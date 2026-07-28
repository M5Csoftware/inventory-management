'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Save,
  CheckCircle,
  Settings as SettingsIcon,
  Sliders,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useAuth } from '@/context/auth-context';
import { useInventory } from '@/context/inventory-context';

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

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('m5c_user_settings', JSON.stringify(profile));
    if (profile.branch && profile.branch !== activeBranch) {
      setActiveBranch(profile.branch);
    }
    setIsSaved(true);
    toast.success('System settings saved successfully!');
    setTimeout(() => setIsSaved(false), 3000);
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
      <form id="settings-form" onSubmit={handleSubmitProfile} className="space-y-6">
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

        {/* Footer Bar */}
        <div className="flex items-center justify-between border-t pt-5">
          <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            {isSaved && (
              <>
                <CheckCircle className="w-4 h-4" /> Settings saved successfully!
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
