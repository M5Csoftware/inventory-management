'use client';

import React from 'react';
import Link from 'next/link';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, CheckCircle2, ArrowLeft, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

function ApprovalsWorkflowContent() {
  const { invoices, loading, refreshInvoices } = useInvoice();
  const { user } = useAuth();

  const pendingL1List = invoices.filter((i) => i.status === 'pending_verification');
  const pendingL2List = invoices.filter((i) => i.status === 'pending_approval');

  const isAdminOrMaster = user?.id === 'master' || user?.role === 'master' || user?.role === 'admin';

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
              <ShieldCheck className="h-7 w-7 text-purple-600" />
              Invoice Approvals Workflow
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage L1 Verification queue and L2 Admin Sign-Off approvals for inward vendor invoices
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={refreshInvoices} className="gap-2 h-9 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queues
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border border-amber-500/30 bg-amber-500/5 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> L1 Verification Queue
              </p>
              <p className="text-2xl font-extrabold text-amber-800 dark:text-amber-200 mt-1">{pendingL1List.length} Pending</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting initial document & details verification</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-purple-500/30 bg-purple-500/5 shadow-sm">
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
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" /> L1 Pending Verification ({pendingL1List.length})
        </h3>
        <InvoiceTable invoices={pendingL1List} title="L1 Pending Verification Queue" defaultStatusFilter="pending_verification" />
      </div>

      {/* L2 Queue Table */}
      <div className="space-y-3 pt-4">
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
