'use client';

import React, { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Download,
  Eye,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  XCircle,
  Landmark,
  FileSpreadsheet,
  MapPin,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { BRANCHES } from '@/context/inventory-context';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { BankDetailsModal } from './BankDetailsModal';
import { ApproveConfirmationModal } from './ApproveConfirmationModal';
import { VerifyConfirmationModal } from './VerifyConfirmationModal';
import { useInvoice } from '@/context/invoice-context';
import { canApproveInvoice } from '@/utils/invoice-permissions';

import { TeamMember, AppConfig } from '@/types/invoice';

export const formatAmount = (amount: number, currency: 'INR' | 'USD' | 'EUR' = 'INR') => {
  const symbols = { INR: '₹', USD: '$', EUR: '€' };
  return (
    (symbols[currency] || '₹') +
    Number(amount || 0).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })
  );
};

export interface InvoiceTableProps {
  invoices: Invoice[];
  title?: string;
  defaultStatusFilter?: string;
  currentUser?: TeamMember | null;
  team?: TeamMember[];
  config?: AppConfig;
  lastActionId?: string | null;
  showActions?: boolean;
  onVerify?: (id: string, notes?: string) => void;
  onApprove?: (id: string) => void;
  onRejectClick?: (id: string) => void;
  onPay?: (id: string) => void;
  onInvoiceClick?: (invoice: Invoice) => void;
  onAddBankDetails?: (invoice: Invoice) => void;
}

