/* src/app/products/new/page.tsx */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Box,
  Plus,
  Save,
  Package,
  Tag,
  IndianRupee,
  Layers,
  AlertCircle,
  Truck,
  Building2,
  Trash2,
  Laptop,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Category, Supplier, BRANCHES } from '@/context/inventory-context';
import { ConfirmModal } from '@/components/confirm-modal';

interface SupplierRow {
  supplierName: string;
  rate: string;
  isCustom?: boolean;
  customName?: string;
}

export default function NewProductPage() {
  const { addProduct, categories, suppliers, activeBranch } = useInventory();
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [initialBranch, setInitialBranch] = useState(() =>
    activeBranch === 'All' ? 'Ahmedabad' : activeBranch,
  );

  useEffect(() => {
    if (activeBranch !== 'All') {
      setInitialBranch(activeBranch);
    }
  }, [activeBranch]);
  const [threshold, setThreshold] = useState('10');
  const [uomValue, setUomValue] = useState('1');
  const [uom, setUom] = useState('pcs');
  const [packaging, setPackaging] = useState('boxes');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const submittingRef = useRef(false);

  // Multi-supplier list state
  const [productSuppliers, setProductSuppliers] = useState<SupplierRow[]>([
    { supplierName: '', rate: '', isCustom: false, customName: '' }
  ]);

  // Set default category and supplier when loaded
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  useEffect(() => {
    if (suppliers.length > 0 && !productSuppliers[0]?.supplierName && !productSuppliers[0]?.isCustom) {
      setProductSuppliers([
        { supplierName: suppliers[0].name, rate: '', isCustom: false, customName: '' }
      ]);
    }
  }, [suppliers]);

  const handleAddSupplierRow = () => {
    const defaultSup = suppliers.length > 0 ? suppliers[0].name : '';
    setProductSuppliers((prev) => [
      ...prev,
      { supplierName: defaultSup, rate: '', isCustom: false, customName: '' }
    ]);
  };

  const handleRemoveSupplierRow = (index: number) => {
    if (productSuppliers.length <= 1) return;
    setProductSuppliers((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSupplierRow = (index: number, updatedFields: Partial<SupplierRow>) => {
    setProductSuppliers((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...updatedFields } : row))
    );
  };

  const selectedCategoryObj = categories.find(
    (c) => c.name.trim().toLowerCase() === category.trim().toLowerCase()
  );
  const isAssetCategory = !!selectedCategoryObj?.isAsset;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) return;
    if (!isAssetCategory && !stock) return;
    setShowConfirmModal(true);
  };

  const executeAddProduct = async () => {
    if (!name || !category) return;
    if (!isAssetCategory && !stock) return;
    if (submittingRef.current) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      // Process suppliersList
      const validSuppliers = productSuppliers
        .map((s) => {
          const finalName = s.isCustom ? (s.customName || '').trim() : s.supplierName.trim();
          return {
            supplierName: finalName,
            rate: parseFloat(s.rate) || 0,
          };
        })
        .filter((s) => s.supplierName.length > 0);

      const primarySupplierName = validSuppliers.length > 0 ? validSuppliers[0].supplierName : 'N/A';
      const derivedPrice = validSuppliers.length > 0 ? validSuppliers[0].rate : 0;

      const targetBranch = initialBranch;

      const initialStockMap = isAssetCategory
        ? { Ahmedabad: 0, Ludhiana: 0, Delhi: 0, Mumbai: 0 }
        : {
            Ahmedabad: targetBranch === 'Ahmedabad' ? parseInt(stock || '0') : 0,
            Ludhiana: targetBranch === 'Ludhiana' ? parseInt(stock || '0') : 0,
            Delhi: targetBranch === 'Delhi' ? parseInt(stock || '0') : 0,
            Mumbai: targetBranch === 'Mumbai' ? parseInt(stock || '0') : 0,
          };

      const dimensionStr = (length || width || height) 
        ? `${length || 0}x${width || 0}x${height || 0}` 
        : undefined;

      await addProduct({
        name,
        category,
        price: derivedPrice,
        stock: initialStockMap,
        threshold: parseInt(threshold || '10'),
        supplier: primarySupplierName,
        suppliersList: validSuppliers,
        sku: sku || undefined,
        description: description || undefined,
        uomValue: parseFloat(uomValue) || 1,
        uom,
        packaging,
        weight: weight ? parseFloat(weight) : undefined,
        dimensions: dimensionStr,
        ...({ branch: targetBranch } as any),
      });

      setShowConfirmModal(false);
      router.push('/products');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const hasCategories = categories.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-full space-y-4">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/products">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-2 transition-all hover:scale-105 hover:border-primary/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Add New Product
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Box className="h-3 w-3" />
                Create a new entry in your global product catalog
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Draft</span>
          </div>
        </div>

        {!hasCategories ? (
          <Card className="border border-warning bg-warning/5 p-6 rounded-xl text-center space-y-4 max-w-lg mx-auto">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Category Required</h3>
              <p className="text-sm text-muted-foreground">
                Before adding a product, you must have at least one **Category** created.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/categories/new">
                <Button size="sm">Create Category</Button>
              </Link>
            </div>
          </Card>
        ) : (
          /* Main Form Card */
          <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Product Details
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Enter product specification, pricing, suppliers, and stock values
                  </CardDescription>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                  Required *
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Product Name & SKU */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Tag className="h-3 w-3" />
                      Product Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ergonomic Office Desk"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Layers className="h-3 w-3" />
                      SKU / Barcode <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. FURN-DSK-02"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 font-mono text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>
                </div>

                {/* Category & Minimum Stock Alert (Placed above where primary supplier was) */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Category <span className="text-destructive">*</span>
                    </label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500 font-medium cursor-pointer"
                    >
                      {(() => {
                        const topLevels = (categories || []).filter((c: Category) => !c.parentCategory);
                        const subMap: Record<string, Category[]> = {};
                        const renderedSubs = new Set<string>();

                        (categories || []).forEach((c: Category) => {
                          if (c.parentCategory) {
                            const key = c.parentCategory.trim().toLowerCase();
                            if (!subMap[key]) subMap[key] = [];
                            subMap[key].push(c);
                          }
                        });

                        const elements = topLevels.map((top: Category) => {
                          const subs = subMap[top.name.trim().toLowerCase()] || [];
                          subs.forEach((s) => renderedSubs.add(s.name));
                          if (subs.length > 0) {
                            return (
                              <optgroup key={top.name} label={`📁 ${top.name}`}>
                                <option value={top.name}>{top.name} (General / Major)</option>
                                {subs.map((s) => (
                                  <option key={s.name} value={s.name}>
                                    &nbsp;&nbsp;↳ {s.name}
                                  </option>
                                ))}
                              </optgroup>
                            );
                          }
                          return (
                            <option key={top.name} value={top.name}>
                              {top.name}
                            </option>
                          );
                        });

                        const unlinkedSubs = (categories || []).filter(
                          (c: Category) => c.parentCategory && !renderedSubs.has(c.name),
                        );
                        if (unlinkedSubs.length > 0) {
                          elements.push(
                            <optgroup key="other-subs" label="Other Subcategories">
                              {unlinkedSubs.map((s) => (
                                <option key={s.name} value={s.name}>
                                  {s.name} ({s.parentCategory})
                                </option>
                              ))}
                            </optgroup>,
                          );
                        }

                        return elements;
                      })()}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      Min Stock Alert (Threshold) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      placeholder="10"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description..."
                    rows={2}
                    className="w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 resize-y dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  />
                </div>

                {/* Suppliers & Rates Section (Hidden for Fixed Assets) */}
                {!isAssetCategory && (
                  <div className="rounded-lg bg-muted/30 p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IndianRupee className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          Suppliers &amp; Cost Rates
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSupplierRow}
                        className="h-7 text-xs gap-1 border-dashed text-primary hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3" /> Add Supplier
                      </Button>
                    </div>

                    <div className="space-y-2.5">
                      {productSuppliers.map((supRow, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-background/60 p-2.5 rounded-lg border border-border/50 shadow-xs">
                          <div className="flex-1 w-full space-y-1">
                            <select
                              value={supRow.isCustom ? "CUSTOM_NEW" : supRow.supplierName}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "CUSTOM_NEW") {
                                  updateSupplierRow(idx, { isCustom: true, supplierName: "" });
                                } else {
                                  updateSupplierRow(idx, { isCustom: false, supplierName: val });
                                }
                              }}
                              className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-xs shadow-sm transition-all dark:border-gray-600 dark:bg-gray-900/90"
                            >
                              <option value="" disabled>Select Supplier</option>
                              {suppliers.map((s) => (
                                <option key={s.name} value={s.name}>{s.name}</option>
                              ))}
                              <option value="CUSTOM_NEW">+ Enter Custom Supplier Name...</option>
                            </select>

                            {supRow.isCustom && (
                              <input
                                type="text"
                                value={supRow.customName || ""}
                                onChange={(e) => updateSupplierRow(idx, { customName: e.target.value })}
                                placeholder="Type new supplier name..."
                                className="h-8 w-full rounded-md border border-primary/50 bg-background px-2.5 text-xs focus:ring-1 focus:ring-primary mt-1"
                                required
                              />
                            )}
                          </div>

                          <div className="w-full sm:w-36 space-y-1">
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={supRow.rate}
                                onChange={(e) => updateSupplierRow(idx, { rate: e.target.value })}
                                placeholder="Cost Rate"
                                className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 pl-6 pr-2 text-xs shadow-sm dark:border-gray-600 dark:bg-gray-900/90"
                                required
                              />
                            </div>
                          </div>

                          {productSuppliers.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveSupplierRow(idx)}
                              className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0 self-end sm:self-center"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Packaging & Stock Info */}
                {isAssetCategory ? (
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-900 dark:text-blue-200 flex items-start gap-3">
                    <Laptop className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-foreground flex items-center gap-2">
                        Fixed Asset Category Active ({selectedCategoryObj?.name})
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold">
                          Asset Product
                        </span>
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        This category is designated for physical hardware and fixed assets. Individual units (e.g. laptops, monitors, devices) and their serial numbers are added via{' '}
                        <Link href="/stock/assets/in" className="text-primary font-semibold underline hover:text-primary/80">
                          Stock In Assets
                        </Link>
                        . Initial opening stock entry is not required and will be initialized to 0.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Base Measurement
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={packaging === 'units' || packaging === 'unit' ? '1' : uomValue}
                          onChange={(e) => setUomValue(e.target.value)}
                          disabled={packaging === 'units' || packaging === 'unit'}
                          placeholder="1"
                          className="h-9 w-24 rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-center text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:bg-muted/70 disabled:text-muted-foreground dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                        />
                        <select 
                          value={uom}
                          onChange={(e) => setUom(e.target.value)}
                          className="h-9 flex-1 rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                        >
                          <optgroup label="Count">
                            <option value="pcs">Pieces (pcs)</option>
                            <option value="units">Units</option>
                          </optgroup>
                          <optgroup label="Length">
                            <option value="mm">Millimeters (mm)</option>
                            <option value="cm">Centimeters (cm)</option>
                            <option value="m">Meters (m)</option>
                          </optgroup>
                          <optgroup label="Weight">
                            <option value="g">Grams (g)</option>
                            <option value="kg">Kilograms (kg)</option>
                          </optgroup>
                          <optgroup label="Volume">
                            <option value="ml">Milliliters (ml)</option>
                            <option value="liters">Liters (L)</option>
                          </optgroup>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Packaging Type
                      </label>
                      <select 
                        value={packaging}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPackaging(val);
                          if (val === 'units' || val === 'unit') {
                            setUomValue('1');
                            setUom('units');
                          }
                        }}
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      >
                        <option value="units">Units</option>
                        <option value="boxes">Boxes</option>
                        <option value="cartons">Cartons</option>
                        <option value="pallets">Pallets</option>
                        <option value="rolls">Rolls</option>
                        <option value="bags">Bags</option>
                        <option value="loose">Loose</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Initial Quantity (in {packaging}) <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="0"
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                        required={!isAssetCategory}
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <Building2 className="h-3 w-3 text-primary" />
                        Target Branch <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={initialBranch}
                        onChange={(e) => setInitialBranch(e.target.value)}
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500 font-medium cursor-pointer"
                      >
                        {BRANCHES.map((b: string) => (
                          <option key={b} value={b}>
                            🏢 {b} Branch
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Weight & Dimensions */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Weight (kg) <span className="text-[9px] text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0.0"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Dimensions (L x B x H) <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        placeholder="L"
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-2 text-center text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      />
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => setWidth(e.target.value)}
                        placeholder="B"
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-2 text-center text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      />
                      <input
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="H"
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-2 text-center text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
                  <Link href="/products" className="w-full sm:w-auto">
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
                    className="group w-full gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/40 sm:w-auto h-9 text-sm disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    {isSubmitting ? 'Creating...' : 'Create Product'}
                    <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Help Tip */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/70">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/20 text-[9px]">
            i
          </span>
          <span>
            All fields marked with <span className="text-destructive">*</span> are required
          </span>
        </div>
      </div>

      {/* Confirmation Modal for Product Creation */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeAddProduct}
        title="Confirm Create Product"
        description="Are you sure you want to add this product to the global inventory catalog?"
        variant="primary"
        confirmText="Create Product"
        confirmLoadingText="Creating..."
        icon={<Package className="h-5 w-5" />}
        itemName={
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Product Name:</span>
              <span className="font-bold text-foreground">{name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-semibold text-foreground">{category}</span>
            </div>
            {sku && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">SKU / Model:</span>
                <span className="font-mono text-foreground font-semibold">{sku}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Initial Stock ({initialBranch}):</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{stock || 0} {uom}</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
