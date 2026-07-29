import React, { useState, useRef } from 'react';
import type { TeamMember, AppConfig, TaxOption } from '@/types/invoice';
import { FilePlus, AlertTriangle, Upload, X, Image as ImageIcon } from 'lucide-react';
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
      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
        <FilePlus size={18} className="text-indigo-600" />
        Check In an Invoice
      </h2>

      {!currentUser && (
        <div className="border border-rose-500/20 bg-rose-500/10 p-4 rounded-xl text-xs sm:text-sm text-rose-600 font-medium flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>
            You must be logged in to check in an invoice.
          </span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="w-full bg-card border border-border/80 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Vendor Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={disabled}
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full bg-background disabled:bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-foreground placeholder:text-muted-foreground shadow-xs font-semibold"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Invoice Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={disabled}
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2024-001"
              className="w-full bg-background disabled:bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-foreground placeholder:text-muted-foreground shadow-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Invoice Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              disabled={disabled}
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-background disabled:bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-foreground shadow-xs cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Taxable Amount ({config.currency}) <span className="text-rose-500">*</span>
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
              className="w-full bg-background disabled:bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-foreground placeholder:text-muted-foreground shadow-xs font-mono font-bold"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Tax Option <span className="text-rose-500">*</span>
            </label>
            <select
              disabled={disabled}
              value={taxOption}
              onChange={(e) => setTaxOption(e.target.value as TaxOption)}
              className="w-full bg-background disabled:bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-foreground shadow-xs cursor-pointer font-medium"
            >
              <option value="IGST">IGST (18%)</option>
              <option value="CGST_SGST">CGST + SGST (9% + 9%)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Total Amount (Calculated)
            </label>
            <input
              type="text"
              readOnly
              value={formatAmount(calculatedTotal, config.currency)}
              className="w-full bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs font-mono"
            />
          </div>
        </div>

        {/* Dynamic breakdown notice */}
        {parsedTaxable > 0 && (
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg text-xs text-foreground font-medium flex flex-col sm:flex-row justify-between gap-2">
            <span>
              Tax Breakup (18%): <strong>{formatAmount(calculatedTax, config.currency)}</strong>{' '}
              {taxOption === 'IGST' ? '(Integrated Tax)' : '(CGST 9% + SGST 9%)'}
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              Total Payable: {formatAmount(calculatedTotal, config.currency)}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              PO Number (Optional)
            </label>
            <input
              type="text"
              disabled={disabled}
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-8891"
              className="w-full bg-background disabled:bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-foreground placeholder:text-muted-foreground shadow-xs font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
              Bank Account (Last 4 Digits)
            </label>
            <input
              type="text"
              maxLength={4}
              disabled={disabled}
              value={bankLast4}
              onChange={(e) => setBankLast4(e.target.value)}
              placeholder="e.g. 4321"
              className="w-full bg-background disabled:bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-foreground placeholder:text-muted-foreground shadow-xs font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Description / Items Summary
          </label>
          <textarea
            rows={2}
            disabled={disabled}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief details of goods or services invoiced..."
            className="w-full bg-background disabled:bg-muted border border-border/80 rounded-lg px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 transition-all text-foreground placeholder:text-muted-foreground shadow-xs"
          />
        </div>

        {/* Invoice Scan Image Upload Box */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Attach Invoice Document / Scan
          </label>

          {invoiceImage ? (
            <div className="border border-indigo-500/40 bg-indigo-500/5 p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="text-indigo-600 shrink-0" size={20} />
                <div>
                  <p className="text-xs font-bold text-foreground">{imageFileName || 'Invoice Scan'}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">Image attached ready for submission</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInvoiceImage(null);
                  setImageFileName('');
                }}
                className="text-rose-600 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
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
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? 'border-indigo-600 bg-indigo-500/10'
                  : 'border-border/80 hover:border-indigo-600 bg-muted/10'
              }`}
            >
              <Upload className="mx-auto text-muted-foreground mb-2" size={24} />
              <p className="text-xs font-semibold text-foreground">Click to upload or drag and drop invoice scan</p>
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
          <button
            type="submit"
            disabled={disabled || !isFormValid}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 disabled:bg-muted disabled:text-muted-foreground text-white font-bold px-6 py-2.5 rounded-lg text-xs sm:text-sm transition-all duration-150 shadow-md cursor-pointer disabled:cursor-not-allowed"
          >
            Submit Invoice Check-In
          </button>
        </div>
      </form>
    </div>
  );
};
