/* src/app/reports/monthly-stock/page.tsx */
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  Download,
  Search,
  RefreshCw,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyStockItem {
  productId: string;
  productName: string;
  category: string;
  sku: string;
  branch: string;
  openingStock: number;
  stockIn: number;
  stockOut: number;
  closingStock: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/inventory";
const DB_HEADER = {
  "x-database": "m5c-inventory",
  "Content-Type": "application/json",
};

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function MonthlyStockReportPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(
    now.getMonth() + 1
  );
  const [monthlyBranch, setMonthlyBranch] = useState<string>("All");
  const [monthlySearch, setMonthlySearch] = useState<string>("");
  const [monthlyData, setMonthlyData] = useState<MonthlyStockItem[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(true);

  const fetchMonthlyReport = async () => {
    setLoadingMonthly(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { ...DB_HEADER };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      params.append("year", String(selectedYear));
      params.append("month", String(selectedMonth));
      if (monthlyBranch && monthlyBranch !== "All") {
        params.append("branch", monthlyBranch);
      }
      if (monthlySearch.trim()) {
        params.append("search", monthlySearch.trim());
      }

      const res = await fetch(
        `${API_BASE}/reports/monthly-stock?${params.toString()}`,
        { headers }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMonthlyData(data.data || []);
          setLoadingMonthly(false);
          return;
        }
      }

      // CLIENT-SIDE FALLBACK if /reports/monthly-stock returns 404 (e.g. deployed Render server)
      const branchQuery = monthlyBranch && monthlyBranch !== "All" ? `?branch=${monthlyBranch}` : "";
      const [prodRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/products${branchQuery}`, { headers: { "x-database": "m5c-inventory" } }),
        fetch(`${API_BASE}/transactions${branchQuery}`, { headers: { "x-database": "m5c-inventory" } }),
      ]);

      const prods = await prodRes.json();
      const txs = await txRes.json();

      if (prods.success && txs.success) {
        const productsList = prods.data || [];
        const transactionsList = txs.data || [];

        const targetYear = selectedYear;
        const targetMonth = selectedMonth;
        const monthStart = new Date(targetYear, targetMonth - 1, 1, 0, 0, 0, 0);
        const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
        const branchesList = ["Ahmedabad", "Ludhiana", "Delhi", "Mumbai"];

        let filteredProducts = productsList;
        if (monthlySearch.trim()) {
          const q = monthlySearch.toLowerCase().trim();
          filteredProducts = productsList.filter(
            (p: any) =>
              p.name?.toLowerCase().includes(q) ||
              p.id?.toLowerCase().includes(q) ||
              p.sku?.toLowerCase().includes(q) ||
              p.category?.toLowerCase().includes(q)
          );
        }

        const calculatedReport: MonthlyStockItem[] = [];

        for (const prod of filteredProducts) {
          const prodTxs = transactionsList.filter((t: any) => t.productId === prod.id);
          const relevantBranches =
            monthlyBranch && monthlyBranch !== "All" ? [monthlyBranch] : branchesList;

          let prodCreatedAt = prod.createdAt ? new Date(prod.createdAt) : null;
          if (!prodCreatedAt && prodTxs.length > 0) {
            const timestamps = prodTxs.map((t: any) => new Date(t.date || t.createdAt).getTime()).filter((t: number) => !isNaN(t));
            if (timestamps.length > 0) {
              prodCreatedAt = new Date(Math.min(...timestamps));
            }
          }
          if (!prodCreatedAt) {
            prodCreatedAt = new Date();
          }

          for (const b of relevantBranches) {
            if (prodCreatedAt > monthEnd) {
              calculatedReport.push({
                productId: prod.id,
                productName: prod.name,
                category: prod.category,
                sku: prod.sku || "",
                branch: b,
                openingStock: 0,
                stockIn: 0,
                stockOut: 0,
                closingStock: 0,
              });
              continue;
            }

            const branchTxs = prodTxs.filter((t: any) => t.branch === b);
            const liveStock = typeof prod.stock === "number" ? prod.stock : (prod.stock?.[b] || 0);

            let netTxAfterMonthEnd = 0;
            let stockIn = 0;
            let stockOut = 0;

            for (const tx of branchTxs) {
              const txDate = new Date(tx.date || tx.createdAt);
              if (txDate > monthEnd) {
                if (tx.type === "Stock In") netTxAfterMonthEnd += tx.quantity;
                else if (tx.type === "Stock Out") netTxAfterMonthEnd -= tx.quantity;
              } else if (txDate >= monthStart && txDate <= monthEnd) {
                if (tx.type === "Stock In") stockIn += tx.quantity;
                else if (tx.type === "Stock Out") stockOut += tx.quantity;
              }
            }

            const closingStock = Math.max(0, liveStock - netTxAfterMonthEnd);
            let openingStock = 0;
            if (prodCreatedAt > monthStart) {
              openingStock = 0;
            } else {
              openingStock = Math.max(0, closingStock - stockIn + stockOut);
            }

            calculatedReport.push({
              productId: prod.id,
              productName: prod.name,
              category: prod.category,
              sku: prod.sku || "",
              branch: b,
              openingStock,
              stockIn,
              stockOut,
              closingStock,
            });
          }
        }

        setMonthlyData(calculatedReport);
      } else {
        toast.error("Failed to compute monthly stock report");
      }
    } catch (err) {
      console.error("Monthly report fetch error:", err);
      toast.error("Network error while fetching monthly stock report");
    } finally {
      setLoadingMonthly(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportMonthlyToExcel = () => {
    if (!monthlyData.length) {
      toast.info("No monthly stock data to export");
      return;
    }
    const monthLabel =
      MONTHS.find((m) => m.value === selectedMonth)?.label || selectedMonth;

    const exportData = monthlyData.map((item) => ({
      "Product ID": item.productId,
      "Product Name": item.productName,
      Category: item.category,
      SKU: item.sku || "-",
      Branch: item.branch,
      "Opening Stock": item.openingStock,
      "Stock In (+)": item.stockIn,
      "Stock Out (-)": item.stockOut,
      "Net Change": item.stockIn - item.stockOut,
      "Closing Stock": item.closingStock,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Stock Summary");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(
      blob,
      `monthly_stock_report_${monthLabel}_${selectedYear}.xlsx`
    );
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Monthly Opening &amp; Closing Stock
        </h1>
      </div>

      {/* Controls & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 bg-card p-4 sm:p-5 rounded-xl shadow-lg border border-border/50">
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Branch</label>
          <select
            value={monthlyBranch}
            onChange={(e) => setMonthlyBranch(e.target.value)}
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Branches</option>
            <option value="Ahmedabad">Ahmedabad</option>
            <option value="Ludhiana">Ludhiana</option>
            <option value="Delhi">Delhi</option>
            <option value="Mumbai">Mumbai</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Search Product</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={monthlySearch}
              onChange={(e) => setMonthlySearch(e.target.value)}
              placeholder="Name, ID, SKU, Category..."
              className="w-full h-10 pl-9 pr-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2 flex items-end">
          <button
            onClick={fetchMonthlyReport}
            className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 rounded-xl hover:bg-primary/90 transition-all shadow-md text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Monthly Table & Export Bar */}
      <div className="space-y-2">
        <div className="overflow-auto max-h-[calc(100vh-220px)] min-h-[500px] bg-card rounded-xl border border-border shadow-sm">
          <div className="min-w-[768px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/90 backdrop-blur-xs text-muted-foreground border-b border-border sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Product</th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Category</th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Branch</th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Opening Stock
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Stock In (+)
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Stock Out (-)
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Net Change
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Closing Stock
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loadingMonthly ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-muted-foreground"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Calculating monthly stock levels...
                    </td>
                  </tr>
                ) : monthlyData.length ? (
                  monthlyData.map((item, idx) => {
                    const netChange = item.stockIn - item.stockOut;
                    return (
                      <tr
                        key={`${item.productId}-${item.branch}-${idx}`}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3 font-medium whitespace-nowrap">
                          {item.productName}{" "}
                          <span className="text-xs text-muted-foreground font-mono">
                            ({item.productId})
                          </span>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {item.category}
                        </td>
                        <td className="p-3 font-medium whitespace-nowrap">
                          {item.branch}
                        </td>
                        <td className="p-3 text-right font-semibold text-muted-foreground">
                          {item.openingStock}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-500">
                          {item.stockIn > 0 ? `+${item.stockIn}` : 0}
                        </td>
                        <td className="p-3 text-right font-semibold text-amber-500">
                          {item.stockOut > 0 ? `-${item.stockOut}` : 0}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                              netChange > 0
                                ? "bg-emerald-500/10 text-emerald-500"
                                : netChange < 0
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {netChange > 0 ? `+${netChange}` : netChange}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold">
                            {item.closingStock}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-muted-foreground"
                    >
                      No monthly inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Summary & Export Button (Always visible right below table) */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1 px-1">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{monthlyData.length}</span> inventory items for{" "}
            <span className="font-semibold text-foreground">
              {MONTHS.find((m) => m.value === selectedMonth)?.label} {selectedYear}
            </span>
          </p>
          <button
            onClick={exportMonthlyToExcel}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
}
