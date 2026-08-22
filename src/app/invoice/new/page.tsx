'use client';

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { TaxOption } from '@/types/invoice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
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
  ArrowUpRight,
  CheckCircle2,
  ShoppingCart,
  Sparkles,
  Plus,
} from 'lucide-react';
import { useInventory, Order } from '@/context/inventory-context';
import { toast } from 'react-toastify';
import { InvoiceStockInModal, StockInItemEntry } from '@/components/invoice/InvoiceStockInModal';

interface UploadedInvoiceImage {
  id: string;
  dataUrl: string;
  fileName: string;
  fileSize: string;
}

function NewInvoiceFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createInvoice } = useInvoice();
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkedOrder, setLinkedOrder] = useState<Order | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const submittingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialPoAppliedRef = useRef(false);

  // Auto Calculations
  const parsedTaxable = parseFloat(taxableAmount) || 0;
  const calculatedTax = parsedTaxable > 0 ? parsedTaxable * 0.18 : 0;
  const calculatedTotal = parsedTaxable + calculatedTax;

  // Auto-fetch and populate form fields from a selected Purchase Order
  const applyOrderDetails = useCallback((order: Order) => {
    setLinkedOrder(order);
    setPoNumber(order.id);

    if (order.supplier) {
      setVendor(order.supplier);
    }

    // Calculate pre-tax subtotal
    const subtotal =
      order.items && order.items.length > 0
        ? order.items.reduce((acc, it) => acc + (it.quantity * it.price), 0)
        : order.totalAmount
        ? Number((order.totalAmount / 1.18).toFixed(2))
        : 0;

    if (subtotal > 0) {
      setTaxableAmount(subtotal.toFixed(2));
    }

    // Format full Order Details for the description box
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-IN')
      : new Date().toLocaleDateString('en-IN');
    const orderedBy = (order as any).orderedBy || (order as any).createdBy || 'Admin';

    if (order.items && order.items.length === 1) {
      const item = order.items[0];
      setDescription(
        `Order Details\nOrder ID: ${order.id}\nSupplier: ${order.supplier || 'N/A'}\nProduct Name\n${item.name}\nDate: ${orderDate}\nOrdered By: ${orderedBy}\nQty\n${item.quantity}\nUnit Price (Rs)\n${Number(item.price || 0).toFixed(2)}`
      );
    } else if (order.items && order.items.length > 1) {
      const itemsList = order.items
        .map(
          (item) =>
            `Product Name\n${item.name}\nQty\n${item.quantity}\nUnit Price (Rs)\n${Number(item.price || 0).toFixed(2)}`
        )
        .join('\n\n');
      setDescription(
        `Order Details\nOrder ID: ${order.id}\nSupplier: ${order.supplier || 'N/A'}\nDate: ${orderDate}\nOrdered By: ${orderedBy}\n\n${itemsList}`
      );
    } else {
      setDescription(
        `Order Details\nOrder ID: ${order.id}\nSupplier: ${order.supplier || 'N/A'}\nDate: ${orderDate}\nOrdered By: ${orderedBy}`
      );
    }

    // Use order creation date if available
    if (order.createdAt) {
      const parsedDate = new Date(order.createdAt);
      if (!isNaN(parsedDate.getTime())) {
        setInvoiceDate(parsedDate.toISOString().slice(0, 10));
      }
    }

    toast.info(`Auto-fetched details from Purchase Order ${order.id}`);
  }, []);

  // Handle PO selection from dropdown / input
  const handlePoChange = (selectedPoId: string) => {
    setPoNumber(selectedPoId);
    const matched = (orders || []).find(
      (o) => o.id.trim().toLowerCase() === selectedPoId.trim().toLowerCase(),
    );
    if (matched) {
      applyOrderDetails(matched);
    } else {
      setLinkedOrder(null);
    }
  };

  const clearPoLink = () => {
    setLinkedOrder(null);
    setPoNumber('');
  };

  // Check URL query parameter (?po=... or ?orderId=...)
  useEffect(() => {
    if (initialPoAppliedRef.current || !orders || orders.length === 0) return;

    const poParam = searchParams?.get('po') || searchParams?.get('orderId');
    if (poParam) {
      const matched = orders.find(
        (o) => o.id.trim().toLowerCase() === poParam.trim().toLowerCase(),
      );
      if (matched) {
        applyOrderDetails(matched);
        initialPoAppliedRef.current = true;
      } else {
        setPoNumber(poParam);
        initialPoAppliedRef.current = true;
      }
    }
  }, [orders, searchParams, applyOrderDetails]);

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
          toast.success(`Attached ${targetFiles.length} document image(s)`);
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
    if (!vendor || !invoiceNumber || !invoiceDate || parsedTaxable <= 0) {
      toast.error('Please complete all required fields.');
      return;
    }
    // Open the confirmation modal with Stock In options
    setIsConfirmModalOpen(true);
  };

  const handleCreateInvoiceOnly = async () => {
    if (submittingRef.current || isSubmitting) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const imageUrls = invoiceImages.map((img) => img.dataUrl);
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
        invoiceImage: imageUrls[0] || null,
        invoiceImages: imageUrls,
      });

      if (success) {
        setIsConfirmModalOpen(false);
        router.push('/invoice');
      }
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
        invoiceImage: imageUrls[0] || null,
        invoiceImages: imageUrls,
      });

      if (success) {
        // Record Stock In transactions for each selected item
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

        toast.success(`Invoice created & ${totalQty} units stocked in successfully!`);
        setIsConfirmModalOpen(false);
        router.push('/invoice');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to complete stock in transactions.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-300 min-h-screen bg-background w-full max-w-full">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6 w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <FilePlus className="h-8 w-8 text-primary" />
            New Invoice
          </h1>
          <p className="text-muted-foreground mt-1">
            Enter vendor details, taxable amount, 18% GST tax option, link with Purchase Order (PO), and attach multiple document scans.
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleFormSubmit} className="w-full max-w-full">
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm rounded-2xl w-full max-w-full overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5 text-emerald-500" />
                  New Invoice Details
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Fill in vendor details or select a Purchase Order to auto-fill. Automatic 18% GST will be calculated.
                </CardDescription>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">
                Inward Register Entry
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Quick PO Link Bar */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Link with Purchase Order (Auto-Fetch Details)
                </label>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Auto-fills Vendor, Subtotal, Date &amp; Description
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <select
                    value={poNumber}
                    onChange={(e) => handlePoChange(e.target.value)}
                    className="h-10 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-medium cursor-pointer"
                  >
                    <option value="">-- Select a Purchase Order (PO) to Auto-Fetch --</option>
                    {(orders || []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} · {o.supplier} · ₹{o.totalAmount?.toLocaleString('en-IN')} ({o.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    list="po-datalist-quick"
                    placeholder="Or type PO Number (e.g. PO-101)"
                    value={poNumber}
                    onChange={(e) => handlePoChange(e.target.value)}
                    className="h-10 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono font-bold"
                  />
                  <datalist id="po-datalist-quick">
                    {(orders || []).map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.id} - {o.supplier} (₹{o.totalAmount})
                      </option>
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Linked PO Notification Banner */}
              {linkedOrder && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-lg flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-bold">Linked with {linkedOrder.id}:</span> {linkedOrder.supplier} · Total ₹{linkedOrder.totalAmount?.toLocaleString('en-IN')} ({linkedOrder.items?.length || 0} item lines)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearPoLink}
                    className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-200 underline font-semibold ml-2 cursor-pointer"
                  >
                    Clear Link
                  </button>
                </div>
              )}
            </div>

            {/* Row 1: Vendor, Invoice Number, Invoice Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Vendor / Party Name <span className="text-destructive">*</span>
                  </label>
                  {suppliers?.some((s) => s.name.trim().toLowerCase() === vendor.trim().toLowerCase()) && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> DB Verified
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  list="new-page-db-vendors"
                  placeholder="Type or select vendor from DB..."
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-semibold"
                />
                <datalist id="new-page-db-vendors">
                  {(suppliers || []).map((s, idx) => (
                    <option key={idx} value={s.name}>
                      {s.name} {s.location ? `(${s.location})` : s.taxId ? `(${s.taxId})` : ''}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5 text-primary" />
                  Vendor Invoice Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INV-2026-001"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Invoice Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 cursor-pointer"
                />
              </div>
            </div>

            {/* Row 2: Taxable Amount, Tax Option, Calculated Total */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <IndianRupee className="h-3.5 w-3.5 text-primary" />
                  Taxable Amount (₹) <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="e.g. 45000"
                  value={taxableAmount}
                  onChange={(e) => setTaxableAmount(e.target.value)}
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tax Option <span className="text-destructive">*</span>
                </label>
                <select
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
                  value={`₹${calculatedTotal.toLocaleString('en-IN')}`}
                  className="h-9 w-full rounded-lg border-2 border-gray-200 bg-muted/40 px-3 text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 shadow-sm"
                />
              </div>
            </div>

            {/* Dynamic Tax Breakup Notice */}
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

            {/* Row 3: PO Number & Bank Account Last 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  PO / Purchase Order No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-2026-904"
                  value={poNumber}
                  onChange={(e) => handlePoChange(e.target.value)}
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Landmark className="h-3.5 w-3.5 text-primary" />
                  Bank Account (Last 4 Digits)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="e.g. 8492"
                  value={bankLast4}
                  onChange={(e) => setBankLast4(e.target.value)}
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Description / Line Items Summary
              </label>
              <textarea
                rows={7}
                placeholder="Brief details of goods or services invoiced..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-300 bg-white/90 p-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 text-foreground leading-relaxed font-mono"
              />
            </div>

            {/* Document Scan Upload Box - Multi-Image */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-primary" />
                  Attach Invoice Copy / Document Scans {invoiceImages.length > 0 && `(${invoiceImages.length} attached)`}
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
                  {/* Grid of uploaded image preview cards */}
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

                  {/* Add more images button */}
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
                  onClick={() => fileInputRef.current?.click()}
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
                  className={`border-2 border-dashed ${
                    dragOver
                      ? 'border-primary bg-primary/10 scale-[0.99]'
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary/60 bg-muted/20 hover:bg-muted/40'
                  } p-6 rounded-xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2`}
                >
                  <div className="p-3 bg-background rounded-full shadow-sm text-primary">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      Click or Drag &amp; Drop multiple invoice documents/images
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Select multiple PNG, JPG, or PDF files at once (up to 10MB each)
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                multiple
                onChange={(e) => {
                  if (e.target.files) handleFilesRead(e.target.files);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                accept="image/*,application/pdf"
                className="hidden"
              />
            </div>

            {/* Form Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
              <Link href="/invoice">
                <Button type="button" variant="outline" size="sm" className="shadow-sm">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 h-10 px-6 font-bold text-sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Submit New Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

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
}

export default function NewInvoiceFormPage() {
  return (
    <InvoiceProvider>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Invoice Form...</div>}>
        <NewInvoiceFormContent />
      </Suspense>
    </InvoiceProvider>
  );
}
