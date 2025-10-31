/**
 * Doctor Messages Page
 * Enhanced messaging interface with statistics and filters
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
  MailOpen,
  Clock,
  TrendingUp,
  Search,
  Filter,
  PlusCircle,
  ArrowLeft
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

interface MessageStats {
  total_conversations: number;
  unread_messages: number;
  today_messages: number;
  response_rate: number;
}

export default function DoctorMessagesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<MessageStats>({
    total_conversations: 0,
    unread_messages: 0,
    today_messages: 0,
    response_rate: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'doctor')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'doctor') {
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

      // Calculate today's messages
      const today = new Date().toDateString();
      const todayMessages = conversations.filter((conv: any) => {
        if (!conv.last_message) return false;
        const messageDate = new Date(conv.last_message.created_at).toDateString();
        return messageDate === today;
      }).length;

      setStats({
        total_conversations: conversations.length,
        unread_messages: unreadCount,
        today_messages: todayMessages,
        response_rate: conversations.length > 0 ? Math.round((todayMessages / conversations.length) * 100) : 0,
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

  if (!user || user.role !== 'doctor') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <Link href="/doctor/dashboard">
              <Button variant="outline" size="sm" className="w-fit">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <MessageSquare className="w-8 h-8 mr-3 text-primary" />
                  Messagerie
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Gérez vos communications avec les patients
                </p>
              </div>
              <Link href="/doctor/messages/new">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversations</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loadingStats ? '...' : stats.total_conversations}
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
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              {stats.unread_messages > 0 && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Nécessite attention
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aujourd'hui</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loadingStats ? '...' : stats.today_messages}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Taux de réponse</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {loadingStats ? '...' : `${stats.response_rate}%`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
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
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {/* Messages Component */}
        <Card>
          <CardContent className="p-0">
            <Messages />
          </CardContent>
        </Card>

        {/* Tips Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <MailOpen className="w-5 h-5 mr-2 text-primary" />
                Conseils de communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Répondez aux messages dans les 24 heures pour maintenir une bonne relation patient</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Utilisez un langage clair et compréhensible</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  <span>Pour les urgences, demandez au patient de vous contacter par téléphone</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-primary" />
                Raccourcis clavier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex justify-between">
                  <span>Envoyer un message</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                    Enter
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span>Nouvelle ligne</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                    Shift + Enter
                  </kbd>
                </li>
                <li className="flex justify-between">
                  <span>Rechercher</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
                    Ctrl + K
                  </kbd>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
