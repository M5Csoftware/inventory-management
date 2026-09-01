'use client';

import { useState, useEffect, useRef } from 'react';
import {
  User,
  Shield,
  Save,
  CheckCircle,
  Settings as SettingsIcon,
  Sliders,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/auth-context';
import { useInventory } from '@/context/inventory-context';
import { ConfirmModal } from '@/components/confirm-modal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/inventory';
const getDbHeader = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'x-database': 'm5c-inventory',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { activeBranch, setActiveBranch } = useInventory();

  const [profile, setProfile] = useState({
    name: user?.name || 'Altaf Hussain',
    email: user?.email || 'master@m5clogs.com',
    phone: '+91 98765 43210',
    role: user?.role === 'admin' ? 'System Administrator' : 'Stock Manager',
    branch: user?.branch || 'Ahmedabad',
    defaultThreshold: 10,
    currency: 'INR (₹)',
    autoRefreshSec: 30,
    notificationsEnabled: true,
  });

  const [isSaved, setIsSaved] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const submittingRef = useRef(false);

  // Rollback Password State
  const [currentRevertPassword, setCurrentRevertPassword] = useState('');
  const [newRevertPassword, setNewRevertPassword] = useState('');
  const [confirmRevertPassword, setConfirmRevertPassword] = useState('');
  const [showRevertPassword, setShowRevertPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [hasCustomPassword, setHasCustomPassword] = useState(false);

  const role = (user?.role || '').toLowerCase();
  const isAdmin =
    role === 'admin' ||
    role === 'master' ||
    role === 'master admin' ||
    role === 'system administrator';

  const fetchSecuritySettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/settings/security`, {
        headers: getDbHeader(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setHasCustomPassword(data.data.hasCustomPassword);
      }
    } catch (e) {
      console.warn('Could not fetch security settings', e);
    }
  };

  useEffect(() => {
    fetchSecuritySettings();
  }, []);

  const handleUpdateRevertPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevertPassword || newRevertPassword.length < 4) {
      toast.error('New password must be at least 4 characters long.');
      return;
    }
    if (newRevertPassword !== confirmRevertPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await fetch(`${API_BASE}/settings/revert-password`, {
        method: 'PUT',
        headers: getDbHeader(),
        body: JSON.stringify({
          currentPassword: currentRevertPassword,
          newPassword: newRevertPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Rollback password updated successfully!');
        setCurrentRevertPassword('');
        setNewRevertPassword('');
        setConfirmRevertPassword('');
        setHasCustomPassword(true);
      } else {
        toast.error(data.message || 'Failed to update rollback password.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error updating password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('m5c_user_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved settings');
      }
    }
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const executeSaveSettings = () => {
    if (submittingRef.current || isSaved) return;
    submittingRef.current = true;
    localStorage.setItem('m5c_user_settings', JSON.stringify(profile));
    if (profile.branch && profile.branch !== activeBranch) {
      setActiveBranch(profile.branch);
    }
    setIsSaved(true);
    setShowConfirmModal(false);
    toast.success('System settings saved successfully!');
    setTimeout(() => {
      submittingRef.current = false;
      setIsSaved(false);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-8 w-full space-y-6 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              System Settings
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary border-primary/20">
              <SettingsIcon className="w-3.5 h-3.5" /> Preferences
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your profile details, facility branch scope, and inventory system defaults.
          </p>
        </div>

        <Button
          type="submit"
          form="settings-form"
          className="h-10 px-5 gap-2 bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save Settings</span>
        </Button>
      </div>

      {/* Main Full-Width Grid */}
      <div className="space-y-6">
        <form id="settings-form" onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: User Profile Settings */}
            <Card className="border-border/60 shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="w-4.5 h-4.5 text-primary" /> Profile Credentials
                </CardTitle>
                <CardDescription className="text-xs">
                  Your identity and active system credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
                  <div className="h-16 w-16 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center text-primary text-xl font-bold shadow-inner shrink-0">
                    {profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                      {profile.name}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                        {user?.role === 'admin' ? 'Master Admin' : 'Staff Manager'}
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Shield className="h-3 w-3" /> Active Authenticated Session
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={profile.name}
                      onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Assigned Facility Branch
                    </label>
                    <select
                      value={profile.branch}
                      onChange={(e) => setProfile((prev) => ({ ...prev, branch: e.target.value }))}
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                    >
                      <option value="Ahmedabad">🏭 Ahmedabad Branch</option>
                      <option value="Delhi">🏭 Delhi (HO)</option>
                      <option value="Ludhiana">🏭 Ludhiana Branch</option>
                      <option value="Mumbai">🏭 Mumbai Branch</option>
                      <option value="All">🌐 All Branches (Global)</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Inventory Defaults & Thresholds */}
            <Card className="border-border/60 shadow-sm bg-card">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sliders className="w-4.5 h-4.5 text-blue-500" /> Inventory System Defaults
                </CardTitle>
                <CardDescription className="text-xs">
                  Reorder alert limits, default currency, and auto-refresh rates
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Low Stock Threshold (Units)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={profile.defaultThreshold}
                      onChange={(e) => setProfile((prev) => ({ ...prev, defaultThreshold: Number(e.target.value) }))}
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Valuation Currency
                    </label>
                    <input
                      type="text"
                      disabled
                      value={profile.currency}
                      className="w-full h-10 px-3.5 text-sm bg-muted text-muted-foreground border border-input rounded-lg cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Auto-Refresh Rate
                    </label>
                    <select
                      value={profile.autoRefreshSec}
                      onChange={(e) => setProfile((prev) => ({ ...prev, autoRefreshSec: Number(e.target.value) }))}
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                    >
                      <option value={15}>⚡ Every 15 Seconds</option>
                      <option value={30}>⏱️ Every 30 Seconds</option>
                      <option value={60}>⏲️ Every 60 Seconds</option>
                      <option value={0}>🚫 Manual Refresh Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Low Stock Notifications
                    </label>
                    <select
                      value={profile.notificationsEnabled ? 'enabled' : 'disabled'}
                      onChange={(e) => setProfile((prev) => ({ ...prev, notificationsEnabled: e.target.value === 'enabled' }))}
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                    >
                      <option value="enabled">🔔 Enabled (Banner Alerts)</option>
                      <option value="disabled">🔕 Muted</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preferences Save Bar */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              {isSaved && (
                <>
                  <CheckCircle className="w-4 h-4" /> Preferences saved successfully!
                </>
              )}
            </div>
          </div>
        </form>

        {/* Card 3: Rollback & Revert Security (Admins & Master Admin only) */}
        <Card className="border-border/60 shadow-sm bg-card border-l-4 border-l-primary">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="w-4.5 h-4.5 text-primary" /> Rollback &amp; Revert Authorization Password
              </CardTitle>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Admin Security
              </span>
            </div>
            <CardDescription className="text-xs">
              Configure the mandatory security password required to rollback, reverse transactions, or undo entries in folder logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isAdmin ? (
              <form onSubmit={handleUpdateRevertPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-amber-600" />
                    Security Protection Active
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {hasCustomPassword
                      ? 'A custom authorization password is set. Entering this password will be required for all undo/rollback operations across all folder logs.'
                      : "Default authorization password is currently active ('admin123'). We recommend setting a custom rollback password below."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Current Password {hasCustomPassword && <span className="text-destructive">*</span>}
                    </label>
                    <input
                      type={showRevertPassword ? 'text' : 'password'}
                      value={currentRevertPassword}
                      onChange={(e) => setCurrentRevertPassword(e.target.value)}
                      placeholder={hasCustomPassword ? 'Enter current password' : 'admin123 (default)'}
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      New Revert Password <span className="text-destructive">*</span>
                    </label>
                    <input
                      type={showRevertPassword ? 'text' : 'password'}
                      required
                      value={newRevertPassword}
                      onChange={(e) => setNewRevertPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Confirm New Password <span className="text-destructive">*</span>
                    </label>
                    <input
                      type={showRevertPassword ? 'text' : 'password'}
                      required
                      value={confirmRevertPassword}
                      onChange={(e) => setConfirmRevertPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRevertPassword(!showRevertPassword)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 font-medium cursor-pointer"
                  >
                    {showRevertPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showRevertPassword ? 'Hide Passwords' : 'Show Passwords'}
                  </button>

                  <Button
                    type="submit"
                    disabled={updatingPassword || !newRevertPassword}
                    className="h-9 px-4 text-xs font-bold gap-1.5 shadow-sm cursor-pointer"
                  >
                    <KeyRound className={`h-3.5 w-3.5 ${updatingPassword ? 'animate-spin' : ''}`} />
                    {updatingPassword ? 'Updating...' : 'Update Rollback Password'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-muted/40 border border-border/40 text-xs text-muted-foreground">
                <p className="flex items-center gap-2 font-semibold text-foreground">
                  <Lock className="h-4 w-4 text-amber-500" /> Administrative Access Restricted
                </p>
                <p className="mt-1">
                  Only System Administrators and Master Admin have permission to view and configure the rollback authorization password.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal for Saving System Settings */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeSaveSettings}
        title="Save System Settings"
        description="Are you sure you want to apply and save these system configuration preferences?"
        variant="primary"
        confirmText="Save Settings"
        confirmLoadingText="Saving..."
        icon={<SettingsIcon className="h-5 w-5" />}
        itemName={
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Default Facility Branch:</span>
              <span className="font-bold text-foreground">{profile.branch}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Low Stock Threshold:</span>
              <span className="font-mono text-foreground font-semibold">{profile.defaultThreshold} units</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Currency:</span>
              <span className="font-medium text-foreground">{profile.currency}</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
