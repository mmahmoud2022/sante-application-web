/**
 * Admin User Management Page
 * Comprehensive user management for administrators
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Filter, Plus, Edit, Trash2, CheckCircle,
  XCircle, Mail, Phone, Calendar, Shield, ChevronLeft,
  UserCheck, UserX, Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  phone_number?: string;
  created_at: string;
  last_login?: string;
}

type RoleFilter = 'all' | 'patient' | 'doctor' | 'admin';
type StatusFilter = 'all' | 'active' | 'inactive' | 'verified' | 'unverified';

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filters
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    patients: 0,
    doctors: 0,
    admins: 0,
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'admin') {
      router.push('/login');
      return;
    }

    if (user) {
      loadUsers();
    }
  }, [user, loading, router]);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter, statusFilter, searchTerm]);

  const loadUsers = async () => {
    setLoadingData(true);
    try {
      const response = await api.users.list();
      const userList = response.data || [];
      setUsers(userList);
      calculateStats(userList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const calculateStats = (userList: User[]) => {
    setStats({
      total: userList.length,
      patients: userList.filter(u => u.role === 'patient').length,
      doctors: userList.filter(u => u.role === 'doctor').length,
      admins: userList.filter(u => u.role === 'admin').length,
      active: userList.filter(u => u.is_active).length,
      inactive: userList.filter(u => !u.is_active).length,
    });
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active);
    } else if (statusFilter === 'verified') {
      filtered = filtered.filter(u => u.is_verified);
    } else if (statusFilter === 'unverified') {
      filtered = filtered.filter(u => !u.is_verified);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(search) ||
        u.first_name.toLowerCase().includes(search) ||
        u.last_name.toLowerCase().includes(search)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      await api.users.update(userId, { is_active: !currentStatus });
      await loadUsers();
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const handleVerifyUser = async (userId: number) => {
    try {
      await api.users.verify(userId);
      await loadUsers();
    } catch (error) {
      console.error('Failed to verify user:', error);
      alert('Erreur lors de la vérification de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur? Cette action est irréversible.')) {
      return;
    }

    try {
      await api.users.delete(userId);
      await loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      patient: 'bg-blue-100 text-blue-800',
      doctor: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      patient: 'Patient',
      doctor: 'Docteur',
      admin: 'Admin',
    };
    return {
      style: styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-800',
      label: labels[role as keyof typeof labels] || role,
    };
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 border-b dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Gestion des utilisateurs</h1>
              <p className="text-gray-600 dark:text-neutral-400">Gérez tous les utilisateurs de la plateforme</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Tableau de bord
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Patients</p>
                <p className="text-2xl font-bold text-blue-600">{stats.patients}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Docteurs</p>
                <p className="text-2xl font-bold text-green-600">{stats.doctors}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Inactifs</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent"
              >
                <option value="all">Tous les rôles</option>
                <option value="patient">Patients</option>
                <option value="doctor">Docteurs</option>
                <option value="admin">Administrateurs</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary dark:focus:ring-primary-400 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="verified">Vérifiés</option>
                <option value="unverified">Non vérifiés</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rôle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inscription
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => {
                      const roleBadge = getRoleBadge(user.role);
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                                {user.first_name[0]}{user.last_name[0]}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge.style}`}>
                              {roleBadge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.phone_number || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col space-y-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${
                                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {user.is_active ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Actif
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactif
                                  </>
                                )}
                              </span>
                              {user.is_verified ? (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 inline-flex items-center">
                                  <Shield className="h-3 w-3 mr-1" />
                                  Vérifié
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Non vérifié
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedUser(user);
                                  setShowDetailsModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="Voir détails"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              {!user.is_verified && (
                                <button
                                  onClick={() => handleVerifyUser(user.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Vérifier l'utilisateur"
                                >
                                  <UserCheck className="h-5 w-5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                className={user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                                title={user.is_active ? 'Désactiver' : 'Activer'}
                              >
                                {user.is_active ? (
                                  <UserX className="h-5 w-5" />
                                ) : (
                                  <UserCheck className="h-5 w-5" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Supprimer"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Détails de l'utilisateur</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Prénom</h3>
                  <p className="mt-1 text-gray-900">{selectedUser.first_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nom</h3>
                  <p className="mt-1 text-gray-900">{selectedUser.last_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                  <p className="mt-1 text-gray-900">{selectedUser.phone_number || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Rôle</h3>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(selectedUser.role).style}`}>
                      {getRoleBadge(selectedUser.role).label}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Vérification</h3>
                  <p className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.is_verified ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedUser.is_verified ? 'Vérifié' : 'Non vérifié'}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date d'inscription</h3>
                  <p className="mt-1 text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                {selectedUser.last_login && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-500">Dernière connexion</h3>
                    <p className="mt-1 text-gray-900">
                      {new Date(selectedUser.last_login).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              {!selectedUser.is_verified && (
                <Button
                  onClick={() => {
                    handleVerifyUser(selectedUser.id);
                    setShowDetailsModal(false);
                  }}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Vérifier
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  handleToggleUserStatus(selectedUser.id, selectedUser.is_active);
                  setShowDetailsModal(false);
                }}
              >
                {selectedUser.is_active ? 'Désactiver' : 'Activer'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedUser(null);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
