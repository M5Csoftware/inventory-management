'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Modal } from './Modal';
import { useInventory } from '@/context/inventory-context';
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  Loader2,
  FileText,
  XCircle,
  ClipboardCheck,
  Info,
} from 'lucide-react';

interface VerifyConfirmationModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, notes?: string) => Promise<boolean | void> | void;
  onReject?: (id: string) => void;
}

export const VerifyConfirmationModal: React.FC<VerifyConfirmationModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onConfirm,
  onReject,
}) => {
  const { physicalVerifications } = useInventory();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  if (!invoice) return null;

  const linkedPv = physicalVerifications.find(
    (pv) =>
      (pv.invoiceNumber &&
        invoice.invoiceNumber &&
        pv.invoiceNumber.trim().toLowerCase() ===
          invoice.invoiceNumber.trim().toLowerCase()) ||
      (pv.poNumber &&
        invoice.poNumber &&
        pv.poNumber.trim().toLowerCase() === invoice.poNumber.trim().toLowerCase())
  );

  const handleConfirm = async () => {
    if (submittingRef.current || isSubmitting) return;
    submittingRef.current = true;
    try {
      setIsSubmitting(true);
      await onConfirm(invoice.id, notes.trim());
      onClose();
    } catch (err) {
      console.error('Failed to verify invoice:', err);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Invoice Verification">
      <div className="space-y-5 py-1">
        {/* Header Alert Banner */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200">
          <div className="h-9 w-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">L1 Verification Review</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verify invoice details before moving to L2 Admin / Invoice approval queue.
            </p>
          </div>
        </div>

        {/* Invoice Primary Details Card */}
        <div className="p-4 rounded-xl bg-card border border-border/60 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vendor Name</span>
              <p className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                <Building2 className="h-4 w-4 text-primary" /> {invoice.vendor}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice No.</span>
              <p className="text-sm font-mono font-bold text-foreground mt-0.5">{invoice.invoiceNumber}</p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-amber-500/5 p-3 rounded-lg border border-amber-500/20">
            <span className="text-xs font-bold text-foreground">Invoice Total:</span>
            <span className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">
              ₹{invoice.amount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs pt-1">
            <div className="p-2 rounded-lg bg-muted/40 border border-border/30">
              <span className="text-[10px] text-muted-foreground block">Taxable</span>
              <span className="font-mono font-semibold">₹{invoice.taxableAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 border border-border/30">
              <span className="text-[10px] text-muted-foreground block">
                Tax ({invoice.taxOption === 'IGST' ? `IGST ${invoice.taxSlab ?? 18}%` : `CGST ${(invoice.taxSlab ?? 18) / 2}% + SGST ${(invoice.taxSlab ?? 18) / 2}%`})
              </span>
              <span className="font-mono font-semibold text-primary">₹{invoice.taxAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 border border-border/30">
              <span className="text-[10px] text-muted-foreground block">Invoice Date</span>
              <span className="font-medium">{invoice.invoiceDate}</span>
            </div>
            <div className="p-2 rounded-lg bg-muted/40 border border-border/30">
              <span className="text-[10px] text-muted-foreground block">PO Number</span>
              <span className="font-mono font-medium">{invoice.poNumber || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* 2-Step Inward Physical Verification Status */}
        {linkedPv ? (
          <div
            className={`p-3.5 rounded-xl border text-xs flex flex-col gap-1.5 shadow-xs ${
              linkedPv.overallStatus === 'Matched'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold">
                <ClipboardCheck className="h-4 w-4 shrink-0 text-primary" />
                <span>Physical Inward Verification:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    linkedPv.overallStatus === 'Matched'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}
                >
                  {linkedPv.overallStatus === 'Matched' ? '✓ 100% Matched' : '⚠️ Discrepancy Found'}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                {linkedPv.id}
              </span>
            </div>
            <p className="text-[11px] opacity-90">
              Verified by <strong>{linkedPv.verifiedBy}</strong> on{' '}
              {new Date(linkedPv.verifiedAt).toLocaleDateString('en-IN')} ({linkedPv.items.length} line items checked).
              {linkedPv.overallStatus !== 'Matched' &&
                ` Shortage/Excess noted in ${linkedPv.items.filter((i) => i.variance !== 0).length} item(s).`}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-primary" /> Physical Verification: Not recorded yet for this invoice.
            </span>
            <Link
              href="/products/physical-verification"
              target="_blank"
              className="text-primary hover:underline text-[11px] font-semibold"
            >
              Verify Physically &rarr;
            </Link>
          </div>
        )}

        {/* Verification Notes Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-amber-600" /> Verification Notes / Remarks (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Verified goods received in warehouse, line items match PO..."
            className="w-full bg-background border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 font-medium text-foreground"
          />
        </div>

        {/* Risk Flags Section if present */}
        {invoice.flags && invoice.flags.length > 0 && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1.5 shadow-xs">
            <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Risk Flags Detected ({invoice.flags.length})
            </h5>
            <ul className="space-y-1 pl-1">
              {invoice.flags.map((f, idx) => (
                <li key={idx} className="text-xs text-rose-800 dark:text-rose-200 flex items-start gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-border/50">
          <div>
            {onReject && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  onReject(invoice.id);
                }}
                disabled={isSubmitting}
                className="text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold gap-1.5 shadow-xs"
              >
                <XCircle className="h-4 w-4" /> Reject Invoice
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 gap-2 shadow-md hover:shadow-amber-500/30 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Confirm &amp; Mark Verified
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
