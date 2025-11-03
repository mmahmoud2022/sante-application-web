"""
Message API endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.message import MessageCreate, MessageResponse, ConversationResponse
from app.services.message_service import MessageService

router = APIRouter()


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def send_message(
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to another user
    """
    message_service = MessageService(db)
    
    try:
        message = message_service.send_message(
            sender_id=current_user.id,
            recipient_id=message_data.recipient_id,
            content=message_data.content,
            subject=message_data.subject,
            reference_id=message_data.reference_id,
            reference_type=message_data.reference_type,
        )
        return message
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all conversations for the current user
    """
    message_service = MessageService(db)
    conversations = message_service.get_user_conversations(current_user.id)
    return conversations


@router.get("/conversations/{other_user_id}", response_model=List[MessageResponse])
def get_conversation(
    other_user_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get messages from a conversation with another user
    """
    message_service = MessageService(db)
    messages = message_service.get_conversation_messages(
        user1_id=current_user.id,
        user2_id=other_user_id,
        limit=limit,
        offset=offset,
    )
    return messages


@router.put("/conversations/{other_user_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_conversation_as_read(
    other_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all messages in a conversation as read
    """
    message_service = MessageService(db)
    message_service.mark_conversation_as_read(
        user_id=current_user.id,
        other_user_id=other_user_id,
    )
    return None


@router.put("/{message_id}/read", response_model=MessageResponse)
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a specific message as read
    """
    from app.models.message import Message
    
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )
    
    # Check authorization
    if message.recipient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to mark this message as read",
        )
    
    message_service = MessageService(db)
    message_service.mark_message_as_read(message_id, current_user.id)
    
    db.refresh(message)
    return message


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get count of unread messages for the current user
    """
    message_service = MessageService(db)
    count = message_service.get_unread_count(current_user.id)
    return {"unread_count": count}


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a message
    """
    message_service = MessageService(db)
    success = message_service.delete_message(message_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found or not authorized",
        )
    
    return None
