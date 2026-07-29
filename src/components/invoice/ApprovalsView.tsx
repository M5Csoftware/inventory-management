'use client';

import React from 'react';
import type { Invoice, TeamMember, AppConfig } from '@/types/invoice';
import { InvoiceTable, formatAmount } from './InvoiceTable';
import { ClipboardCheck, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ApprovalsViewProps {
  invoices: Invoice[];
  currentUser: TeamMember | null;
  team: TeamMember[];
  config: AppConfig;
  lastActionId: string | null;
  onVerify: (id: string, notes?: string) => void;
  onApprove: (id: string) => void;
  onRejectClick: (id: string) => void;
  onPay: (id: string) => void;
  onInvoiceClick: (invoice: Invoice) => void;
  onAddBankDetails?: (invoice: Invoice) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  invoices,
  currentUser,
  team,
  config,
  lastActionId,
  onVerify,
  onApprove,
  onRejectClick,
  onPay,
  onInvoiceClick,
  onAddBankDetails,
}) => {
  const pendingVerification = invoices.filter((i) => i.status === 'pending_verification');
  const pendingApproval = invoices.filter((i) => i.status === 'pending_approval');
  const approved = invoices.filter((i) => i.status === 'approved');

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Approvals Queue
          </h2>
          <p className="text-xs text-muted-foreground">Review, verify, and grant sign-offs for inward invoices</p>
        </div>
      </div>

      {/* Step 1: Verifier queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" /> Awaiting Verification ({pendingVerification.length})
          </h3>
          <span className="text-xs text-muted-foreground font-medium">Step 1 of 3 &bull; Verification Review</span>
        </div>
        <InvoiceTable
          invoices={pendingVerification}
          currentUser={currentUser}
          team={team}
          config={config}
          lastActionId={lastActionId}
          showActions={true}
          onVerify={onVerify}
          onApprove={onApprove}
          onRejectClick={onRejectClick}
          onPay={onPay}
          onInvoiceClick={onInvoiceClick}
          onAddBankDetails={onAddBankDetails}
        />
      </div>

      {/* Step 2: Admin approval queue */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-purple-500" /> Awaiting Admin Approval ({pendingApproval.length})
          </h3>
          <span className="text-xs text-muted-foreground font-mono font-medium">
            (Threshold ≥ {formatAmount(config.threshold, config.currency)} requires sign-off)
          </span>
        </div>
        <InvoiceTable
          invoices={pendingApproval}
          currentUser={currentUser}
          team={team}
          config={config}
          lastActionId={lastActionId}
          showActions={true}
          onVerify={onVerify}
          onApprove={onApprove}
          onRejectClick={onRejectClick}
          onPay={onPay}
          onInvoiceClick={onInvoiceClick}
          onAddBankDetails={onAddBankDetails}
        />
      </div>

      {/* Step 3: Pay queue */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Approved — Ready to Pay ({approved.length})
          </h3>
          <span className="text-xs text-muted-foreground font-medium">Step 3 of 3 &bull; Final Payout Queue</span>
        </div>
        <InvoiceTable
          invoices={approved}
          currentUser={currentUser}
          team={team}
          config={config}
          lastActionId={lastActionId}
          showActions={true}
          onVerify={onVerify}
          onApprove={onApprove}
          onRejectClick={onRejectClick}
          onPay={onPay}
          onInvoiceClick={onInvoiceClick}
          onAddBankDetails={onAddBankDetails}
        />
      </div>
    </div>
  );
};
