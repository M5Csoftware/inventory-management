"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Download, Search, RefreshCw, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInventory, Category } from "@/context/inventory-context";

interface MonthlyStockItem {
  productId: string;
  productName: string;
  category: string;
  supplier: string;
  branch: string;
  sku: string;
  openingStock: number;
  purchaseRate: number;
  purchaseValue: number;
  stockIn: number;
  stockOut: number;
  closingStock: number;
  lastPurchaseDate: string;
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
  const { categories } = useInventory();
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(
    now.getMonth() + 1,
  );
  const [monthlyBranch, setMonthlyBranch] = useState<string>("All");
  const [monthlyCategory, setMonthlyCategory] = useState<string>("All");
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
      if (monthlyCategory && monthlyCategory !== "All") {
        params.append("category", monthlyCategory);
      }
      if (monthlySearch.trim()) {
        params.append("search", monthlySearch.trim());
      }

      const res = await fetch(
        `${API_BASE}/reports/monthly-stock?${params.toString()}`,
        { headers },
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          let list: MonthlyStockItem[] = data.data || [];
          if (monthlyCategory && monthlyCategory !== "All") {
            const catLower = monthlyCategory.toLowerCase();
            list = list.filter(
              (item) => item.category?.toLowerCase() === catLower,
            );
          }
          list.sort((a, b) => {
            const timeA = a.lastPurchaseDate && a.lastPurchaseDate !== "-" ? new Date(a.lastPurchaseDate).getTime() : 0;
            const timeB = b.lastPurchaseDate && b.lastPurchaseDate !== "-" ? new Date(b.lastPurchaseDate).getTime() : 0;
            const validA = !isNaN(timeA) && timeA > 0;
            const validB = !isNaN(timeB) && timeB > 0;
            if (validA && validB) return timeB - timeA;
            if (validA && !validB) return -1;
            if (!validA && validB) return 1;
            return a.productName.localeCompare(b.productName);
          });
          setMonthlyData(list);
          setLoadingMonthly(false);
          return;
        }
      }

      // CLIENT-SIDE FALLBACK if /reports/monthly-stock returns 404 (e.g. deployed Render server)
      const branchQuery =
        monthlyBranch && monthlyBranch !== "All"
          ? `?branch=${monthlyBranch}`
          : "";
      const [prodRes, txRes] = await Promise.all([
        fetch(`${API_BASE}/products${branchQuery}`, {
          headers: { "x-database": "m5c-inventory" },
        }),
        fetch(`${API_BASE}/transactions${branchQuery}`, {
          headers: { "x-database": "m5c-inventory" },
        }),
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
        if (monthlyCategory && monthlyCategory !== "All") {
          const catLower = monthlyCategory.toLowerCase();
          filteredProducts = filteredProducts.filter(
            (p: any) => p.category?.toLowerCase() === catLower,
          );
        }
        if (monthlySearch.trim()) {
          const q = monthlySearch.toLowerCase().trim();
          filteredProducts = filteredProducts.filter(
            (p: any) =>
              p.name?.toLowerCase().includes(q) ||
              p.id?.toLowerCase().includes(q) ||
              p.sku?.toLowerCase().includes(q) ||
              p.category?.toLowerCase().includes(q),
          );
        }

        const calculatedReport: MonthlyStockItem[] = [];

        for (const prod of filteredProducts) {
          const prodTxs = transactionsList.filter(
            (t: any) =>
              t.productId === prod.id ||
              t.productId === String(prod._id) ||
              (prod._id && String(t.productId) === String(prod._id)),
          );
          const relevantBranches =
            monthlyBranch && monthlyBranch !== "All"
              ? [monthlyBranch]
              : branchesList;

          const txTimestamps = prodTxs
            .map((t: any) => new Date(t.date || t.createdAt).getTime())
            .filter((t: number) => !isNaN(t));

          let prodCreatedAt = prod.createdAt ? new Date(prod.createdAt) : null;
          if (txTimestamps.length > 0) {
            const earliestTx = new Date(Math.min(...txTimestamps));
            if (!prodCreatedAt || earliestTx < prodCreatedAt) {
              prodCreatedAt = earliestTx;
            }
          }
          if (!prodCreatedAt) {
            prodCreatedAt = new Date();
          }

          for (const b of relevantBranches) {
            const branchTxs = prodTxs.filter((t: any) => t.branch === b);
            const initialStockForBranch =
              typeof prod.stock === "object" && prod.stock !== null
                ? prod.stock[b] || 0
                : prod.stock || 0;

            const txsAfterMonthEnd = branchTxs.filter((t: any) => {
              const txDate = new Date(t.date || t.createdAt);
              return txDate > monthEnd;
            });

            let currentStockAtMonthEnd = initialStockForBranch;
            for (const t of txsAfterMonthEnd) {
              if (t.type === "Stock In") {
                currentStockAtMonthEnd -= t.quantity || 0;
              } else if (t.type === "Stock Out") {
                currentStockAtMonthEnd += t.quantity || 0;
              }
            }

            const monthTxs = branchTxs.filter((t: any) => {
              const txDate = new Date(t.date || t.createdAt);
              return txDate >= monthStart && txDate <= monthEnd;
            });

            let stockInMonth = 0;
            let stockOutMonth = 0;
            for (const t of monthTxs) {
              if (t.type === "Stock In") stockInMonth += t.quantity || 0;
              if (t.type === "Stock Out") stockOutMonth += t.quantity || 0;
            }

            const closingStock = Math.max(0, currentStockAtMonthEnd);
            const openingStock = Math.max(
              0,
              closingStock - stockInMonth + stockOutMonth,
            );

            if (
              prodCreatedAt > monthEnd &&
              openingStock === 0 &&
              stockInMonth === 0 &&
              stockOutMonth === 0 &&
              closingStock === 0
            ) {
              continue;
            }

            const stockInTxs = branchTxs.filter(
              (t: any) => t.type === "Stock In",
            );

            // Extract supplier from recent Stock In transactions
            let txSupplier = "";
            if (stockInTxs.length > 0) {
              const sorted = [...stockInTxs].sort(
                (a: any, b: any) =>
                  new Date(b.date || b.createdAt).getTime() -
                  new Date(a.date || a.createdAt).getTime(),
              );

              for (const t of sorted) {
                if (
                  t.supplier &&
                  typeof t.supplier === "string" &&
                  t.supplier.trim()
                ) {
                  txSupplier = t.supplier.trim();
                  break;
                }
                const combinedNotes = `${t.reasonOrLocation || ""} ${t.notes || ""} ${t.reason || ""}`;
                const match = combinedNotes.match(/Supplier:\s*([^|]+)/i);
                if (match && match[1] && match[1].trim()) {
                  txSupplier = match[1].trim();
                  break;
                }
              }
            }

            const supplierName =
              txSupplier ||
              prod.supplier ||
              (prod.suppliersList && prod.suppliersList.length > 0
                ? prod.suppliersList[0]?.supplierName
                : null) ||
              "-";

            // Fetch the Amount / Price entered on the Stock In form
            let txPurchaseAmount: number | null = null;
            if (stockInTxs.length > 0) {
              const sortedForRate = [...stockInTxs].sort(
                (a: any, b: any) =>
                  new Date(b.date || b.createdAt).getTime() -
                  new Date(a.date || a.createdAt).getTime(),
              );

              for (const t of sortedForRate) {
                if (
                  t.amount !== undefined &&
                  t.amount !== null &&
                  !isNaN(Number(t.amount))
                ) {
                  txPurchaseAmount = Number(t.amount);
                  break;
                }
                if (
                  t.price !== undefined &&
                  t.price !== null &&
                  !isNaN(Number(t.price))
                ) {
                  txPurchaseAmount = Number(t.price);
                  break;
                }
                const combinedNotes = `${t.reasonOrLocation || ""} ${t.notes || ""} ${t.reason || ""}`;
                const match = combinedNotes.match(
                  /Price:\s*₹?\s*([\d,]+(?:\.\d+)?)/i,
                );
                if (match && match[1]) {
                  const parsed = Number(match[1].replace(/,/g, ""));
                  if (!isNaN(parsed)) {
                    txPurchaseAmount = parsed;
                    break;
                  }
                }
              }
            }

            const purchaseRate = (() => {
              if (
                prod.suppliersList &&
                Array.isArray(prod.suppliersList) &&
                supplierName
              ) {
                const match = prod.suppliersList.find(
                  (s: any) =>
                    s.supplierName &&
                    s.supplierName.toLowerCase() === supplierName.toLowerCase(),
                );
                if (
                  match &&
                  match.rate !== undefined &&
                  match.rate !== null &&
                  !isNaN(Number(match.rate))
                ) {
                  return Number(match.rate);
                }
              }
              return Number(prod.price) || 0;
            })();
            const purchaseValue =
              txPurchaseAmount !== null
                ? txPurchaseAmount
                : openingStock * purchaseRate;

            // Get the most recent Stock In transaction for this product/branch to get the purchase date
            let lastPurchaseDate = "-";
            if (stockInTxs.length > 0) {
              // Sort by purchaseDate first, then date, then createdAt
              const sorted = [...stockInTxs].sort((a: any, b: any) => {
                const dateA = a.purchaseDate || a.date || a.createdAt;
                const dateB = b.purchaseDate || b.date || b.createdAt;
                return new Date(dateB).getTime() - new Date(dateA).getTime();
              });

              const latestTx = sorted[0];
              const dateToUse =
                latestTx.purchaseDate || latestTx.date || latestTx.createdAt;

              if (dateToUse) {
                const d = new Date(dateToUse);
                // Only format if it's a valid date
                if (!isNaN(d.getTime())) {
                  lastPurchaseDate = d.toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });
                }
              }
            }

            calculatedReport.push({
              productId: prod.id,
              productName: prod.name,
              category: prod.category || "Uncategorized",
              supplier: supplierName,
              sku: prod.sku || prod.id,
              branch: b,
              openingStock,
              purchaseRate,
              purchaseValue,
              stockIn: stockInMonth,
              stockOut: stockOutMonth,
              closingStock,
              lastPurchaseDate,
            });
          }
        }

        calculatedReport.sort((a, b) => {
          const timeA = a.lastPurchaseDate && a.lastPurchaseDate !== "-" ? new Date(a.lastPurchaseDate).getTime() : 0;
          const timeB = b.lastPurchaseDate && b.lastPurchaseDate !== "-" ? new Date(b.lastPurchaseDate).getTime() : 0;
          const validA = !isNaN(timeA) && timeA > 0;
          const validB = !isNaN(timeB) && timeB > 0;
          if (validA && validB) return timeB - timeA;
          if (validA && !validB) return -1;
          if (!validA && validB) return 1;
          return a.productName.localeCompare(b.productName);
        });

        setMonthlyData(calculatedReport);
      } else {
        toast.error("Failed to load monthly stock calculation");
      }
    } catch (err) {
      console.error("Fetch monthly report error:", err);
      toast.error("Network error while calculating monthly stock");
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
      Month: `${monthLabel} ${selectedYear}`,
      Branch: item.branch,
      Product: item.productName,
      Category: item.category,
      Supplier: item.supplier || "-",
      "OS (Opening Stock)": item.openingStock,
      "Purchase Rate (₹)": item.purchaseRate || 0,
      "Purchase Value (₹)": item.purchaseValue || 0,
      "Incoming Qty (Stock In)": item.stockIn,
      "Stock Out": item.stockOut,
      "Current Stock": item.closingStock,
      "Last Purchase Date": item.lastPurchaseDate || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Stock Summary");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `monthly_stock_report_${monthLabel}_${selectedYear}.xlsx`);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 bg-card p-4 sm:p-5 rounded-xl shadow-lg border border-border/50">
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
          <label className="text-xs sm:text-sm font-medium">Category</label>
          <select
            value={monthlyCategory}
            onChange={(e) => setMonthlyCategory(e.target.value)}
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="All">All Categories</option>
            {categories.map((cat: Category) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">
            Search Product
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-3 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={monthlySearch}
              onChange={(e) => setMonthlySearch(e.target.value)}
              placeholder="Name, ID, SKU..."
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
        <div className="overflow-auto max-h-[calc(100vh-380px)] min-h-[220px] bg-card rounded-xl border border-border shadow-sm">
          <div className="min-w-[768px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/90 backdrop-blur-xs text-muted-foreground border-b border-border sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">
                    Product
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">
                    Category
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">
                    Supplier
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    OS
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Purchase Rate
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Purchase Value
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Stock In
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Stock Out
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-right bg-muted/90">
                    Current Stock
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap text-center bg-muted/90">
                    Last Purchase Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loadingMonthly ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-6 text-center text-muted-foreground"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Calculating monthly stock levels...
                    </td>
                  </tr>
                ) : monthlyData.length ? (
                  monthlyData.map((item, idx) => {
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
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {item.supplier || "-"}
                        </td>
                        <td className="p-3 text-right font-semibold text-muted-foreground">
                          {(item.openingStock ?? 0).toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-mono text-xs">
                          ₹{(item.purchaseRate ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-mono text-xs font-semibold">
                          ₹{(item.purchaseValue ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-500">
                          {(item.stockIn || 0) > 0
                            ? `+${(item.stockIn || 0).toLocaleString()}`
                            : 0}
                        </td>
                        <td className="p-3 text-right font-semibold text-amber-500">
                          {(item.stockOut || 0) > 0
                            ? `-${(item.stockOut || 0).toLocaleString()}`
                            : 0}
                        </td>
                        <td className="p-3 text-right">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold">
                            {(item.closingStock ?? 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="p-3 text-center text-xs text-muted-foreground whitespace-nowrap">
                          {item.lastPurchaseDate || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={10}
                      className="p-6 text-center text-muted-foreground"
                    >
                      No monthly inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
              {!loadingMonthly && monthlyData.length > 0 && (
                <tfoot className="bg-muted/90 font-bold border-t-2 border-border sticky bottom-0 z-10 text-xs sm:text-sm">
                  <tr>
                    <td className="p-3">Total ({monthlyData.length} items)</td>
                    <td className="p-3">-</td>
                    <td className="p-3">-</td>
                    <td className="p-3 text-right text-foreground font-bold">
                      {monthlyData
                        .reduce(
                          (acc, curr) => acc + (curr.openingStock || 0),
                          0,
                        )
                        .toLocaleString()}
                    </td>
                    <td className="p-3 text-right">-</td>
                    <td className="p-3 text-right font-mono text-foreground font-bold">
                      ₹
                      {monthlyData
                        .reduce(
                          (acc, curr) => acc + (curr.purchaseValue || 0),
                          0,
                        )
                        .toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-right text-emerald-500 font-bold">
                      +
                      {monthlyData
                        .reduce((acc, curr) => acc + (curr.stockIn || 0), 0)
                        .toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-amber-500 font-bold">
                      -
                      {monthlyData
                        .reduce((acc, curr) => acc + (curr.stockOut || 0), 0)
                        .toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-primary font-bold">
                      {monthlyData
                        .reduce(
                          (acc, curr) => acc + (curr.closingStock || 0),
                          0,
                        )
                        .toLocaleString()}
                    </td>
                    <td className="p-3 text-center">-</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Results Summary & Export Button */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1 px-1">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {monthlyData.length}
            </span>{" "}
            inventory items for{" "}
            <span className="font-semibold text-foreground">
              {MONTHS.find((m) => m.value === selectedMonth)?.label}{" "}
              {selectedYear}
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
