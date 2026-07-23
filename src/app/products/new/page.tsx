'use client';

import { useState, useEffect } from 'react';
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
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Category, Supplier } from '@/context/inventory-context';

export default function NewProductPage() {
  const { addProduct, categories, suppliers, activeBranch } = useInventory();
  const router = useRouter();

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [threshold, setThreshold] = useState('10');
  const [status, setStatus] = useState('active');
  const [uomValue, setUomValue] = useState('1');
  const [uom, setUom] = useState('pcs');
  const [packaging, setPackaging] = useState('boxes');

  // Set default selection values once categories/suppliers load
  useEffect(() => {
    if (categories.length > 0 && !category) {
      setCategory(categories[0].name);
    }
  }, [categories, category]);

  useEffect(() => {
    if (suppliers.length > 0 && !supplier) {
      setSupplier(suppliers[0].name);
    }
  }, [suppliers, supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !stock || !category || !supplier) return;

    const targetBranch = activeBranch === 'All' ? 'Delhi' : activeBranch;
    const initialStockMap = {
      Ahmedabad: targetBranch === 'Ahmedabad' ? parseInt(stock || '0') : 0,
      Ludhiana: targetBranch === 'Ludhiana' ? parseInt(stock || '0') : 0,
      Delhi: targetBranch === 'Delhi' ? parseInt(stock || '0') : 0,
      Mumbai: targetBranch === 'Mumbai' ? parseInt(stock || '0') : 0,
    };

    await addProduct({
      name,
      category,
      price: parseFloat(price),
      stock: initialStockMap,
      threshold: parseInt(threshold || '10'),
      supplier,
      sku: sku || undefined,
      description: description || undefined,
      status,
      uomValue: parseFloat(uomValue) || 1,
      uom,
      packaging,
    });

    router.push('/products');
  };

  const hasDependencies = categories.length > 0 && suppliers.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-full space-y-4">
        {/* Header Section - Compact */}
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

        {!hasDependencies ? (
          <Card className="border border-warning bg-warning/5 p-6 rounded-xl text-center space-y-4 max-w-lg mx-auto">
            <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Prerequisites Required</h3>
              <p className="text-sm text-muted-foreground">
                Before adding a product, you must have at least one **Category** and one **Supplier** created.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              {categories.length === 0 && (
                <Link href="/categories/new">
                  <Button size="sm">Create Category</Button>
                </Link>
              )}
              {suppliers.length === 0 && (
                <Link href="/suppliers/new">
                  <Button size="sm" variant="outline">Create Supplier</Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          /* Main Form Card - Compact */
          <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Product Details
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Enter product specification, pricing, and initial stock values
                  </CardDescription>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                  Required *
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Name & SKU - Compact */}
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
                      SKU / Barcode <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. FURN-DSK-02"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 font-mono text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      required
                    />
                  </div>
                </div>

                {/* Category & Supplier - Compact */}
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
                      Primary Supplier <span className="text-destructive">*</span>
                    </label>
                    <select 
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    >
                      {suppliers.map((sup: Supplier) => (
                        <option key={sup.name} value={sup.name}>{sup.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Description - Compact */}
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

                {/* Pricing & Stock - Compact */}
                <div className="rounded-lg bg-muted/30 p-3 sm:p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <IndianRupee className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">
                      Pricing & Inventory
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Unit Price (₹) <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="0.00"
                          className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 pl-7 pr-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <AlertCircle className="h-3 w-3" />
                        Min Stock Alert
                      </label>
                      <input
                        type="number"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                        placeholder="10"
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground">
                        Status
                      </label>
                      <select 
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      >
                        <option value="active">🟢 Active</option>
                        <option value="draft">⚪ Draft</option>
                        <option value="inactive">🔴 Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Packaging & Stock Info - Compact */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Base Measurement
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={uomValue}
                        onChange={(e) => setUomValue(e.target.value)}
                        placeholder="1"
                        className="h-9 w-24 rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-center text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
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
                      onChange={(e) => setPackaging(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    >
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
                      required
                    />
                  </div>
                </div>

                {/* Action Buttons - Compact */}
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
                    className="group w-full gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/40 sm:w-auto h-9 text-sm"
                  >
                    <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    Create Product
                    <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Help Tip - Compact */}
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
