# Notification and Messaging Features Implementation

## Overview
This document describes the implementation of notification and messaging features between doctors and patients in the Santé medical application.

## Features Implemented

### 1. Backend: Messaging System

#### Database Model
- **Message Model** (`app/models/message.py`)
  - Stores messages between users (doctors and patients)
  - Fields: id, sender_id, recipient_id, subject, content, is_read, read_at, reference_id, reference_type, created_at, updated_at, deleted_at
  - Supports soft delete for message retention
  - Relationships with User model via sender and recipient

#### API Endpoints
- **POST /api/v1/messages** - Send a new message
- **GET /api/v1/messages/conversations** - List all conversations for current user
- **GET /api/v1/messages/conversations/{user_id}** - Get messages in a conversation
- **PUT /api/v1/messages/conversations/{user_id}/read** - Mark conversation as read
- **PUT /api/v1/messages/{message_id}/read** - Mark specific message as read
- **GET /api/v1/messages/unread-count** - Get unread message count
- **DELETE /api/v1/messages/{message_id}** - Soft delete a message

#### Business Logic
- **MessageService** (`app/services/message_service.py`)
  - `send_message()` - Send message with automatic notification creation
  - `get_conversation_messages()` - Retrieve conversation history
  - `get_user_conversations()` - Get all conversations with summary info
  - `mark_message_as_read()` - Mark individual messages as read
  - `mark_conversation_as_read()` - Mark all messages in conversation as read
  - `get_unread_count()` - Count unread messages
  - `delete_message()` - Soft delete messages
  - Authorization: Only allows messaging between doctors and patients, or between doctors

#### Database Migration
- **002_add_messages.py** - Creates messages table with proper indexes

### 2. Backend: Enhanced Notifications

#### Fixes Applied
- Fixed notification service to use `read_at` attribute instead of non-existent `is_read`
- Fixed user model reference from `phone_number` to `phone`
- Updated notification endpoints to properly check read status

### 3. Frontend: Messaging Interface

#### Components
- **Messages Component** (`components/Messages.tsx`)
  - Split-panel interface: conversations list and message thread
  - Real-time conversation view
  - Unread message badges
  - Send message with optional subject
  - Mark conversations as read automatically
  - Supports dark mode
  - Responsive design

- **NotificationBell Component** (`components/NotificationBell.tsx`)
  - Bell icon with unread count badge
  - Dropdown notification list
  - Mark individual or all notifications as read
  - Auto-refresh every 30 seconds
  - Action URL navigation
  - Dark mode support

#### Pages
- **Doctor Messages** (`app/doctor/messages/page.tsx`)
  - Protected route for doctors
  - Full messaging interface

- **Patient Messages** (`app/patient/messages/page.tsx`)
  - Protected route for patients
  - Full messaging interface

#### Dashboard Integration
- Integrated NotificationBell component into doctor and patient dashboard headers
- Added MessageSquare button linking to messages page
- Replaced placeholder notification icons

### 4. Testing

#### Unit Tests
- **test_message_service.py**
  - Test send message functionality
  - Test conversation retrieval
  - Test mark as read
  - Test unread count
  - Test authorization rules (patients cannot message each other)
  - All tests use proper fixtures and database session management

## Technical Details

### Authorization Rules
1. **Doctors can message:**
   - Patients
   - Other doctors

2. **Patients can message:**
   - Doctors only (not other patients)

### Notification Integration
- New messages automatically trigger in-app notifications
- Uses existing `MESSAGE_RECEIVED` notification type
- Notifications include sender name and message subject (if any)
- Links to message conversation

### Data Flow
1. User sends message via POST /messages
2. MessageService validates sender/recipient roles
3. Message is created in database
4. Notification is automatically created for recipient
5. Frontend polls for new notifications every 30 seconds
6. User can view messages in dedicated messages page
7. Opening conversation marks messages as read

### API Response Examples

