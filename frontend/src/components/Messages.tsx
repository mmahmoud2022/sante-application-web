/**
 * Messages Component
 * Displays messaging interface for doctor-patient communication
 */
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  subject?: string;
  content: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

interface Conversation {
  other_user_id: number;
  other_user_name: string;
  other_user_role: string;
  last_message?: Message;
  unread_count: number;
}

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    loadConversations();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.other_user_id);
    }
  }, [selectedConversation]);

  const loadCurrentUser = async () => {
    try {
      const response = await api.get('/users/me');
      setCurrentUserId(response.data.id);
    } catch (error) {
      console.error('Failed to load current user:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (otherUserId: number) => {
    try {
      const response = await api.get(`/messages/conversations/${otherUserId}`);
      setMessages(response.data.reverse());
      
      // Mark conversation as read
      await api.put(`/messages/conversations/${otherUserId}/read`);
      
      // Update unread count in conversations list
      setConversations(prev => 
        prev.map(conv => 
          conv.other_user_id === otherUserId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation || !messageContent.trim()) return;

    try {
      setSending(true);
      const response = await api.post('/messages', {
        recipient_id: selectedConversation.other_user_id,
        subject: messageSubject.trim() || null,
        content: messageContent.trim(),
      });

      setMessages([...messages, response.data]);
      setMessageContent('');
      setMessageSubject('');
      
      // Reload conversations to update last message
      loadConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Échec de l\'envoi du message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] bg-gray-50 dark:bg-gray-900">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h2>
        </div>
        
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            Aucune conversation
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map(conversation => (
              <button
                key={conversation.other_user_id}
                onClick={() => setSelectedConversation(conversation)}
                className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedConversation?.other_user_id === conversation.other_user_id
                    ? 'bg-primary-50 dark:bg-primary-900/20'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {conversation.other_user_name}
                      </h3>
                      {conversation.unread_count > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {conversation.other_user_role === 'doctor' ? 'Médecin' : 'Patient'}
                    </p>
                    {conversation.last_message && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>
                  {conversation.last_message && (
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(conversation.last_message.created_at)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedConversation.other_user_name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {selectedConversation.other_user_role === 'doctor' ? 'Médecin' : 'Patient'}
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_id === currentUserId
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {message.subject && (
                      <div className="font-semibold mb-1">{message.subject}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender_id === currentUserId
                          ? 'text-primary-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {formatDate(message.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Sujet (optionnel)"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full"
                />
                <div className="flex space-x-2">
                  <textarea
                    placeholder="Écrivez votre message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !messageContent.trim()}
                    className="self-end"
                  >
                    {sending ? 'Envoi...' : 'Envoyer'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Sélectionnez une conversation pour commencer
          </div>
        )}
      </div>
    </div>
  );
}
