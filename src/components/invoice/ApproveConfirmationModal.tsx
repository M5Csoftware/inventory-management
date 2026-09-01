'use client';

import React, { useState, useRef } from 'react';
import { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Modal } from './Modal';
import {
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Calendar,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';

interface ApproveConfirmationModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean | void> | void;
  onReject?: (id: string) => void;
}

export const ApproveConfirmationModal: React.FC<ApproveConfirmationModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onConfirm,
  onReject,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  if (!invoice) return null;

  const handleConfirm = async () => {
    if (submittingRef.current || isSubmitting) return;
    submittingRef.current = true;
    try {
      setIsSubmitting(true);
      await onConfirm(invoice.id);
      onClose();
    } catch (err) {
      console.error('Failed to approve invoice:', err);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Invoice Approval">
      <div className="space-y-5 py-1">
        {/* Header Alert Banner */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-300">
          <div className="h-9 w-9 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider">L2 Administrative Approval</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review invoice details before granting formal sign-off for payout processing.
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

          <div className="flex items-center justify-between bg-purple-500/5 p-3 rounded-lg border border-purple-500/20">
            <span className="text-xs font-bold text-foreground">Total Payout Amount:</span>
            <span className="text-xl font-black text-purple-700 dark:text-purple-300 font-mono">
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

        {/* Risk Flags Section if present */}
        {invoice.flags && invoice.flags.length > 0 && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1.5 shadow-xs">
            <h5 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-500" /> Active Risk Flags Detected ({invoice.flags.length})
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

        <p className="text-xs text-muted-foreground leading-relaxed">
          By clicking <strong className="text-foreground">&quot;Confirm &amp; Approve&quot;</strong>, this invoice will be marked as <strong className="text-purple-600 dark:text-purple-400">APPROVED</strong> and moved to the payout queue. If you do not wish to approve, click <strong className="text-rose-600 dark:text-rose-400">&quot;Reject Invoice&quot;</strong> to reject it.
        </p>

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
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 gap-2 shadow-md hover:shadow-purple-500/30 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Approving...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Confirm &amp; Approve Invoice
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
