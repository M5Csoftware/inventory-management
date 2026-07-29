'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { TaxOption } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  FilePlus,
  Building2,
  Receipt,
  Calendar,
  IndianRupee,
  FileText,
  Upload,
  Landmark,
  Save,
  Image as ImageIcon,
  X,
} from 'lucide-react';

function NewInvoiceFormContent() {
  const router = useRouter();
  const { createInvoice } = useInvoice();

  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxableAmount, setTaxableAmount] = useState('');
  const [taxOption, setTaxOption] = useState<TaxOption>('IGST');
  const [poNumber, setPoNumber] = useState('');
  const [bankLast4, setBankLast4] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto Calculations
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || !invoiceNumber || !invoiceDate || parsedTaxable <= 0) return;

    setIsSubmitting(true);
    try {
      const success = await createInvoice({
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

      if (success) {
        router.push('/invoice');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/invoice">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-2 transition-all hover:scale-105"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
              <FilePlus className="h-6 w-6 text-purple-600" />
              Register Inward Invoice (Check-In)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Enter vendor details, taxable amount, 18% GST tax calculation, PO reference, and upload invoice document
            </p>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <Card className="border border-border/60 shadow-xl bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold">Inward Invoice Setup</CardTitle>
              <CardDescription className="text-xs">
                Fill in vendor details and tax specifications. Automatic 18% GST will be calculated.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Row 1: Vendor & Invoice Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 text-purple-600" />
                    Vendor / Party Name <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Acme Logistics & Tech Pvt Ltd"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Receipt className="h-3.5 w-3.5 text-purple-600" />
                    Vendor Invoice Number <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. INV-2026-8801"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Invoice Date, Taxable Amount, Tax Option */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 text-purple-600" />
                    Invoice Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <IndianRupee className="h-3.5 w-3.5 text-purple-600" />
                    Taxable Amount (₹) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45000"
                    value={taxableAmount}
                    onChange={(e) => setTaxableAmount(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    GST Tax Structure
                  </label>
                  <select
                    value={taxOption}
                    onChange={(e) => setTaxOption(e.target.value as TaxOption)}
                    className="h-10 w-full rounded-xl border-2 border-gray-300 bg-background px-3 text-xs font-semibold shadow-sm focus:border-primary focus:outline-none dark:border-gray-600 cursor-pointer"
                  >
                    <option value="IGST">IGST (18% Integrated Tax)</option>
                    <option value="CGST_SGST">CGST (9%) + SGST (9%)</option>
                  </select>
                </div>
              </div>

              {/* Tax & Total Calculation Box */}
              {parsedTaxable > 0 && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">Taxable Value</p>
                    <p className="text-sm font-bold text-foreground">₹{parsedTaxable.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">Calculated GST (18%)</p>
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300">₹{calculatedTax.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">Total Payable Amount</p>
                    <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">₹{calculatedTotal.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}

              {/* Row 3: PO Number & Bank Account Last 4 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-purple-600" />
                    PO / Purchase Order No. (Optional)
                  </label>
                  <Input
                    placeholder="e.g. PO-2026-904"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Landmark className="h-3.5 w-3.5 text-purple-600" />
                    Bank Account Last 4 Digits (Optional)
                  </label>
                  <Input
                    maxLength={4}
                    placeholder="e.g. 8492"
                    value={bankLast4}
                    onChange={(e) => setBankLast4(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Invoice Remarks / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. IT Equipment supply for Q3 deployment."
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  className="w-full text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 p-3 focus:outline-none focus:border-primary"
                />
              </div>

              {/* Document Image Upload / Drag and Drop */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Upload className="h-3.5 w-3.5 text-purple-600" />
                  Attach Invoice Copy (Optional Scan Image)
                </label>

                {invoiceImage ? (
                  <div className="relative rounded-xl border-2 border-purple-500/40 p-4 bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="text-xs font-bold text-foreground">{imageFileName || 'Invoice Scan Image'}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">Image attached & ready</p>
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
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500 transition-colors bg-muted/10 space-y-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-xs font-semibold text-foreground">Click to upload or drag & drop invoice scan</p>
                    <p className="text-[10px] text-muted-foreground">Supports PNG, JPG, WEBP, or scanned document images</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileRead(file);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Form Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Link href="/invoice">
                  <Button type="button" variant="outline" size="sm">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Registering...' : 'Register Inward Invoice'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

export default function NewInvoiceFormPage() {
  return (
    <InvoiceProvider>
      <NewInvoiceFormContent />
    </InvoiceProvider>
  );
}