**Conversation List:**
```json
[
  {
    "other_user_id": 5,
    "other_user_name": "Dr. John Smith",
    "other_user_role": "doctor",
    "last_message": {
      "id": 123,
      "content": "Your test results are ready...",
      "created_at": "2025-10-25T10:30:00Z"
    },
    "unread_count": 2
  }
]
```

**Message:**
```json
{
  "id": 123,
  "sender_id": 5,
  "recipient_id": 10,
  "subject": "Test Results",
  "content": "Your recent blood work shows...",
  "is_read": false,
  "created_at": "2025-10-25T10:30:00Z"
}
```

## File Changes Summary

### Backend Files Added/Modified
- `backend/app/models/message.py` (NEW)
- `backend/app/models/user.py` (MODIFIED - added message relationships)
- `backend/app/models/__init__.py` (MODIFIED - exported Message)
- `backend/app/schemas/message.py` (NEW)
- `backend/app/schemas/__init__.py` (MODIFIED - exported message schemas)
- `backend/app/services/message_service.py` (NEW)
- `backend/app/services/notification_service.py` (MODIFIED - bug fixes)
- `backend/app/api/v1/endpoints/messages.py` (NEW)
- `backend/app/api/v1/endpoints/notifications.py` (MODIFIED - bug fixes)
- `backend/app/api/v1/api.py` (MODIFIED - registered messages router)
- `backend/alembic/versions/002_add_messages.py` (NEW)
- `backend/tests/test_message_service.py` (NEW)

### Frontend Files Added/Modified
- `frontend/src/components/Messages.tsx` (NEW)
- `frontend/src/components/NotificationBell.tsx` (NEW)
- `frontend/src/app/doctor/messages/page.tsx` (NEW)
- `frontend/src/app/patient/messages/page.tsx` (NEW)
- `frontend/src/app/doctor/dashboard/page.tsx` (MODIFIED - integrated components)
- `frontend/src/app/patient/dashboard/page.tsx` (MODIFIED - integrated components)

## Setup Instructions

### Database Migration
```bash
# Run migrations to create messages table
cd backend
alembic upgrade head
```

### Access Features
1. **Notifications**: Available in top-right corner of all dashboards (bell icon)
2. **Messages**: Click message icon in dashboard or navigate to:
   - Doctor: `/doctor/messages`
   - Patient: `/patient/messages`

## Future Enhancements

Potential improvements for future iterations:
1. WebSocket integration for real-time messaging
2. Message attachments support
3. Message search and filtering
4. Conversation archiving
5. Group messaging for care teams
6. Message templates for common communications
7. Read receipts with timestamps
8. Typing indicators
9. Push notifications for mobile apps
10. Email notifications for new messages

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access their own messages
3. **Role-based Access**: Messaging restricted by user roles
4. **Soft Delete**: Messages are not permanently deleted, allowing audit trail
5. **Input Validation**: All inputs validated via Pydantic schemas
6. **XSS Prevention**: Content sanitized on frontend display

## Performance Considerations

1. **Indexing**: Database indexes on sender_id, recipient_id, is_read, created_at
2. **Pagination**: Conversation and message lists support pagination
3. **Polling**: Notification polling at 30-second intervals (can be adjusted)
4. **Caching**: Consider Redis caching for frequently accessed conversations
5. **Query Optimization**: Efficient queries to minimize database load

## Accessibility

1. **Keyboard Navigation**: All interactive elements keyboard accessible
2. **ARIA Labels**: Proper ARIA labels for screen readers
3. **Color Contrast**: WCAG AA compliant color contrast
4. **Dark Mode**: Full dark mode support
5. **Focus Indicators**: Clear focus indicators for navigation

## Browser Compatibility

Tested and compatible with modern browsers:
- Chrome 100+
- Firefox 100+
- Safari 15+
- Edge 100+

## Conclusion

The notification and messaging features are now fully implemented and integrated into the Santé medical application. Both doctors and patients can communicate effectively through the platform, with real-time notifications and a user-friendly interface.
