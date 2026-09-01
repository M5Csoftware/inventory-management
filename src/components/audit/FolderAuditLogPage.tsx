'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  History,
  Search,
  RefreshCw,
  Download,
  RotateCcw,
  ArrowLeft,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Layers,
  FileSpreadsheet,
  Box,
  Truck,
  ShoppingCart,
  Users,
  Package,
  Receipt,
  Eye,
  EyeOff,
  Lock,
  Laptop,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { useInventory, BRANCHES } from '@/context/inventory-context';
import { useAuth } from '@/context/auth-context';

export interface AuditLogItem {
  id: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  category: string;
  details: string;
  target?: string;
  branch?: string;
  ipAddress?: string;
  referenceId?: string;
  entityType?: string;
  previousState?: any;
  newState?: any;
  isReverted?: boolean;
  revertedAt?: string;
  revertedBy?: string;
  revertReason?: string;
  timestamp: string;
  createdAt?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/inventory';
const getDbHeader = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'x-database': 'm5c-inventory',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const actionBadgeStyles: Record<string, string> = {
  'Stock In': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Stock Out': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'Stock Transfer': 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  'Stock Adjust': 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  'Product Created': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Product Updated': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'Product Deleted': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Order Created': 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'Order Updated': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'Order Completed': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Order Cancelled': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'Order Deleted': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Category Created': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  'Category Added': 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  'Category Updated': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'Category Deleted': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Supplier Created': 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'Supplier Added': 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'Supplier Updated': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'Supplier Deleted': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Invoice Created': 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  'Invoice Updated': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'Invoice Verified': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Invoice Approved': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Invoice Deleted': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Asset Added': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'Asset Assigned': 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'Asset Returned': 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'Asset Maintenance': 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  'Asset Deleted': 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'Action Reverted': 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
};

const categoryIcons: Record<string, any> = {
  Products: Box,
  Stock: Truck,
  Orders: ShoppingCart,
  Suppliers: Users,
  Categories: Package,
  Invoice: Receipt,
  Assets: Laptop,
};

interface FolderAuditLogPageProps {
  category: 'Products' | 'Stock' | 'Orders' | 'Suppliers' | 'Categories' | 'Invoice' | 'Assets';
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}

export function FolderAuditLogPage({
  category,
  title,
  description,
  backHref,
  backLabel,
}: FolderAuditLogPageProps) {
  const { revertAuditLog } = useInventory();
  const { user } = useAuth();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Revert Modal State
  const [logToRevert, setLogToRevert] = useState<AuditLogItem | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [revertPassword, setRevertPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // Detail Modal State
  const [selectedDetailLog, setSelectedDetailLog] = useState<AuditLogItem | null>(null);

  const CategoryIcon = categoryIcons[category] || History;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ category });
      const res = await fetch(`${API_BASE}/audit-logs?${params.toString()}`, {
        headers: getDbHeader(),
      });
      if (!res.ok) {
        setLogs([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      } else {
        toast.error(data.message || 'Failed to load audit logs');
      }
    } catch (err: any) {
      console.warn('Could not connect to audit log service:', err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Branch filter
      if (branchFilter !== 'All') {
        const matchesBranch =
          log.branch === branchFilter ||
          log.branch === 'Global' ||
          (log.branch && log.branch.includes(branchFilter));
        if (!matchesBranch) return false;
      }

      // Date filters
      if (startDate) {
        const logTime = new Date(log.timestamp || log.createdAt || '').getTime();
        const startTime = new Date(startDate).getTime();
        if (!isNaN(logTime) && !isNaN(startTime) && logTime < startTime) return false;
      }
      if (endDate) {
        const logTime = new Date(log.timestamp || log.createdAt || '').getTime();
        const endTime = new Date(endDate).setHours(23, 59, 59, 999);
        if (!isNaN(logTime) && !isNaN(endTime) && logTime > endTime) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const inUser = (log.userName || '').toLowerCase().includes(q);
        const inAction = (log.action || '').toLowerCase().includes(q);
        const inDetails = (log.details || '').toLowerCase().includes(q);
        const inTarget = (log.target || '').toLowerCase().includes(q);
        const inId = (log.id || '').toLowerCase().includes(q);
        const inRef = (log.referenceId || '').toLowerCase().includes(q);
        if (!inUser && !inAction && !inDetails && !inTarget && !inId && !inRef) return false;
      }

      return true;
    });
  }, [logs, branchFilter, startDate, endDate, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const created = filteredLogs.filter(
      (l) => l.action.toLowerCase().includes('create') || l.action.toLowerCase().includes('in')
    ).length;
    const updated = filteredLogs.filter(
      (l) => l.action.toLowerCase().includes('update') || l.action.toLowerCase().includes('edit')
    ).length;
    const reverted = filteredLogs.filter((l) => l.isReverted || l.action === 'Action Reverted').length;
    return { total, created, updated, reverted };
  }, [filteredLogs]);

  // Execute Revert
  const handleExecuteRevert = async () => {
    if (!logToRevert || isReverting) return;
    if (!revertPassword.trim()) {
      setPasswordError('Rollback authorization password is required.');
      return;
    }
    setPasswordError('');
    setIsReverting(true);
    try {
      const success = await revertAuditLog(
        logToRevert.id,
        revertReason.trim() || undefined,
        revertPassword.trim()
      );
      if (success) {
        setLogToRevert(null);
        setRevertReason('');
        setRevertPassword('');
        setPasswordError('');
        await fetchLogs();
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsReverting(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Date & Time',
      'User',
      'Role',
      'Action',
      'Target',
      'Branch',
      'Details',
      'Reference ID',
      'Status',
    ];
    const rows = filteredLogs.map((l) => [
      `"${l.id}"`,
      `"${new Date(l.timestamp || l.createdAt || '').toLocaleString('en-IN')}"`,
      `"${l.userName}"`,
      `"${l.userRole || 'User'}"`,
      `"${l.action}"`,
      `"${(l.target || '').replace(/"/g, '""')}"`,
      `"${l.branch || 'Global'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.referenceId || ''}"`,
      `"${l.isReverted ? 'Reverted' : 'Active'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${category.toLowerCase()}_audit_log_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300 min-h-screen bg-background">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href={backHref} className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">{title}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CategoryIcon className="h-7 w-7 text-primary" />
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="text-xs h-9 px-3 gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="text-xs h-9 px-3 gap-1.5 shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Operations</p>
              <h3 className="text-xl sm:text-2xl font-black text-foreground mt-0.5">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Creations &amp; Inward</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {stats.created}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Updates &amp; Edits</p>
              <h3 className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
                {stats.updated}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Reverted / Undone</p>
              <h3 className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                {stats.reverted}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar & Main Audit Table */}
      <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-base font-bold">Chronological Operations Log</CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredLogs.length} verified operations in {category}
                </CardDescription>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search user, action, target..."
                  className="h-8 w-44 sm:w-56 rounded-lg border border-border bg-background pl-8 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="All">All Branches</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              {/* Start Date */}
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start Date"
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {/* End Date */}
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End Date"
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              />

              {(searchTerm || branchFilter !== 'All' || startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setBranchFilter('All');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="relative w-full overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground space-y-3">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
                <p className="text-xs font-semibold">Loading audit history...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground space-y-3">
                <History className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <p className="text-xs font-semibold">No audit log records found matching your filters.</p>
              </div>
            ) : (
              <table className="w-full caption-bottom text-xs">
                <thead className="[&_tr]:border-b bg-muted/40">
                  <tr className="border-b transition-colors text-muted-foreground font-bold uppercase text-[10px]">
                    <th className="h-9 px-4 text-left">Log ID</th>
                    <th className="h-9 px-4 text-left">Timestamp</th>
                    <th className="h-9 px-4 text-left">Operator</th>
                    <th className="h-9 px-4 text-left">Action</th>
                    <th className="h-9 px-4 text-left">Target / Entity</th>
                    <th className="h-9 px-4 text-left">Branch</th>
                    <th className="h-9 px-4 text-left">Operation Details</th>
                    <th className="h-9 px-4 text-right">Rollback / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredLogs.map((log) => {
                    const isRevertedLog = log.isReverted;
                    const isRevertAction = log.action === 'Action Reverted';
                    const badgeClass =
                      actionBadgeStyles[log.action] ||
                      'bg-muted text-foreground border-border/60';

                    return (
                      <tr
                        key={log.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          isRevertedLog ? 'opacity-65 bg-muted/10' : ''
                        }`}
                      >
                        {/* Log ID */}
                        <td className="p-4 font-mono font-bold text-foreground whitespace-nowrap">
                          {log.id}
                        </td>

                        {/* Timestamp */}
                        <td className="p-4 whitespace-nowrap text-muted-foreground">
                          <span className="font-semibold text-foreground block">
                            {new Date(log.timestamp || log.createdAt || '').toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] block mt-0.5">
                            {new Date(log.timestamp || log.createdAt || '').toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </td>

                        {/* Operator */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-semibold text-foreground block flex items-center gap-1.5">
                            <User className="h-3 w-3 text-muted-foreground" /> {log.userName}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">
                            {log.userRole || 'Admin'}
                          </span>
                        </td>

                        {/* Action Badge */}
                        <td className="p-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badgeClass}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Target */}
                        <td className="p-4 font-medium text-foreground whitespace-nowrap">
                          <span className="block truncate max-w-[140px]" title={log.target}>
                            {log.target || 'N/A'}
                          </span>
                          {log.referenceId && log.referenceId !== log.target && (
                            <span className="text-[10px] text-muted-foreground font-mono block">
                              Ref: {log.referenceId}
                            </span>
                          )}
                        </td>

                        {/* Branch */}
                        <td className="p-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                            <Building2 className="h-3 w-3 text-primary" /> {log.branch || 'Global'}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="p-4 text-foreground text-xs min-w-[260px] max-w-[380px]">
                          <p className="line-clamp-2" title={log.details}>
                            {log.details}
                          </p>
                          {isRevertedLog && (
                            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-1 flex items-center gap-1">
                              <RotateCcw className="h-3 w-3" /> Reverted by {log.revertedBy || 'Admin'}{' '}
                              {log.revertedAt ? `(${new Date(log.revertedAt).toLocaleDateString()})` : ''}
                            </p>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* View Snapshot Button */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDetailLog(log)}
                              className="h-7 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                              title="View details & raw snapshot"
                            >
                              <Eye className="h-3 w-3 mr-1" /> View
                            </Button>

                            {/* Revert / Rollback Button */}
                            {isRevertedLog ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 font-bold text-[10px]">
                                <RotateCcw className="h-3 w-3" /> Rolled Back
                              </span>
                            ) : isRevertAction ? (
                              <span className="text-[10px] text-muted-foreground font-semibold italic">
                                Reversal Log
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setLogToRevert(log);
                                  setRevertReason('');
                                  setRevertPassword('');
                                  setPasswordError('');
                                  setShowPassword(false);
                                }}
                                className="h-7 px-2.5 text-[11px] font-bold text-destructive hover:bg-destructive/10 hover:border-destructive/40 border-border/80 cursor-pointer shadow-xs transition-colors"
                              >
                                <RotateCcw className="h-3 w-3 mr-1 text-destructive" /> Revert
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal for Reverting an Operation */}
      {logToRevert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border/50 bg-destructive/10 text-destructive">
              <div className="p-2 rounded-xl bg-destructive/15 text-destructive border border-destructive/25">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Confirm Action Rollback</h3>
                <p className="text-xs text-muted-foreground">
                  Revert entry #{logToRevert.id} ({logToRevert.action})
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Action:</span>
                  <span className="font-bold text-foreground">{logToRevert.action}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Target Entity:</span>
                  <span className="font-bold text-foreground">{logToRevert.target || logToRevert.referenceId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Originally Done By:</span>
                  <span className="font-semibold text-foreground">{logToRevert.userName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Timestamp:</span>
                  <span className="text-foreground">
                    {new Date(logToRevert.timestamp || logToRevert.createdAt || '').toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-border/40">
                  <span className="text-muted-foreground font-semibold block mb-0.5">Details:</span>
                  <p className="text-foreground italic">{logToRevert.details}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-900 dark:text-amber-200">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-amber-600 shrink-0" />
                  What will happen when you rollback:
                </p>
                <p className="text-[11px] opacity-90 mt-1">
                  The system will automatically inverse the changes made in this operation, restore preceding values or stock quantities, and record an immutable rollback audit trail.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Rollback Reason (Optional)
                </label>
                <input
                  type="text"
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  placeholder="e.g. Accidental misclick entry / incorrect quantity booked"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-primary" />
                    Rollback Authorization Password <span className="text-destructive">*</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">Configured in Settings</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={revertPassword}
                    onChange={(e) => {
                      setRevertPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="Enter rollback password to authorize..."
                    className={`h-9 w-full rounded-lg border bg-background px-3 pr-9 text-xs focus:outline-none focus:ring-2 ${
                      passwordError
                        ? 'border-destructive focus:ring-destructive/20'
                        : 'border-border focus:ring-primary/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-[11px] text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {passwordError}
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLogToRevert(null)}
                disabled={isReverting}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleExecuteRevert}
                disabled={isReverting}
                className="text-xs font-bold gap-1.5 cursor-pointer shadow-md"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${isReverting ? 'animate-spin' : ''}`} />
                {isReverting ? 'Rolling back...' : 'Yes, Rollback Action'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot / Detail Modal */}
      {selectedDetailLog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Audit Log Details ({selectedDetailLog.id})
                  </h3>
                  <p className="text-xs text-muted-foreground">{selectedDetailLog.action}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDetailLog(null)}
                className="h-8 w-8 p-0 rounded-full cursor-pointer"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Log ID</span>
                  <span className="font-mono font-bold text-foreground">{selectedDetailLog.id}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Operator</span>
                  <span className="font-semibold text-foreground">{selectedDetailLog.userName}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Category</span>
                  <span className="font-semibold text-foreground">{selectedDetailLog.category}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Branch</span>
                  <span className="font-semibold text-foreground">{selectedDetailLog.branch || 'Global'}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">
                  Full Operation Details
                </span>
                <p className="text-foreground font-medium">{selectedDetailLog.details}</p>
              </div>

              {selectedDetailLog.previousState && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Previous State Snapshot (Before Action)
                  </span>
                  <pre className="p-3 rounded-xl bg-background border border-border/60 font-mono text-[11px] overflow-x-auto max-h-48 text-muted-foreground">
                    {JSON.stringify(selectedDetailLog.previousState, null, 2)}
                  </pre>
                </div>
              )}

              {selectedDetailLog.newState && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    New State Snapshot (After Action)
                  </span>
                  <pre className="p-3 rounded-xl bg-background border border-border/60 font-mono text-[11px] overflow-x-auto max-h-48 text-muted-foreground">
                    {JSON.stringify(selectedDetailLog.newState, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDetailLog(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
