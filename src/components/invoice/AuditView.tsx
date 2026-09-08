'use client';

import React, { useState } from 'react';
import type { Invoice, AppConfig } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  History,
  Clock,
  FileSpreadsheet,
  Download,
  Eye,
  Search,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  XCircle,
  AlertTriangle,
  Building2,
  Landmark,
  FileText,
  User,
  Filter,
} from 'lucide-react';
import { Modal } from './Modal';
import { formatAmount } from './InvoiceTable';

interface AuditViewProps {
  invoices: Invoice[];
  config: AppConfig;
}

export const AuditView: React.FC<AuditViewProps> = ({ invoices, config }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Flatten all history entries for CSV Export and Global Event Stats
  const entriesForExport = invoices.flatMap((inv) =>
    (inv.history || []).map((ev) => ({
      ...ev,
      vendor: inv.vendor,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      branch: inv.branch || 'Ahmedabad',
      poNumber: inv.poNumber || '',
      currentStatus: inv.status,
    }))
  );
  entriesForExport.sort((a, b) => b.at - a.at);

  // Filter invoices for table view
  const filteredInvoices = invoices.filter((inv) => {
    const invBranch = inv.branch || 'Ahmedabad';
    const matchesSearch =
      inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.poNumber && inv.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      invBranch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.history &&
        inv.history.some(
          (h) =>
            h.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (h.note && h.note.toLowerCase().includes(searchTerm.toLowerCase()))
        ));

    const matchesStatus =
      statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  filteredInvoices.sort((a, b) => b.enteredAt - a.enteredAt);

  // Stats calculation
  const totalLogsCount = entriesForExport.length;
  const approvedPaidCount = invoices.filter((i) => i.status === 'approved' || i.status === 'paid').length;
  const rejectedCount = invoices.filter((i) => i.status === 'rejected').length;
  const pendingCount = invoices.filter((i) => i.status === 'pending_verification' || i.status === 'pending_approval').length;

  const handleExportCSV = () => {
    if (entriesForExport.length === 0) return;
    const headers = [
      'Timestamp',
      'Actor Name',
      'Actor Role',
      'Action',
      'Vendor Name',
      'Invoice Number',
      'PO Number',
      'Branch',
      'Total Amount (INR)',
      'Current Status',
      'Note / Remarks',
    ];

    const rows = entriesForExport.map((e) => [
      `"${new Date(e.at).toLocaleString('en-IN').replace(/"/g, '""')}"`,
      `"${(e.actorName || '').replace(/"/g, '""')}"`,
      `"${(e.actorRole || '').replace(/"/g, '""')}"`,
      `"${(e.action || '').replace(/"/g, '""')}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${(e.poNumber || '').replace(/"/g, '""')}"`,
      `"${(e.branch || '').replace(/"/g, '""')}"`,
      e.amount,
      `"${e.currentStatus}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'pending_verification':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">Pending Verification</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">Approved</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Paid</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">Rejected</Badge>;
    }
  };

  const getActionBadge = (action: string) => {
    const actLower = action.toLowerCase();
    if (actLower.includes('checked in')) {
      return <Badge variant="outline" className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30 font-semibold">{action}</Badge>;
    } else if (actLower.includes('verified')) {
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 font-semibold">{action}</Badge>;
    } else if (actLower.includes('approved')) {
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30 font-semibold">{action}</Badge>;
    } else if (actLower.includes('paid')) {
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold">{action}</Badge>;
    } else if (actLower.includes('rejected')) {
      return <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 font-semibold">{action}</Badge>;
    }
    return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-semibold">{action}</Badge>;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 shadow-xs">
            <History size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Invoice Audit Ledger
            </h2>
            <p className="text-xs text-muted-foreground">
              Immutable historical activity timeline &amp; audit trail for all inward check-ins, verifications, approvals, payments, and rejections.
            </p>
          </div>
        </div>

        <Button
          onClick={handleExportCSV}
          size="sm"
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs shadow-sm shrink-0"
        >
          <Download size={15} /> Export Audit CSV
        </Button>
      </div>

      {/* Top Audit Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Audit Logs</p>
          <p className="text-2xl font-black text-foreground mt-1">{totalLogsCount}</p>
        </Card>

        <Card className="p-4 border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Approved &amp; Paid</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedPaidCount}</p>
        </Card>

        <Card className="p-4 border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pending Review</p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</p>
        </Card>

        <Card className="p-4 border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Rejected Invoices</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{rejectedCount}</p>
        </Card>
      </div>

      {/* Audit Table Toolbar */}
      <Card className="border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-muted/30 border-b border-border/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Activity Ledger</h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {filteredInvoices.length} Invoices
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendor, inv #, actor, action..."
                className="pl-9 h-9 text-xs bg-background border-2 border-gray-300 dark:border-gray-600 rounded-xl font-medium focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'pending_verification', label: 'Pending Verification' },
              { id: 'pending_approval', label: 'Pending Approval' },
              { id: 'approved', label: 'Approved' },
              { id: 'paid', label: 'Paid' },
              { id: 'rejected', label: 'Rejected' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/80 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Invoice No.</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3">Latest Audit Action</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    No invoice audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invBranch = inv.branch || 'Ahmedabad';
                  const lastHistory = inv.history && inv.history.length > 0
                    ? inv.history[inv.history.length - 1]
                    : null;

                  return (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground max-w-[160px] truncate" title={inv.vendor}>
                        {inv.vendor}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-foreground">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {inv.invoiceDate}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                          invBranch === 'Delhi'
                            ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25'
                            : invBranch === 'Mumbai'
                            ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25'
                            : invBranch === 'Ludhiana'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                        }`}>
                          🏢 {invBranch}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-extrabold text-right text-foreground">
                        {formatAmount(inv.amount, config.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="px-4 py-3">
                        {lastHistory ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              {getActionBadge(lastHistory.action)}
                              <span className="text-[11px] text-muted-foreground font-medium">by {lastHistory.actorName}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">
                              {new Date(lastHistory.at).toLocaleString('en-IN')}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No history log</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(inv)}
                          className="gap-1.5 text-xs h-8 px-3 font-semibold shadow-xs"
                        >
                          <Eye size={14} /> View Audit Timeline
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Invoice Full Audit Timeline Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice Audit Log: ${selectedInvoice.invoiceNumber}`}
        >
          <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Invoice Meta Banner */}
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor Name</span>
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-4 w-4 text-primary" /> {selectedInvoice.vendor}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Total Amount</span>
                  <span className="font-mono font-extrabold text-foreground">{formatAmount(selectedInvoice.amount, config.currency)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Invoice Date</span>
                  <span className="font-medium">{selectedInvoice.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">PO Number</span>
                  <span className="font-mono font-medium">{selectedInvoice.poNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Branch</span>
                  <span className="font-medium">{selectedInvoice.branch || 'Ahmedabad'}</span>
                </div>
              </div>

              {/* Vendor Bank Info if available */}
              {selectedInvoice.bankDetails && (
                <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <Landmark className="h-3.5 w-3.5 text-primary" /> Bank Record:
                  </span>
                  <p className="mt-0.5 font-mono text-[11px]">
                    {selectedInvoice.bankDetails.bankName} ({selectedInvoice.bankDetails.accountName}) &bull; A/C: {selectedInvoice.bankDetails.accountNumber} &bull; IFSC: {selectedInvoice.bankDetails.ifscCode}
                  </p>
                </div>
              )}
            </div>

            {/* Risk Flags Banner if present */}
            {selectedInvoice.flags && selectedInvoice.flags.length > 0 && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1.5 shadow-xs">
                <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> Risk Flags Logged ({selectedInvoice.flags.length})
                </h5>
                <ul className="space-y-1 pl-1">
                  {selectedInvoice.flags.map((f, idx) => (
                    <li key={idx} className="text-xs text-rose-800 dark:text-rose-200 flex items-start gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Audit History Activity Timeline */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1 flex items-center gap-1.5">
                <History className="h-4 w-4 text-primary" /> Audit History &amp; Activity Log
              </h4>

              <div className="relative pl-5 border-l-2 border-primary/40 space-y-6 pt-1">
                {[...(selectedInvoice.history || [])]
                  .sort((a, b) => b.at - a.at)
                  .map((ev, idx) => (
                    <div key={idx} className="relative">
                      {/* Node Bullet */}
                      <div className="absolute -left-[27px] top-0 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background ring-4 ring-primary/10 shadow-xs" />
                      
                      <div className="flex items-center justify-between mb-1.5">
                        {getActionBadge(ev.action)}
                        <span className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(ev.at).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Actor: <span className="font-bold text-foreground">{ev.actorName}</span>{' '}
                        <span className="font-mono text-[11px]">({ev.actorRole})</span>
                      </div>

                      {ev.note && (
                        <div className="mt-2 text-xs bg-background border border-border/60 p-3 rounded-xl text-foreground max-w-full break-words leading-relaxed font-medium shadow-xs">
                          {ev.note}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Modal Close Button */}
            <div className="pt-3 flex justify-end border-t border-border/50">
              <Button size="sm" variant="outline" onClick={() => setSelectedInvoice(null)} className="px-4">
                Close Audit Log
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
