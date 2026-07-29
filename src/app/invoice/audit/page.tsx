'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { History, ArrowLeft, RefreshCw, Search, Download, FileText, User, Calendar } from 'lucide-react';

function InvoiceAuditContent() {
  const { invoices, loading, refreshInvoices } = useInvoice();
  const [searchTerm, setSearchTerm] = useState('');

  // Flat map all history entries across all invoices
  const auditEntries = invoices.flatMap((inv) =>
    (inv.history || []).map((h) => ({
      ...h,
      invoiceId: inv.id,
      vendor: inv.vendor,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
    }))
  ).sort((a, b) => b.at - a.at);

  const filteredEntries = auditEntries.filter((e) => {
    const term = searchTerm.toLowerCase();
    return (
      e.vendor.toLowerCase().includes(term) ||
      e.invoiceNumber.toLowerCase().includes(term) ||
      e.action.toLowerCase().includes(term) ||
      e.actorName.toLowerCase().includes(term) ||
      e.invoiceId.toLowerCase().includes(term)
    );
  });

  const exportAuditCSV = () => {
    const headers = ['Timestamp', 'Invoice ID', 'Vendor', 'Invoice No.', 'Action', 'Actor Name', 'Actor Role', 'Details / Note'];
    const rows = filteredEntries.map((e) => [
      `"${new Date(e.at).toLocaleString()}"`,
      `"${e.invoiceId}"`,
      `"${e.vendor.replace(/"/g, '""')}"`,
      `"${e.invoiceNumber}"`,
      `"${e.action}"`,
      `"${e.actorName}"`,
      `"${e.actorRole}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Invoice_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoice">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-2 transition-all hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2.5">
              <History className="h-7 w-7 text-purple-600" />
              Invoice Audit Trail & Action Log
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Immutable chronological history of all invoice inward check-ins, verifications, sign-offs, payments, and bank detail updates
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshInvoices} className="gap-2 h-9 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportAuditCSV} className="gap-2 h-9 text-xs">
            <Download className="h-3.5 w-3.5" /> Export Audit Trail (CSV)
          </Button>
        </div>
      </div>

      {/* Main Audit Table Card */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="p-4 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-600" />
            <h3 className="font-bold text-base text-foreground">Action Logs</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {filteredEntries.length} Records
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by action, vendor, actor..."
              className="pl-9 h-9 text-xs bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Invoice Ref</th>
                <th className="py-3 px-4">Vendor & Invoice No.</th>
                <th className="py-3 px-4">Action Performed</th>
                <th className="py-3 px-4">Actor (User)</th>
                <th className="py-3 px-4">Action Details / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No audit records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(e.at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {e.invoiceId}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground">{e.vendor}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{e.invoiceNumber}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {e.action}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-foreground">{e.actorName}</div>
                      <div className="text-[11px] text-muted-foreground">{e.actorRole}</div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground max-w-xs truncate" title={e.note}>
                      {e.note || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function InvoiceAuditPage() {
  return (
    <InvoiceProvider>
      <InvoiceAuditContent />
    </InvoiceProvider>
  );
}
