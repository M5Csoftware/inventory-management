'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Plus, Edit2, Trash2, UserCheck, Key, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/auth-context';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  branch?: string;
  permissions?: string[];
  status?: 'active' | 'inactive';
  lastLogin?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/inventory';
const DB_HEADER = { 'x-database': 'm5c-inventory', 'Content-Type': 'application/json' };

export default function ManageRolesPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const isAdminOrMaster = currentUser?.id === 'master' || currentUser?.role === 'master' || currentUser?.role === 'admin';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          ...DB_HEADER,
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.filter((u: User) => u.id !== 'master' && u.role !== 'master'));
      }
    } catch (err: any) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!id) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-database': 'm5c-inventory',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User deleted successfully');
        setUsers((prev) => prev.filter((u) => u.id !== id && (u as any)._id !== id));
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (err: any) {
      toast.error('Network error');
    }
  };

  if (currentUser && !isAdminOrMaster) {
    return (
      <div className="p-12 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto text-2xl font-bold border border-red-500/20">
          🛡️
        </div>
        <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-muted-foreground text-sm">
          User &amp; Role Management is strictly restricted to System Administrators and Master Admins only.
        </p>
        <Link href="/" className="inline-block mt-2">
          <Button className="gap-2">Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              User Roles &amp; Permissions
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
              <Shield className="w-3.5 h-3.5" /> Access Control
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure system user accounts, branch assignments, and granular sidebar folder/tab permissions.
          </p>
        </div>

        <Link
          href="/manage-roles/new"
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          Create New User
        </Link>
      </div>

      {/* Users Table Card */}
      <div className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/50 font-semibold tracking-wider">
              <tr>
                <th className="p-4 text-left">User Details</th>
                <th className="p-4 text-left">System Role</th>
                <th className="p-4 text-left">Branch Scope</th>
                <th className="p-4 text-left">Folder &amp; Tab Permissions</th>
                <th className="p-4 text-left">Last Active</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading user directory...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No custom user accounts found. Click "Create New User" to get started.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const permCount = u.permissions?.length || 0;
                  const isFullAccess = isAdmin || u.permissions?.includes('*');

                  return (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {u.name}
                              <span className="font-mono text-[11px] text-muted-foreground">({u.id})</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isAdmin
                              ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {isAdmin ? 'Admin' : 'Stock Manager'}
                        </span>
                      </td>

                      <td className="p-4">
                        <span className="text-xs font-medium text-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/40">
                          🏭 {u.branch || 'Ahmedabad'}
                        </span>
                      </td>

                      <td className="p-4">
                        {isFullAccess ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Full Access (All Tabs)
                          </span>
                        ) : permCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                            <Lock className="w-3 h-3" /> {permCount} Tabs Allowed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            No Tabs Configured
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-xs text-muted-foreground">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Never'}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/manage-roles/edit/${u.id}`}
                            className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-border/40"
                            title="Edit User & Permissions"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => setUserToDelete(u)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors inline-flex items-center gap-1.5 border border-destructive/20 cursor-pointer"
                            title="Delete User Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDeleteModal
        isOpen={!!userToDelete}
        title="Delete User Account"
        description={`Are you sure you want to delete account "${userToDelete?.name}" (${userToDelete?.email})? This action cannot be undone.`}
        onConfirm={() => {
          if (userToDelete) {
            const targetId = userToDelete.id || (userToDelete as any)._id;
            handleDelete(targetId);
            setUserToDelete(null);
          }
        }}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  );
}
