'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  Laptop,
  Warehouse,
  FileText,
  Plus,
  Save,
  Package,
  Building2,
  Receipt,
  Hash,
  Barcode,
  IndianRupee,
  Tag,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Product, Supplier } from '@/context/inventory-context';

export default function StockInAssetsPage() {
  const { products, categories, suppliers, recordTransaction, activeBranch } = useInventory();
  const router = useRouter();

  // Form states for Asset Stock In
  const [productId, setProductId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [customSupplier, setCustomSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [quantity, setQuantity] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState('Warehouse A (Zone 1)');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Filter products that belong to an asset category
  const assetProducts = products.filter((prod) => {
    const category = categories.find((c) => c.name.toLowerCase() === prod.category.toLowerCase());
    return category?.isAsset === true;
  });

  // Default selection when asset products load
  useEffect(() => {
    if (assetProducts.length > 0 && !productId) {
      setProductId(assetProducts[0].id);
      if (assetProducts[0].price) {
        setAmount(assetProducts[0].price.toString());
      }
    }
  }, [assetProducts, productId]);

  // Set default supplier when suppliers load
  useEffect(() => {
    if (suppliers.length > 0 && !supplier) {
      setSupplier(suppliers[0].name);
    }
  }, [suppliers, supplier]);

  // When product changes, auto-fill price if available
  const handleProductChange = (id: string) => {
    setProductId(id);
    const selectedProd = assetProducts.find(p => p.id === id);
    if (selectedProd && selectedProd.price) {
      setAmount(selectedProd.price.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !productId || !quantity || !location) return;

    const finalSupplier = supplier === 'CUSTOM_SUPPLIER' ? customSupplier : supplier;

    const summaryParts = [
      invoiceNumber ? `Invoice: ${invoiceNumber}` : '',
      finalSupplier ? `Supplier: ${finalSupplier}` : '',
      model ? `Model: ${model}` : '',
      serialNumber ? `S/N: ${serialNumber}` : '',
      amount ? `Price: ₹${amount}` : '',
      notes ? `Notes: ${notes}` : '',
    ].filter(Boolean);

    const fullNotes = `[Asset Intake] ${summaryParts.join(' | ')}`;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const success = await recordTransaction(
        productId,
        'Stock In',
        parseInt(quantity),
        location,
        fullNotes
      );

      if (success) {
        router.push('/stock/assets');
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="mx-auto max-w-full space-y-4">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/stock/assets">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-2 transition-all hover:scale-105 hover:border-primary/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                <Laptop className="h-6 w-6 text-blue-500" />
                Stock In Assets (Receive Hardware & Equipment)
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-blue-500" />
                Record incoming asset inventory with serial numbers, supplier, invoice, and model tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Asset Stock</span>
          </div>
        </div>

        {assetProducts.length === 0 ? (
          <Card className="border border-border/50 bg-background/60 backdrop-blur-sm p-8 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground">
              You must have at least one asset product created (under an asset category) before recording stock in for assets.
            </p>
            <Link href="/products/new">
              <Button size="sm">Create Asset Product</Button>
            </Link>
          </Card>
        ) : (
          /* Main Form Card */
          <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-blue-500" />
                    Asset Intake & Acquisition Details
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Enter product name, supplier, invoice, serial numbers, quantity, model, and unit price
                  </CardDescription>
                </div>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-medium text-blue-600">
                  New Asset Stock In
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 1. Item Name & Supplier */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Package className="h-3 w-3" />
                      Item Name <span className="text-destructive">*</span>
                    </label>
                    <select 
                      value={productId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    >
                      {assetProducts.map((prod: Product) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.category}) - Current: {activeBranch === 'All' ? Object.values(prod.stock || {}).reduce((a, b) => a + b, 0) : prod.stock?.[activeBranch] || 0} units
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      Supplier
                    </label>
                    <select 
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    >
                      {suppliers.map((s: Supplier) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                      <option value="CUSTOM_SUPPLIER">+ Enter Custom Supplier</option>
                    </select>
                    {supplier === 'CUSTOM_SUPPLIER' && (
                      <input
                        type="text"
                        value={customSupplier}
                        onChange={(e) => setCustomSupplier(e.target.value)}
                        placeholder="Enter supplier name"
                        className="mt-1.5 h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      />
                    )}
                  </div>
                </div>

                {/* 2. Invoice Number & Model (Optional) */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Receipt className="h-3 w-3" />
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-9041"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      Model <span className="text-[10px] font-normal text-muted-foreground">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Latitude 5420 / M2 Max 16-inch"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>
                </div>

                {/* 3. Quantity & Amount / Price */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      Quantity <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 10"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <IndianRupee className="h-3 w-3" />
                      Amount / Price (₹)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 65000"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>
                </div>

                {/* 4. Serial Number & Storage Location */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Barcode className="h-3 w-3" />
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="e.g. SN-80941A, SN-80942B"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Warehouse className="h-3 w-3" />
                      Warehouse / Storage Location <span className="text-destructive">*</span>
                    </label>
                    <select 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    >
                      <option value="Warehouse A (Zone 1)">🏢 Warehouse A (Zone 1)</option>
                      <option value="Warehouse B (Zone 3)">🏢 Warehouse B (Zone 3)</option>
                      <option value="Warehouse C (Cold Storage)">❄️ Warehouse C (Cold Storage)</option>
                      <option value="IT Storage Locker">💻 IT Storage Locker</option>
                    </select>
                  </div>
                </div>

                {/* 5. Additional Notes */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Additional Notes / Transaction Details
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Received via cargo dispatch with 1-year extended warranty."
                    className="w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 resize-y dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
                  <Link href="/stock/assets" className="w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 transition-all hover:bg-muted/50 sm:w-auto h-9 text-sm"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 sm:w-auto h-9 text-sm disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    {isSubmitting ? 'Recording Asset Stock...' : 'Record Asset Stock In'}
                    <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
