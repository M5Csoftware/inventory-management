"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowDownRight,
  Package,
  FileText,
  Plus,
  Save,
  AlertCircle,
  User,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Product } from "@/context/inventory-context";

export default function StockOutPage() {
  const { products, categories, recordTransaction, updateProduct, activeBranch } =
    useInventory();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("mode") === "edit";

  // Form states
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Customer Order / Sale");
  const [handedTo, setHandedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

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
  const filteredNonAssetProducts = nonAssetProducts.filter((prod) =>
    prod.name.toLowerCase().includes(productSearchTerm.toLowerCase()),
  );

  const selectedProduct = nonAssetProducts.find((p) => p.id === productId);

  const getStockLabel = (prod: Product) => {
    if (!prod || !prod.stock) return 0;
    if (typeof prod.stock === "number") return prod.stock;
    if (activeBranch === "All") {
      return Object.values(prod.stock || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    }
    return prod.stock?.[activeBranch] || 0;
  };

  const requestedProductId = searchParams.get("productId");

  // Default selection when products load
  useEffect(() => {
    if (requestedProductId) {
      const targetProduct = nonAssetProducts.find((p) => p.id === requestedProductId);
      if (targetProduct) {
        setProductId(targetProduct.id);
        if (isEditMode && !quantity) {
          setQuantity(String(getStockLabel(targetProduct)));
        }
      }
      return;
    }

    if (nonAssetProducts.length > 0 && !productId) {
      setProductId(nonAssetProducts[0].id);
    }
  }, [requestedProductId, nonAssetProducts, productId, isEditMode, quantity]);

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
    setProductSearchOpen(false);
    setProductSearchTerm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !productId || !quantity || !reason) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
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

      const finalNotes = handedTo ? `Handed to: ${handedTo}\n${notes}` : notes;

      const success = await recordTransaction(
        productId,
        "Stock Out",
        parseInt(quantity),
        reason,
        finalNotes || undefined,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-full space-y-4">
        {/* Header Section - Compact */}
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
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Stock Out (Dispatch Stock)
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <ArrowDownRight className="h-3 w-3 text-blue-500" />
                Record outward stock movement, sales, or product wastage
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Outgoing</span>
          </div>
        </div>

        {nonAssetProducts.length === 0 ? (
          <Card className="border border-border/50 bg-background/60 backdrop-blur-sm p-8 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground">
              You must have at least one consumable product (non-asset) created
              before recording stock out transactions.
            </p>
            <Link href="/products/new">
              <Button size="sm">Create Product</Button>
            </Link>
          </Card>
        ) : (
          /* Main Form Card - Compact */
          <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-blue-500" />
                    Stock Out Details
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Select product, specify outgoing quantity, and reasons for
                    dispatch
                  </CardDescription>
                </div>
                <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-medium text-blue-600">
                  Dispatch
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Select Product */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Package className="h-3 w-3" />
                    Select Product <span className="text-destructive">*</span>
                  </label>

                  {/* Searchable Select Product dropdown */}
                  <div className="relative" ref={productDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setProductSearchOpen((prev) => !prev)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500 flex items-center justify-between text-left"
                    >
                      <span className="truncate">
                        {selectedProduct
                          ? `${selectedProduct.name} (Current: ${getStockLabel(selectedProduct)} units)`
                          : "Select a product"}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1" />
                    </button>

                    {productSearchOpen && (
                      <div className="absolute z-20 mt-1.5 w-full rounded-lg border-2 border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-900 overflow-hidden">
                        <div className="flex items-center gap-2 border-b border-border/50 px-2.5 py-2">
                          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <input
                            autoFocus
                            type="text"
                            value={productSearchTerm}
                            onChange={(e) =>
                              setProductSearchTerm(e.target.value)
                            }
                            placeholder="Search product name..."
                            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                          />
                        </div>
                        <div className="max-h-56 overflow-y-auto py-1">
                          {filteredNonAssetProducts.length === 0 ? (
                            <p className="px-3 py-2 text-sm text-muted-foreground">
                              No products found.
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
                                    {prod.name} (Current: {getStockLabel(prod)}{" "}
                                    units)
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

                {/* Dispatched Quantity, Reason, & Handed To */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Dispatched Quantity{" "}
                      <span className="text-destructive">*</span>
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
                      <AlertCircle className="h-3 w-3" />
                      Reason / Destination{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    >
                      <option value="Customer Order / Sale">
                        🛒 Customer Order / Sale
                      </option>
                      <option value="Damage / Scrap / Waste">
                        🗑️ Damage / Scrap / Waste
                      </option>
                      <option value="Return to Supplier">
                        🔄 Return to Supplier
                      </option>
                      <option value="Internal Usage">🏢 Internal Usage</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <User className="h-3 w-3" />
                      Handed To
                    </label>
                    <input
                      type="text"
                      value={handedTo}
                      onChange={(e) => setHandedTo(e.target.value)}
                      placeholder="Name of person receiving"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Notes / Order Reference
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Customer Invoice #INV-0043, shipped via Local courier."
                    className="w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 resize-y dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  />
                </div>

                {/* Action Buttons - Compact */}
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
                    className="group w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-blue-500/40 sm:w-auto h-9 text-sm disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    {isSubmitting ? (isEditMode ? "Saving..." : "Recording...") : isEditMode ? "Update Stock" : "Record Stock Out"}
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
            All fields marked with <span className="text-destructive">*</span>{" "}
            are required
          </span>
        </div>
      </div>
    </div>
  );
}
