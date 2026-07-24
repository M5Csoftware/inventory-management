/* src/app/reports/transactions/page.tsx */
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import {
  Download,
  RefreshCw,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string; // ISO string
  productId: string;
  productName: string;
  type: string; // 'Stock In' | 'Stock Out'
  quantity: number;
  reasonOrLocation: string;
  notes?: string;
  branch: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/inventory";
const DB_HEADER = {
  "x-database": "m5c-inventory",
  "Content-Type": "application/json",
};

export default function TransactionsReportPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [branch, setBranch] = useState<string>("All");
  const [productId, setProductId] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const fetchTransactionsReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { ...DB_HEADER };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams();
      if (branch && branch !== "All") params.append("branch", branch);
      if (productId) params.append("productId", productId);
      if (type) params.append("type", type);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      let res = await fetch(`${API_BASE}/reports?${params.toString()}`, {
        headers,
      });

      // Fallback to /transactions if /reports endpoint returns 404 (e.g. live Render server)
      if (res.status === 404) {
        const branchQuery = branch && branch !== "All" ? `?branch=${branch}` : "";
        res = await fetch(`${API_BASE}/transactions${branchQuery}`, {
          headers: { "x-database": "m5c-inventory" },
        });
      }

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        let list: Transaction[] = data.data || [];

        // Apply client side filters if fallback was triggered
        if (productId.trim()) {
          const q = productId.toLowerCase().trim();
          list = list.filter(
            (t) =>
              t.productId.toLowerCase().includes(q) ||
              t.productName.toLowerCase().includes(q)
          );
        }
        if (type) {
          list = list.filter((t) => t.type === type);
        }
        if (startDate || endDate) {
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;
          list = list.filter((t) => {
            const d = new Date(t.date);
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
          });
        }

        setTransactions(list);
      } else {
        toast.error(data.message || "Failed to load transaction report");
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
      toast.error("Network error while fetching transaction report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionsReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportToExcel = () => {
    if (!transactions.length) {
      toast.info("No transaction data to export");
      return;
    }
    const exportData = transactions.map((t) => ({
      Date: new Date(t.date).toLocaleDateString(),
      "Transaction ID": t.id,
      Branch: t.branch,
      "Product ID": t.productId,
      "Product Name": t.productName,
      Type: t.type,
      Quantity: t.quantity,
      "Reason / Location": t.reasonOrLocation,
      Notes: t.notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaction History");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(
      blob,
      `transaction_report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Transaction History Report
        </h1>
      </div>

      {/* Filters Bar - Single Row Alignment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 bg-card p-4 sm:p-5 rounded-xl shadow-lg border border-border/50">
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
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
          <label className="text-xs sm:text-sm font-medium">Product ID</label>
          <input
            type="text"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            placeholder="e.g. PROD-001"
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">
            Transaction Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="Stock In">Stock In</option>
            <option value="Stock Out">Stock Out</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Date Range</label>
          <div className="flex gap-2 items-center">
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start"
              className="w-full h-10 px-2 py-2 bg-background border border-border rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate ?? undefined}
              placeholderText="End"
              className="w-full h-10 px-2 py-2 bg-background border border-border rounded text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2 flex items-end">
          <button
            onClick={fetchTransactionsReport}
            className="w-full h-10 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 rounded-xl hover:bg-primary/90 transition-all shadow-md text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Table & Export Bar */}
      <div className="space-y-2">
        <div className="overflow-auto max-h-[calc(100vh-220px)] min-h-[500px] bg-card rounded-xl border border-border shadow-sm">
          <div className="min-w-[640px]">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-muted/90 backdrop-blur-xs text-muted-foreground border-b border-border sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Date</th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Branch</th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Product</th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Type</th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Qty</th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">
                    Location / Reason
                  </th>
                  <th className="p-3 font-semibold whitespace-nowrap bg-muted/90">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                      Loading transaction report...
                    </td>
                  </tr>
                ) : transactions.length ? (
                  transactions.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 whitespace-nowrap font-medium">
                        {t.branch}
                      </td>
                      <td className="p-3 whitespace-nowrap font-medium">
                        {t.productName}{" "}
                        <span className="text-xs text-muted-foreground font-mono">
                          ({t.productId})
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                            t.type === "Stock In"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-amber-500/10 text-amber-500"
                          )}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{t.quantity}</td>
                      <td className="p-3 text-xs">{t.reasonOrLocation}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {t.notes || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      No transactions found for selected filters.
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
            Showing <span className="font-semibold text-foreground">{transactions.length}</span> transaction records
          </p>
          <button
            onClick={exportToExcel}
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
