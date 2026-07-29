'use client';

import React, { useState } from 'react';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { History, RefreshCw, Search, Download, FileText } from 'lucide-react';

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
    <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-300 min-h-screen bg-background w-full max-w-full">
      {/* Top Header matching Inventory Management pages (NO back button) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            Invoice Audit
          </h1>
          <p className="text-muted-foreground mt-1">
            Immutable chronological log of all invoice check-ins, verifications, sign-offs, payments, and bank updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refreshInvoices} className="shadow-sm">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="outline" onClick={exportAuditCSV} className="shadow-sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Main Audit Table Card */}
      <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm overflow-hidden w-full max-w-full">
        <div className="p-4 bg-muted/40 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Action Logs</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {filteredEntries.length} Records
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by action, vendor, actor..."
              className="pl-9 h-9 text-xs bg-white/90 dark:bg-gray-900/90 border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground border-b border-border/40">
              <tr>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Invoice Ref</th>
                <th className="py-3 px-4">Vendor &amp; Invoice No.</th>
                <th className="py-3 px-4">Action Performed</th>
                <th className="py-3 px-4">Actor (User)</th>
                <th className="py-3 px-4">Action Details / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    No audit records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((e, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(e.at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
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
