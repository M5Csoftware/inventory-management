'use client';

import React from 'react';
import type { Invoice, AppConfig, TeamMember } from '@/types/invoice';
import { KPIs } from './KPIs';
import { InvoiceTable } from './InvoiceTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

      <Card className="border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Needs Attention
          </CardTitle>
          {flaggedList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportInvoicesToCSV(flaggedList, 'Flagged_Invoices')}
              className="gap-1.5 text-xs h-8"
            >
              <Download size={14} /> Export Flagged CSV
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-4">
          {flaggedList.length === 0 ? (
            <div className="flex items-center justify-center p-8 bg-muted/10 border border-dashed border-border/60 rounded-xl text-center">
              <div className="space-y-1">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto opacity-80" />
                <p className="text-sm font-semibold text-foreground">Clean Register</p>
                <p className="text-xs text-muted-foreground">Nothing flagged right now — all invoice checks passed cleanly.</p>
              </div>
            </div>
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
        </CardContent>
      </Card>

      {/* Audit Policy Card */}
      <Card className="border border-primary/20 bg-primary/5 rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="p-5">
          <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
            <Shield size={16} />
            Audit &amp; Security Policy
          </h3>
          <ul className="list-disc pl-5 mt-3 space-y-1.5 text-xs text-muted-foreground font-medium">
            <li>No user may approve or pay an invoice they submitted.</li>
            <li>Invoices of <strong className="text-foreground">{formatAmount(config.threshold, config.currency)}</strong> or more require admin sign-off after verification.</li>
            <li>Every action is timestamped and permanently recorded in the Audit Trail.</li>
            <li>Duplicate invoice numbers, changed bank details, and near-threshold amounts are flagged automatically.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
