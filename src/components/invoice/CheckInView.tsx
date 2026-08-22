import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, FileText, CheckCircle2, Building2, Receipt, Calendar, IndianRupee, Image as ImageIcon, AlertCircle, ArrowUpRight, Landmark, Plus } from 'lucide-react';
import { TeamMember, AppConfig, TaxOption } from '@/types/invoice';
import { useInventory, Order } from '@/context/inventory-context';
import { toast } from 'react-toastify';
import { InvoiceStockInModal, StockInItemEntry } from '@/components/invoice/InvoiceStockInModal';

interface UploadedInvoiceImage {
  id: string;
  dataUrl: string;
  fileName: string;
  fileSize: string;
}

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
    invoiceImages?: string[];
  }) => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  currentUser,
  config,
  onSubmit,
}) => {
  const { suppliers, orders, recordTransaction, updateOrderStatus } = useInventory();
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxableAmount, setTaxableAmount] = useState('');
  const [taxOption, setTaxOption] = useState<TaxOption>('IGST');
  const [poNumber, setPoNumber] = useState('');
  const [bankLast4, setBankLast4] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceImages, setInvoiceImages] = useState<UploadedInvoiceImage[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [linkedOrder, setLinkedOrder] = useState<Order | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if entered vendor matches a DB supplier
  const matchedSupplier = suppliers?.find(
    (s) => s.name.trim().toLowerCase() === vendor.trim().toLowerCase()
  );

  // Auto tax calculations
  const parsedTaxable = parseFloat(taxableAmount) || 0;
  const calculatedTax = parsedTaxable > 0 ? parsedTaxable * 0.18 : 0;
  const calculatedTotal = parsedTaxable + calculatedTax;

  const handlePoChange = (val: string) => {
    setPoNumber(val);
    const matched = (orders || []).find(
      (o) => o.id.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      setLinkedOrder(matched);
      if (matched.supplier) setVendor(matched.supplier);
      const subtotal =
        matched.items && matched.items.length > 0
          ? matched.items.reduce((acc, it) => acc + it.quantity * it.price, 0)
          : matched.totalAmount
          ? Number((matched.totalAmount / 1.18).toFixed(2))
          : 0;
      if (subtotal > 0) setTaxableAmount(subtotal.toFixed(2));
      if (matched.createdAt) {
        const d = new Date(matched.createdAt);
        if (!isNaN(d.getTime())) setInvoiceDate(d.toISOString().slice(0, 10));
      }

      const orderDate = matched.createdAt
        ? new Date(matched.createdAt).toLocaleDateString('en-IN')
        : new Date().toLocaleDateString('en-IN');
      const orderedBy = (matched as any).orderedBy || (matched as any).createdBy || 'Admin';

      if (matched.items && matched.items.length === 1) {
        const item = matched.items[0];
        setDescription(
          `Order Details\nOrder ID: ${matched.id}\nSupplier: ${matched.supplier || 'N/A'}\nProduct Name\n${item.name}\nDate: ${orderDate}\nOrdered By: ${orderedBy}\nQty\n${item.quantity}\nUnit Price (Rs)\n${Number(item.price || 0).toFixed(2)}`
        );
      } else if (matched.items && matched.items.length > 1) {
        const itemsList = matched.items
          .map(
            (item) =>
              `Product Name\n${item.name}\nQty\n${item.quantity}\nUnit Price (Rs)\n${Number(item.price || 0).toFixed(2)}`
          )
          .join('\n\n');
        setDescription(
          `Order Details\nOrder ID: ${matched.id}\nSupplier: ${matched.supplier || 'N/A'}\nDate: ${orderDate}\nOrdered By: ${orderedBy}\n\n${itemsList}`
        );
      } else {
        setDescription(
          `Order Details\nOrder ID: ${matched.id}\nSupplier: ${matched.supplier || 'N/A'}\nDate: ${orderDate}\nOrdered By: ${orderedBy}`
        );
      }
    } else {
      setLinkedOrder(null);
    }
  };

  const handleFilesRead = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const targetFiles = Array.from(files).filter(
      (f) => f.type.startsWith('image/') || f.name.match(/\.(png|jpe?g|webp|gif|svg|pdf)$/i)
    );

    if (targetFiles.length === 0) {
      toast.warn('Please select valid image files');
      return;
    }

    const newImages: UploadedInvoiceImage[] = [];
    let processed = 0;

    targetFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const sizeKb = (file.size / 1024).toFixed(1);
        const sizeStr =
          file.size > 1024 * 1024
            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
            : `${sizeKb} KB`;

        newImages.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dataUrl,
          fileName: file.name,
          fileSize: sizeStr,
        });

        processed++;
        if (processed === targetFiles.length) {
          setInvoiceImages((prev) => [...prev, ...newImages]);
          toast.success(`Attached ${targetFiles.length} image(s)`);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id: string) => {
    setInvoiceImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!vendor || !invoiceNumber || !invoiceDate || parsedTaxable <= 0) return;

    // Open Stock In confirmation modal
    setIsConfirmModalOpen(true);
  };

  const resetForm = () => {
    setVendor('');
    setInvoiceNumber('');
    setInvoiceDate('');
    setTaxableAmount('');
    setTaxOption('IGST');
    setPoNumber('');
    setBankLast4('');
    setDescription('');
    setInvoiceImages([]);
    setLinkedOrder(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateInvoiceOnly = async () => {
    if (submittingRef.current || isSubmitting) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const imageUrls = invoiceImages.map((img) => img.dataUrl);

      await onSubmit({
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
        invoiceImage: imageUrls[0] || null,
        invoiceImages: imageUrls,
      });

      resetForm();
      setIsConfirmModalOpen(false);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleCreateInvoiceWithStockIn = async (items: StockInItemEntry[]) => {
    if (submittingRef.current || isSubmitting) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const imageUrls = invoiceImages.map((img) => img.dataUrl);

      await onSubmit({
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
        invoiceImage: imageUrls[0] || null,
        invoiceImages: imageUrls,
      });

      // Record Stock In transactions for each item
      let totalQty = 0;
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          totalQty += item.quantity;
          await recordTransaction(
            item.productId,
            'Stock In',
            item.quantity,
            'Invoice Inward Entry',
            `Invoice: ${invoiceNumber}${poNumber ? ` | PO: ${poNumber}` : ''}`,
            {
              purchaseDate: invoiceDate,
              amount: item.price,
              supplier: vendor,
              invoiceNumber,
              branch: item.branch,
            }
          );
        }
      }

      // If linked with an order, mark the order as Completed
      if (linkedOrder && linkedOrder.status !== 'Completed') {
        await updateOrderStatus(linkedOrder.id, 'Completed');
      }

      toast.success(`Invoice registered & ${totalQty} units stocked in!`);
      resetForm();
      setIsConfirmModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete stock in transactions.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
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
                Select registered vendor from database or enter new party details, taxable amount, and tax options.
              </CardDescription>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
              Inward Register Entry
            </span>
          </div>
        </CardHeader>

        {!currentUser && (
          <div className="mx-6 mt-6 border border-rose-500/20 bg-rose-500/10 p-4 rounded-xl text-xs sm:text-sm text-rose-600 font-medium flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Authentication Required</strong>
              Please log in to submit invoices to the register.
            </div>
          </div>
        )}

        <CardContent className="pt-6">
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Vendor / Party Name <span className="text-destructive">*</span>
                  </label>
                  {matchedSupplier && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> DB Verified
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  disabled={disabled}
                  list="db-suppliers-datalist"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Type vendor or select registered..."
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-semibold"
                />
                <datalist id="db-suppliers-datalist">
                  {(suppliers || []).map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name} {s.location ? `(${s.location})` : s.taxId ? `(${s.taxId})` : ''}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5 text-primary" /> Vendor Invoice Number <span className="text-destructive">*</span>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <IndianRupee className="h-3.5 w-3.5 text-primary" /> Taxable Amount (₹) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  disabled={disabled}
                  value={taxableAmount}
                  onChange={(e) => setTaxableAmount(e.target.value)}
                  placeholder="e.g. 45000"
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
                  disabled
                  value={`₹${calculatedTotal.toLocaleString('en-IN')}`}
                  className="h-9 w-full rounded-lg border-2 border-gray-200 bg-muted/40 px-3 text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 shadow-sm"
                />
              </div>
            </div>

            {parsedTaxable > 0 && (
              <div className="bg-primary/10 border border-primary/20 p-3.5 rounded-xl text-xs text-foreground font-medium flex flex-col sm:flex-row justify-between items-center gap-2">
                <span>
                  Tax Breakup (18%): <strong className="text-foreground">₹{calculatedTax.toLocaleString('en-IN')}</strong>{' '}
                  {taxOption === 'IGST' ? '(Integrated Tax)' : '(CGST 9% + SGST 9%)'}
                </span>
                <span className="font-bold text-primary text-sm">
                  Total Payable: ₹{calculatedTotal.toLocaleString('en-IN')}
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
                  list="checkin-po-datalist"
                  value={poNumber}
                  onChange={(e) => handlePoChange(e.target.value)}
                  placeholder="e.g. PO-8891"
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono"
                />
                <datalist id="checkin-po-datalist">
                  {(orders || []).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} - {o.supplier} (₹{o.totalAmount})
                    </option>
                  ))}
                </datalist>
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
                rows={6}
                disabled={disabled}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of items or services received..."
                className="w-full rounded-lg border-2 border-gray-300 bg-white/90 p-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 text-foreground font-mono leading-relaxed"
              />
            </div>

            {/* Document Scan Box - Multi-Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Attach Invoice Document Scans {invoiceImages.length > 0 && `(${invoiceImages.length} attached)`}
                </label>
                {invoiceImages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setInvoiceImages([])}
                    className="text-[11px] text-destructive hover:underline cursor-pointer font-medium"
                  >
                    Clear All ({invoiceImages.length})
                  </button>
                )}
              </div>

              {invoiceImages.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {invoiceImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className="relative border-2 border-primary/30 bg-primary/5 rounded-xl p-2.5 flex items-center justify-between gap-2.5 shadow-xs hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="h-12 w-12 rounded-lg overflow-hidden shrink-0 border border-border bg-muted/40 flex items-center justify-center relative">
                            <img
                              src={img.dataUrl}
                              alt={img.fileName}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 bg-black/75 text-white text-[8px] px-1 rounded-tl-sm font-bold">
                              #{idx + 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate" title={img.fileName}>
                              {img.fileName}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{img.fileSize}</p>
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveImage(img.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 cursor-pointer"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-primary/40 hover:border-primary bg-muted/20 hover:bg-muted/40 p-3 rounded-xl text-center cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-semibold text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Click to add more images / documents</span>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files) handleFilesRead(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary bg-muted/10'
                  }`}
                >
                  <Upload className="mx-auto text-muted-foreground mb-2" size={26} />
                  <p className="text-xs font-semibold text-foreground">Click or Drag &amp; Drop multiple invoice documents/images</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Select multiple PNG, JPG, or PDF files at once (up to 10MB each)</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesRead(e.target.files);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={disabled || !isFormValid}
                className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 h-10 px-6 font-bold text-sm cursor-pointer"
              >
                Submit New Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation & Stock In Modal on Submit */}
      <InvoiceStockInModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        invoiceSummary={{
          vendor,
          invoiceNumber,
          invoiceDate,
          totalAmount: calculatedTotal,
          poNumber,
          linkedOrder,
        }}
        onSubmitInvoiceOnly={handleCreateInvoiceOnly}
        onSubmitWithStockIn={handleCreateInvoiceWithStockIn}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
