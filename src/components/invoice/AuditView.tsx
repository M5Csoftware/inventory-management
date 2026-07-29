'use client';

import React, { useState } from 'react';
import type { Invoice, AppConfig } from '@/types/invoice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, Clock, FileSpreadsheet, Download, Eye } from 'lucide-react';
import { Modal } from './Modal';
import { formatAmount } from './InvoiceTable';

interface AuditViewProps {
  invoices: Invoice[];
  config: AppConfig;
}

export const AuditView: React.FC<AuditViewProps> = ({ invoices, config }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const entriesForExport = invoices.flatMap((inv) =>
    (inv.history || []).map((ev) => ({
      ...ev,
      vendor: inv.vendor,
      invoiceNumber: inv.invoiceNumber,
    }))
  );
  entriesForExport.sort((a, b) => b.at - a.at);

  const handleExportExcel = () => {
    if (entriesForExport.length === 0) return;
    const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Vendor', 'Invoice Number', 'Note / Metadata'];
    const rows = entriesForExport.map((e) => [
      `"${new Date(e.at).toLocaleString('en-IN').replace(/"/g, '""')}"`,
      `"${(e.actorName || '').replace(/"/g, '""')}"`,
      `"${(e.actorRole || '').replace(/"/g, '""')}"`,
      `"${(e.action || '').replace(/"/g, '""')}"`,
      `"${(e.vendor || '').replace(/"/g, '""')}"`,
      `"${(e.invoiceNumber || '').replace(/"/g, '""')}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const displayInvoices = invoices.filter(
    (inv) => inv.status === 'approved' || inv.status === 'paid'
  );
  displayInvoices.sort((a, b) => b.enteredAt - a.enteredAt);

  if (displayInvoices.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <History size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Invoice Audit
            </h2>
            <p className="text-xs text-muted-foreground">Permanent ledger of processed invoices</p>
          </div>
        </div>
        <Card className="border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl p-10 shadow-xs text-center">
          <div className="w-14 h-14 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet size={28} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-bold text-sm">No records found</p>
          <p className="text-muted-foreground text-xs mt-1">No approved or paid invoices to display in the audit trail yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <Card className="border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Download Audit Records</h3>
            <p className="text-xs text-muted-foreground">
              Export all {entriesForExport.length} system audit event logs as a formatted CSV spreadsheet.
            </p>
          </div>
        </div>
        <Button
          onClick={handleExportExcel}
          size="sm"
          className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs"
        >
          <Download size={15} />
          Export CSV File
        </Button>
      </Card>

      <div className="border-b border-border/60 pb-3">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <History size={20} className="text-primary" />
          Processed Invoices Ledger
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Showing 1 row per invoice (Approved and Paid). Click to view full audit logs.
        </p>
      </div>

      <Card className="border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs">
              {displayInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-foreground">{inv.vendor}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-foreground">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground">
                    {formatAmount(inv.amount, config.currency)}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === 'paid' ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">PAID</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">APPROVED</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(inv)}
                      className="gap-1 text-xs h-7 px-2.5"
                    >
                      <Eye size={14} /> Full Log
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Audit Log: ${selectedInvoice.invoiceNumber}` : ''}
      >
        {selectedInvoice && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="bg-muted/30 border border-border/60 rounded-xl p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vendor</span>
                  <span className="text-sm font-bold text-foreground">{selectedInvoice.vendor}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Amount</span>
                  <span className="text-sm font-extrabold font-mono text-foreground">{formatAmount(selectedInvoice.amount, config.currency)}</span>
                </div>
              </div>
            </div>

            <div className="relative pl-4 border-l-2 border-primary/40 space-y-5">
              {[...(selectedInvoice.history || [])].sort((a, b) => b.at - a.at).map((ev, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] mt-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background ring-2 ring-primary/20"></div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(ev.at).toLocaleString('en-IN')}
                    </span>
                    <span className="bg-primary/10 text-primary text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md">
                      {ev.action}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Actor: <span className="font-semibold text-foreground">{ev.actorName}</span> <span className="font-mono">({ev.actorRole})</span>
                  </div>
                  {ev.note && (
                    <div className="mt-1.5 text-xs bg-background border border-border/60 p-2.5 rounded-xl text-foreground max-w-full break-words leading-relaxed italic shadow-xs">
                      {ev.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
