import React, { useState } from 'react';
import type { Invoice, AppConfig } from '@/types/invoice';
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
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <History size={18} className="text-indigo-600" />
          Audit Trail
          <span className="text-xs font-medium text-muted-foreground select-none">— permanent ledger</span>
        </h2>
        <div className="flex flex-col items-center justify-center bg-card border border-border/80 rounded-xl p-10 shadow-sm mt-4">
          <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-3">
            <FileSpreadsheet size={32} className="text-muted-foreground" />
          </div>
          <p className="text-foreground font-bold text-sm">No records found</p>
          <p className="text-muted-foreground text-xs mt-1 text-center">No approved or paid invoices to display in the audit trail yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-card border border-border/80 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Download Audit Records</h3>
            <p className="text-xs text-muted-foreground">
              Export all {entriesForExport.length} system audit event logs as a formatted Excel spreadsheet (.csv).
            </p>
          </div>
        </div>
        <button
          onClick={handleExportExcel}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Download size={15} />
          Export Excel File
        </button>
      </div>

      <div className="border-b border-border/80 pb-2">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <History size={18} className="text-indigo-600" />
          Processed Invoices Ledger
        </h2>
        <p className="text-xs font-medium text-muted-foreground select-none mt-0.5">
          Showing 1 row per invoice (Approved and Paid). Click to view full audit logs.
        </p>
      </div>

      <div className="overflow-x-auto w-full border border-border/80 rounded-xl bg-card shadow-sm">
        <table className="w-full border-collapse text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 select-none">
              <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground px-4 py-3">Vendor</th>
              <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground px-4 py-3">Invoice #</th>
              <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground px-4 py-3">Amount</th>
              <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground px-4 py-3">Status</th>
              <th className="text-xs uppercase font-bold tracking-wider text-muted-foreground px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {displayInvoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-bold text-foreground">{inv.vendor}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{inv.invoiceNumber}</td>
                <td className="px-4 py-3 font-mono font-semibold text-foreground">
                  {formatAmount(inv.amount, config.currency)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${
                    inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'
                  }`}>
                    {inv.status === 'paid' ? 'PAID' : 'APPROVED'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="inline-flex items-center gap-1 bg-background border border-border/80 hover:border-indigo-600 hover:text-indigo-600 text-foreground px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold"
                  >
                    <Eye size={14} /> Full Log
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Audit Log: ${selectedInvoice.invoiceNumber}` : ''}
      >
        {selectedInvoice && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="bg-muted/30 border border-border/60 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Vendor</span>
                  <span className="text-sm font-semibold text-foreground">{selectedInvoice.vendor}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</span>
                  <span className="text-sm font-semibold font-mono text-foreground">{formatAmount(selectedInvoice.amount, config.currency)}</span>
                </div>
              </div>
            </div>

            <div className="relative pl-4 border-l-2 border-border/80 space-y-6">
              {[...(selectedInvoice.history || [])].sort((a, b) => b.at - a.at).map((ev, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[21px] mt-0.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-background ring-2 ring-indigo-500/20"></div>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-mono text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(ev.at).toLocaleString('en-IN')}
                    </span>
                    <span className="bg-indigo-500/10 text-indigo-600 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                      {ev.action}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Actor: <span className="font-semibold text-foreground">{ev.actorName}</span> <span className="font-mono">({ev.actorRole})</span>
                  </div>
                  {ev.note && (
                    <div className="mt-1.5 text-xs bg-background border border-border/60 p-2.5 rounded-lg text-foreground max-w-full break-words leading-relaxed italic shadow-xs">
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
