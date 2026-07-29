'use client';

import React, { useState } from 'react';
import { Invoice } from '@/types/invoice';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onVerify: (id: string, notes?: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onPay: (id: string) => void;
  onOpenBankModal: (invoice: Invoice) => void;
}

export function InvoiceDetailModal({
  invoice,
  onClose,
  onVerify,
  onApprove,
  onReject,
  onPay,
  onOpenBankModal,
}: InvoiceDetailModalProps) {
  const { user } = useAuth();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  const isAdminOrMaster = user?.id === 'master' || user?.role === 'master' || user?.role === 'admin';

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'pending_verification':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">Pending L1 Verification</Badge>;
      case 'pending_approval':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">Pending L2 Approval</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Approved</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">Paid</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">Rejected</Badge>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 p-4 bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{invoice.invoiceNumber}</h3>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Risk Flags Warning Banner */}
          {invoice.flags && invoice.flags.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-rose-600" /> Risk Flags Detected
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border border-border/50">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Taxable Amount</p>
              <p className="text-base font-extrabold text-foreground mt-0.5">₹{invoice.taxableAmount.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tax ({invoice.taxOption})</p>
              <p className="text-base font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">₹{invoice.taxAmount.toLocaleString('en-IN')}</p>
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Invoice Info</h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">PO Number:</span>
                  <span className="font-semibold">{invoice.poNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Entered By:</span>
                  <span className="font-semibold">{invoice.enteredBy} ({new Date(invoice.enteredAt).toLocaleDateString()})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Branch:</span>
                  <span className="font-semibold">{invoice.branch || 'Ahmedabad'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/40">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-semibold">{invoice.description || 'N/A'}</span>
                </div>
              </div>

              {/* Vendor Bank Details Card */}
              <div className="p-3.5 rounded-xl bg-card border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <Landmark className="h-3.5 w-3.5 text-blue-500" /> Vendor Bank Account
                  </span>
                  <Button variant="outline" size="sm" onClick={() => onOpenBankModal(invoice)} className="h-7 text-[11px] px-2">
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
            </div>

            {/* Column 2: Document Preview */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1">Attached Invoice Document</h4>
              {invoice.invoiceImage ? (
                <div className="relative rounded-xl border border-border overflow-hidden bg-muted/20 group max-h-64 flex items-center justify-center p-2">
                  <img src={invoice.invoiceImage} alt="Invoice Scan" className="max-h-60 w-auto object-contain rounded-lg shadow-sm" />
                </div>
              ) : (
                <div className="h-48 rounded-xl border-2 border-dashed border-border/60 flex flex-col items-center justify-center p-4 text-center text-muted-foreground bg-muted/10">
                  <FileText className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-xs">No scan image attached to this invoice check-in.</p>
                </div>
              )}
            </div>
          </div>

          {/* History & Action Audit Timeline */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-primary" /> Approval History & Audit Trail
            </h4>
            <div className="space-y-2">
              {invoice.history && invoice.history.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/40 text-xs">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{h.action}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(h.at).toLocaleString()}</span>
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
        <div className="border-t border-border/60 p-4 bg-muted/30 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="w-full sm:w-auto">
              Close
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* L1 Verification Button */}
            {invoice.status === 'pending_verification' && (
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 w-full sm:w-auto"
                onClick={() => onVerify(invoice.id)}
              >
                <CheckCircle2 className="h-4 w-4" /> Complete L1 Verification
              </Button>
            )}

            {/* L2 Sign-Off Button */}
            {invoice.status === 'pending_approval' && isAdminOrMaster && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 w-full sm:w-auto"
                onClick={() => onApprove(invoice.id)}
              >
                <ShieldCheck className="h-4 w-4" /> Grant L2 Sign-Off
              </Button>
            )}

            {/* Pay Button */}
            {invoice.status === 'approved' && isAdminOrMaster && (
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 w-full sm:w-auto"
                onClick={() => onPay(invoice.id)}
              >
                <DollarSign className="h-4 w-4" /> Mark as Paid
              </Button>
            )}

            {/* Reject Button */}
            {invoice.status !== 'paid' && invoice.status !== 'rejected' && (
              <Button
                variant="outline"
                size="sm"
                className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950 gap-1.5 w-full sm:w-auto"
                onClick={() => {
                  const reason = prompt('Please enter rejection reason:');
                  if (reason) onReject(invoice.id, reason);
                }}
              >
                <XCircle className="h-4 w-4" /> Reject Invoice
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
