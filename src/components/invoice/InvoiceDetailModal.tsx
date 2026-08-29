import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useInventory } from '@/context/inventory-context';
import {
  FileSpreadsheet,
  X,
  Calendar,
  Building2,
  FileText,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  DollarSign,
  AlertTriangle,
  Landmark,
  ExternalLink,
  History,
  Info,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { canApproveInvoice } from '@/utils/invoice-permissions';
import { TeamMember, AppConfig } from '@/types/invoice';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  isOpen?: boolean;
  onClose: () => void;
  onVerify?: (id: string, notes?: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string, reason: string) => void;
  onRejectClick?: (id: string) => void;
  onPay?: (id: string) => void;
  onOpenBankModal?: (invoice: Invoice) => void;
  onAddBankDetails?: (invoice: Invoice) => void;
  currentUser?: TeamMember | null;
  team?: TeamMember[];
  config?: AppConfig;
}

export function InvoiceDetailModal({
  invoice,
  isOpen,
  onClose,
  onVerify,
  onApprove,
  onReject,
  onRejectClick,
  onPay,
  onOpenBankModal,
  onAddBankDetails,
  currentUser,
  team,
  config,
}: InvoiceDetailModalProps) {
  const { user } = useAuth();
  const { physicalVerifications } = useInventory();
  const [mounted, setMounted] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

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

  const attachedImages: string[] = invoice.invoiceImages && invoice.invoiceImages.length > 0
    ? invoice.invoiceImages
    : (invoice.invoiceImage ? [invoice.invoiceImage] : []);

  useEffect(() => {
    setMounted(true);
    setSelectedImgIdx(0);
  }, [invoice]);

  const canApprove = canApproveInvoice(user, currentUser);

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'pending_verification':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">Pending Verification</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">Pending Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Approved</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">Paid</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">Rejected</Badge>;
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden flex flex-col my-auto border-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 p-4 bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-foreground">{invoice.invoiceNumber}</h3>
                {getStatusBadge(invoice.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vendor: <span className="font-semibold text-foreground">{invoice.vendor}</span> &bull; Ref ID: {invoice.id}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gradient-to-br from-background via-background to-muted/20">
          {/* Risk Flags Warning Banner */}
          {invoice.flags && invoice.flags.length > 0 && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-500" /> Risk Flags Detected
              </h4>
              <ul className="space-y-1">
                {invoice.flags.map((f, idx) => (
                  <li key={idx} className="text-xs text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    {f.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Financial Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-card/80 border border-border/50 shadow-xs">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Taxable Amount</p>
              <p className="text-base font-extrabold text-foreground mt-0.5">₹{invoice.taxableAmount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tax ({invoice.taxOption === 'IGST' ? `IGST ${invoice.taxSlab ?? 18}%` : `CGST ${(invoice.taxSlab ?? 18) / 2}% + SGST ${(invoice.taxSlab ?? 18) / 2}%`})
              </p>
              <p className="text-base font-extrabold text-primary mt-0.5">₹{invoice.taxAmount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Amount</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{invoice.amount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice Date</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{invoice.invoiceDate}</p>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1">Invoice Details</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">PO Number:</span>
                  <span className="font-semibold font-mono">{invoice.poNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Entered By:</span>
                  <span className="font-semibold">{invoice.enteredBy} ({new Date(invoice.enteredAt).toLocaleDateString()})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Branch:</span>
                  <span className="font-semibold">{invoice.branch || 'Ahmedabad'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-semibold">{invoice.description || 'N/A'}</span>
                </div>
              </div>

              {/* Vendor Bank Details Card */}
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-primary" /> Vendor Bank Account
                  </span>
                  <Button variant="outline" size="sm" onClick={() => (onOpenBankModal || onAddBankDetails)?.(invoice)} className="h-7 text-[11px] px-2.5 shadow-xs">
                    {invoice.bankDetails ? 'Edit Bank Info' : '+ Add Bank Info'}
                  </Button>
                </div>
                {invoice.bankDetails ? (
                  <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                    <p><span className="font-semibold text-foreground">{invoice.bankDetails.bankName}</span> ({invoice.bankDetails.accountName})</p>
                    <p className="font-mono">A/C: {invoice.bankDetails.accountNumber} &bull; IFSC: {invoice.bankDetails.ifscCode}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No detailed bank record added. (Last 4: {invoice.bankLast4 || 'N/A'})</p>
                )}
              </div>

              {/* 2-Step Inward Physical Verification Card */}
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <ClipboardCheck className="h-4 w-4 text-primary" /> Physical Verification Tally
                  </span>
                  <Link
                    href="/products/physical-verification"
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    {linkedPv ? 'View Tally Log &rarr;' : '+ Record Physical Count'}
                  </Link>
                </div>
                {linkedPv ? (
                  <div className="space-y-1 pt-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                          linkedPv.overallStatus === 'Matched'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                        }`}
                      >
                        {linkedPv.overallStatus === 'Matched' ? '✓ 100% Matched' : '⚠️ Discrepancy'}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground pt-0.5">
                      Verified by <strong>{linkedPv.verifiedBy}</strong> ({linkedPv.items.length} items checked on {new Date(linkedPv.verifiedAt).toLocaleDateString('en-IN')})
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic pt-1">
                    No physical count recorded yet for this invoice inward entry.
                  </p>
                )}
              </div>
            </div>

            {/* Column 2: Document Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Attached Documents {attachedImages.length > 0 && `(${attachedImages.length})`}
                </h4>
                {attachedImages.length > 1 && (
                  <span className="text-[10px] font-semibold text-primary">
                    Image {selectedImgIdx + 1} of {attachedImages.length}
                  </span>
                )}
              </div>

              {attachedImages.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="relative rounded-2xl border border-border/60 overflow-hidden bg-muted/20 group max-h-64 flex items-center justify-center p-2 shadow-xs">
                    <img
                      src={attachedImages[selectedImgIdx] || attachedImages[0]}
                      alt={`Invoice Document ${selectedImgIdx + 1}`}
                      className="max-h-60 w-auto object-contain rounded-xl shadow-xs"
                    />
                    <a
                      href={attachedImages[selectedImgIdx] || attachedImages[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 bg-background/80 hover:bg-background text-foreground backdrop-blur-xs p-1.5 rounded-lg border border-border/50 text-[11px] font-semibold flex items-center gap-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-primary" /> Full Size
                    </a>
                  </div>

                  {/* Thumbnail gallery strip if multiple images */}
                  {attachedImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {attachedImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImgIdx(idx)}
                          className={`relative h-14 w-14 shrink-0 rounded-xl overflow-hidden border-2 transition-all p-0.5 cursor-pointer ${
                            selectedImgIdx === idx
                              ? 'border-primary ring-2 ring-primary/20 scale-105'
                              : 'border-border/60 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumb ${idx + 1}`}
                            className="h-full w-full object-cover rounded-lg"
                          />
                          <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[9px] px-1 rounded-sm font-bold">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-48 rounded-2xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center p-4 text-center text-muted-foreground bg-muted/10">
                  <FileText className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs font-semibold">No scan image attached to this invoice check-in.</p>
                </div>
              )}
            </div>
          </div>

          {/* History & Action Audit Timeline */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-1 flex items-center gap-1.5">
              <History className="h-4 w-4 text-primary" /> Approval History &amp; Audit Trail
            </h4>
            <div className="space-y-2">
              {invoice.history && invoice.history.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/40 text-xs shadow-xs">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{h.action}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{new Date(h.at).toLocaleString()}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      By <span className="font-semibold text-foreground">{h.actorName}</span> ({h.actorRole}) &bull; {h.note}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="border-t border-border/50 p-4 bg-muted/30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto shadow-sm">
              Close
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Verification Button */}
            {invoice.status === 'pending_verification' && (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 w-full sm:w-auto shadow-sm"
                onClick={() => onVerify?.(invoice.id)}
              >
                <CheckCircle2 className="h-4 w-4" /> Verify Invoice
              </Button>
            )}

            {/* Approval Button */}
            {invoice.status === 'pending_approval' && canApprove && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-2 w-full sm:w-auto shadow-md hover:shadow-purple-500/30 transition-all rounded-xl h-9 px-4"
                onClick={() => onApprove?.(invoice.id)}
              >
                <ShieldCheck className="h-4 w-4" /> Approve Invoice
              </Button>
            )}

            {/* Pay Button */}
            {invoice.status === 'approved' && canApprove && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 w-full sm:w-auto shadow-md hover:shadow-emerald-500/30 transition-all rounded-xl h-9 px-4"
                onClick={() => onPay?.(invoice.id)}
              >
                <DollarSign className="h-4 w-4" /> Mark as Paid
              </Button>
            )}

            {/* Reject Button */}
            {invoice.status !== 'paid' && invoice.status !== 'rejected' && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950 gap-1.5 w-full sm:w-auto shadow-sm"
                onClick={() => {
                  if (onRejectClick) {
                    onRejectClick(invoice.id);
                  } else if (onReject) {
                    const reason = prompt('Please enter rejection reason:');
                    if (reason) onReject(invoice.id, reason);
                  }
                }}
              >
                <XCircle className="h-4 w-4" /> Reject Invoice
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
