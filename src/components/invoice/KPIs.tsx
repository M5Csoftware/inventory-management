import React from 'react';
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
      colorClass: 'border-l-indigo-600',
      textColor: 'text-slate-900 dark:text-slate-100',
    },
    {
      label: 'Awaiting Second Approval',
      value: pendingL2,
      icon: ShieldAlert,
      colorClass: 'border-l-indigo-600',
      textColor: 'text-slate-900 dark:text-slate-100',
    },
    {
      label: 'Approved - Ready to Pay',
      value: approved,
      icon: Landmark,
      colorClass: 'border-l-indigo-600',
      textColor: 'text-slate-900 dark:text-slate-100',
    },
    {
      label: 'Paid',
      value: paid,
      icon: CheckCircle,
      colorClass: 'border-l-emerald-600',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Flagged For Review',
      value: flagged,
      icon: AlertOctagon,
      colorClass: 'border-l-rose-600',
      textColor: 'text-rose-600 dark:text-rose-400',
      highlight: flagged > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isRed = card.textColor.includes('rose');
        const isGreen = card.textColor.includes('emerald');

        let badgeBg = 'bg-slate-100 text-slate-700';
        if (isRed) badgeBg = 'bg-rose-500/10 text-rose-600 border border-rose-500/20';
        else if (isGreen) badgeBg = 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20';
        else badgeBg = 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20';

        return (
          <div
            key={index}
            className={`bg-card border border-border/80 border-l-4 ${card.colorClass} rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-200 ${
              card.highlight ? 'bg-rose-500/5' : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={`text-2xl font-extrabold leading-none ${card.textColor}`}>
                {card.value}
              </span>
              <div className={`p-2 rounded-full flex items-center justify-center ${badgeBg}`}>
                <Icon size={15} />
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 block leading-tight">
              {card.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
