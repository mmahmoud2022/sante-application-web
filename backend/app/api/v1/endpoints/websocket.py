"""
WebSocket endpoints for real-time notifications and messaging
"""
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
import json
from datetime import datetime

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        # user_id -> set of websockets
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # room_name -> set of websockets
        self.rooms: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Accept and store a new connection"""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Remove a connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        
        # Remove from all rooms
        for room_sockets in self.rooms.values():
            room_sockets.discard(websocket)
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user"""
        if user_id in self.active_connections:
            disconnected = set()
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.add(websocket)
            
            # Clean up disconnected sockets
            for ws in disconnected:
                self.active_connections[user_id].discard(ws)
    
    async def join_room(self, websocket: WebSocket, room: str):
        """Add a connection to a room"""
        if room not in self.rooms:
            self.rooms[room] = set()
        self.rooms[room].add(websocket)
    
    async def leave_room(self, websocket: WebSocket, room: str):
        """Remove a connection from a room"""
        if room in self.rooms:
            self.rooms[room].discard(websocket)
            if not self.rooms[room]:
                del self.rooms[room]
    
    async def broadcast_to_room(self, message: dict, room: str):
        """Send a message to all connections in a room"""
        if room in self.rooms:
            disconnected = set()
            for websocket in self.rooms[room]:
                try:
                    await websocket.send_json(message)
                except Exception:
                    disconnected.add(websocket)
            
            # Clean up disconnected sockets
            for ws in disconnected:
                self.rooms[room].discard(ws)
    
    def get_online_users(self) -> Set[int]:
        """Get list of currently online user IDs"""
        return set(self.active_connections.keys())
    
    def is_user_online(self, user_id: int) -> bool:
        """Check if a user is currently online"""
        return user_id in self.active_connections


# Global connection manager instance
manager = ConnectionManager()


async def get_current_user_from_token(token: str, db: Session) -> User:
    """Authenticate user from WebSocket token"""
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            return None
        
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user and user.is_active:
            return user
    except Exception:
        pass
    return None


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time communication
    
    Connect with: ws://host/api/v1/websocket/ws?token=<access_token>
    
    Message format:
    {
        "type": "message|notification|presence|join_room|leave_room",
        "data": {...}
    }
    """
    # Authenticate user
    user = await get_current_user_from_token(token, db)
    if not user:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    # Accept connection
    await manager.connect(websocket, user.id)
    
    try:
        # Send connection success
        await websocket.send_json({
            "type": "connected",
            "data": {
                "user_id": user.id,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
        # Handle incoming messages
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "ping":
                # Heartbeat
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            elif message_type == "join_room":
                # Join a chat room
                room = data.get("room")
                if room:
                    await manager.join_room(websocket, room)
                    await websocket.send_json({
                        "type": "room_joined",
                        "room": room,
                        "timestamp": datetime.utcnow().isoformat()
                    })
            
            elif message_type == "leave_room":
                # Leave a chat room
                room = data.get("room")
                if room:
                    await manager.leave_room(websocket, room)
                    await websocket.send_json({
                        "type": "room_left",
                        "room": room,
                        "timestamp": datetime.utcnow().isoformat()
                    })
            
            elif message_type == "message":
                # Send message to room
                room = data.get("room")
                content = data.get("content")
                if room and content:
                    await manager.broadcast_to_room({
                        "type": "message",
                        "room": room,
                        "from_user_id": user.id,
                        "from_user_name": f"{user.first_name} {user.last_name}",
                        "content": content,
                        "timestamp": datetime.utcnow().isoformat()
                    }, room)
            
            elif message_type == "presence":
                # Get presence information
                online_users = list(manager.get_online_users())
                await websocket.send_json({
                    "type": "presence",
                    "online_users": online_users,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, user.id)
    except Exception as e:
        print(f"WebSocket error for user {user.id}: {e}")
        manager.disconnect(websocket, user.id)


@router.get("/online-users")
async def get_online_users():
    """
    Get list of currently online users
    
    Returns user IDs of all connected users
    """
    return {
        "online_users": list(manager.get_online_users()),
        "count": len(manager.get_online_users()),
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/user/{user_id}/online")
async def check_user_online(user_id: int):
    """
    Check if a specific user is online
    """
    return {
        "user_id": user_id,
        "online": manager.is_user_online(user_id),
        "timestamp": datetime.utcnow().isoformat()
    }


# Helper function for sending notifications via WebSocket
async def send_notification(user_id: int, notification: dict):
    """
    Send a notification to a specific user via WebSocket
    
    Can be called from other parts of the application
    """
    message = {
        "type": "notification",
        "data": notification,
        "timestamp": datetime.utcnow().isoformat()
    }
    await manager.send_personal_message(message, user_id)
