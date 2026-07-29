'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, ShieldCheck, CheckCircle2, DollarSign, AlertTriangle, FileText } from 'lucide-react';

interface KPIsProps {
  total: number;
  pendingL1: number;
  pendingL2: number;
  approved: number;
  paid: number;
  flagged: number;
}

export function KPIs({ total, pendingL1, pendingL2, approved, paid, flagged }: KPIsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* Total Invoices */}
      <Card className="border border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Registered</p>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground mt-0.5">{total}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Pending L1 Verification */}
      <Card className="border border-amber-500/20 bg-amber-500/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Pending L1 (Verify)</p>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-0.5">{pendingL1}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Pending L2 Approval */}
      <Card className="border border-purple-500/20 bg-purple-500/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">Pending L2 (Sign-Off)</p>
            <p className="text-xl sm:text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">{pendingL2}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Approved */}
      <Card className="border border-emerald-500/20 bg-emerald-500/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Approved</p>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">{approved}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
        </CardContent>
      </Card>

      {/* Paid */}
      <Card className="border border-blue-500/20 bg-blue-500/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Paid</p>
            <p className="text-xl sm:text-2xl font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">{paid}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
            <DollarSign className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
        </CardContent>
      </Card>

      {/* High Flagged */}
      <Card className="border border-rose-500/20 bg-rose-500/5 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">Flagged Risk</p>
            <p className="text-xl sm:text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-0.5">{flagged}</p>
          </div>
          <div className="h-9 w-9 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 sm:h-5 w-4 sm:w-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
