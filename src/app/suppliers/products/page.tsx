"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building,
  Package,
  Filter,
  Edit2,
  Users,
  IndianRupee,
  Boxes,
  Download,
  LayoutGrid,
  ListFilter,
  Mail,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  Plus,
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
import { useInventory, Product, ProductSupplierEntry } from "@/context/inventory-context";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";
import { toast } from "react-toastify";

interface SupplierProductEntry {
  product: Product;
  rate: number;
  isPrimary: boolean;
}

interface SupplierGroup {
  supplierName: string;
  contact?: string;
  email?: string;
  phone?: string;
  location?: string;
  branch?: string;
  items: SupplierProductEntry[];
  totalProducts: number;
  totalStock: number;
  avgRate: number;
}

export default function SupplierProductsPage() {
  const pathname = usePathname();
  const { suppliers, products, deleteProduct, activeBranch } = useInventory();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Filter State
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"suppliers-grid" | "table">("suppliers-grid");

  // Track expanded supplier cards
  const [expandedSuppliers, setExpandedSuppliers] = useState<Record<string, boolean>>({});

  const toggleSupplierExpand = (name: string) => {
    setExpandedSuppliers((prev) => ({
      ...prev,
      [name]: prev[name] === undefined ? false : !prev[name],
    }));
  };

  // Extract all product categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Group products by Supplier
  const supplierGroups = useMemo(() => {
    const map = new Map<string, SupplierGroup>();

    // 1. Initialize map with existing suppliers directory
    suppliers.forEach((s) => {
      map.set(s.name.toLowerCase(), {
        supplierName: s.name,
        contact: s.contact,
        email: s.email,
        phone: s.phone,
        location: s.location,
        branch: s.branch,
        items: [],
        totalProducts: 0,
        totalStock: 0,
        avgRate: 0,
      });
    });

    // 2. Populate products under each supplier
    products.forEach((p) => {
      if (p.suppliersList && p.suppliersList.length > 0) {
        p.suppliersList.forEach((sEntry: ProductSupplierEntry) => {
          const key = sEntry.supplierName.toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              supplierName: sEntry.supplierName,
              items: [],
              totalProducts: 0,
              totalStock: 0,
              avgRate: 0,
            });
          }

          const group = map.get(key)!;
          const isPrimary = (p.supplier || "").toLowerCase() === key;
          group.items.push({
            product: p,
            rate: sEntry.rate,
            isPrimary,
          });
        });
      } else if (p.supplier) {
        const key = p.supplier.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            supplierName: p.supplier,
            items: [],
            totalProducts: 0,
            totalStock: 0,
            avgRate: 0,
          });
        }

        const group = map.get(key)!;
        group.items.push({
          product: p,
          rate: p.price || 0,
          isPrimary: true,
        });
      }
    });

    // 3. Compute stats for each supplier group
    const groups: SupplierGroup[] = [];
    map.forEach((group) => {
      if (group.items.length > 0 || suppliers.some((s) => s.name.toLowerCase() === group.supplierName.toLowerCase())) {
        const totalStock = group.items.reduce((acc, item) => {
          const stock = activeBranch === 'All'
            ? Object.values(item.product.stock || {}).reduce((x, y) => x + y, 0)
            : item.product.stock?.[activeBranch] || 0;
          return acc + stock;
        }, 0);

        const avgRate = group.items.length > 0
          ? group.items.reduce((acc, item) => acc + item.rate, 0) / group.items.length
          : 0;

        groups.push({
          ...group,
          totalProducts: group.items.length,
          totalStock,
          avgRate,
        });
      }
    });

    return groups;
  }, [suppliers, products, activeBranch]);

  // Filter supplier groups based on selected filters
  const filteredSupplierGroups = useMemo(() => {
    return supplierGroups.filter((group) => {
      const matchesSupplier =
        selectedSupplierFilter === "ALL" ||
        group.supplierName.toLowerCase() === selectedSupplierFilter.toLowerCase();

      const matchingItems = group.items.filter((item) => {
        const matchesCategory =
          selectedCategoryFilter === "ALL" ||
          item.product.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

        return matchesCategory;
      });

      return matchesSupplier && (selectedCategoryFilter === "ALL" || matchingItems.length > 0);
    }).map((group) => {
      const filteredItems = group.items.filter((item) => {
        return (
          selectedCategoryFilter === "ALL" ||
          item.product.category.toLowerCase() === selectedCategoryFilter.toLowerCase()
        );
      });

      return {
        ...group,
        items: filteredItems,
      };
    });
  }, [supplierGroups, selectedSupplierFilter, selectedCategoryFilter]);

  // Flat list of supplier-product pairs for Table View
  const flatSupplierProductList = useMemo(() => {
    const list: Array<{
      supplierName: string;
      contact?: string;
      location?: string;
      product: Product;
      rate: number;
      isPrimary: boolean;
      stock: number;
    }> = [];

    filteredSupplierGroups.forEach((group) => {
      group.items.forEach((item) => {
        const stock = activeBranch === 'All'
          ? Object.values(item.product.stock || {}).reduce((x, y) => x + y, 0)
          : item.product.stock?.[activeBranch] || 0;

        list.push({
          supplierName: group.supplierName,
          contact: group.contact,
          location: group.location,
          product: item.product,
          rate: item.rate,
          isPrimary: item.isPrimary,
          stock,
        });
      });
    });

    return list;
  }, [filteredSupplierGroups, activeBranch]);

  // Export CSV
  const handleExportCSV = () => {
    if (flatSupplierProductList.length === 0) {
      toast.error("No supplier products available to export.");
      return;
    }

    const headers = ["Supplier Name", "Supplier Contact", "Supplier Location", "Product ID", "SKU", "Product Name", "Category", "Supplier Rate (INR)", "Stock Units", "Role"];
    const rows = flatSupplierProductList.map((row) => [
      `"${row.supplierName}"`,
      `"${row.contact || ""}"`,
      `"${row.location || ""}"`,
      `"${row.product.id}"`,
      `"${row.product.sku || ""}"`,
      `"${row.product.name}"`,
      `"${row.product.category}"`,
      row.rate,
      row.stock,
      `"${row.isPrimary ? "Primary Supplier" : "Alternate Supplier"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Supplier_Products_Catalog_${new Date().toISOString().substring(0, 10)}.csv`);
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
            <Download className="h-3.5 w-3.5 text-blue-600" /> Export CSV
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
            <Package className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-foreground">Supplier Catalog & Offerings</h2>
              <p className="text-xs text-muted-foreground">Supplier-centric product directory with rates and stock levels.</p>
            </div>
          </div>

          {/* Filters & View Switcher */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Supplier Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/40">
              <Building className="h-3.5 w-3.5 text-muted-foreground ml-1.5 shrink-0" />
              <select
                value={selectedSupplierFilter}
                onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                className="h-8 bg-transparent text-xs font-medium outline-none cursor-pointer pr-2"
              >
                <option value="ALL">All Suppliers ({supplierGroups.length})</option>
                {supplierGroups.map((g) => (
                  <option key={g.supplierName} value={g.supplierName}>
                    {g.supplierName} ({g.items.length} items)
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

            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/40 shrink-0">
              <button
                onClick={() => setViewMode("suppliers-grid")}
                title="Supplier Cards View"
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === "suppliers-grid"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Supplier Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                title="Supplier-Product Table Matrix"
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ListFilter className="h-3.5 w-3.5" /> Table Matrix
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* VIEW 1: SUPPLIER-FIRST CARDS VIEW (DEFAULT) */}
      {viewMode === "suppliers-grid" && (
        <div className="space-y-6">
          {filteredSupplierGroups.length === 0 ? (
            <Card className="p-10 text-center bg-background/60">
              <p className="text-sm text-muted-foreground">No suppliers or products match your selected filter.</p>
            </Card>
          ) : (
            filteredSupplierGroups.map((group, groupIdx) => {
              const isCollapsed = expandedSuppliers[group.supplierName] === false;

              return (
                <Card
                  key={`supplier-group-${group.supplierName}-${groupIdx}`}
                  className="border-border/50 bg-background/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Supplier Card Header */}
                  <CardHeader className="bg-muted/20 border-b border-border/40 pb-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3.5">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shrink-0 mt-0.5">
                          <Building className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-lg font-bold text-foreground">
                              {group.supplierName}
                            </CardTitle>
                            {group.branch && (
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                Branch: {group.branch}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {group.contact && (
                              <span className="flex items-center gap-1">
                                👤 Contact: <strong className="text-foreground font-medium">{group.contact}</strong>
                              </span>
                            )}
                            {group.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-primary/70" /> {group.email}
                              </span>
                            )}
                            {group.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-primary/70" /> {group.phone}
                              </span>
                            )}
                            {group.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-primary/70" /> {group.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Supplier Metrics Bar & Actions */}
                      <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 bg-background/80 border border-border/50 rounded-lg px-3 py-1.5 text-xs shadow-sm">
                          <div className="text-center px-1">
                            <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Items</span>
                            <span className="font-bold text-foreground text-sm">{group.totalProducts}</span>
                          </div>
                          <div className="h-6 w-px bg-border/60" />
                          <div className="text-center px-1">
                            <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Total Stock</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{group.totalStock} units</span>
                          </div>
                          <div className="h-6 w-px bg-border/60" />
                          <div className="text-center px-1">
                            <span className="text-[10px] text-muted-foreground block uppercase font-semibold">Avg Rate</span>
                            <span className="font-mono font-bold text-foreground text-sm">
                              ₹{group.avgRate.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Link href={`/suppliers/edit/${encodeURIComponent(group.supplierName)}`}>
                            <Button variant="ghost" size="icon" title="Edit Supplier" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSupplierExpand(group.supplierName)}
                            className="h-8 text-xs gap-1"
                          >
                            {isCollapsed ? (
                              <>
                                Show Catalog <ChevronDown className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                Hide Catalog <ChevronUp className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Supplier Products Table */}
                  {!isCollapsed && (
                    <CardContent className="p-0">
                      {group.items.length === 0 ? (
                        <p className="p-6 text-xs text-muted-foreground text-center">
                          No products mapped to this supplier yet.
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground uppercase tracking-wider font-semibold">
                              <tr>
                                <th className="px-4 py-3">SKU / ID</th>
                                <th className="px-4 py-3">Product Name</th>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Supplier Rate (₹)</th>
                                <th className="px-4 py-3">UOM & Packaging</th>
                                <th className="px-4 py-3">Stock Status ({activeBranch})</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                              {group.items.map((item, itemIdx) => {
                                const stock = activeBranch === 'All'
                                  ? Object.values(item.product.stock || {}).reduce((x, y) => x + y, 0)
                                  : item.product.stock?.[activeBranch] || 0;

                                return (
                                  <tr key={`sup-prod-item-${group.supplierName}-${item.product.id}-${itemIdx}`} className="hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-mono font-semibold text-primary">
                                      {item.product.sku || item.product.id}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-foreground">
                                      <div className="flex items-center gap-2">
                                        <span>{item.product.name}</span>
                                        {item.isPrimary && (
                                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            Primary Vendor
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      <span className="inline-flex items-center rounded bg-muted px-2 py-0.5">
                                        {item.product.category}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                      ₹{item.rate.toLocaleString("en-IN")}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                      {item.product.uomValue ? `${item.product.uomValue} ` : ""}
                                      {item.product.uom || "pcs"} / {item.product.packaging || "box"}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold text-[11px] ${
                                          stock <= item.product.threshold
                                            ? "bg-destructive/10 text-destructive animate-pulse"
                                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                        }`}
                                      >
                                        {stock} units
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-1 shrink-0">
                                        <Link href={`/products/edit/${item.product.id}`}>
                                          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-border/60">
                                            <Edit2 className="h-3 w-3" /> Edit
                                          </Button>
                                        </Link>
                                        <Button
                                          onClick={() => setProductToDelete(item.product)}
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                          title="Delete Product"
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
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* VIEW 2: SUPPLIER-FIRST TABLE MATRIX VIEW */}
      {viewMode === "table" && (
        <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Supplier-Product Matrix ({flatSupplierProductList.length} Entries)
                </CardTitle>
                <CardDescription className="text-xs">
                  Unified catalog ordered by Supplier, showing contracted rates and product inventory.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="relative w-full overflow-x-auto rounded-md">
              {flatSupplierProductList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  No supplier products match your selected filter.
                </p>
              ) : (
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Supplier Name</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">SKU / ID</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product Name</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Contracted Rate (₹)</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Stock Status</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatSupplierProductList.map((row, idx) => (
                      <tr key={`flat-row-${row.supplierName}-${row.product.id}-${idx}`} className="border-b transition-colors hover:bg-muted/30">
                        <td className="p-4 align-middle font-semibold text-foreground">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-primary/70 shrink-0" />
                            <span>{row.supplierName}</span>
                          </div>
                        </td>
                        <td className="p-4 align-middle font-mono text-xs font-semibold text-primary">
                          {row.product.sku || row.product.id}
                        </td>
                        <td className="p-4 align-middle font-medium text-foreground">
                          {row.product.name}
                        </td>
                        <td className="p-4 align-middle text-muted-foreground">
                          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                            {row.product.category}
                          </span>
                        </td>
                        <td className="p-4 align-middle font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{row.rate.toLocaleString("en-IN")}
                        </td>
                        <td className="p-4 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              row.stock <= row.product.threshold
                                ? "bg-destructive/10 text-destructive animate-pulse"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            }`}
                          >
                            {row.stock} units ({activeBranch})
                          </span>
                        </td>
                        <td className="p-4 align-middle text-right">
                          <div className="flex items-center justify-end gap-1 shrink-0">
                            <Link href={`/products/edit/${row.product.id}`}>
                              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 border-border/60">
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </Button>
                            </Link>
                            <Button
                              onClick={() => setProductToDelete(row.product)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              title="Delete Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Product Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={productToDelete !== null}
        onClose={() => setProductToDelete(null)}
        onConfirm={async () => {
          if (productToDelete) {
            await deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
        title="Delete Product"
        description="Are you sure you want to delete this product? All related inventory records and supplier rates will be deleted."
        itemName={productToDelete ? `${productToDelete.name} (${productToDelete.id})` : ""}
      />
    </div>
  );
}
