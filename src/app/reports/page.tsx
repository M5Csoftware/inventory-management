/* src/app/reports/page.tsx */
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { ChevronDown, Download } from "lucide-react";

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

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // filter state
  const [branch, setBranch] = useState<string>("All");
  const [productId, setProductId] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      if (branch && branch !== "All") params.append("branch", branch);
      if (productId) params.append("productId", productId);
      if (type) params.append("type", type);
      if (startDate) params.append("startDate", startDate.toISOString());
      if (endDate) params.append("endDate", endDate.toISOString());

      const res = await fetch(`${API_BASE}/reports?${params.toString()}`, {
        headers: { ...DB_HEADER, Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data);
      } else {
        toast.error(data.message || "Failed to load report");
      }
    } catch (err) {
      toast.error("Network error while fetching report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportToExcel = () => {
    if (!transactions.length) {
      toast.info("No data to export");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(transactions);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(
      blob,
      `inventory_report_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const handleApplyFilters = () => {
    fetchReport();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <h1 className="text-2xl sm:text-4xl font-bold bg-linear-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
        Reports &amp; Analytics
      </h1>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-card p-3 sm:p-4 rounded-xl shadow-lg">
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">Branch</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm"
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
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs sm:text-sm font-medium">
            Transaction Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm"
          >
            <option value="">All Types</option>
            <option value="Stock In">Stock In</option>
            <option value="Stock Out">Stock Out</option>
          </select>
        </div>
        <div className="space-y-2 flex flex-col">
          <label className="text-xs sm:text-sm font-medium">Date Range</label>
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              placeholderText="Start"
              className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm"
            />
            <DatePicker
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate ?? undefined}
              placeholderText="End"
              className="w-full h-10 px-3 py-2 bg-background border border-border rounded text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleApplyFilters}
          className="col-span-1 sm:col-span-2 lg:col-span-4 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg text-sm sm:text-base"
        >
          <ChevronDown className="w-4 h-4" />
          Apply Filters
        </button>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button
          onClick={exportToExcel}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 sm:py-2 rounded-xl shadow text-sm"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[640px] px-4 sm:px-0">
          <table className="w-full text-sm text-left border border-border rounded-lg">
            <thead className="bg-muted/30 text-muted-foreground">
              <tr>
                <th className="p-2 font-medium whitespace-nowrap">Date</th>
                <th className="p-2 font-medium whitespace-nowrap">Branch</th>
                <th className="p-2 font-medium whitespace-nowrap">Product</th>
                <th className="p-2 font-medium whitespace-nowrap">Type</th>
                <th className="p-2 font-medium whitespace-nowrap">Qty</th>
                <th className="p-2 font-medium whitespace-nowrap">
                  Location / Reason
                </th>
                <th className="p-2 font-medium whitespace-nowrap">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-muted-foreground"
                  >
                    Loading report...
                  </td>
                </tr>
              ) : transactions.length ? (
                transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="p-2 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="p-2 whitespace-nowrap">{t.branch}</td>
                    <td className="p-2 whitespace-nowrap">
                      {t.productName} ({t.productId})
                    </td>
                    <td className="p-2 whitespace-nowrap">{t.type}</td>
                    <td className="p-2 font-medium">{t.quantity}</td>
                    <td className="p-2">{t.reasonOrLocation}</td>
                    <td className="p-2">{t.notes || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-muted-foreground"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
