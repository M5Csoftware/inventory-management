'use client';

import React from 'react';
import Link from 'next/link';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { KPIs } from '@/components/invoice/KPIs';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileSpreadsheet, RefreshCw, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

function InvoiceDashboardContent() {
  const { invoices, config, loading, refreshInvoices } = useInvoice();

  const pendingL1 = invoices.filter((i) => i.status === 'pending_verification').length;
  const pendingL2 = invoices.filter((i) => i.status === 'pending_approval').length;
  const approved = invoices.filter((i) => i.status === 'approved').length;
  const paid = invoices.filter((i) => i.status === 'paid').length;
  const flagged = invoices.filter((i) => i.flags && i.flags.some((f) => f.level === 'high')).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2.5">
            <FileSpreadsheet className="h-7 w-7 text-purple-600" />
            Inward Invoice Register
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Track inward vendor invoices, L1 verification, L2 sign-offs, audit trails, and payment statuses
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshInvoices} className="gap-2 h-9 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Link href="/invoice/new">
            <Button size="sm" className="gap-2 h-9 text-xs bg-purple-600 hover:bg-purple-700 text-white">
              <PlusCircle className="h-4 w-4" /> Register Inward Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs Cards */}
      <KPIs
        total={invoices.length}
        pendingL1={pendingL1}
        pendingL2={pendingL2}
        approved={approved}
        paid={paid}
        flagged={flagged}
      />

      {/* Main Invoice Table */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground border rounded-2xl bg-card">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
          Loading Invoice Register...
        </div>
      ) : (
        <InvoiceTable invoices={invoices} title="Inward Invoices Log" />
      )}
    </div>
  );
}

export default function InvoiceDashboardPage() {
  return (
    <InvoiceProvider>
      <InvoiceDashboardContent />
    </InvoiceProvider>
  );
}
