import React, { useState } from 'react';
import type { TeamMember, AppConfig, Role } from '@/types/invoice';
import {
  Users, Trash2, Settings, UserPlus, Info, ShieldCheck,
  User, Eye, EyeOff, Pencil, X, Check,
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
  'Master Admin': 'bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold',
  Admin: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20',
  Verifier: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
  User: 'bg-muted text-muted-foreground border border-border/60',
};

const roleIcons: Record<Role, React.ReactNode> = {
  'Master Admin': <ShieldCheck size={11} className="text-amber-600" />,
  Admin: <ShieldCheck size={11} />,
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
  // --- Add member state ---
  const [memberName, setMemberName] = useState('');
  const [memberUsername, setMemberUsername] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberRole, setMemberRole] = useState<Role>('User');
  const [showPw, setShowPw] = useState(false);
  const [formError, setFormError] = useState('');

  // --- Edit member state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<Role>('User');
  const [showEditPw, setShowEditPw] = useState(false);
  const [editError, setEditError] = useState('');

  // --- Settings state ---
  const [currency, setCurrency] = useState<AppConfig['currency']>(config.currency);
  const [threshold, setThreshold] = useState<string>(config.threshold.toString());

  const openEdit = (m: TeamMember) => {
    setEditingId(m.id);
    setEditName(m.name);
    setEditUsername(m.username);
    setEditPassword('');
    setEditRole(m.role === 'Admin' ? 'Admin' : m.role);
    setEditError('');
    setShowEditPw(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError('');
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!memberName.trim()) return setFormError('Name is required.');
    if (!memberUsername.trim()) return setFormError('Username is required.');
    if (memberPassword.length < 6) return setFormError('Password must be at least 6 characters.');
    if (team.some((m) => m.username.toLowerCase() === memberUsername.trim().toLowerCase())) {
      return setFormError('Username already taken.');
    }
    onAddMember(memberName.trim(), memberUsername.trim(), memberPassword, memberRole);
    toast.success(`Account created for ${memberName.trim()} (@${memberUsername.trim()}) as ${memberRole}`);
    setMemberName('');
    setMemberUsername('');
    setMemberPassword('');
    setMemberRole('User');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError('');
    if (!editName.trim()) return setEditError('Name is required.');
    if (!editUsername.trim()) return setEditError('Username is required.');

    const dup = team.find((m) => m.id !== editingId && m.username.toLowerCase() === editUsername.trim().toLowerCase());
    if (dup) return setEditError('Username already taken by another member.');

    onEditMember(editingId, editName.trim(), editUsername.trim(), editPassword, editRole);
    toast.success(`Account for @${editUsername.trim()} updated successfully.`);
    setEditingId(null);
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(threshold);
    if (isNaN(val) || val < 0) return;
    onSaveSettings(currency, val);
    toast.success('System settings saved successfully.');
  };

  return (
    <div className="w-full space-y-8">
      {/* Policy Threshold Settings */}
      <div className="bg-card border border-border/80 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Settings size={18} className="text-indigo-600" /> System Threshold & Currency
        </h3>
        <form onSubmit={handleSettingsSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as AppConfig['currency'])}
              className="w-full bg-background border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-foreground cursor-pointer"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
              Second Approval Threshold
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full bg-background border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm font-mono font-bold text-foreground"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs sm:text-sm transition-all cursor-pointer shadow-xs"
            >
              Save Policy Settings
            </button>
          </div>
        </form>
      </div>

      {/* Team Roster */}
      <div className="bg-card border border-border/80 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Users size={18} className="text-indigo-600" /> Team Accounts & Roles ({team.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30">
                <th className="py-2.5 px-3 font-bold uppercase text-muted-foreground">Name</th>
                <th className="py-2.5 px-3 font-bold uppercase text-muted-foreground">Username</th>
                <th className="py-2.5 px-3 font-bold uppercase text-muted-foreground">Role</th>
                <th className="py-2.5 px-3 font-bold uppercase text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {team.map((m) => (
                <tr key={m.id} className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-semibold text-foreground">{m.name}</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">@{m.username}</td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${roleColors[m.role] || ''}`}>
                      {roleIcons[m.role]} {m.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {m.role !== 'Master Admin' && (
                      <button
                        onClick={() => onRemoveMember(m.id)}
                        className="text-rose-600 hover:bg-rose-500/10 p-1 rounded-lg transition-colors"
                        title="Remove member"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
