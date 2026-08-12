'use client';

import React, { useState } from 'react';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, RefreshCw, Clock, CheckCircle2, Layers } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

function ApprovalsWorkflowContent() {
  const {
    invoices,
    loading,
    refreshInvoices,
    verifyInvoice,
    approveInvoice,
    rejectInvoice,
    payInvoice,
    updateBankDetails,
    team,
    config,
  } = useInvoice();
  const { user } = useAuth();
  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'step1' | 'step2' | 'step3'>('all');

  const pendingL1List = invoices.filter((i) => i.status === 'pending_verification');
  const pendingL2List = invoices.filter((i) => i.status === 'pending_approval');
  const approvedList = invoices.filter((i) => i.status === 'approved');

  return (
    <div className="p-6 sm:p-8 pb-32 sm:pb-44 space-y-8 animate-in fade-in duration-300 min-h-screen bg-background w-full max-w-full">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Approvals Workflow
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage L1 Verification queue, L2 Admin Sign-Off approvals, and L3 Payout queue for inward vendor invoices.
          </p>
        </div>
        <Button variant="outline" onClick={refreshInvoices} className="shadow-sm shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queues
        </Button>
      </div>

      {/* Overview Cards (3 Steps) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        <Card
          onClick={() => setActiveQueueTab('step1')}
          className={`border cursor-pointer transition-all hover:scale-[1.01] ${
            activeQueueTab === 'step1'
              ? 'border-amber-500 bg-amber-500/10 shadow-md'
              : 'border-amber-500/30 bg-amber-500/5 shadow-xs'
          } rounded-2xl`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" /> Step 1: Verification Queue
              </p>
              <p className="text-2xl font-black text-amber-800 dark:text-amber-200 mt-1">{pendingL1List.length} Pending</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting initial document &amp; details verification</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveQueueTab('step2')}
          className={`border cursor-pointer transition-all hover:scale-[1.01] ${
            activeQueueTab === 'step2'
              ? 'border-purple-500 bg-purple-500/10 shadow-md'
              : 'border-purple-500/30 bg-purple-500/5 shadow-xs'
          } rounded-2xl`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-purple-500" /> Step 2: Admin Approval Queue
              </p>
              <p className="text-2xl font-black text-purple-800 dark:text-purple-200 mt-1">{pendingL2List.length} Pending</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting final admin threshold sign-off</p>
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setActiveQueueTab('step3')}
          className={`border cursor-pointer transition-all hover:scale-[1.01] ${
            activeQueueTab === 'step3'
              ? 'border-emerald-500 bg-emerald-500/10 shadow-md'
              : 'border-emerald-500/30 bg-emerald-500/5 shadow-xs'
          } rounded-2xl`}
        >
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Step 3: Ready to Pay Queue
              </p>
              <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">{approvedList.length} Approved</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Approved invoices ready for final bank payout</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Tabs Toolbar */}
      <div className="flex items-center gap-2 p-1 bg-muted/60 backdrop-blur-xs rounded-xl border border-border/50 flex-wrap w-fit">
        <button
          onClick={() => setActiveQueueTab('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeQueueTab === 'all'
              ? 'bg-background text-foreground shadow-xs font-bold border border-border/50'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers size={14} className={activeQueueTab === 'all' ? 'text-primary' : ''} />
          All Queues (3 Steps)
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
          Step 1: Verification ({pendingL1List.length})
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
          Step 2: Admin Sign-Off ({pendingL2List.length})
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
          Step 3: Ready to Pay ({approvedList.length})
        </button>
      </div>

      {/* L1 Queue Table (Step 1) */}
      {(activeQueueTab === 'all' || activeQueueTab === 'step1') && (
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Step 1: Pending Verification ({pendingL1List.length})
            </h3>
            <span className="text-xs text-muted-foreground font-medium">L1 Document Review</span>
          </div>
          <InvoiceTable
            invoices={pendingL1List}
            title="Verification Queue"
            defaultStatusFilter="pending_verification"
            team={team}
            config={config}
            showActions={true}
            onVerify={verifyInvoice}
            onApprove={approveInvoice}
            onRejectClick={(id) => rejectInvoice(id, "Rejected from approvals queue")}
            onPay={payInvoice}
          />
        </div>
      )}

      {/* L2 Queue Table (Step 2) */}
      {(activeQueueTab === 'all' || activeQueueTab === 'step2') && (
        <div className="space-y-3 pt-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-purple-500" /> Step 2: Pending Admin Sign-Off ({pendingL2List.length})
            </h3>
            <span className="text-xs text-muted-foreground font-medium">L2 Threshold Sign-Off</span>
          </div>
          <InvoiceTable
            invoices={pendingL2List}
            title="Admin Sign-Off Queue"
            defaultStatusFilter="pending_approval"
            team={team}
            config={config}
            showActions={true}
            onVerify={verifyInvoice}
            onApprove={approveInvoice}
            onRejectClick={(id) => rejectInvoice(id, "Rejected from approvals queue")}
            onPay={payInvoice}
          />
        </div>
      )}

      {/* Step 3 Queue Table (Approved - Ready to Pay) */}
      {(activeQueueTab === 'all' || activeQueueTab === 'step3') && (
        <div className="space-y-3 pt-4 w-full">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Step 3: Approved — Ready to Pay ({approvedList.length})
            </h3>
            <span className="text-xs text-muted-foreground font-medium">L3 Final Payout Queue</span>
          </div>
          <InvoiceTable
            invoices={approvedList}
            title="Approved / Payout Queue"
            defaultStatusFilter="approved"
            team={team}
            config={config}
            showActions={true}
            onVerify={verifyInvoice}
            onApprove={approveInvoice}
            onRejectClick={(id) => rejectInvoice(id, "Rejected from approvals queue")}
            onPay={payInvoice}
          />
        </div>
      )}
    </div>
  );
}

export default function ApprovalsWorkflowPage() {
  return (
    <InvoiceProvider>
      <ApprovalsWorkflowContent />
    </InvoiceProvider>
  );
}
