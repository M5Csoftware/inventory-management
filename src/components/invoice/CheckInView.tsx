'use client';

import React, { useState, useRef } from 'react';
import type { TeamMember, AppConfig, TaxOption } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilePlus, AlertTriangle, Upload, X, Image as ImageIcon, Building2, Receipt, Calendar, IndianRupee, Landmark, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { formatAmount } from './InvoiceTable';

interface CheckInViewProps {
  currentUser: TeamMember | null;
  config: AppConfig;
  onSubmit: (invoiceData: {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableAmount: number;
    taxOption: TaxOption;
    taxAmount: number;
    amount: number;
    poNumber: string;
    bankLast4: string;
    description: string;
    invoiceImage: string | null;
  }) => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  currentUser,
  config,
  onSubmit,
}) => {
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxableAmount, setTaxableAmount] = useState('');
  const [taxOption, setTaxOption] = useState<TaxOption>('IGST');
  const [poNumber, setPoNumber] = useState('');
  const [bankLast4, setBankLast4] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto tax calculations
  const parsedTaxable = parseFloat(taxableAmount) || 0;
  const calculatedTax = parsedTaxable > 0 ? parsedTaxable * 0.18 : 0;
  const calculatedTotal = parsedTaxable + calculatedTax;

  const handleFileRead = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInvoiceImage(ev.target?.result as string);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!vendor || !invoiceNumber || !invoiceDate || parsedTaxable <= 0) return;

    onSubmit({
      vendor,
      invoiceNumber,
      invoiceDate,
      taxableAmount: parsedTaxable,
      taxOption,
      taxAmount: calculatedTax,
      amount: calculatedTotal,
      poNumber,
      bankLast4,
      description,
      invoiceImage,
    });

    // Reset form
    setVendor('');
    setInvoiceNumber('');
    setInvoiceDate('');
    setTaxableAmount('');
    setTaxOption('IGST');
    setPoNumber('');
    setBankLast4('');
    setDescription('');
    setInvoiceImage(null);
    setImageFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const disabled = !currentUser;
  const isFormValid = vendor.trim() !== '' && invoiceNumber.trim() !== '' && invoiceDate !== '' && parsedTaxable > 0;

  return (
    <div className="w-full max-w-full space-y-6">
      <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm rounded-2xl w-full max-w-full overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                New Invoice Details
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Enter vendor details, taxable amount, tax option, and attach document scan for automatic 18% GST computation
              </CardDescription>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
              Inward Register Entry
            </span>
          </div>
        </CardHeader>

        {!currentUser && (
          <div className="mx-6 mt-6 border border-rose-500/20 bg-rose-500/10 p-4 rounded-xl text-xs sm:text-sm text-rose-600 font-medium flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>You must be logged in to create a new invoice.</span>
          </div>
        )}

        <CardContent className="p-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Vendor Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={disabled}
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5 text-primary" /> Invoice Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={disabled}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Invoice Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  required
                  disabled={disabled}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <IndianRupee className="h-3.5 w-3.5 text-primary" /> Taxable Amount ({config.currency}) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  disabled={disabled}
                  value={taxableAmount}
                  onChange={(e) => setTaxableAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tax Option <span className="text-destructive">*</span>
                </label>
                <select
                  disabled={disabled}
                  value={taxOption}
                  onChange={(e) => setTaxOption(e.target.value as TaxOption)}
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 cursor-pointer font-semibold"
                >
                  <option value="IGST">IGST (18%)</option>
                  <option value="CGST_SGST">CGST + SGST (9% + 9%)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Amount (Calculated)
                </label>
                <input
                  type="text"
                  readOnly
                  value={formatAmount(calculatedTotal, config.currency)}
                  className="h-9 w-full rounded-lg border-2 border-gray-200 bg-muted/40 px-3 text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 shadow-sm"
                />
              </div>
            </div>

            {/* Dynamic tax breakup notice */}
            {parsedTaxable > 0 && (
              <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-xl text-xs text-foreground font-medium flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>
                  Tax Breakup (18%): <strong className="text-foreground">{formatAmount(calculatedTax, config.currency)}</strong>{' '}
                  {taxOption === 'IGST' ? '(Integrated Tax)' : '(CGST 9% + SGST 9%)'}
                </span>
                <span className="font-bold text-primary text-sm">
                  Total Payable: {formatAmount(calculatedTotal, config.currency)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  PO Number (Optional)
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-8891"
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Landmark className="h-3.5 w-3.5 text-primary" /> Bank Account (Last 4 Digits)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  disabled={disabled}
                  value={bankLast4}
                  onChange={(e) => setBankLast4(e.target.value)}
                  placeholder="e.g. 4321"
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description / Line Items Summary
              </label>
              <textarea
                rows={3}
                disabled={disabled}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of items or services received..."
                className="w-full rounded-lg border-2 border-gray-300 bg-white/90 p-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 text-foreground"
              />
            </div>

            {/* Document Scan Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Attach Invoice Document Scan
              </label>

              {invoiceImage ? (
                <div className="border-2 border-primary/40 bg-primary/5 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="text-primary shrink-0" size={22} />
                    <div>
                      <p className="text-xs font-bold text-foreground">{imageFileName || 'Invoice Scan'}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> Scan attached and ready for submission
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setInvoiceImage(null);
                      setImageFileName('');
                    }}
                    className="h-8 w-8 text-rose-600"
                  >
                    <X size={18} />
                  </Button>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary bg-muted/10'
                  }`}
                >
                  <Upload className="mx-auto text-muted-foreground mb-2" size={26} />
                  <p className="text-xs font-semibold text-foreground">Click to upload or drag &amp; drop invoice scan</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG, WEBP formats supported</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={disabled || !isFormValid}
                className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 h-10 px-6 font-bold text-sm"
              >
                Submit New Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
