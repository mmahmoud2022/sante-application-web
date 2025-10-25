"""
Message Service
Handles messaging between doctors and patients
"""
from typing import List, Optional, Dict
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models.message import Message
from app.models.user import User, UserRole
from app.models.notification import NotificationType, NotificationChannel
from app.services.notification_service import NotificationService


class MessageService:
    """Service for managing messages between users"""

    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)

    def send_message(
        self,
        sender_id: int,
        recipient_id: int,
        content: str,
        subject: Optional[str] = None,
        reference_id: Optional[int] = None,
        reference_type: Optional[str] = None,
    ) -> Message:
        """
        Send a message from one user to another
        
        Args:
            sender_id: ID of the user sending the message
            recipient_id: ID of the user receiving the message
            content: Message content
            subject: Optional message subject
            reference_id: Optional reference to related entity
            reference_type: Type of referenced entity
            
        Returns:
            Created Message object
        """
        # Verify users exist and have valid roles
        sender = self.db.query(User).filter(User.id == sender_id).first()
        recipient = self.db.query(User).filter(User.id == recipient_id).first()
        
        if not sender or not recipient:
            raise ValueError("Sender or recipient not found")
        
        # Verify appropriate roles (doctor-patient communication)
        if not self._can_message(sender, recipient):
            raise ValueError("Messaging is only allowed between doctors and patients")
        
        # Create the message
        message = Message(
            sender_id=sender_id,
            recipient_id=recipient_id,
            subject=subject,
            content=content,
            reference_id=reference_id,
            reference_type=reference_type,
        )
        
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        # Send notification to recipient
        self._send_message_notification(message, sender, recipient)
        
        return message

    def get_conversation_messages(
        self,
        user1_id: int,
        user2_id: int,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Message]:
        """
        Get messages between two users
        
        Args:
            user1_id: First user ID
            user2_id: Second user ID
            limit: Maximum number of messages to return
            offset: Number of messages to skip
            
        Returns:
            List of Message objects
        """
        messages = (
            self.db.query(Message)
            .filter(
                Message.deleted_at.is_(None),
                or_(
                    and_(
                        Message.sender_id == user1_id,
                        Message.recipient_id == user2_id
                    ),
                    and_(
                        Message.sender_id == user2_id,
                        Message.recipient_id == user1_id
                    )
                )
            )
            .order_by(Message.created_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        return messages

    def get_user_conversations(self, user_id: int) -> List[Dict]:
        """
        Get all conversations for a user with summary information
        
        Args:
            user_id: User ID
            
        Returns:
            List of conversation summaries
        """
        # Get all users that this user has exchanged messages with
        subquery_sent = (
            self.db.query(Message.recipient_id)
            .filter(Message.sender_id == user_id, Message.deleted_at.is_(None))
            .distinct()
        )
        
        subquery_received = (
            self.db.query(Message.sender_id)
            .filter(Message.recipient_id == user_id, Message.deleted_at.is_(None))
            .distinct()
        )
        
        # Get unique user IDs from both sent and received messages
        user_ids = set()
        for row in subquery_sent.all():
            user_ids.add(row[0])
        for row in subquery_received.all():
            user_ids.add(row[0])
        
        conversations = []
        for other_user_id in user_ids:
            # Get the other user
            other_user = self.db.query(User).filter(User.id == other_user_id).first()
            if not other_user:
                continue
            
            # Get last message in conversation
            last_message = (
                self.db.query(Message)
                .filter(
                    Message.deleted_at.is_(None),
                    or_(
                        and_(
                            Message.sender_id == user_id,
                            Message.recipient_id == other_user_id
                        ),
                        and_(
                            Message.sender_id == other_user_id,
                            Message.recipient_id == user_id
                        )
                    )
                )
                .order_by(Message.created_at.desc())
                .first()
            )
            
            # Count unread messages from this user
            unread_count = (
                self.db.query(Message)
                .filter(
                    Message.sender_id == other_user_id,
                    Message.recipient_id == user_id,
                    Message.is_read == False,
                    Message.deleted_at.is_(None)
                )
                .count()
            )
            
            conversations.append({
                "other_user_id": other_user_id,
                "other_user_name": other_user.full_name,
                "other_user_role": other_user.role.value,
                "last_message": last_message,
                "unread_count": unread_count,
            })
        
        # Sort by last message time
        conversations.sort(
            key=lambda x: x["last_message"].created_at if x["last_message"] else datetime.min,
            reverse=True
        )
        
        return conversations

    def mark_message_as_read(self, message_id: int, user_id: int) -> bool:
        """
        Mark a message as read
        
        Args:
            message_id: Message ID
            user_id: User ID (must be the recipient)
            
        Returns:
            True if successful, False otherwise
        """
        message = self.db.query(Message).filter(Message.id == message_id).first()
        
        if not message or message.recipient_id != user_id:
            return False
        
        if not message.is_read:
            message.is_read = True
            message.read_at = datetime.utcnow()
            self.db.commit()
        
        return True

    def mark_conversation_as_read(self, user_id: int, other_user_id: int) -> int:
        """
        Mark all messages in a conversation as read
        
        Args:
            user_id: Current user ID (recipient)
            other_user_id: Other user ID (sender)
            
        Returns:
            Number of messages marked as read
        """
        count = (
            self.db.query(Message)
            .filter(
                Message.sender_id == other_user_id,
                Message.recipient_id == user_id,
                Message.is_read == False,
                Message.deleted_at.is_(None)
            )
            .update({"is_read": True, "read_at": datetime.utcnow()})
        )
        self.db.commit()
        return count

    def get_unread_count(self, user_id: int) -> int:
        """
        Get count of unread messages for a user
        
        Args:
            user_id: User ID
            
        Returns:
            Number of unread messages
        """
        count = (
            self.db.query(Message)
            .filter(
                Message.recipient_id == user_id,
                Message.is_read == False,
                Message.deleted_at.is_(None)
            )
            .count()
        )
        return count

    def delete_message(self, message_id: int, user_id: int) -> bool:
        """
        Soft delete a message
        
        Args:
            message_id: Message ID
            user_id: User ID (must be sender or recipient)
            
        Returns:
            True if successful, False otherwise
        """
        message = self.db.query(Message).filter(Message.id == message_id).first()
        
        if not message:
            return False
        
        # Only sender or recipient can delete
        if message.sender_id != user_id and message.recipient_id != user_id:
            return False
        
        message.deleted_at = datetime.utcnow()
        self.db.commit()
        return True

    def _can_message(self, sender: User, recipient: User) -> bool:
        """
        Check if two users can message each other
        Doctors and patients can message each other
        
        Args:
            sender: Sender User object
            recipient: Recipient User object
            
        Returns:
            True if messaging is allowed
        """
        # Allow messaging between doctors and patients
        if (sender.role == UserRole.DOCTOR and recipient.role == UserRole.PATIENT) or \
           (sender.role == UserRole.PATIENT and recipient.role == UserRole.DOCTOR):
            return True
        
        # Allow messaging between doctors
        if sender.role == UserRole.DOCTOR and recipient.role == UserRole.DOCTOR:
            return True
        
        return False

    def _send_message_notification(self, message: Message, sender: User, recipient: User):
        """
        Send notification to recipient about new message
        
        Args:
            message: Message object
            sender: Sender User object
            recipient: Recipient User object
        """
        notification_message = f"Nouveau message de {sender.full_name}"
        if message.subject:
            notification_message += f": {message.subject}"
        
        self.notification_service.create_notification(
            user_id=recipient.id,
            notification_type=NotificationType.MESSAGE_RECEIVED,
            title="Nouveau message",
            message=notification_message,
            channel=NotificationChannel.IN_APP,
            reference_id=message.id,
            reference_type="message",
        )
