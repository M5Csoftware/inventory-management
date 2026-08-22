"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IndianRupee,
  Search,
  Filter,
  Edit2,
  Users,
  Package,
  ArrowUpDown,
  Download,
  Building,
  TrendingDown,
  Sparkles,
  LayoutGrid,
  ListFilter,
  X,
  Save,
  Tag,
  Boxes,
  Check,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Product, ProductSupplierEntry } from "@/context/inventory-context";
import { toast } from "react-toastify";

interface RateItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  category: string;
  supplierName: string;
  rate: number;
  isPrimary: boolean;
  uom?: string;
  uomValue?: number;
  packaging?: string;
  totalStock: number;
}

export default function SupplierRatesPage() {
  const pathname = usePathname();
  const { products, suppliers, updateProduct, activeBranch } = useInventory();

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"rate-asc" | "rate-desc" | "name-asc" | "supplier-asc">("name-asc");
  const [viewMode, setViewMode] = useState<"table" | "byProduct" | "bySupplier">("table");

  // Quick Edit Modal State
  const [editingRateItem, setEditingRateItem] = useState<RateItem | null>(null);
  const [newRateValue, setNewRateValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  // Extract all categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Flatten products into Rate items
  const rateItems = useMemo(() => {
    return products.flatMap((product: Product, pIdx: number) => {
      const totalStock = activeBranch === 'All'
        ? Object.values(product.stock || {}).reduce((a, b) => a + b, 0)
        : product.stock?.[activeBranch] || 0;

      const items: RateItem[] = [];

      if (product.suppliersList && product.suppliersList.length > 0) {
        product.suppliersList.forEach((sEntry: ProductSupplierEntry, idx: number) => {
          items.push({
            id: `${product.id}-${sEntry.supplierName}-${pIdx}-${idx}`,
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            category: product.category,
            supplierName: sEntry.supplierName,
            rate: sEntry.rate,
            isPrimary:
              sEntry.supplierName.toLowerCase() === (product.supplier || "").toLowerCase() ||
              idx === 0,
            uom: product.uom,
            uomValue: product.uomValue,
            packaging: product.packaging,
            totalStock,
          });
        });
      } else if (product.supplier) {
        items.push({
          id: `${product.id}-${product.supplier}-${pIdx}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          category: product.category,
          supplierName: product.supplier,
          rate: product.price || 0,
          isPrimary: true,
          uom: product.uom,
          uomValue: product.uomValue,
          packaging: product.packaging,
          totalStock,
        });
      }

      return items;
    });
  }, [products, activeBranch]);

  // Minimum rate map per product for "Best Rate" badge
  const minRateMap = useMemo(() => {
    const map: Record<string, number> = {};
    rateItems.forEach((item) => {
      if (!(item.productId in map) || item.rate < map[item.productId]) {
        map[item.productId] = item.rate;
      }
    });
    return map;
  }, [rateItems]);

  // Count of suppliers offering each product
  const productSupplierCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    rateItems.forEach((item) => {
      map[item.productId] = (map[item.productId] || 0) + 1;
    });
    return map;
  }, [rateItems]);

  // Analytics Metrics
  const metrics = useMemo(() => {
    const totalRecords = rateItems.length;
    const uniqueSuppliers = new Set(rateItems.map((r) => r.supplierName)).size;
    const avgRate = totalRecords > 0 ? rateItems.reduce((acc, r) => acc + r.rate, 0) / totalRecords : 0;
    const multiVendorProducts = Object.values(productSupplierCountMap).filter((c) => c > 1).length;

    return {
      totalRecords,
      uniqueSuppliers,
      avgRate,
      multiVendorProducts,
    };
  }, [rateItems, productSupplierCountMap]);

  // Filter & Sort Rate Items
  const filteredRates = useMemo(() => {
    let result = rateItems.filter((rateItem) => {
      const matchesSupplier =
        selectedSupplierFilter === "ALL" ||
        rateItem.supplierName.toLowerCase() === selectedSupplierFilter.toLowerCase();

      const matchesCategory =
        selectedCategoryFilter === "ALL" ||
        rateItem.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        searchLower === "" ||
        rateItem.supplierName.toLowerCase().includes(searchLower) ||
        rateItem.productName.toLowerCase().includes(searchLower) ||
        rateItem.category.toLowerCase().includes(searchLower) ||
        (rateItem.sku && rateItem.sku.toLowerCase().includes(searchLower));

      return matchesSupplier && matchesCategory && matchesSearch;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "rate-asc") return a.rate - b.rate;
      if (sortBy === "rate-desc") return b.rate - a.rate;
      if (sortBy === "supplier-asc") return a.supplierName.localeCompare(b.supplierName);
      return a.productName.localeCompare(b.productName);
    });

    return result;
  }, [rateItems, selectedSupplierFilter, selectedCategoryFilter, searchTerm, sortBy]);

  // Grouped by Product for View Mode "byProduct"
  const ratesByProduct = useMemo(() => {
    const map: Record<string, RateItem[]> = {};
    filteredRates.forEach((item) => {
      if (!map[item.productId]) map[item.productId] = [];
      map[item.productId].push(item);
    });
    return Object.entries(map).map(([productId, items]) => ({
      productId,
      productName: items[0].productName,
      sku: items[0].sku,
      category: items[0].category,
      totalStock: items[0].totalStock,
      items: items.sort((a, b) => a.rate - b.rate), // lowest first
    }));
  }, [filteredRates]);

  // Grouped by Supplier for View Mode "bySupplier"
  const ratesBySupplier = useMemo(() => {
    const map: Record<string, RateItem[]> = {};
    filteredRates.forEach((item) => {
      if (!map[item.supplierName]) map[item.supplierName] = [];
      map[item.supplierName].push(item);
    });
    return Object.entries(map).map(([supplierName, items]) => ({
      supplierName,
      items,
    }));
  }, [filteredRates]);

  // Quick Edit Handlers
  const handleOpenEdit = (item: RateItem) => {
    setEditingRateItem(item);
    setNewRateValue(item.rate.toString());
  };

  const handleSaveRate = async () => {
    if (savingRef.current || isSaving || !editingRateItem) return;
    const parsedRate = parseFloat(newRateValue);
    if (isNaN(parsedRate) || parsedRate < 0) {
      toast.error("Please enter a valid rate amount.");
      return;
    }

    savingRef.current = true;
    setIsSaving(true);
    try {
      const targetProduct = products.find((p) => p.id === editingRateItem.productId);
      if (!targetProduct) {
        toast.error("Product not found.");
        return;
      }

      let updatedSuppliersList: ProductSupplierEntry[] = [];
      if (targetProduct.suppliersList && targetProduct.suppliersList.length > 0) {
        let found = false;
        updatedSuppliersList = targetProduct.suppliersList.map((sEntry) => {
          if (sEntry.supplierName.toLowerCase() === editingRateItem.supplierName.toLowerCase()) {
            found = true;
            return { ...sEntry, rate: parsedRate };
          }
          return sEntry;
        });

        if (!found) {
          updatedSuppliersList.push({
            supplierName: editingRateItem.supplierName,
            rate: parsedRate,
          });
        }
      } else {
        updatedSuppliersList = [
          { supplierName: editingRateItem.supplierName, rate: parsedRate },
        ];
      }

      const updates: Partial<Product> = {
        suppliersList: updatedSuppliersList,
      };

      // If updating the primary supplier rate, also update main price
      if (
        targetProduct.supplier &&
        targetProduct.supplier.toLowerCase() === editingRateItem.supplierName.toLowerCase()
      ) {
        updates.price = parsedRate;
      }

      await updateProduct(targetProduct.id, updates);
      toast.success(`Updated rate for ${editingRateItem.supplierName} to ₹${parsedRate.toLocaleString("en-IN")}`);
      setEditingRateItem(null);
    } catch (err) {
      toast.error("Failed to update supplier rate.");
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredRates.length === 0) {
      toast.error("No rates available to export.");
      return;
    }

    const headers = ["Supplier", "Product ID", "Product Name", "SKU", "Category", "Contracted Rate (INR)", "UOM", "Packaging", "Status"];
    const rows = filteredRates.map((r) => [
      `"${r.supplierName}"`,
      `"${r.productId}"`,
      `"${r.productName}"`,
      `"${r.sku || ""}"`,
      `"${r.category}"`,
      r.rate,
      `"${r.uomValue ? `${r.uomValue} ` : ""}${r.uom || "pcs"}"`,
      `"${r.packaging || "box"}"`,
      `"${r.isPrimary ? "Primary Rate" : "Alternate Rate"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Supplier_Rates_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 max-w-full">
      {/* BROWSER-STYLE TAB SYSTEM */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-2 pt-2 rounded-t-xl overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-1">
          <Link
            href="/suppliers"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg border-t border-x transition-all ${
              pathname === "/suppliers"
                ? "bg-background text-primary border-border/60 border-b-2 border-b-primary shadow-sm -mb-px font-bold"
                : "text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground"
            }`}
          >
            <Building className="h-4 w-4 text-primary shrink-0" />
            <span>Suppliers Directory</span>
          </Link>

          <Link
            href="/suppliers/rates"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg border-t border-x transition-all ${
              pathname === "/suppliers/rates"
                ? "bg-background text-emerald-600 dark:text-emerald-400 border-border/60 border-b-2 border-b-emerald-500 shadow-sm -mb-px font-bold"
                : "text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground"
            }`}
          >
            <IndianRupee className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Supplier Rates</span>
          </Link>

          <Link
            href="/suppliers/products"
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-lg border-t border-x transition-all ${
              pathname === "/suppliers/products"
                ? "bg-background text-blue-600 dark:text-blue-400 border-border/60 border-b-2 border-b-blue-500 shadow-sm -mb-px font-bold"
                : "text-muted-foreground border-transparent hover:bg-background/50 hover:text-foreground"
            }`}
          >
            <Package className="h-4 w-4 text-blue-500 shrink-0" />
            <span>Supplier Products</span>
          </Link>
        </div>

        <div className="hidden sm:flex items-center gap-2 pb-1.5 pr-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-border/60">
            <Download className="h-3.5 w-3.5 text-emerald-600" /> Export CSV
          </Button>
          <Link href="/suppliers/new">
            <Button size="sm" className="gap-1.5 h-8 text-xs shadow-sm">
              <Plus className="h-3.5 w-3.5" /> Add Supplier
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Toolbar */}
      <Card className="border-border/50 bg-background/60 backdrop-blur-sm p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-foreground">Supplier Contract Pricing Matrix</h2>
              <p className="text-xs text-muted-foreground">Contracted vendor rates, UOM, packaging, and rate comparison.</p>
            </div>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Supplier Filter */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/40">
              <Filter className="h-3.5 w-3.5 text-muted-foreground ml-1.5 shrink-0" />
              <select
                value={selectedSupplierFilter}
                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                className="h-8 bg-transparent text-xs font-medium outline-none cursor-pointer pr-2"
              >
                <option value="ALL">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/40">
              <Boxes className="h-3.5 w-3.5 text-muted-foreground ml-1.5 shrink-0" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="h-8 bg-transparent text-xs font-medium outline-none cursor-pointer pr-2"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/40">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground ml-1.5 shrink-0" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-8 bg-transparent text-xs font-medium outline-none cursor-pointer pr-2"
              >
                <option value="name-asc">Product Name (A-Z)</option>
                <option value="supplier-asc">Supplier Name (A-Z)</option>
                <option value="rate-asc">Rate: Low to High</option>
                <option value="rate-desc">Rate: High to Low</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/40 shrink-0">
              <button
                onClick={() => setViewMode("table")}
                title="Table Matrix View"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" /> Table
              </button>
              <button
                onClick={() => setViewMode("byProduct")}
                title="Grouped by Product View"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === "byProduct"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> By Product
              </button>
              <button
                onClick={() => setViewMode("bySupplier")}
                title="Grouped by Supplier View"
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === "bySupplier"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building className="h-3.5 w-3.5" /> By Supplier
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* VIEW 1: TABLE MATRIX VIEW */}
      {viewMode === "table" && (
        <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-emerald-500" />
                  Vendor Rates Matrix ({filteredRates.length} Rate Entries)
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing all active contracted supplier prices with rate badges and comparisons.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="relative w-full overflow-x-auto rounded-md">
              {filteredRates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No rate cards match your search criteria or selected filters.
                </p>
              ) : (
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Supplier</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Contracted Rate (₹)</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">UOM / Packaging</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Rate Status</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRates.map((rateItem, idx) => {
                      const isBestPrice = minRateMap[rateItem.productId] === rateItem.rate;
                      const hasMultipleSuppliers = (productSupplierCountMap[rateItem.productId] || 0) > 1;

                      return (
                        <tr key={`rate-row-${rateItem.id}-${idx}`} className="border-b transition-colors hover:bg-muted/30">
                          <td className="p-4 align-middle font-semibold text-foreground">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-primary/70 shrink-0" />
                              <span>{rateItem.supplierName}</span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="font-medium text-foreground">{rateItem.productName}</div>
                            {rateItem.sku && (
                              <div className="text-xs font-mono text-muted-foreground">SKU: {rateItem.sku}</div>
                            )}
                          </td>
                          <td className="p-4 align-middle text-muted-foreground">
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                              {rateItem.category}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-base">
                                ₹{rateItem.rate.toLocaleString("en-IN")}
                              </span>
                              {hasMultipleSuppliers && isBestPrice && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <TrendingDown className="h-3 w-3" /> Best Rate
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 align-middle text-xs text-muted-foreground">
                            {rateItem.uomValue ? `${rateItem.uomValue} ` : ""}
                            {rateItem.uom || "pcs"} / {rateItem.packaging || "box"}
                          </td>
                          <td className="p-4 align-middle">
                            {rateItem.isPrimary ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                <Check className="h-3 w-3" /> Primary Rate
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                Alternate Supplier
                              </span>
                            )}
                          </td>
                          <td className="p-4 align-middle text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleOpenEdit(rateItem)}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary transition-all"
                              >
                                <Edit2 className="h-3.5 w-3.5" /> Quick Edit
                              </Button>
                              <Link href={`/products/edit/${rateItem.productId}`}>
                                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                                  Full Edit
                                </Button>
                              </Link>
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
      )}

      {/* VIEW 2: GROUPED BY PRODUCT VIEW */}
      {viewMode === "byProduct" && (
        <div className="space-y-4">
          {ratesByProduct.length === 0 ? (
            <Card className="p-8 text-center bg-background/60">
              <p className="text-sm text-muted-foreground">No rate items match your search or filter.</p>
            </Card>
          ) : (
            ratesByProduct.map((group, groupIdx) => {
              const lowestRate = group.items[0]?.rate;

              return (
                <Card key={`group-prod-${group.productId}-${groupIdx}`} className="border-border/50 bg-background/60 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="bg-muted/20 border-b border-border/40 pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-bold">{group.productName}</CardTitle>
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-mono">
                            {group.sku || group.productId}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Category: <span className="font-medium text-foreground">{group.category}</span> | Current Stock: {group.totalStock} units
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-medium">
                          {group.items.length} Vendor Rate{group.items.length > 1 ? "s" : ""}
                        </span>
                        {group.items.length > 1 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                            Lowest: ₹{lowestRate.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-border/40">
                    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {group.items.map((r, itemIdx) => {
                        const isBest = r.rate === lowestRate && group.items.length > 1;

                        return (
                          <div
                            key={`prod-item-${r.id}-${itemIdx}`}
                            className={`rounded-xl border p-3.5 transition-all space-y-2 relative ${
                              isBest
                                ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
                                : "border-border/60 bg-card/40 hover:border-primary/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                                  <Building className="h-3.5 w-3.5 text-primary" />
                                  {r.supplierName}
                                </h4>
                                <span className="text-[10px] text-muted-foreground">
                                  {r.isPrimary ? "Primary Vendor" : "Alternate Vendor"}
                                </span>
                              </div>
                              {isBest && (
                                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  Best Value
                                </span>
                              )}
                            </div>

                            <div className="flex items-baseline justify-between border-t border-border/40 pt-2">
                              <span className="text-xs text-muted-foreground">Contracted Price:</span>
                              <span className="font-mono text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                ₹{r.rate.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-1 text-[11px] text-muted-foreground">
                              <span>Packaging: {r.uom || "pcs"} / {r.packaging || "box"}</span>
                              <Button
                                onClick={() => handleOpenEdit(r)}
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-primary hover:bg-primary/10"
                              >
                                <Edit2 className="h-3 w-3 mr-1" /> Edit
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 3: GROUPED BY SUPPLIER VIEW */}
      {viewMode === "bySupplier" && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ratesBySupplier.length === 0 ? (
            <Card className="col-span-full p-8 text-center bg-background/60">
              <p className="text-sm text-muted-foreground">No rate items match your search or filter.</p>
            </Card>
          ) : (
            ratesBySupplier.map((group, groupIdx) => (
              <Card key={`group-sup-${group.supplierName}-${groupIdx}`} className="border-border/50 bg-background/60 backdrop-blur-sm flex flex-col justify-between">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{group.supplierName}</CardTitle>
                      <CardDescription className="text-xs">
                        {group.items.length} Contracted Product Rate{group.items.length > 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3 flex-1">
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {group.items.map((r, itemIdx) => (
                      <div key={`sup-item-${r.id}-${itemIdx}`} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors text-xs">
                        <div>
                          <div className="font-medium text-foreground">{r.productName}</div>
                          <div className="text-[10px] text-muted-foreground">{r.category}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{r.rate.toLocaleString("en-IN")}
                          </span>
                          <Button
                            onClick={() => handleOpenEdit(r)}
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* QUICK EDIT RATE MODAL */}
      {editingRateItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-gradient-to-br from-card to-card/90">
            <CardHeader className="border-b border-border/50 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-emerald-500" />
                  Quick Edit Supplier Rate
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Update rate for <strong className="text-foreground">{editingRateItem.supplierName}</strong>
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingRateItem(null)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="rounded-lg bg-muted/40 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-semibold text-foreground">{editingRateItem.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span>{editingRateItem.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor Role:</span>
                  <span>{editingRateItem.isPrimary ? "Primary Vendor" : "Alternate Vendor"}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  New Contracted Rate (₹) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={newRateValue}
                    onChange={(e) => setNewRateValue(e.target.value)}
                    placeholder="Enter rate e.g. 500"
                    className="h-10 w-full rounded-lg border-2 border-primary/40 bg-background pl-8 pr-3 text-base font-mono font-bold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRateItem(null)}
                  className="h-9"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleSaveRate}
                  className="h-9 gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Rate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
