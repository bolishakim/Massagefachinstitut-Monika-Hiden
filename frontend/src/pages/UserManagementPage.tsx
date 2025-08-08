import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/components/layout/ProtectedRoute';
import { User, Role } from '@/types';
import { userService, CreateUserRequest, UpdateUserRequest } from '@/services/user';
import { UserModal, UserFormData } from '@/components/modals/UserModal';
import { DeleteUserModal, ToggleUserStatusModal } from '@/components/modals/ConfirmModal';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { isAdmin } = usePermissions();
  
  // State for users data
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // State for filtering and search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [statusFilter, setStatusFilter] = useState<'true' | 'false' | ''>('');

  // State for modals and UI
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userModalLoading, setUserModalLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load users on component mount and when filters change
  useEffect(() => {
    loadUsers();
  }, [pagination.currentPage, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async (page: number = pagination.currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userService.getUsers(page, 10, {
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter || undefined,
      });

      if (response.success) {
        setUsers(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user creation
  const handleCreateUser = async (userData: UserFormData) => {
    try {
      setUserModalLoading(true);
      const createData: CreateUserRequest = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password!,
        role: userData.role,
      };

      const response = await userService.createUser(createData);
      
      if (response.success) {
        await loadUsers(1); // Reload from first page
        setShowUserModal(false);
        setSelectedUser(null);
      } else {
        throw new Error(response.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error; // Let the modal handle the error display
    } finally {
      setUserModalLoading(false);
    }
  };

  // Handle user update
  const handleUpdateUser = async (userData: UserFormData) => {
    if (!selectedUser) return;

    try {
      setUserModalLoading(true);
      const updateData: UpdateUserRequest = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
      };

      const response = await userService.updateUser(selectedUser.id, updateData);
      
      if (response.success) {
        await loadUsers(); // Reload current page
        setShowUserModal(false);
        setSelectedUser(null);
      } else {
        throw new Error(response.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error; // Let the modal handle the error display
    } finally {
      setUserModalLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setDeleteLoading(true);
      const response = await userService.deleteUser(selectedUser.id);
      
      if (response.success) {
        await loadUsers(); // Reload current page
        setShowDeleteModal(false);
        setSelectedUser(null);
      } else {
        throw new Error(response.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle user status toggle
  const handleToggleStatus = async () => {
    if (!selectedUser) return;

    try {
      setStatusLoading(true);
      const response = await userService.toggleUserStatus(selectedUser.id);
      
      if (response.success) {
        await loadUsers(); // Reload current page
        setShowStatusModal(false);
        setSelectedUser(null);
      } else {
        throw new Error(response.error || 'Failed to toggle user status');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      setError('Failed to update user status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openStatusModal = (user: User) => {
    setSelectedUser(user);
    setShowStatusModal(true);
  };

  // Utility functions
  const getUserDisplayName = (user: User) => `${user.firstName} ${user.lastName}`;

  const getRoleColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case Role.MODERATOR:
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default:
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8" />
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage user accounts and permissions
            </p>
          </div>
          {isAdmin() && (
            <Button onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card className="glass">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  All Users ({users.length})
                </Button>
                <Button variant="outline" size="sm">
                  Active ({users.filter((u) => u.isActive).length})
                </Button>
                <Button variant="outline" size="sm">
                  Inactive ({users.filter((u) => !u.isActive).length})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>
              Users ({pagination.totalCount})
              {loading && <span className="text-muted-foreground text-sm ml-2">Loading...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Role</th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Verified</th>
                    <th className="text-left py-3 px-4 font-medium">Created</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium">
                              {user.firstName[0]}
                              {user.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                            user.role
                          )}`}
                        >
                          <Shield className="h-3 w-3" />
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                              : 'text-red-600 bg-red-100 dark:bg-red-900/20'
                          }`}
                        >
                          {user.isActive ? (
                            <UserCheck className="h-3 w-3" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            user.emailVerified
                              ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                              : 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
                          }`}
                        >
                          <Mail className="h-3 w-3" />
                          {user.emailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin() && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditModal(user)}
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openStatusModal(user)}
                                title={user.isActive ? 'Deactivate user' : 'Activate user'}
                              >
                                {user.isActive ? (
                                  <UserX className="h-4 w-4" />
                                ) : (
                                  <UserCheck className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteModal(user)}
                                className="text-destructive hover:text-destructive"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && users.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No users found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms' : 'No users available'}
                </p>
                {isAdmin() && !searchTerm && (
                  <Button onClick={openCreateModal} className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First User
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} users
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUsers(pagination.currentPage - 1)}
                    disabled={!pagination.hasPreviousPage || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadUsers(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Modals */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        onSave={selectedUser ? handleUpdateUser : handleCreateUser}
        user={selectedUser}
        loading={userModalLoading}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteUser}
        userName={selectedUser ? getUserDisplayName(selectedUser) : ''}
        loading={deleteLoading}
      />

      <ToggleUserStatusModal
        isOpen={showStatusModal}
        onClose={() => {
          setShowStatusModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleToggleStatus}
        userName={selectedUser ? getUserDisplayName(selectedUser) : ''}
        currentStatus={selectedUser?.isActive || false}
        loading={statusLoading}
      />
    </div>
  );
}