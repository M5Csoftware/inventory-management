'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Package,
  Boxes,
  Plus,
  Trash2,
  Search,
  ArrowLeft,
  Calendar,
  UserCheck,
  MapPin,
  Info,
  ShieldCheck,
  Eye,
  Receipt,
  ShoppingCart,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  useInventory,
  BRANCHES,
  PhysicalVerificationItem,
  PhysicalVerificationRecord,
} from '@/context/inventory-context';
import { useInvoice } from '@/context/invoice-context';
import { useAuth } from '@/context/auth-context';
import { toast } from 'react-toastify';
import { ConfirmModal, ConfirmDeleteModal } from '@/components/confirm-modal';

export default function PhysicalVerificationPage() {
  const { user } = useAuth();
  const { invoices } = useInvoice();
  const {
    products,
    categories,
    transactions,
    orders,
    activeBranch,
    physicalVerifications,
    addPhysicalVerification,
    deletePhysicalVerification,
  } = useInventory();

  // Active view tab: 'form' or 'history'
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  // Form states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [branch, setBranch] = useState<string>(() =>
    activeBranch === 'All' ? 'Ahmedabad' : activeBranch
  );
  const [verifiedBy, setVerifiedBy] = useState<string>(() => user?.name || 'Inspector');
  const [verifiedAt, setVerifiedAt] = useState<string>(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const submittingRef = useRef(false);

  // Line items state
  const [items, setItems] = useState<PhysicalVerificationItem[]>([]);

  // History filter states
  const [historySearch, setHistorySearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Matched' | 'Discrepancy'>('all');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [selectedRecordForDetail, setSelectedRecordForDetail] =
    useState<PhysicalVerificationRecord | null>(null);
  const [recordToDelete, setRecordToDelete] =
    useState<PhysicalVerificationRecord | null>(null);

  // Sync user name
  useEffect(() => {
    if (user?.name) {
      setVerifiedBy(user.name);
    }
  }, [user]);

  // Sync active branch
  useEffect(() => {
    if (activeBranch !== 'All') {
      setBranch(activeBranch);
    }
  }, [activeBranch]);

  // Non-asset products for selection
  const nonAssetProducts = useMemo(() => {
    return products.filter((prod) => {
      const category = categories.find(
        (c) => c.name.toLowerCase() === prod.category.toLowerCase()
      );
      return !category?.isAsset;
    });
  }, [products, categories]);

  // Handle Invoice Selection to auto-populate items and metadata
  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    if (!invId) {
      setInvoiceNumber('');
      setPoNumber('');
      setSupplier('');
      setItems([]);
      return;
    }

    const matchedInvoice = invoices.find((inv) => inv.id === invId);
    if (!matchedInvoice) return;

    setInvoiceNumber(matchedInvoice.invoiceNumber || '');
    setPoNumber(matchedInvoice.poNumber || '');
    setSupplier(matchedInvoice.vendor || '');

    // Check if there are transactions recorded for this invoice number
    const invoiceTransactions = transactions.filter(
      (tx) =>
        tx.type === 'Stock In' &&
        ((tx.invoiceNumber &&
          tx.invoiceNumber.trim().toLowerCase() ===
            matchedInvoice.invoiceNumber.trim().toLowerCase()) ||
          (tx.notes &&
            tx.notes.toLowerCase().includes(matchedInvoice.invoiceNumber.toLowerCase())))
    );

    // Check if there is a linked order
    const linkedOrder = orders.find(
      (o) =>
        o.id.trim().toLowerCase() === (matchedInvoice.poNumber || '').trim().toLowerCase()
    );

    let populatedItems: PhysicalVerificationItem[] = [];

    if (invoiceTransactions.length > 0) {
      // Group by productId
      const prodMap = new Map<string, { qty: number; name: string }>();
      invoiceTransactions.forEach((tx) => {
        const current = prodMap.get(tx.productId) || { qty: 0, name: tx.productName };
        prodMap.set(tx.productId, {
          qty: current.qty + tx.quantity,
          name: tx.productName,
        });
      });

      populatedItems = Array.from(prodMap.entries()).map(([prodId, data]) => {
        const prod = products.find((p) => p.id === prodId);
        return {
          productId: prodId,
          productName: prod?.name || data.name,
          category: prod?.category,
          invoicedQuantity: data.qty,
          physicalQuantity: data.qty, // Default to invoiced quantity for convenient checking
          variance: 0,
          status: 'Matched',
          condition: 'Good Condition',
          notes: '',
        };
      });
    } else if (linkedOrder && linkedOrder.items?.length > 0) {
      populatedItems = linkedOrder.items.map((it) => {
        const prod = products.find(
          (p) =>
            p.id === it.productId ||
            p.name.trim().toLowerCase() === it.name.trim().toLowerCase()
        );
        const qty = it.quantity || 1;
        return {
          productId: prod?.id || it.productId || it.name,
          productName: prod?.name || it.name,
          category: prod?.category,
          invoicedQuantity: qty,
          physicalQuantity: qty,
          variance: 0,
          status: 'Matched',
          condition: 'Good Condition',
          notes: '',
        };
      });
    } else if (nonAssetProducts.length > 0) {
      // Fallback default 1 item
      populatedItems = [
        {
          productId: nonAssetProducts[0].id,
          productName: nonAssetProducts[0].name,
          category: nonAssetProducts[0].category,
          invoicedQuantity: 1,
          physicalQuantity: 1,
          variance: 0,
          status: 'Matched',
          condition: 'Good Condition',
          notes: '',
        },
      ];
    }

    setItems(populatedItems);
    toast.info(`Auto-loaded items from Invoice ${matchedInvoice.invoiceNumber}`);
  };

  // Line item manipulation helpers
  const handleAddItem = () => {
    if (nonAssetProducts.length === 0) return;
    const p = nonAssetProducts[0];
    setItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        category: p.category,
        invoicedQuantity: 1,
        physicalQuantity: 1,
        variance: 0,
        status: 'Matched',
        condition: 'Good Condition',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProductSelect = (index: number, productId: string) => {
    const matched = nonAssetProducts.find((p) => p.id === productId);
    if (!matched) return;
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              productId: matched.id,
              productName: matched.name,
              category: matched.category,
            }
          : item
      )
    );
  };

  const handleInvoicedQtyChange = (index: number, qty: number) => {
    const validQty = Math.max(0, qty || 0);
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const variance = item.physicalQuantity - validQty;
          const status =
            variance === 0 ? 'Matched' : variance < 0 ? 'Shortage' : 'Excess';
          return {
            ...item,
            invoicedQuantity: validQty,
            variance,
            status,
          };
        }
        return item;
      })
    );
  };

  const handlePhysicalQtyChange = (index: number, qty: number) => {
    const validQty = Math.max(0, qty || 0);
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const variance = validQty - item.invoicedQuantity;
          const status =
            variance === 0 ? 'Matched' : variance < 0 ? 'Shortage' : 'Excess';
          return {
            ...item,
            physicalQuantity: validQty,
            variance,
            status,
          };
        }
        return item;
      })
    );
  };

  const handleConditionChange = (
    index: number,
    condition: PhysicalVerificationItem['condition']
  ) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, condition } : item))
    );
  };

  const handleItemNotesChange = (index: number, notes: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, notes } : item))
    );
  };

  // Form submission validation & trigger confirm modal
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.warn('Please add at least one line item to verify.');
      return;
    }
    setShowSubmitConfirm(true);
  };

  const executeSubmitVerification = async () => {
    if (submittingRef.current || isSubmitting) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const hasDiscrepancy = items.some(
        (it) => it.variance !== 0 || it.condition !== 'Good Condition'
      );
      const overallStatus: 'Matched' | 'Discrepancy' = hasDiscrepancy
        ? 'Discrepancy'
        : 'Matched';

      await addPhysicalVerification({
        invoiceNumber: invoiceNumber.trim() || undefined,
        poNumber: poNumber.trim() || undefined,
        supplier: supplier.trim() || undefined,
        branch,
        verifiedBy: verifiedBy.trim() || 'Inspector',
        verifiedAt,
        items,
        overallStatus,
        generalNotes: generalNotes.trim() || undefined,
      });

      // Reset form
      setSelectedInvoiceId('');
      setInvoiceNumber('');
      setPoNumber('');
      setSupplier('');
      setGeneralNotes('');
      setItems([]);
      setActiveTab('history');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save physical verification.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  // Filtered History Records
  const filteredRecords = useMemo(() => {
    return physicalVerifications.filter((rec) => {
      const matchesSearch =
        rec.id.toLowerCase().includes(historySearch.toLowerCase()) ||
        (rec.invoiceNumber || '').toLowerCase().includes(historySearch.toLowerCase()) ||
        (rec.poNumber || '').toLowerCase().includes(historySearch.toLowerCase()) ||
        (rec.supplier || '').toLowerCase().includes(historySearch.toLowerCase()) ||
        rec.verifiedBy.toLowerCase().includes(historySearch.toLowerCase()) ||
        rec.items.some((it) => it.productName.toLowerCase().includes(historySearch.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ? true : rec.overallStatus === statusFilter;

      const matchesBranch =
        branchFilter === 'All' ? true : rec.branch === branchFilter;

      return matchesSearch && matchesStatus && matchesBranch;
    });
  }, [physicalVerifications, historySearch, statusFilter, branchFilter]);

  // Overall metrics for current form
  const totalInvoicedUnits = items.reduce((acc, it) => acc + (it.invoicedQuantity || 0), 0);
  const totalPhysicalUnits = items.reduce((acc, it) => acc + (it.physicalQuantity || 0), 0);
  const totalVariance = totalPhysicalUnits - totalInvoicedUnits;
  const isFormFullyMatched =
    items.length > 0 &&
    items.every((it) => it.variance === 0 && it.condition === 'Good Condition');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-300 min-h-screen bg-background">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/products" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Products
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Physical Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ClipboardCheck className="h-7 w-7 text-primary" />
            Physical Verification (Inward Tally)
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conduct 2-step physical inspection of received goods to tally against invoice inward records.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-xl border border-border/60 self-start sm:self-auto">
          <Button
            type="button"
            variant={activeTab === 'form' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('form')}
            className="text-xs h-8 px-3 gap-1.5 cursor-pointer font-semibold shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Conduct Verification
          </Button>
          <Button
            type="button"
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('history')}
            className="text-xs h-8 px-3 gap-1.5 cursor-pointer font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" /> Tally Log &amp; History ({physicalVerifications.length})
          </Button>
        </div>
      </div>

      {/* Notice Banner: Invariance of Inventory Stock */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-foreground">
            2-Step Inward Verification &amp; Audit Tally Rule
          </p>
          <p className="opacity-90">
            Physical verification records physical counts and variance strictly for quality checking and inward audit records. 
            <strong> Inventory stock is officially booked and updated via the Invoice module and will not be altered by this form.</strong>
          </p>
        </div>
      </div>

      {activeTab === 'form' ? (
        /* Conduct Verification Form */
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                Step 1: Link Inward Invoice &amp; Reference Details
              </CardTitle>
              <CardDescription className="text-xs">
                Select an existing inward invoice to auto-load products and expected quantities, or enter reference details manually.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Invoice Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-primary" /> Select Inward Invoice (Auto-Fetch)
                  </label>
                  <select
                    value={selectedInvoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-background px-3 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 cursor-pointer"
                  >
                    <option value="">-- Select Inward Invoice --</option>
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} · {inv.vendor} (₹{inv.amount?.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manual Invoice Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-9901"
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-background px-3 text-xs font-mono font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700"
                  />
                </div>

                {/* Linked PO Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1">
                    <ShoppingCart className="h-3.5 w-3.5 text-primary" /> PO Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-102"
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-background px-3 text-xs font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-1">
                {/* Supplier / Vendor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> Supplier / Vendor
                  </label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder="Vendor Name"
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-background px-3 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700"
                  />
                </div>

                {/* Target Branch */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> Inspection Branch <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-background px-3 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Inspector Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <UserCheck className="h-3.5 w-3.5 text-primary" /> Verified By (Inspector) <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={verifiedBy}
                    onChange={(e) => setVerifiedBy(e.target.value)}
                    required
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-background px-3 text-xs font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700"
                  />
                </div>

                {/* Verification Date & Time */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> Inspection Date &amp; Time <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={verifiedAt}
                    onChange={(e) => setVerifiedAt(e.target.value)}
                    required
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-background px-3 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Tally Grid */}
          <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" />
                  Step 2: Product Inward Tally &amp; Condition Verification ({items.length} items)
                </CardTitle>
                <CardDescription className="text-xs">
                  Compare invoiced quantities against physically counted quantities and inspect package condition.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs h-8 px-3 gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" /> Add Item Line
              </Button>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {items.length === 0 ? (
                <div className="p-8 text-center rounded-xl border-2 border-dashed border-border bg-muted/10 space-y-3">
                  <Package className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    No products added for physical verification. Select an inward invoice above or click &quot;Add Item Line&quot;.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="text-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add First Product
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-border/80 bg-background shadow-xs space-y-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
                        {/* Product selection */}
                        <div className="lg:col-span-4 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Product #{idx + 1}
                          </label>
                          {nonAssetProducts.length > 0 ? (
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                              className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            >
                              {nonAssetProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.category})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={item.productName}
                              readOnly
                              className="h-9 w-full rounded-lg border border-border bg-muted/40 px-2.5 text-xs font-semibold"
                            />
                          )}
                        </div>

                        {/* Invoiced Qty */}
                        <div className="lg:col-span-2 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                            Invoiced Qty (Booked)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.invoicedQuantity}
                            onChange={(e) => handleInvoicedQtyChange(idx, parseInt(e.target.value) || 0)}
                            className="h-9 w-full rounded-lg border border-border bg-muted/30 px-2.5 text-xs font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        {/* Physically Counted Qty */}
                        <div className="lg:col-span-2 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-primary block truncate">
                            Physical Count (Received) <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.physicalQuantity}
                            onChange={(e) => handlePhysicalQtyChange(idx, parseInt(e.target.value) || 0)}
                            className="h-9 w-full rounded-lg border-2 border-primary/40 bg-background px-2.5 text-xs font-mono font-black text-center focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        </div>

                        {/* Condition */}
                        <div className="lg:col-span-3 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Package Condition
                          </label>
                          <select
                            value={item.condition}
                            onChange={(e) =>
                              handleConditionChange(
                                idx,
                                e.target.value as PhysicalVerificationItem['condition']
                              )
                            }
                            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                          >
                            <option value="Good Condition">✓ Good Condition</option>
                            <option value="Damaged">⚠️ Damaged Units</option>
                            <option value="Packaging Defect">⚠️ Packaging Defect</option>
                            <option value="Seal Broken">⚠️ Seal Broken</option>
                            <option value="Other">Other Observation</option>
                          </select>
                        </div>

                        {/* Remove Action */}
                        <div className="lg:col-span-1 flex justify-end pt-5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                            title="Remove line item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Variance & Status Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/40 text-xs">
                        <div className="flex items-center gap-2">
                          {item.variance === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-bold text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" /> 100% Matched (Invoiced: {item.invoicedQuantity} · Physical: {item.physicalQuantity})
                            </span>
                          ) : item.variance < 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 font-bold text-[11px]">
                              <AlertTriangle className="h-3.5 w-3.5" /> Shortage: {Math.abs(item.variance)} unit(s) missing (Invoiced: {item.invoicedQuantity} · Physical: {item.physicalQuantity})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25 font-bold text-[11px]">
                              <Info className="h-3.5 w-3.5" /> Excess: +{item.variance} unit(s) surplus (Invoiced: {item.invoicedQuantity} · Physical: {item.physicalQuantity})
                            </span>
                          )}

                          {item.condition !== 'Good Condition' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 text-[10px] font-semibold">
                              Condition Issue: {item.condition}
                            </span>
                          )}
                        </div>

                        {/* Item Remarks input */}
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => handleItemNotesChange(idx, e.target.value)}
                          placeholder="Item remarks / batch / serial no..."
                          className="h-7 w-full sm:w-64 rounded-md border border-border/80 bg-background px-2 text-[11px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall Tally Summary & Submission */}
          <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
                Step 3: Verification Summary &amp; Inspector Remarks
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-5 space-y-4">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Total Invoiced Qty</span>
                  <span className="text-base font-mono font-bold text-foreground mt-0.5 block">
                    {totalInvoicedUnits} units
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Total Physical Qty</span>
                  <span className="text-base font-mono font-bold text-primary mt-0.5 block">
                    {totalPhysicalUnits} units
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Net Variance</span>
                  <span
                    className={`text-base font-mono font-bold mt-0.5 block ${
                      totalVariance === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : totalVariance < 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {totalVariance > 0 ? `+${totalVariance}` : totalVariance} units
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border/60">
                  <span className="text-[10px] text-muted-foreground block uppercase font-bold">Tally Status</span>
                  <span
                    className={`text-xs font-bold mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      isFormFullyMatched
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                    }`}
                  >
                    {isFormFullyMatched ? '✓ 100% Matched' : '⚠️ Discrepancy'}
                  </span>
                </div>
              </div>

              {/* General Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Inspector Overall Remarks / Verification Notes
                </label>
                <textarea
                  rows={3}
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="e.g. All 100 cartons physically verified, seal intact, matched with invoice and PO."
                  className="w-full rounded-lg border-2 border-gray-300 bg-background p-2.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/40">
                <p className="text-[11px] text-muted-foreground">
                  Submitting will create an immutable audit record for the invoice verification log.
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="w-full sm:w-auto h-10 px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Saving Record...' : 'Save Physical Verification Record'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      ) : (
        /* History & Tally Log Tab */
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm bg-gradient-to-br from-card to-card/80 rounded-2xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold">Physical Verification Audit Log</CardTitle>
                  <CardDescription className="text-xs">
                    Historical physical count tallies against inward invoices and purchase orders.
                  </CardDescription>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="search"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search record, invoice, supplier..."
                      className="h-8 w-48 sm:w-60 rounded-lg border border-border bg-background pl-8 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Matched">✓ Matched</option>
                    <option value="Discrepancy">⚠️ Discrepancy</option>
                  </select>

                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border bg-background px-2 text-xs font-medium cursor-pointer"
                  >
                    <option value="All">All Branches</option>
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="relative w-full overflow-x-auto rounded-xl border border-border/50 bg-background">
                {filteredRecords.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-3">
                    <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-xs font-medium">No physical verification records found matching your filters.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('form')}
                      className="text-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Conduct New Physical Verification
                    </Button>
                  </div>
                ) : (
                  <table className="w-full caption-bottom text-xs">
                    <thead className="[&_tr]:border-b bg-muted/30">
                      <tr className="border-b transition-colors">
                        <th className="h-9 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">Record ID</th>
                        <th className="h-9 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">Invoice / PO</th>
                        <th className="h-9 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">Supplier</th>
                        <th className="h-9 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">Branch</th>
                        <th className="h-9 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">Items Tallied</th>
                        <th className="h-9 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">Tally Result</th>
                        <th className="h-9 px-4 text-left font-bold text-muted-foreground uppercase text-[10px]">Verified By &amp; Date</th>
                        <th className="h-9 px-4 text-right font-bold text-muted-foreground uppercase text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredRecords.map((rec) => {
                        const totalInv = rec.items.reduce((a, b) => a + (b.invoicedQuantity || 0), 0);
                        const totalPhys = rec.items.reduce((a, b) => a + (b.physicalQuantity || 0), 0);
                        const diff = totalPhys - totalInv;

                        return (
                          <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-mono font-bold text-foreground">{rec.id}</td>
                            <td className="p-4">
                              <span className="font-mono font-bold block">{rec.invoiceNumber || 'Manual / Standalone'}</span>
                              {rec.poNumber && (
                                <span className="text-[10px] text-muted-foreground block font-mono">PO: {rec.poNumber}</span>
                              )}
                            </td>
                            <td className="p-4 font-medium text-foreground">{rec.supplier || 'N/A'}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground">
                                <MapPin className="h-3 w-3 text-primary" /> {rec.branch}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="font-semibold block">{rec.items.length} product line(s)</span>
                              <span className="text-[10px] text-muted-foreground block font-mono">
                                Invoiced: {totalInv} · Physical: {totalPhys}
                              </span>
                            </td>
                            <td className="p-4">
                              {rec.overallStatus === 'Matched' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-bold text-[10px]">
                                  <CheckCircle2 className="h-3 w-3" /> 100% Matched
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 font-bold text-[10px]">
                                  <AlertTriangle className="h-3 w-3" /> Discrepancy ({diff > 0 ? `+${diff}` : diff})
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className="font-medium text-foreground block">{rec.verifiedBy}</span>
                              <span className="text-[10px] text-muted-foreground block">
                                {new Date(rec.verifiedAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedRecordForDetail(rec)}
                                  className="h-7 text-xs px-2 gap-1 cursor-pointer"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setRecordToDelete(rec)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                                  title="Delete verification record"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Record Detail Modal */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Physical Verification Details ({selectedRecordForDetail.id})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Inward tally record &amp; physical inspection checklist
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRecordForDetail(null)}
                className="h-8 w-8 p-0 rounded-full cursor-pointer"
              >
                ✕
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Invoice No.</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedRecordForDetail.invoiceNumber || 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">PO No.</span>
                  <span className="font-mono font-bold text-foreground">
                    {selectedRecordForDetail.poNumber || 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Branch</span>
                  <span className="font-semibold text-foreground">
                    {selectedRecordForDetail.branch}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                  <span className="text-[10px] text-muted-foreground block">Overall Result</span>
                  <span
                    className={`font-bold inline-flex items-center gap-1 ${
                      selectedRecordForDetail.overallStatus === 'Matched'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {selectedRecordForDetail.overallStatus}
                  </span>
                </div>
              </div>

              {/* Verified By / Date */}
              <div className="p-3 rounded-lg bg-background border border-border/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-muted-foreground">Verified By: </span>
                  <strong className="text-foreground">{selectedRecordForDetail.verifiedBy}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <strong className="text-foreground">
                    {new Date(selectedRecordForDetail.verifiedAt).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">
                  Line Items Tally ({selectedRecordForDetail.items.length})
                </label>
                <div className="border border-border/60 rounded-xl overflow-hidden divide-y divide-border/40">
                  {selectedRecordForDetail.items.map((it, idx) => (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-background hover:bg-muted/20">
                      <div>
                        <span className="font-bold text-foreground block">{it.productName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          Invoiced: {it.invoicedQuantity} units · Physical Count: {it.physicalQuantity} units · Condition: {it.condition}
                        </span>
                        {it.notes && (
                          <p className="text-[10px] text-primary mt-0.5">Remarks: {it.notes}</p>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full self-start sm:self-auto shrink-0 ${
                          it.variance === 0
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
                            : it.variance < 0
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/25'
                        }`}
                      >
                        {it.variance === 0 ? '✓ Matched' : it.variance < 0 ? `Shortage (${it.variance})` : `Excess (+${it.variance})`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedRecordForDetail.generalNotes && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                  <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                    Inspector Remarks
                  </span>
                  <p className="text-xs text-foreground italic">{selectedRecordForDetail.generalNotes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecordForDetail(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Verification Form Submission */}
      <ConfirmModal
        isOpen={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={executeSubmitVerification}
        title="Save Physical Verification Record"
        description="Are you sure you want to save this inward physical verification record to the audit ledger?"
        variant={items.some((it) => it.variance !== 0) ? 'warning' : 'success'}
        confirmText="Save Verification"
        confirmLoadingText="Saving Record..."
        icon={<ClipboardCheck className="h-5 w-5" />}
        itemName={
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Branch:</span>
              <span className="font-semibold text-foreground">{branch}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Items Verified:</span>
              <span className="font-semibold text-foreground">{items.length} line item(s)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Total Physical Count:</span>
              <span className="font-bold text-foreground">{totalPhysicalUnits} units</span>
            </div>
            <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Result:</span>
              <span className={`font-bold ${isFormFullyMatched ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {isFormFullyMatched ? '100% Matched' : `Discrepancy (Variance: ${totalVariance > 0 ? `+${totalVariance}` : totalVariance})`}
              </span>
            </div>
          </div>
        }
      />

      {/* Confirmation Modal for Record Deletion */}
      <ConfirmDeleteModal
        isOpen={recordToDelete !== null}
        onClose={() => setRecordToDelete(null)}
        onConfirm={async () => {
          if (recordToDelete) {
            await deletePhysicalVerification(recordToDelete.id);
          }
        }}
        title="Delete Verification Record"
        description="Are you sure you want to delete this physical verification tally? This cannot be undone."
        itemName={recordToDelete ? `${recordToDelete.id} (Verified by: ${recordToDelete.verifiedBy})` : ''}
      />
    </div>
  );
}
