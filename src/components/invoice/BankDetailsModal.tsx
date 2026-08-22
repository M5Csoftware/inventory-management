'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Invoice, BankDetails } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Landmark, X, Save } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface BankDetailsModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSave: (bankDetails: BankDetails) => void;
}

export function BankDetailsModal({ invoice, onClose, onSave }: BankDetailsModalProps) {
  const { user } = useAuth();
  const existing = invoice.bankDetails;
  const [mounted, setMounted] = useState(false);

  const [bankName, setBankName] = useState(existing?.bankName || '');
  const [accountName, setAccountName] = useState(existing?.accountName || invoice.vendor || '');
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(existing?.ifscCode || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = React.useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting || !bankName || !accountName || !accountNumber || !ifscCode) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    onSave({
      bankName,
      accountName,
      accountNumber,
      ifscCode,
      addedAt: Date.now(),
      addedBy: user?.name || 'User',
    });
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden space-y-0 border-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 p-4 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">Vendor Bank Details</h3>
              <p className="text-xs text-muted-foreground">
                Invoice {invoice.invoiceNumber} &bull; {invoice.vendor}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-gradient-to-br from-background via-background to-muted/20">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bank Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. HDFC Bank / ICICI Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Account Holder Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. Acme Technologies Pvt Ltd"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Account Number <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. 50100294184920"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="h-10 text-xs font-mono bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-bold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                IFSC Code <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. HDFC0001234"
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                className="h-10 text-xs font-mono uppercase bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-bold"
                required
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" size="sm" onClick={onClose} className="shadow-sm">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="gap-2 shadow-md">
              <Save className="h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save Bank Details'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
