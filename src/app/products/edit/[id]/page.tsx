/* src/app/products/edit/[id]/page.tsx */
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from "next/link";
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Box,
  Save,
  Package,
  Tag,
  IndianRupee,
  Layers,
  AlertCircle,
  Truck,
  Plus,
  Building2,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Category, Supplier, Product, ProductSupplierEntry, BRANCHES } from '@/context/inventory-context';

interface SupplierRow {
  supplierName: string;
  rate: string;
  isCustom?: boolean;
  customName?: string;
}

export default function EditProductPage() {
  const { products, updateProduct, categories, suppliers, activeBranch } = useInventory();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const product = products.find((p: Product) => p.id === id);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(() =>
    activeBranch === 'All' ? 'Ahmedabad' : activeBranch,
  );

  useEffect(() => {
    if (activeBranch !== 'All') {
      setSelectedBranch(activeBranch);
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
  const submittingRef = useRef(false);

  // Multi-supplier list state
  const [productSuppliers, setProductSuppliers] = useState<SupplierRow[]>([
    { supplierName: '', rate: '', isCustom: false, customName: '' }
  ]);

  // Populate form with existing product details
  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku || '');
      setCategory(product.category);
      setDescription(product.description || '');

      const targetBranchToUse = activeBranch === 'All' ? selectedBranch : activeBranch;
      const currentStock = typeof product.stock === 'number' 
        ? product.stock 
        : (product.stock?.[targetBranchToUse] || 0);
      setStock(currentStock.toString());
      setThreshold(product.threshold ? product.threshold.toString() : '10');
      setUomValue(product.uomValue ? product.uomValue.toString() : '1');
      setUom(product.uom || 'pcs');
      setPackaging(product.packaging || 'boxes');
      setWeight(product.weight?.toString() || '');

      if (product.dimensions) {
        const parts = product.dimensions.split(' x ');
        if (parts.length === 3) {
          setLength(parts[0]);
          setWidth(parts[1]);
          setHeight(parts[2]);
        }
      }

      // Populate supplier list
      if (product.suppliersList && product.suppliersList.length > 0) {
        setProductSuppliers(
          product.suppliersList.map((s: ProductSupplierEntry) => {
            const isKnown = suppliers.some((sup) => sup.name === s.supplierName);
            return {
              supplierName: isKnown ? s.supplierName : '',
              rate: s.rate !== undefined ? s.rate.toString() : (product.price ? product.price.toString() : '0'),
              isCustom: !isKnown,
              customName: isKnown ? '' : s.supplierName,
            };
          })
        );
      } else if (product.supplier) {
        const isKnown = suppliers.some((sup) => sup.name === product.supplier);
        setProductSuppliers([
          {
            supplierName: isKnown ? product.supplier : '',
            rate: product.price ? product.price.toString() : '0',
            isCustom: !isKnown,
            customName: isKnown ? '' : product.supplier,
          }
        ]);
      }
    }
  }, [product, activeBranch, selectedBranch, suppliers]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !product || !name || !stock || !category) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const dimensionStr = (length || width || height) 
        ? `${length || 0}x${width || 0}x${height || 0}` 
        : undefined;

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

      const primarySupplierName = validSuppliers.length > 0 ? validSuppliers[0].supplierName : (product.supplier || 'N/A');
      const derivedPrice = validSuppliers.length > 0 ? validSuppliers[0].rate : product.price;

      const existingStockMap =
        typeof product.stock === "object" && product.stock !== null
          ? product.stock
          : { Ahmedabad: 0, Ludhiana: 0, Delhi: typeof product.stock === "number" ? product.stock : 0, Mumbai: 0 };

      const targetBranchToUse = activeBranch === "All" ? selectedBranch : activeBranch;

      const updatedStockMap = {
        Ahmedabad: existingStockMap.Ahmedabad || 0,
        Ludhiana: existingStockMap.Ludhiana || 0,
        Delhi: existingStockMap.Delhi || 0,
        Mumbai: existingStockMap.Mumbai || 0,
        [targetBranchToUse]: parseInt(stock || "0"),
      };

      await updateProduct(product.id, {
        name,
        category,
        price: derivedPrice,
        stock: updatedStockMap,
        threshold: parseInt(threshold || '10'),
        supplier: primarySupplierName,
        suppliersList: validSuppliers,
        sku: sku || undefined,
        description: description || undefined,
        uomValue: parseFloat(uomValue) || 1,
        uom,
        packaging,
        weight: weight ? parseFloat(weight) : undefined,
        dimensions: dimensionStr
      });

      router.push('/products');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen p-6 sm:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full border-border/50 text-center p-6 space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Product Not Found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              The product with ID "{id}" could not be found or does not exist.
            </p>
          </div>
          <Link href="/products" className="block pt-2">
            <Button className="w-full">Back to Products</Button>
          </Link>
        </Card>
      </div>
    );
  }

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
                Edit Product
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Box className="h-3 w-3" />
                Modify details of product: {product.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>Editing</span>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Product Specifications
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Adjust product configuration, suppliers, and stock values.
                </CardDescription>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                Required *
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  >
                    {categories.map((cat: Category) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
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

                {/* Suppliers & Rates Section */}
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

                {/* Packaging & Stock Info */}
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
                      Current Quantity (in {packaging}) <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Building2 className="h-3 w-3 text-primary" />
                      Target Branch <span className="text-destructive">*</span>
                    </label>
                    {activeBranch === "All" ? (
                      <select
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500 font-medium cursor-pointer"
                      >
                        {BRANCHES.map((b: string) => (
                          <option key={b} value={b}>
                            🏢 {b} Branch
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="h-9 w-full rounded-lg border-2 border-gray-200 bg-muted/40 px-3 text-sm flex items-center font-semibold text-foreground">
                        🏢 {activeBranch} Branch
                      </div>
                    )}
                  </div>
                </div>

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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
    </div>
  );
}
