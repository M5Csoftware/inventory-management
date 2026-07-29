import React from 'react';
import type { Invoice, AppConfig, TeamMember } from '@/types/invoice';
import { KPIs } from './KPIs';
import { InvoiceTable } from './InvoiceTable';
import { Shield, Download } from 'lucide-react';
import { formatAmount } from './InvoiceTable';
import { exportInvoicesToCSV } from '@/utils/export-invoice';

interface DashboardViewProps {
  invoices: Invoice[];
  team: TeamMember[];
  config: AppConfig;
  onInvoiceClick: (invoice: Invoice) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  invoices, 
  team, 
  config,
  onInvoiceClick
}) => {
  const pendingVerification = invoices.filter((i) => i.status === 'pending_verification').length;
  const pendingApproval = invoices.filter((i) => i.status === 'pending_approval').length;
  const approved = invoices.filter((i) => i.status === 'approved').length;
  const paid = invoices.filter((i) => i.status === 'paid').length;

  const flaggedList = invoices.filter(
    (i) =>
      i.flags &&
      i.flags.some((f) => f.level === 'high') &&
      i.status !== 'paid' &&
      i.status !== 'rejected'
  );
  
  const flaggedCount = flaggedList.length;

  return (
    <div className="w-full space-y-6">
      <KPIs
        pendingL1={pendingVerification}
        pendingL2={pendingApproval}
        approved={approved}
        paid={paid}
        flagged={flaggedCount}
      />

      <div className="bg-card border border-border/80 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Needs Attention
          </h2>
          {flaggedList.length > 0 && (
            <button
              onClick={() => exportInvoicesToCSV(flaggedList, 'Flagged_Invoices')}
              className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Download size={14} /> Export Flagged to CSV
            </button>
          )}
        </div>
        {flaggedList.length === 0 ? (
          <p className="text-muted-foreground text-xs italic bg-muted/20 border border-border/60 rounded-xl p-6 shadow-xs">
            Nothing flagged right now — the register is clean.
          </p>
        ) : (
          <InvoiceTable
            invoices={flaggedList}
            currentUser={null}
            team={team}
            config={config}
            lastActionId={null}
            showActions={false}
            onVerify={() => {}}
            onApprove={() => {}}
            onRejectClick={() => {}}
            onPay={() => {}}
            onInvoiceClick={onInvoiceClick}
          />
        )}
      </div>

      {/* Audit policy note */}
      <div className="border border-border/80 border-l-4 border-l-indigo-600 bg-card p-5 rounded-xl shadow-sm">
        <h3 className="font-semibold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
          <Shield size={16} className="text-indigo-600" />
          Audit Policy
        </h3>
        <ul className="list-disc pl-5 mt-3 space-y-2 text-xs sm:text-sm text-muted-foreground font-medium">
          <li>No user may approve or pay an invoice they submitted.</li>
          <li>Invoices of {formatAmount(config.threshold, config.currency)} or more require admin sign-off after verification.</li>
          <li>Every action is timestamped and permanently recorded in the Audit Trail.</li>
          <li>Duplicate invoice numbers, changed bank details, and near-threshold amounts are flagged automatically.</li>
        </ul>
      </div>
    </div>
  );
};
