"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Package,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  Building2,
  Tag,
  Boxes,
  Eye,
  X,
  TrendingUp,
  SlidersHorizontal,
  PieChart,
  BarChart3,
  Sparkles,
  ArrowUpRight,
  ShieldAlert,
  ArrowUpDown,
  History,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/context/inventory-context";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/inventory";

interface Product {
  _id?: string;
  id: string;
  name: string;
  category: string;
  sku?: string;
  unit: string;
  price: number;
  minStock: number;
  stock: Record<string, number>;
  supplier?: string;
  description?: string;
}

interface Transaction {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: string;
  quantity: number;
  branch: string;
  reasonOrLocation?: string;
  notes?: string;
}

export default function ProductDetailsReportPage() {
  const { activeBranch } = useInventory();
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // View Modes: "catalog" | "matrix" | "categories"
  const [viewMode, setViewMode] = useState<"catalog" | "matrix" | "categories">("catalog");

  // Filters
  const [branchFilter, setBranchFilter] = useState<string>(activeBranch || "All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [supplierFilter, setSupplierFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("valuation-desc");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Drawer details & tabs
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "distribution" | "history">("overview");

  // Sync activeBranch if changed globally
  useEffect(() => {
    if (activeBranch) {
      setBranchFilter(activeBranch);
    }
  }, [activeBranch]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "x-database": "m5c-inventory",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const [prodRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/products`, { headers }),
        fetch(`${API_BASE}/transactions`, { headers }),
      ]);

      if (prodRes.ok) {
        const data = await prodRes.json();
        if (data.success) {
          const prodList: Product[] = data.data || [];
          setProducts(prodList);

          const cats = Array.from(new Set(prodList.map((p) => p.category).filter(Boolean)));
          setCategories(cats);

          const sups = Array.from(new Set(prodList.map((p) => p.supplier).filter((s): s is string => Boolean(s))));
          setSuppliers(sups);
        }
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        if (txData.success) {
          setTransactions(txData.data || []);
        }
      }
    } catch (err) {
      console.error("Failed to load product report data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute total quantity for a product under current branch filter
  const getProductStock = (prod: Product, branch: string) => {
    if (!prod.stock) return 0;
    if (branch !== "All") {
      return prod.stock[branch] || 0;
    }
    return Object.values(prod.stock).reduce((acc, val) => acc + (val || 0), 0);
  };

  // Compute status
  const getStockStatus = (prod: Product, branch: string) => {
    const qty = getProductStock(prod, branch);
    if (qty === 0) return "Out of Stock";
    if (qty <= (prod.minStock || 0)) return "Low Stock";
    return "In Stock";
  };

  // Filtered & Sorted dataset
  const filteredProducts = useMemo(() => {
    let list = products.filter((prod) => {
      // Category filter
      if (categoryFilter !== "All" && prod.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Supplier filter
      if (supplierFilter !== "All" && prod.supplier?.toLowerCase() !== supplierFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      const status = getStockStatus(prod, branchFilter);
      if (statusFilter !== "All" && status !== statusFilter) {
        return false;
      }

      // Price Range filter
      const p = prod.price || 0;
      if (priceRangeFilter === "low" && p >= 1000) return false;
      if (priceRangeFilter === "mid" && (p < 1000 || p > 10000)) return false;
      if (priceRangeFilter === "high" && p <= 10000) return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchId = prod.id?.toLowerCase().includes(term);
        const matchName = prod.name?.toLowerCase().includes(term);
        const matchCat = prod.category?.toLowerCase().includes(term);
        const matchSupplier = prod.supplier?.toLowerCase().includes(term);
        const matchDesc = prod.description?.toLowerCase().includes(term);
        if (!matchId && !matchName && !matchCat && !matchSupplier && !matchDesc) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      const stockA = getProductStock(a, branchFilter);
      const stockB = getProductStock(b, branchFilter);
      const valA = stockA * (a.price || 0);
      const valB = stockB * (b.price || 0);

      if (sortBy === "valuation-desc") return valB - valA;
      if (sortBy === "valuation-asc") return valA - valB;
      if (sortBy === "stock-desc") return stockB - stockA;
      if (sortBy === "stock-asc") return stockA - stockB;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "price-desc") return (b.price || 0) - (a.price || 0);
      return 0;
    });

    return list;
  }, [products, categoryFilter, supplierFilter, statusFilter, priceRangeFilter, branchFilter, searchTerm, sortBy]);

  // Overall & Filtered Metrics
  const metrics = useMemo(() => {
    let totalQty = 0;
    let totalVal = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let inStock = 0;
    let maxValProduct: Product | null = null;
    let maxVal = -1;

    filteredProducts.forEach((p) => {
      const qty = getProductStock(p, branchFilter);
      const val = qty * (p.price || 0);
      totalQty += qty;
      totalVal += val;

      if (val > maxVal) {
        maxVal = val;
        maxValProduct = p;
      }

      const st = getStockStatus(p, branchFilter);
      if (st === "Out of Stock") outOfStock++;
      else if (st === "Low Stock") lowStock++;
      else inStock++;
    });

    const stockHealthIndex =
      filteredProducts.length > 0
        ? Math.round(((inStock) / filteredProducts.length) * 100)
        : 100;

    return {
      totalProducts: filteredProducts.length,
      totalQty,
      totalVal,
      lowStock,
      outOfStock,
      inStock,
      stockHealthIndex,
      maxValProduct,
      maxVal,
    };
  }, [filteredProducts, branchFilter]);

  // Category Breakdown Summary
  const categorySummary = useMemo(() => {
    const map: Record<
      string,
      { category: string; count: number; totalQty: number; totalValuation: number; lowStockCount: number }
    > = {};

    filteredProducts.forEach((p) => {
      const cat = p.category || "Uncategorized";
      if (!map[cat]) {
        map[cat] = { category: cat, count: 0, totalQty: 0, totalValuation: 0, lowStockCount: 0 };
      }
      const qty = getProductStock(p, branchFilter);
      const val = qty * (p.price || 0);
      const st = getStockStatus(p, branchFilter);

      map[cat].count += 1;
      map[cat].totalQty += qty;
      map[cat].totalValuation += val;
      if (st === "Low Stock" || st === "Out of Stock") {
        map[cat].lowStockCount += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.totalValuation - a.totalValuation);
  }, [filteredProducts, branchFilter]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Product ID",
      "Product Name",
      "Category",
      "Unit",
      "Price (INR)",
      "Min Stock",
      "Delhi Stock",
      "Ahmedabad Stock",
      "Ludhiana Stock",
      "Mumbai Stock",
      "Total / Filtered Qty",
      "Total Valuation (INR)",
      "Stock Status",
      "Supplier",
    ];

    const rows = filteredProducts.map((p) => {
      const delhi = p.stock?.Delhi || 0;
      const ahmedabad = p.stock?.Ahmedabad || 0;
      const ludhiana = p.stock?.Ludhiana || 0;
      const mumbai = p.stock?.Mumbai || 0;
      const filteredQty = getProductStock(p, branchFilter);
      const val = filteredQty * (p.price || 0);
      const status = getStockStatus(p, branchFilter);

      return [
        `"${p.id || ""}"`,
        `"${(p.name || "").replace(/"/g, '""')}"`,
        `"${p.category || ""}"`,
        `"${p.unit || "Pcs"}"`,
        p.price || 0,
        p.minStock || 0,
        delhi,
        ahmedabad,
        ludhiana,
        mumbai,
        filteredQty,
        val,
        `"${status}"`,
        `"${(p.supplier || "N/A").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `product_details_report_${branchFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Product specific transactions
  const productTransactions = useMemo(() => {
    if (!selectedProduct) return [];
    return transactions.filter(
      (t) =>
        t.productId?.toLowerCase() === selectedProduct.id.toLowerCase() ||
        t.productName?.toLowerCase() === selectedProduct.name.toLowerCase()
    );
  }, [selectedProduct, transactions]);

  return (
    <div className="p-4 sm:p-8 space-y-6 w-full print:p-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Product Details Report
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              <Sparkles className="w-3 h-3" /> Master Analytics
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive audit report covering multi-branch quantities, SKU valuations, category summaries, and stock health metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-9 gap-1.5"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
          <Button
            size="sm"
            onClick={exportToCSV}
            disabled={filteredProducts.length === 0}
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold">M5C Logistics — Product Details Report</h1>
        <p className="text-sm text-gray-600">
          Branch Scope: {branchFilter} | Generated on: {new Date().toLocaleString()}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5">
        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total SKUs
            </CardTitle>
            <Boxes className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Cataloged product lines</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stock Units
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalQty.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Units ({branchFilter === "All" ? "All Branches" : branchFilter})
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inventory Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              ₹{metrics.totalVal.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total valuation at unit cost</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stock Health
            </CardTitle>
            <Sparkles className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {metrics.stockHealthIndex}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Optimal stock ratio</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60 col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Stock Warnings
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.lowStock} <span className="text-xs font-normal text-muted-foreground">Low</span>
              </span>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {metrics.outOfStock} <span className="text-xs font-normal text-muted-foreground">Out</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Action required items</p>
          </CardContent>
        </Card>
      </div>

      {/* View Switcher Tabs & Filter Bar */}
      <div className="flex flex-col space-y-4 print:hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
            <button
              onClick={() => setViewMode("catalog")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "catalog"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Product Catalog</span>
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "matrix"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Multi-Branch Matrix</span>
            </button>
            <button
              onClick={() => setViewMode("categories")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "categories"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Category Analytics</span>
            </button>
          </div>

          <div className="text-xs text-muted-foreground hidden sm:block">
            Showing <span className="font-bold text-foreground">{filteredProducts.length}</span> of {products.length} products
          </div>
        </div>

        {/* Filter Toolbar */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search Product, SKU, Supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Branch Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">🌐 All Branches</option>
                  <option value="Delhi">🏭 Delhi (HO)</option>
                  <option value="Ahmedabad">🏭 Ahmedabad</option>
                  <option value="Ludhiana">🏭 Ludhiana</option>
                  <option value="Mumbai">🏭 Mumbai</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">All Stock Statuses</option>
                  <option value="In Stock">🟢 In Stock</option>
                  <option value="Low Stock">🟠 Low Stock</option>
                  <option value="Out of Stock">🔴 Out of Stock</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="valuation-desc">Valuation (High → Low)</option>
                  <option value="valuation-asc">Valuation (Low → High)</option>
                  <option value="stock-desc">Stock Qty (High → Low)</option>
                  <option value="stock-asc">Stock Qty (Low → High)</option>
                  <option value="name-asc">Product Name (A-Z)</option>
                  <option value="price-desc">Unit Price (High → Low)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VIEW 1: Catalog Table */}
      {viewMode === "catalog" && (
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-3.5 px-4">SKU / ID</th>
                  <th className="py-3.5 px-4">Product Name &amp; Category</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-4 text-center">Min Threshold</th>
                  <th className="py-3.5 px-4 text-center">
                    {branchFilter === "All" ? "Total Stock" : `${branchFilter} Stock`}
                  </th>
                  <th className="py-3.5 px-4 text-right">Valuation (INR)</th>
                  <th className="py-3.5 px-4 text-center">Stock Status</th>
                  <th className="py-3.5 px-4">Supplier</th>
                  <th className="py-3.5 px-4 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading Product Details...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      No products found matching your current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((prod) => {
                    const qty = getProductStock(prod, branchFilter);
                    const val = qty * (prod.price || 0);
                    const status = getStockStatus(prod, branchFilter);

                    return (
                      <tr
                        key={prod.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedProduct(prod);
                          setDrawerTab("overview");
                        }}
                      >
                        <td className="py-3 px-4 font-mono font-medium text-xs text-primary">
                          {prod.id}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground">{prod.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
                              {prod.category}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              ({prod.unit || "Pcs"})
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          ₹{(prod.price || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center text-xs font-mono text-muted-foreground">
                          {prod.minStock || 0}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-sm">
                          {qty}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          ₹{val.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {status === "In Stock" && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                              In Stock
                            </span>
                          )}
                          {status === "Low Stock" && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">
                              Low Stock
                            </span>
                          )}
                          {status === "Out of Stock" && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20">
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-36">
                          {prod.supplier || "N/A"}
                        </td>
                        <td className="py-3 px-4 text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => {
                              setSelectedProduct(prod);
                              setDrawerTab("overview");
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* VIEW 2: Multi-Branch Matrix */}
      {viewMode === "matrix" && (
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-3.5 px-4">SKU / ID</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-3 text-center bg-blue-500/5">Delhi (HO)</th>
                  <th className="py-3.5 px-3 text-center bg-emerald-500/5">Ahmedabad</th>
                  <th className="py-3.5 px-3 text-center bg-amber-500/5">Ludhiana</th>
                  <th className="py-3.5 px-3 text-center bg-purple-500/5">Mumbai</th>
                  <th className="py-3.5 px-4 text-center font-bold">Total Units</th>
                  <th className="py-3.5 px-4 text-right font-bold">Total Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredProducts.map((prod) => {
                  const delhi = prod.stock?.Delhi || 0;
                  const ahmedabad = prod.stock?.Ahmedabad || 0;
                  const ludhiana = prod.stock?.Ludhiana || 0;
                  const mumbai = prod.stock?.Mumbai || 0;
                  const total = delhi + ahmedabad + ludhiana + mumbai;
                  const totalVal = total * (prod.price || 0);

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedProduct(prod);
                        setDrawerTab("distribution");
                      }}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-xs text-primary">
                        {prod.id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {prod.name}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs">
                        ₹{(prod.price || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs font-semibold bg-blue-500/5">
                        {delhi}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs font-semibold bg-emerald-500/5">
                        {ahmedabad}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs font-semibold bg-amber-500/5">
                        {ludhiana}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-xs font-semibold bg-purple-500/5">
                        {mumbai}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sm">
                        {total}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{totalVal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* VIEW 3: Category Analytics */}
      {viewMode === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorySummary.map((cat) => {
            const pctOfTotalVal =
              metrics.totalVal > 0
                ? Math.round((cat.totalValuation / metrics.totalVal) * 100)
                : 0;

            return (
              <Card key={cat.category} className="border-border/60 shadow-sm hover:border-primary/50 transition-all">
                <CardHeader className="pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold">{cat.category}</CardTitle>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-muted">
                      {cat.count} SKUs
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                      <span className="text-xs text-muted-foreground block">Category Stock Qty</span>
                      <span className="font-bold text-base">{cat.totalQty.toLocaleString()} units</span>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 block">Category Valuation</span>
                      <span className="font-bold text-base text-emerald-600 dark:text-emerald-400">
                        ₹{cat.totalValuation.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Valuation Share</span>
                      <span className="font-bold text-foreground">{pctOfTotalVal}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${pctOfTotalVal}%` }}
                      />
                    </div>
                  </div>

                  {cat.lowStockCount > 0 && (
                    <div className="flex items-center justify-between p-2.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium border border-amber-500/20">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {cat.lowStockCount} items low/out of stock
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-[10px] px-2 hover:bg-amber-500/20"
                        onClick={() => {
                          setCategoryFilter(cat.category);
                          setStatusFilter("Low Stock");
                          setViewMode("catalog");
                        }}
                      >
                        View Items
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Slide-over Detail Drawer */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-lg bg-card border-l border-border shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-mono mb-1 border-border">
                  {selectedProduct.id}
                </span>
                <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedProduct(null)}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
              <button
                onClick={() => setDrawerTab("overview")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  drawerTab === "overview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setDrawerTab("distribution")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  drawerTab === "distribution" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Stock Breakdown
              </button>
              <button
                onClick={() => setDrawerTab("history")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  drawerTab === "history" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Transactions ({productTransactions.length})
              </button>
            </div>

            {/* Tab 1: Overview */}
            {drawerTab === "overview" && (
              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                    <span className="text-xs text-muted-foreground block">Category</span>
                    <span className="font-medium">{selectedProduct.category}</span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                    <span className="text-xs text-muted-foreground block">Unit Type</span>
                    <span className="font-medium">{selectedProduct.unit || "Pcs"}</span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                    <span className="text-xs text-muted-foreground block">Unit Price</span>
                    <span className="font-semibold text-emerald-600">
                      ₹{(selectedProduct.price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                    <span className="text-xs text-muted-foreground block">Min Stock Threshold</span>
                    <span className="font-semibold">{selectedProduct.minStock || 0}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-accent/30 border border-border/50 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Reorder Status</span>
                    <span className="font-semibold">
                      {getProductStock(selectedProduct, "All") <= selectedProduct.minStock
                        ? "⚠️ Reorder Required"
                        : "🟢 Sufficient Stock"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Recommended Order Quantity</span>
                    <span className="font-bold text-primary">
                      {Math.max(0, (selectedProduct.minStock || 0) * 2 - getProductStock(selectedProduct, "All"))} units
                    </span>
                  </div>
                </div>

                {selectedProduct.supplier && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Primary Supplier
                    </h3>
                    <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-sm">
                      {selectedProduct.supplier}
                    </div>
                  </div>
                )}

                {selectedProduct.description && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Product Description
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/20 border border-border/40">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Stock Breakdown */}
            {drawerTab === "distribution" && (
              <div className="space-y-4 flex-1">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Branch Level Progress
                </h3>

                {["Delhi", "Ahmedabad", "Ludhiana", "Mumbai"].map((br) => {
                  const qty = selectedProduct.stock?.[br] || 0;
                  const totalQty = getProductStock(selectedProduct, "All");
                  const pct = totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0;

                  return (
                    <div key={br} className="space-y-1.5 p-3 rounded-lg bg-muted/30 border border-border/40">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {br}
                        </span>
                        <span className="font-bold">{qty} units ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Transaction History */}
            {drawerTab === "history" && (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px]">
                {productTransactions.length === 0 ? (
                  <p className="text-xs text-center text-muted-foreground py-8">
                    No recorded movement transactions for this product.
                  </p>
                ) : (
                  productTransactions.map((tx) => (
                    <div key={tx.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-primary font-medium">{tx.id}</span>
                        <span className="font-semibold">{tx.type}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{tx.branch}</span>
                        <span className="font-bold text-foreground">{tx.quantity} units</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground border-t pt-1 mt-1">
                        {tx.date} — {tx.reasonOrLocation || tx.notes || "Standard Movement"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => setSelectedProduct(null)}
            >
              Close Drawer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
