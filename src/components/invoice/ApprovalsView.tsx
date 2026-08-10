'use client';

import React, { useState } from 'react';
import type { Invoice, TeamMember, AppConfig } from '@/types/invoice';
import { InvoiceTable, formatAmount } from './InvoiceTable';
import { ClipboardCheck, Clock, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ApprovalsViewProps {
  invoices: Invoice[];
  currentUser: TeamMember | null;
  team: TeamMember[];
  config: AppConfig;
  lastActionId: string | null;
  showActions?: boolean;
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
  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'step1' | 'step2' | 'step3'>('all');

  const pendingVerification = invoices.filter((i) => i.status === 'pending_verification');
  const pendingApproval = invoices.filter((i) => i.status === 'pending_approval');
  const approved = invoices.filter((i) => i.status === 'approved');

  return (
    <div className="w-full space-y-8 pb-32 sm:pb-44">
      {/* Header & Sub-Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 shadow-xs">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Approvals Queue
            </h2>
            <p className="text-xs text-muted-foreground">Review, verify, and grant sign-offs for inward invoices</p>
          </div>
        </div>

        {/* Quick Filter Tabs for Approvals Workflow */}
        <div className="inline-flex p-1 bg-muted/60 backdrop-blur-xs rounded-xl border border-border/50 flex-wrap gap-1">
          <button
            onClick={() => setActiveQueueTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeQueueTab === 'all'
                ? 'bg-background text-foreground shadow-xs font-bold border border-border/50'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers size={14} className={activeQueueTab === 'all' ? 'text-primary' : ''} />
            All Queues ({invoices.filter((i) => i.status !== 'paid' && i.status !== 'rejected').length})
          </button>

          <button
            onClick={() => setActiveQueueTab('step1')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeQueueTab === 'step1'
                ? 'bg-amber-500/10 text-amber-800 dark:text-amber-200 shadow-xs font-bold border border-amber-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock size={14} className="text-amber-500" />
            Step 1: Verification ({pendingVerification.length})
          </button>

          <button
            onClick={() => setActiveQueueTab('step2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeQueueTab === 'step2'
                ? 'bg-purple-500/10 text-purple-800 dark:text-purple-200 shadow-xs font-bold border border-purple-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShieldCheck size={14} className="text-purple-500" />
            Step 2: Approval ({pendingApproval.length})
          </button>

          <button
            onClick={() => setActiveQueueTab('step3')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeQueueTab === 'step3'
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 shadow-xs font-bold border border-emerald-500/30'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 size={14} className="text-emerald-500" />
            Step 3: Ready to Pay ({approved.length})
          </button>
        </div>
      </div>

      {/* Step 1: Verifier queue */}
      {(activeQueueTab === 'all' || activeQueueTab === 'step1') && (
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
      )}

      {/* Step 2: Admin approval queue */}
      {(activeQueueTab === 'all' || activeQueueTab === 'step2') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-500" /> Awaiting Admin / Invoice Approval ({pendingApproval.length})
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
      )}

      {/* Step 3: Pay queue */}
      {(activeQueueTab === 'all' || activeQueueTab === 'step3') && (
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
      )}
    </div>
  );
};
