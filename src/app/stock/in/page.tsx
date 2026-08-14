"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Package,
  Warehouse,
  FileText,
  Plus,
  Save,
  Building2,
  Receipt,
  Hash,
  Barcode,
  IndianRupee,
  Tag,
  Search,
  Check,
  ChevronDown,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Product, Supplier, BRANCHES } from "@/context/inventory-context";

export default function StockInPage() {
  const {
    products,
    categories,
    suppliers,
    recordTransaction,
    updateProduct,
    activeBranch,
  } = useInventory();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  // Form states matching Asset Stock In
  const [productId, setProductId] = useState("");
  const [targetBranch, setTargetBranch] = useState(() =>
    activeBranch === "All" ? "Ahmedabad" : activeBranch,
  );
  const [supplier, setSupplier] = useState("");
  const [customSupplier, setCustomSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [location, setLocation] = useState("Warehouse A (Zone 1)");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (activeBranch !== "All") {
      setTargetBranch(activeBranch);
    }
  }, [activeBranch]);

  // Searchable Select Product dropdown states
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Filter out products that belong to an asset category
  const nonAssetProducts = products.filter((prod) => {
    const category = categories.find(
      (c) => c.name.toLowerCase() === prod.category.toLowerCase(),
    );
    return !category?.isAsset;
  });

  // Products filtered by the search term (for the dropdown list)
  const filteredNonAssetProducts = nonAssetProducts.filter(
    (prod) =>
      prod.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      prod.category.toLowerCase().includes(productSearchTerm.toLowerCase()),
  );

  const selectedProduct = nonAssetProducts.find((p) => p.id === productId);

  const getStockLabel = (prod: Product) =>
    activeBranch === "All"
      ? Object.values(prod.stock || {}).reduce((a, b) => a + b, 0)
      : prod.stock?.[activeBranch] || 0;

  const requestedProductId = searchParams.get("productId");

  // Default product selection & price auto-fill
  useEffect(() => {
    if (requestedProductId) {
      const targetProduct = nonAssetProducts.find((p) => p.id === requestedProductId);
      if (targetProduct) {
        setProductId(targetProduct.id);
        if (targetProduct.price) {
          setAmount(targetProduct.price.toString());
        }
        if (isEditMode && !quantity) {
          setQuantity(String(getStockLabel(targetProduct)));
        }
      }
      return;
    }

    if (nonAssetProducts.length > 0 && !productId) {
      setProductId(nonAssetProducts[0].id);
      if (nonAssetProducts[0].price) {
        setAmount(nonAssetProducts[0].price.toString());
      }
    }
  }, [requestedProductId, nonAssetProducts, productId, isEditMode, quantity]);

  // Set default supplier when suppliers load
  useEffect(() => {
    if (suppliers && suppliers.length > 0 && !supplier) {
      setSupplier(suppliers[0].name);
    }
  }, [suppliers, supplier]);

  // Close the product search dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(e.target as Node)
      ) {
        setProductSearchOpen(false);
        setProductSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProductChange = (id: string) => {
    setProductId(id);
    const selectedProd = nonAssetProducts.find((p) => p.id === id);
    if (selectedProd && selectedProd.price) {
      setAmount(selectedProd.price.toString());
    }
    setProductSearchOpen(false);
    setProductSearchTerm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !productId || !quantity || !location) return;

    const finalSupplier =
      supplier === "CUSTOM_SUPPLIER" ? customSupplier : supplier;

    if (isEditMode && selectedProduct) {
      const targetBranch = activeBranch === "All" ? "Ahmedabad" : activeBranch;
      const existingStockMap =
        typeof selectedProduct.stock === "object" && selectedProduct.stock !== null
          ? selectedProduct.stock
          : { Ahmedabad: 0, Ludhiana: 0, Delhi: typeof selectedProduct.stock === "number" ? selectedProduct.stock : 0, Mumbai: 0 };

      const updatedStockMap = {
        ...existingStockMap,
        [targetBranch]: parseInt(quantity || "0"),
      };

      await updateProduct(selectedProduct.id, {
        stock: updatedStockMap,
      });
      router.push("/stock");
      return;
    }

    // Create notes with all the details including purchase date
    const summaryParts = [
      purchaseDate ? `Purchase Date: ${purchaseDate}` : "",
      invoiceNumber ? `Invoice: ${invoiceNumber}` : "",
      finalSupplier ? `Supplier: ${finalSupplier}` : "",
      model ? `Model: ${model}` : "",
      serialNumber ? `S/N: ${serialNumber}` : "",
      amount ? `Price: ₹${amount}` : "",
      notes ? `Notes: ${notes}` : "",
    ].filter(Boolean);

    const fullNotes =
      summaryParts.length > 0 ? summaryParts.join(" | ") : undefined;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const success = await recordTransaction(
        productId,
        "Stock In",
        parseInt(quantity),
        location,
        fullNotes,
        {
          purchaseDate: purchaseDate,
          amount: amount ? parseFloat(amount) : undefined,
          supplier: finalSupplier,
          invoiceNumber: invoiceNumber,
          model: model,
          serialNumber: serialNumber,
          branch: targetBranch,
        },
      );

      if (success) {
        router.push("/stock");
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
            <Link href="/stock">
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
                <Package className="h-6 w-6 text-emerald-500" />
                Stock In (Receive Shipment)
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                Record incoming catalog inventory with supplier, invoice, model,
                and serial tracking
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Incoming Stock</span>
          </div>
        </div>

        {nonAssetProducts.length === 0 ? (
          <Card className="border border-border/50 bg-background/60 backdrop-blur-sm p-8 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground">
              You must have at least one non-asset product created before
              recording stock in transactions.
            </p>
            <Link href="/products/new">
              <Button size="sm">Create Product</Button>
            </Link>
          </Card>
        ) : (
          /* Main Form Card */
          <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative z-20 overflow-visible">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                    Stock Intake Details
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Select product name, supplier, invoice, quantity, model,
                    serial numbers, and location
                  </CardDescription>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600">
                  New Shipment
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4 overflow-visible">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 1. Item Name & Supplier */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5 relative z-30">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Package className="h-3 w-3" />
                      Item Name <span className="text-destructive">*</span>
                    </label>

                    {/* Searchable Item Name dropdown */}
                    <div className="relative" ref={productDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setProductSearchOpen((prev) => !prev)}
                        className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500 flex items-center justify-between text-left"
                      >
                        <span className="truncate">
                          {selectedProduct
                            ? `${selectedProduct.name} (${selectedProduct.category}) - Current: ${getStockLabel(selectedProduct)} units`
                            : "Select an item"}
                        </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                      </button>

                      {productSearchOpen && (
                        <div className="absolute z-50 mt-1.5 w-full rounded-lg border-2 border-gray-300 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-900 overflow-hidden">
                          <div className="flex items-center gap-2 border-b border-border/50 px-2.5 py-2">
                            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <input
                              autoFocus
                              type="text"
                              value={productSearchTerm}
                              onChange={(e) =>
                                setProductSearchTerm(e.target.value)
                              }
                              placeholder="Search item name or category..."
                              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                            />
                          </div>
                          <div className="max-h-56 overflow-y-auto py-1">
                            {filteredNonAssetProducts.length === 0 ? (
                              <p className="px-3 py-2 text-sm text-muted-foreground">
                                No items found.
                              </p>
                            ) : (
                              filteredNonAssetProducts.map(
                                (prod: Product, index: number) => (
                                  <button
                                    key={`${prod.id}-${index}`}
                                    type="button"
                                    onClick={() => handleProductChange(prod.id)}
                                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/60 transition-colors"
                                  >
                                    <span className="truncate">
                                      {prod.name} ({prod.category}) - Current:{" "}
                                      {getStockLabel(prod)} units
                                    </span>
                                    {prod.id === productId && (
                                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                    )}
                                  </button>
                                ),
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                      <option value="CUSTOM_SUPPLIER">
                        + Enter Custom Supplier
                      </option>
                    </select>
                    {supplier === "CUSTOM_SUPPLIER" && (
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

                {/* 2. Purchase Date, Invoice Number & Model (Optional) */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      Date <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      required
                    />
                  </div>

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
                      Model{" "}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. Standard Model / Batch X"
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
                      placeholder="e.g. 50"
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
                      placeholder="e.g. 4500"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>
                </div>

                {/* 4. Branch, Serial / Batch Number & Storage Location */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Building2 className="h-3 w-3 text-primary" />
                      Target Branch <span className="text-destructive">*</span>
                    </label>
                    {activeBranch === "All" ? (
                      <select
                        value={targetBranch}
                        onChange={(e) => setTargetBranch(e.target.value)}
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

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Barcode className="h-3 w-3" />
                      Serial / Batch Number
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="e.g. BATCH-80941A"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Warehouse className="h-3 w-3" />
                      Warehouse / Storage Location{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    >
                      <option value="Warehouse A (Zone 1)">
                        🏢 Warehouse A (Zone 1)
                      </option>
                      <option value="Warehouse B (Zone 3)">
                        🏢 Warehouse B (Zone 3)
                      </option>
                      <option value="Warehouse C (Cold Storage)">
                        ❄️ Warehouse C (Cold Storage)
                      </option>
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
                    placeholder="e.g. Received via cargo dispatch with PO reference."
                    className="w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 resize-y dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
                  <Link href="/stock" className="w-full sm:w-auto">
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
                    className="group w-full gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] hover:shadow-emerald-500/40 sm:w-auto h-9 text-sm disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    {isSubmitting ? (isEditMode ? "Saving..." : "Recording...") : isEditMode ? "Update Stock" : "Record Stock In"}
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
            All fields marked with <span className="text-destructive">*</span>{" "}
            are required
          </span>
        </div>
      </div>
    </div>
  );
}
