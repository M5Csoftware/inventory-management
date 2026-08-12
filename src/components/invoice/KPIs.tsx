'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert, Hourglass, Landmark, CheckCircle, AlertOctagon } from 'lucide-react';

interface KPIsProps {
  pendingL1: number;
  pendingL2: number;
  approved: number;
  paid: number;
  flagged: number;
}

export const KPIs: React.FC<KPIsProps> = ({
  pendingL1,
  pendingL2,
  approved,
  paid,
  flagged,
}) => {
  const cards = [
    {
      label: 'Awaiting First Approval',
      value: pendingL1,
      icon: Hourglass,
      badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      valueStyle: 'text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Awaiting Second Approval',
      value: pendingL2,
      icon: ShieldAlert,
      badgeStyle: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      valueStyle: 'text-purple-700 dark:text-purple-300',
    },
    {
      label: 'Approved - Ready to Pay',
      value: approved,
      icon: Landmark,
      badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      valueStyle: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Paid',
      value: paid,
      icon: CheckCircle,
      badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      valueStyle: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Flagged For Review',
      value: flagged,
      icon: AlertOctagon,
      badgeStyle: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      valueStyle: 'text-rose-700 dark:text-rose-300',
      highlight: flagged > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card
            key={index}
            className={`border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 ${
              card.highlight ? 'border-rose-500/40 bg-rose-500/5' : ''
            }`}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex justify-between items-center">
                <span className={`text-2xl font-black tracking-tight ${card.valueStyle}`}>
                  {card.value}
                </span>
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center border shrink-0 ${card.badgeStyle}`}>
                  <Icon size={16} />
                </div>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mt-3 block leading-tight">
                {card.label}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
