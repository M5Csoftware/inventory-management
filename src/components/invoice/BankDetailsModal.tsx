'use client';

import React, { useState } from 'react';
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

  const [bankName, setBankName] = useState(existing?.bankName || '');
  const [accountName, setAccountName] = useState(existing?.accountName || invoice.vendor || '');
  const [accountNumber, setAccountNumber] = useState(existing?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(existing?.ifscCode || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountName || !accountNumber || !ifscCode) return;

    onSave({
      bankName,
      accountName,
      accountNumber,
      ifscCode,
      addedAt: Date.now(),
      addedBy: user?.name || 'User',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden space-y-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Vendor Bank Details</h3>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Bank Name <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="e.g. HDFC Bank / ICICI Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-10 text-xs bg-background"
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
              className="h-10 text-xs bg-background"
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
                className="h-10 text-xs font-mono bg-background"
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
                className="h-10 text-xs font-mono uppercase bg-background"
                required
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Save className="h-4 w-4" /> Save Bank Details
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
