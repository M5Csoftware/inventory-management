'use client';

import React from 'react';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

function ApprovalsWorkflowContent() {
  const { invoices, loading, refreshInvoices } = useInvoice();
  const { user } = useAuth();

  const pendingL1List = invoices.filter((i) => i.status === 'pending_verification');
  const pendingL2List = invoices.filter((i) => i.status === 'pending_approval');

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-300 min-h-screen bg-background w-full max-w-full">
      {/* Top Header matching Inventory Management pages (NO back button) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Approvals
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage L1 Verification queue and L2 Admin Sign-Off approvals for inward vendor invoices.
          </p>
        </div>
        <Button variant="outline" onClick={refreshInvoices} className="shadow-sm">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Queues
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <Card className="border border-amber-500/30 bg-amber-500/5 shadow-xs rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> L1 Verification Queue
              </p>
              <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-200 mt-1">{pendingL1List.length} Pending</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting initial document &amp; details verification</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-500/30 bg-purple-500/5 shadow-xs rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> L2 Admin Sign-Off Queue
              </p>
              <p className="text-2xl font-extrabold text-purple-800 dark:text-purple-200 mt-1">{pendingL2List.length} Pending</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting final admin threshold approval</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* L1 Queue Table */}
      <div className="space-y-3 w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" /> L1 Pending Verification ({pendingL1List.length})
        </h3>
        <InvoiceTable invoices={pendingL1List} title="L1 Verification Queue" defaultStatusFilter="pending_verification" />
      </div>

      {/* L2 Queue Table */}
      <div className="space-y-3 pt-4 w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-purple-600" /> L2 Pending Admin Sign-Off ({pendingL2List.length})
        </h3>
        <InvoiceTable invoices={pendingL2List} title="L2 Admin Sign-Off Queue" defaultStatusFilter="pending_approval" />
      </div>
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
