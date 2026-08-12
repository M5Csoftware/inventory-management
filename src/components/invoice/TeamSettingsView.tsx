'use client';

import React, { useState } from 'react';
import type { TeamMember, AppConfig, Role } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users, Trash2, Settings, UserPlus, Info, ShieldCheck,
  User, Eye, EyeOff, Pencil, X, Check, Save,
} from 'lucide-react';
import { toast } from 'react-toastify';

interface TeamSettingsViewProps {
  team: TeamMember[];
  config: AppConfig;
  onAddMember: (name: string, username: string, password: string, role: Role) => void;
  onRemoveMember: (id: string) => void;
  onEditMember: (id: string, name: string, username: string, password: string, role: Role) => void;
  onSaveSettings: (currency: AppConfig['currency'], threshold: number) => void;
  currentUserId: string | null;
  isMasterAdmin?: boolean;
}

const roleColors: Record<Role, string> = {
  'Master Admin': 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold',
  Admin: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  Invoice: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold',
  Verifier: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  User: 'bg-muted text-muted-foreground border-border/60',
};

const roleIcons: Record<Role, React.ReactNode> = {
  'Master Admin': <ShieldCheck size={11} className="text-amber-600" />,
  Admin: <ShieldCheck size={11} />,
  Invoice: <ShieldCheck size={11} className="text-emerald-600" />,
  Verifier: <Eye size={11} />,
  User: <User size={11} />,
};

export const TeamSettingsView: React.FC<TeamSettingsViewProps> = ({
  team,
  config,
  onAddMember,
  onRemoveMember,
  onEditMember,
  onSaveSettings,
  currentUserId,
  isMasterAdmin = false,
}) => {
  // --- Settings state ---
  const [currency, setCurrency] = useState<AppConfig['currency']>(config.currency);
  const [threshold, setThreshold] = useState<string>(config.threshold.toString());

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(threshold);
    if (isNaN(val) || val < 0) return;
    onSaveSettings(currency, val);
    toast.success('System settings saved successfully.');
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
          <Settings size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Settings &amp; Policy
          </h2>
          <p className="text-xs text-muted-foreground">Configure approval thresholds, currency, and user role access</p>
        </div>
      </div>

      {/* Policy Threshold Settings */}
      <Card className="border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Settings size={18} className="text-primary" /> System Threshold &amp; Currency
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Invoices exceeding the second approval threshold will require L2 admin sign-off.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSettingsSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as AppConfig['currency'])}
                className="h-10 w-full bg-background border-2 border-gray-300 dark:border-gray-600 rounded-xl px-3 text-xs font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                L2 Approval Threshold Amount
              </label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono font-bold"
              />
            </div>
            <div>
              <Button
                type="submit"
                className="w-full font-bold h-10 text-xs shadow-md gap-2"
              >
                <Save size={15} /> Save Policy Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Team Roster */}
      <Card className="border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users size={18} className="text-primary" /> Active Accounts &amp; Roles ({team.length})
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            User accounts with permission to verify, approve, and manage inward invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {team.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{m.name}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-muted-foreground">@{m.username}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={`inline-flex items-center gap-1.5 ${roleColors[m.role] || ''}`}>
                        {roleIcons[m.role]} {m.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {m.role !== 'Master Admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveMember(m.id)}
                          className="h-7 w-7 text-rose-600 hover:bg-rose-500/10"
                          title="Remove member"
                        >
                          <Trash2 size={15} />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
