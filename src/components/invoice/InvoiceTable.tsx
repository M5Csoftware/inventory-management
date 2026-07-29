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
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { InvoiceDetailModal } from './InvoiceDetailModal';
import { BankDetailsModal } from './BankDetailsModal';
import { useInvoice } from '@/context/invoice-context';

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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [bankModalInvoice, setBankModalInvoice] = useState<Invoice | null>(null);

  const isAdminOrMaster = user?.id === 'master' || user?.role === 'master' || user?.role === 'admin';

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.poNumber && inv.poNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = [
      'ID',
      'Vendor',
      'Invoice Number',
      'Invoice Date',
      'Taxable Amount (INR)',
      'Tax Option',
      'Tax Amount (INR)',
      'Total Amount (INR)',
      'PO Number',
      'Status',
      'Entered By',
      'Branch',
    ];

    const rows = filteredInvoices.map((i) => [
      `"${i.id}"`,
      `"${i.vendor.replace(/"/g, '""')}"`,
      `"${i.invoiceNumber}"`,
      `"${i.invoiceDate}"`,
      i.taxableAmount,
      `"${i.taxOption}"`,
      i.taxAmount,
      i.amount,
      `"${i.poNumber || ''}"`,
      `"${i.status}"`,
      `"${i.enteredBy}"`,
      `"${i.branch || ''}"`,
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
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">Pending L1</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">Pending L2</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Approved</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">Paid</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">Rejected</Badge>;
    }
  };

  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 bg-muted/30 border-b border-border/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-base text-foreground">{title || 'Registered Inward Invoices'}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {filteredInvoices.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search vendor, inv #, PO #..."
                className="pl-9 h-9 text-xs bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs h-9">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
          {[
            { id: 'all', label: 'All Invoices' },
            { id: 'pending_verification', label: 'Pending L1' },
            { id: 'pending_approval', label: 'Pending L2' },
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
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
            <tr>
              <th className="py-3 px-4">Invoice ID</th>
              <th className="py-3 px-4">Vendor Name</th>
              <th className="py-3 px-4">Invoice No.</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Taxable</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4">PO No.</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Entered By</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-foreground">
                  No invoice records found matching your filters.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
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
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => setSelectedInvoice(inv)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {inv.status === 'pending_verification' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                          onClick={() => verifyInvoice(inv.id)}
                          title="L1 Verify"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}

                      {inv.status === 'pending_approval' && isAdminOrMaster && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
                          onClick={() => approveInvoice(inv.id)}
                          title="L2 Approve"
                        >
                          <ShieldCheck className="h-4 w-4" />
                        </Button>
                      )}

                      {inv.status === 'approved' && isAdminOrMaster && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                          onClick={() => payInvoice(inv.id)}
                          title="Mark Paid"
                        >
                          <DollarSign className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => setBankModalInvoice(inv)}
                        title="Bank Details"
                      >
                        <Landmark className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onVerify={(id, notes) => verifyInvoice(id, notes)}
          onApprove={(id) => approveInvoice(id)}
          onReject={(id, reason) => rejectInvoice(id, reason)}
          onPay={(id) => payInvoice(id)}
          onOpenBankModal={(inv) => setBankModalInvoice(inv)}
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