export function InvoiceTable({
  invoices,
  title,
  defaultStatusFilter = 'all',
  currentUser,
  team,
  config,
  lastActionId,
  showActions,
  onVerify,
  onApprove,
  onRejectClick,
  onPay,
  onInvoiceClick,
  onAddBankDetails,
}: InvoiceTableProps) {
  const { user } = useAuth();
  const { verifyInvoice, approveInvoice, rejectInvoice, payInvoice, updateBankDetails } = useInvoice();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [bankModalInvoice, setBankModalInvoice] = useState<Invoice | null>(null);
  const [approveConfirmModalTarget, setApproveConfirmModalTarget] = useState<Invoice | null>(null);
  const [verifyConfirmModalTarget, setVerifyConfirmModalTarget] = useState<Invoice | null>(null);

  const canApprove = canApproveInvoice(user, currentUser);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const invBranch = inv.branch || 'Ahmedabad';
    const matchesSearch =
      inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.poNumber && inv.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      invBranch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || inv.status === statusFilter;

    const matchesBranch =
      branchFilter === 'all' || invBranch.toLowerCase() === branchFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const exportCSV = () => {
    const headers = [
      'ID',
      'Vendor',
      'Invoice Number',
      'Invoice Date',
      'Branch',
      'Taxable Amount (INR)',
      'Tax Slab (%)',
      'Tax Option',
      'Tax Amount (INR)',
      'Total Amount (INR)',
      'PO Number',
      'Status',
      'Entered By',
    ];

    const rows = filteredInvoices.map((i) => [
      `"${i.id}"`,
      `"${i.vendor.replace(/"/g, '""')}"`,
      `"${i.invoiceNumber}"`,
      `"${i.invoiceDate}"`,
      `"${i.branch || 'Ahmedabad'}"`,
      i.taxableAmount,
      i.taxSlab ?? (i.taxAmount > 0 && i.taxableAmount > 0 ? Math.round((i.taxAmount / i.taxableAmount) * 100) : 18),
      `"${i.taxOption}"`,
      i.taxAmount,
      i.amount,
      `"${i.poNumber || ''}"`,
      `"${i.status}"`,
      `"${i.enteredBy}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'pending_verification':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">Pending Verification</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Approved</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">Paid</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">Rejected</Badge>;
    }
  };

  return (
    <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 bg-muted/40 border-b border-border/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">{title || 'Invoices'}</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {filteredInvoices.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendor, inv #, PO #, branch..."
                className="pl-9 h-9 text-xs bg-white/90 dark:bg-gray-900/90 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium focus:border-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs h-9 shadow-sm">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Pills & Branch Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
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

          {/* Branch Filter Pills */}
          <div className="flex items-center gap-1 text-xs shrink-0 flex-wrap">
            <span className="text-muted-foreground font-semibold text-[11px] flex items-center gap-1 mr-1">
              <MapPin size={12} className="text-primary" /> Branch:
            </span>
            {['all', ...BRANCHES].map((b) => (
              <button
                key={b}
                onClick={() => setBranchFilter(b)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  branchFilter.toLowerCase() === b.toLowerCase()
                    ? 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                }`}
              >
                {b === 'all' ? 'All' : b}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto pb-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border/40">
            <tr>
              <th className="py-3 px-4">Invoice ID</th>
              <th className="py-3 px-4">Vendor Name</th>
              <th className="py-3 px-4">Invoice No.</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Branch</th>
              <th className="py-3 px-4 text-right">Taxable</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4">PO No.</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Entered By</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20 text-xs">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-muted-foreground">
                  No invoice records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const invBranch = inv.branch || 'Ahmedabad';
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-purple-600 dark:text-purple-400">
                      {inv.id}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground max-w-[160px] truncate" title={inv.vendor}>
                      {inv.vendor}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-foreground">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {inv.invoiceDate}
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      ₹{inv.taxableAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-extrabold text-foreground">
                      ₹{inv.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {inv.poNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3 px-4 text-center text-muted-foreground">
                      {inv.enteredBy}
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                          onClick={() => setSelectedInvoice(inv)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                      {inv.status === 'pending_verification' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2.5 text-xs font-bold text-amber-700 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/10 gap-1.5 shadow-xs"
                          onClick={() => {
                            if (onVerify) {
                              onVerify(inv.id);
                            } else {
                              setVerifyConfirmModalTarget(inv);
                            }
                          }}
                          title="Verify Invoice"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Verify
                        </Button>
                      )}

                      {inv.status === 'pending_approval' && (
                        canApprove ? (
                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm hover:shadow-purple-500/25 transition-all rounded-lg"
                            onClick={() => {
                              if (onApprove) {
                                onApprove(inv.id);
                              } else {
                                setApproveConfirmModalTarget(inv);
                              }
                            }}
                            title="Approve Invoice"
                          >
                            <ShieldCheck className="h-4 w-4" /> Approve
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed py-1">
                            Admin/Invoice Role Needed
                          </Badge>
                        )
                      )}

                      {inv.status === 'approved' && canApprove && (
                        <Button
                          size="sm"
                          className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm hover:shadow-emerald-500/25 transition-all rounded-lg"
                          onClick={() => (onPay ? onPay(inv.id) : payInvoice(inv.id))}
                          title="Mark Paid"
                        >
                          <DollarSign className="h-3.5 w-3.5" /> Pay
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg"
                        onClick={() => setBankModalInvoice(inv)}
                        title="Bank Details"
                      >
                        <Landmark className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          currentUser={currentUser}
          onClose={() => setSelectedInvoice(null)}
          onVerify={(id) => {
            if (onVerify) {
              onVerify(id);
            } else {
              const target = invoices.find((i) => i.id === id);
              if (target) setVerifyConfirmModalTarget(target);
            }
          }}
          onApprove={(id) => {
            if (onApprove) {
              onApprove(id);
            } else {
              const target = invoices.find((i) => i.id === id);
              if (target) setApproveConfirmModalTarget(target);
            }
          }}
          onRejectClick={(id) => {
            if (onRejectClick) {
              onRejectClick(id);
            } else {
              const reason = prompt('Please enter rejection reason:');
              if (reason) rejectInvoice(id, reason);
            }
          }}
          onReject={(id, reason) => rejectInvoice(id, reason)}
          onPay={(id) => payInvoice(id)}
          onOpenBankModal={(inv) => setBankModalInvoice(inv)}
        />
      )}

      {/* Verify Confirmation Modal */}
      {verifyConfirmModalTarget && (
        <VerifyConfirmationModal
          invoice={verifyConfirmModalTarget}
          isOpen={!!verifyConfirmModalTarget}
          onClose={() => setVerifyConfirmModalTarget(null)}
          onConfirm={async (id, notes) => {
            if (onVerify) {
              await onVerify(id, notes);
            } else {
              await verifyInvoice(id, notes);
            }
          }}
          onReject={(id) => {
            if (onRejectClick) {
              onRejectClick(id);
            } else {
              const reason = prompt('Please enter rejection reason:');
              if (reason) rejectInvoice(id, reason);
            }
          }}
        />
      )}

      {/* Approval Confirmation Modal */}
      {approveConfirmModalTarget && (
        <ApproveConfirmationModal
          invoice={approveConfirmModalTarget}
          isOpen={!!approveConfirmModalTarget}
          onClose={() => setApproveConfirmModalTarget(null)}
          onConfirm={async (id) => {
            if (onApprove) {
              await onApprove(id);
            } else {
              await approveInvoice(id);
            }
          }}
          onReject={(id) => {
            if (onRejectClick) {
              onRejectClick(id);
            } else {
              const reason = prompt('Please enter rejection reason:');
              if (reason) rejectInvoice(id, reason);
            }
          }}
        />
      )}

      {/* Bank Details Modal */}
      {bankModalInvoice && (
        <BankDetailsModal
          invoice={bankModalInvoice}
          onClose={() => setBankModalInvoice(null)}
          onSave={(bankDetails) => {
            updateBankDetails(bankModalInvoice.id, bankDetails);
            setBankModalInvoice(null);
          }}
        />
      )}
    </Card>
  );
}
