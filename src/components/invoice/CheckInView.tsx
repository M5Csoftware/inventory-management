'use client';

import React, { useState, useRef } from 'react';
import type { TeamMember, AppConfig, TaxOption } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilePlus, AlertTriangle, Upload, X, Image as ImageIcon, Building2, Receipt, Calendar, IndianRupee, Landmark } from 'lucide-react';
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
    <div className="w-full space-y-6">
      <Card className="border border-border/60 bg-card/80 backdrop-blur-xs rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4 border-b border-border/40">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <FilePlus size={20} className="text-primary" />
            Check In New Invoice
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Enter vendor details, taxable amount, and attach invoice scan. Automatic 18% GST will be calculated.
          </CardDescription>
        </CardHeader>

        {!currentUser && (
          <div className="mx-6 mt-6 border border-rose-500/20 bg-rose-500/10 p-4 rounded-xl text-xs sm:text-sm text-rose-600 font-medium flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <span>You must be logged in to check in an invoice.</span>
          </div>
        )}

        <CardContent className="p-6">
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-primary" /> Vendor Name <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  disabled={disabled}
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5 text-primary" /> Invoice Number <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  required
                  disabled={disabled}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="e.g. INV-2026-001"
                  className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Invoice Date <span className="text-destructive">*</span>
                </label>
                <Input
                  type="date"
                  required
                  disabled={disabled}
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <IndianRupee className="h-3.5 w-3.5 text-primary" /> Taxable Amount ({config.currency}) <span className="text-destructive">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  disabled={disabled}
                  value={taxableAmount}
                  onChange={(e) => setTaxableAmount(e.target.value)}
                  placeholder="0.00"
                  className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tax Structure <span className="text-destructive">*</span>
                </label>
                <select
                  disabled={disabled}
                  value={taxOption}
                  onChange={(e) => setTaxOption(e.target.value as TaxOption)}
                  className="h-10 w-full bg-background border-2 border-gray-300 dark:border-gray-600 rounded-xl px-3 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                >
                  <option value="IGST">IGST (18%)</option>
                  <option value="CGST_SGST">CGST + SGST (9% + 9%)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Amount (Calculated)
                </label>
                <Input
                  type="text"
                  readOnly
                  value={formatAmount(calculatedTotal, config.currency)}
                  className="h-10 text-xs bg-muted/40 border-2 border-gray-200 dark:border-gray-700 text-emerald-600 dark:text-emerald-400 font-black font-mono"
                />
              </div>
            </div>

            {/* Dynamic breakdown notice */}
            {parsedTaxable > 0 && (
              <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-xl text-xs text-foreground font-medium flex flex-col sm:flex-row justify-between gap-2">
                <span>
                  Tax Breakup (18%): <strong>{formatAmount(calculatedTax, config.currency)}</strong>{' '}
                  {taxOption === 'IGST' ? '(Integrated Tax)' : '(CGST 9% + SGST 9%)'}
                </span>
                <span className="font-bold text-primary">
                  Total Payable: {formatAmount(calculatedTotal, config.currency)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  PO Number (Optional)
                </label>
                <Input
                  type="text"
                  disabled={disabled}
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="e.g. PO-8891"
                  className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Landmark className="h-3.5 w-3.5 text-primary" /> Bank Account (Last 4 Digits)
                </label>
                <Input
                  type="text"
                  maxLength={4}
                  disabled={disabled}
                  value={bankLast4}
                  onChange={(e) => setBankLast4(e.target.value)}
                  placeholder="e.g. 4321"
                  className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description / Items Summary
              </label>
              <textarea
                rows={2}
                disabled={disabled}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief details of goods or services invoiced..."
                className="w-full bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 p-3 text-xs focus:outline-none focus:border-primary text-foreground"
              />
            </div>

            {/* Invoice Scan Upload Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Attach Invoice Document / Scan
              </label>

              {invoiceImage ? (
                <div className="border-2 border-primary/40 bg-primary/5 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="text-primary shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-foreground">{imageFileName || 'Invoice Scan'}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Image attached &amp; ready for submission</p>
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
                  <Upload className="mx-auto text-muted-foreground mb-2" size={24} />
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
                className="w-full sm:w-auto font-bold px-6 h-10 text-xs sm:text-sm shadow-md"
              >
                Submit Invoice Check-In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
