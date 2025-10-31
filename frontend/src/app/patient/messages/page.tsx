/**
 * Patient Messages Page
 * Enhanced messaging interface with quick actions
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Messages from '@/components/Messages';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  MessageSquare, 
  Users, 
  Mail,
  PlusCircle,
  Search,
  AlertCircle,
  Info,
  ArrowLeft
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

interface MessageStats {
  total_conversations: number;
  unread_messages: number;
}

export default function PatientMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<MessageStats>({
    total_conversations: 0,
    unread_messages: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'patient')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'patient') {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const [conversationsRes, unreadRes] = await Promise.all([
        api.messages.listConversations(),
        api.messages.unreadCount(),
      ]);

      const conversations = conversationsRes.data || [];
      const unreadCount = unreadRes.data?.count || 0;

      setStats({
        total_conversations: conversations.length,
        unread_messages: unreadCount,
      });
    } catch (error) {
      console.error('Failed to load message stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'patient') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <Link href="/patient/dashboard">
              <Button variant="outline" size="sm" className="w-fit">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <MessageSquare className="w-8 h-8 mr-3 text-primary" />
                  Mes Messages
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Communiquez avec vos médecins
                </p>
              </div>
              <Link href="/patient/messages/new">
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  Nouveau message
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversations actives</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loadingStats ? '...' : stats.total_conversations}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Médecins avec qui vous correspondez
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages non lus</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loadingStats ? '...' : stats.unread_messages}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Nouveaux messages reçus
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              {stats.unread_messages > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {stats.unread_messages} nouveau{stats.unread_messages > 1 ? 'x' : ''}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une conversation..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Messages Component */}
        <Card>
          <CardContent className="p-0">
            <Messages />
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Info className="w-5 h-5 mr-2 text-primary" />
                Utilisation de la messagerie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Utilisez la messagerie pour des questions non urgentes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Votre médecin vous répondra généralement sous 24-48 heures</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Vous pouvez joindre des documents à vos messages</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-orange-600" />
                En cas d'urgence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>
                  <strong className="text-gray-900">N'utilisez pas la messagerie pour les urgences.</strong>
                </p>
                <p>
                  En cas de situation urgente, veuillez :
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• Appeler le 15 (SAMU)</li>
                  <li>• Appeler le 112 (Urgences européennes)</li>
                  <li>• Vous rendre aux urgences</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
