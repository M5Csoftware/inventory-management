"use client";

import { useState } from "react";
import { useInventory } from "@/context/inventory-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  AlertTriangle,
  AlertCircle,
  Package,
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  ShoppingCart,
  Building2,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LowStockAlertsPage() {
  const { products, activeBranch, categories } = useInventory();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "out" | "critical" | "low">("all");

  const getStock = (p: any) => {
    if (!p.stock) return 0;
    if (typeof p.stock === "number") return p.stock;
    if (activeBranch === "All") {
      return Object.values(p.stock as Record<string, number>).reduce(
        (acc, curr) => acc + (curr || 0),
        0
      );
    }
    return (p.stock as Record<string, number>)[activeBranch] || 0;
  };

  // Filter low stock items
  const lowStockItems = products.filter((p) => {
    const stock = getStock(p);
    return stock <= p.threshold;
  });

  // KPI Calculations
  const outOfStockCount = lowStockItems.filter((p) => getStock(p) === 0).length;
  const criticalCount = lowStockItems.filter((p) => {
    const s = getStock(p);
    return s > 0 && s <= Math.max(1, Math.floor(p.threshold / 2));
  }).length;
  const lowCount = lowStockItems.length - outOfStockCount - criticalCount;

  const totalUnitsNeeded = lowStockItems.reduce((acc, p) => {
    const current = getStock(p);
    const deficit = Math.max(0, p.threshold - current);
    return acc + deficit;
  }, 0);

  // Filter items by search, category, and urgency
  const filteredItems = lowStockItems.filter((p) => {
    const stock = getStock(p);
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      (p.supplier && p.supplier.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;

    let matchesUrgency = true;
    if (urgencyFilter === "out") matchesUrgency = stock === 0;
    if (urgencyFilter === "critical")
      matchesUrgency = stock > 0 && stock <= Math.max(1, Math.floor(p.threshold / 2));
    if (urgencyFilter === "low")
      matchesUrgency = stock > Math.max(1, Math.floor(p.threshold / 2)) && stock <= p.threshold;

    return matchesSearch && matchesCategory && matchesUrgency;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Low Stock Alerts & Reorder Hub</h1>
              <p className="text-xs md:text-sm text-muted-foreground">
                Monitor products falling below minimum thresholds and restock inventory efficiently.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-accent/50 border border-border/50 text-xs font-medium flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Branch View: <strong>{activeBranch}</strong></span>
          </div>
          <Link href="/stock/in">
            <Button size="sm" className="gap-2 text-xs h-9">
              <PlusCircle className="h-4 w-4" />
              Restock Stock In
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Low Stock */}
        <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Low Stock
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{lowStockItems.length}</span>
            <span className="text-xs text-muted-foreground">items below min</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
            Requires attention
          </div>
        </div>

        {/* Out of Stock */}
        <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Out of Stock (0 Left)
            </span>
            <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-destructive">{outOfStockCount}</span>
            <span className="text-xs text-muted-foreground">items completely out</span>
          </div>
          <div className="mt-2 text-xs text-destructive font-medium">
            High Priority / Urgency
          </div>
        </div>

        {/* Critical Stock */}
        <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Critical Level (&le;50%)
            </span>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-orange-500">{criticalCount}</span>
            <span className="text-xs text-muted-foreground">near empty</span>
          </div>
          <div className="mt-2 text-xs text-orange-500 font-medium">
            Needs purchase order
          </div>
        </div>

        {/* Total Units Needed */}
        <div className="rounded-xl border bg-card/60 backdrop-blur-sm p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Restock Deficit
            </span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold">{totalUnitsNeeded}</span>
            <span className="text-xs text-muted-foreground">units to threshold</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground font-medium">
            Minimum reorder quantity
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-accent/20 p-3 rounded-xl border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search low stock product, SKU, supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-background"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 bg-background border border-input rounded-md px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="All">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Urgency Filter Tabs */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setUrgencyFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                urgencyFilter === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({lowStockItems.length})
            </button>
            <button
              onClick={() => setUrgencyFilter("out")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                urgencyFilter === "out"
                  ? "bg-destructive text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Out ({outOfStockCount})
            </button>
            <button
              onClick={() => setUrgencyFilter("critical")}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                urgencyFilter === "critical"
                  ? "bg-orange-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Critical ({criticalCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Alert List / Table */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 border border-dashed rounded-xl bg-card/40 text-center">
          {lowStockItems.length === 0 ? (
            <>
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold">Inventory Fully Stocked! 🎉</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                There are currently no items below their minimum threshold for branch <strong>{activeBranch}</strong>.
              </p>
            </>
          ) : (
            <>
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold">No matching low stock items</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search criteria or category filters.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((product) => {
            const stock = getStock(product);
            const deficit = Math.max(0, product.threshold - stock);
            const percent = Math.min(100, Math.round((stock / Math.max(1, product.threshold)) * 100));

            let statusBadge = {
              label: "Low Stock",
              color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
              barColor: "bg-amber-500",
            };
            if (stock === 0) {
              statusBadge = {
                label: "Out of Stock",
                color: "bg-destructive/10 text-destructive border-destructive/20 font-bold animate-pulse",
                barColor: "bg-destructive",
              };
            } else if (stock <= Math.max(1, Math.floor(product.threshold / 2))) {
              statusBadge = {
                label: "Critical",
                color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
                barColor: "bg-orange-500",
              };
            }

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border bg-card/70 backdrop-blur-sm p-4 md:p-5 shadow-xs hover:border-border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Product Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-base font-bold truncate">{product.name}</h3>
                    {product.sku && (
                      <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded border">
                        SKU: {product.sku}
                      </span>
                    )}
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>Category: <strong>{product.category}</strong></span>
                    <span>Supplier: <strong>{product.supplier || "N/A"}</strong></span>
                    <span>Price: <strong>₹{product.price}</strong></span>
                  </div>

                  {/* Stock Progress Bar */}
                  <div className="pt-2 max-w-md">
                    <div className="flex justify-between text-xs font-medium mb-1">
                      <span>Stock Level: <strong className={stock === 0 ? "text-destructive" : ""}>{stock} units</strong></span>
                      <span className="text-muted-foreground">Min Threshold: {product.threshold}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${statusBadge.barColor}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stock Breakdown per Branch */}
                {typeof product.stock === "object" && product.stock !== null && (
                  <div className="hidden lg:flex flex-col gap-1 border-x px-4 shrink-0 min-w-[180px]">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                      Branch Stocks
                    </span>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      {Object.entries(product.stock as Record<string, number>).map(([br, val]) => (
                        <div key={br} className="flex justify-between gap-1">
                          <span className="text-muted-foreground truncate">{br}:</span>
                          <span className={`font-mono ${val <= product.threshold ? "text-amber-500 font-bold" : ""}`}>
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Restock Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <div className="text-right hidden sm:block mr-2">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                      Reorder Deficit
                    </span>
                    <span className="text-sm font-bold text-amber-500">
                      +{deficit} units needed
                    </span>
                  </div>

                  <Link href={`/stock/in`}>
                    <Button size="sm" variant="default" className="h-9 gap-1.5 text-xs">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Restock Now
                    </Button>
                  </Link>

                  <Link href={`/orders/new?supplier=${encodeURIComponent(product.supplier)}`}>
                    <Button size="sm" variant="outline" className="h-9 gap-1.5 text-xs">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Order
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
