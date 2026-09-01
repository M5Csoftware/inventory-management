"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowLeft,
  Calendar,
  User,
  Activity,
  Layers,
  Building2,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { useInventory } from "@/context/inventory-context";
import { useAuth } from "@/context/auth-context";

export interface AuditLogItem {
  id: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  category: string;
  details: string;
  target?: string;
  branch?: string;
  ipAddress?: string;
  timestamp: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/inventory";
const DB_HEADER = { "x-database": "m5c-inventory", "Content-Type": "application/json" };

const actionBadgeStyles: Record<string, string> = {
  "Stock In": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "Stock Out": "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Stock Transfer": "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "Product Created": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  "Product Updated": "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  "Product Deleted": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "User Account Created": "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
  "User Account Updated": "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "User Account Deleted": "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
  "Order Created": "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  "Order Updated": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "Order Deleted": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "Category Created": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "Category Added": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "Category Updated": "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  "Category Deleted": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "Supplier Created": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  "Supplier Updated": "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  "Supplier Deleted": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "Asset Assigned": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
  "Asset Returned": "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
  "Maintenance Scheduled": "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
  "Maintenance Updated": "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  "Maintenance Deleted": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  "Asset Serial Created": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
  "Asset Serial Updated": "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  "Asset Serial Deleted": "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

export default function AuditLogPage() {
  const { activeBranch } = useInventory();
  const { user: currentUser } = useAuth();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [branchFilter, setBranchFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAuditLogs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams();

      if (branchFilter !== "All") queryParams.append("branch", branchFilter);
      if (categoryFilter !== "All") queryParams.append("category", categoryFilter);
      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());
      if (startDate) queryParams.append("startDate", startDate);
      if (endDate) queryParams.append("endDate", endDate);

      const url = `${API_BASE}/audit-logs?${queryParams.toString()}`;
      const res = await fetch(url, {
        headers: {
          ...DB_HEADER,
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const sorted = [...data.data].sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA;
        });
        setLogs(sorted);
        if (isManualRefresh) toast.success("Audit log records refreshed");
      } else {
        toast.error(data.message || "Failed to load audit logs");
      }
    } catch (err) {
      toast.error("Network error while fetching system audit logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [categoryFilter, branchFilter, startDate, endDate]);

  // Handle client-side search filtering on current logs
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          log.userName?.toLowerCase().includes(q) ||
          log.userEmail?.toLowerCase().includes(q) ||
          log.action?.toLowerCase().includes(q) ||
          log.details?.toLowerCase().includes(q) ||
          log.target?.toLowerCase().includes(q) ||
          log.id?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
  }, [logs, searchQuery]);

  // Statistics Metrics
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const stockEvents = filteredLogs.filter((l) => l.category === "Stock").length;
    const masterEvents = filteredLogs.filter(
      (l) => l.category === "Products" || l.category === "Users" || l.category === "Categories"
    ).length;
    const uniqueUsers = new Set(filteredLogs.map((l) => l.userName)).size;
    return { total, stockEvents, masterEvents, uniqueUsers };
  }, [filteredLogs]);

  // CSV Export handler
  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      toast.warn("No audit log data available to export");
      return;
    }

    const headers = [
      "Log ID",
      "Timestamp",
      "User Name",
      "User Email",
      "User Role",
      "Action",
      "Category",
      "Activity Narrative",
      "Target Entity",
      "Facility Branch",
      "IP Address",
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id || ""}"`,
      `"${new Date(log.timestamp).toLocaleString("en-IN")}"`,
      `"${log.userName || ""}"`,
      `"${log.userEmail || ""}"`,
      `"${log.userRole || ""}"`,
      `"${log.action || ""}"`,
      `"${log.category || ""}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
      `"${log.target || ""}"`,
      `"${log.branch || "Global"}"`,
      `"${log.ipAddress || "127.0.0.1"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Audit log exported to CSV");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All");
    setBranchFilter("All");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="p-4 sm:p-8 w-full space-y-6 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Master Audit Log
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Universal Activity Trail
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Comprehensive timeline of all user activities, stock additions/removals, role updates, and system events.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchAuditLogs(true)}
            disabled={refreshing}
            className="h-10 px-3.5 gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={exportToCSV}
            className="h-10 px-4 gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total Audit Entries
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {stats.total}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Stock Movements
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {stats.stockEvents}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Master &amp; User Changes
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {stats.masterEvents}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80 backdrop-blur-sm shadow-xs">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Active Contributors
              </p>
              <h3 className="text-2xl font-bold tracking-tight text-foreground mt-0.5">
                {stats.uniqueUsers} Users
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Control Bar */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search user, action, target, or narrative..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
              >
                <option value="All">📂 All Categories</option>
                <option value="Stock">📦 Stock Operations</option>
                <option value="Products">🏷️ Products</option>
                <option value="Users">👥 Users &amp; Roles</option>
                <option value="Orders">🛒 Orders</option>
                <option value="Assets">💻 Assets</option>
                <option value="Categories">🏷️ Categories</option>
                <option value="Suppliers">🤝 Suppliers</option>
                <option value="System">⚙️ System</option>
              </select>
            </div>

            {/* Branch Filter */}
            <div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
              >
                <option value="All">🏭 All Branches</option>
                <option value="Ahmedabad">🏭 Ahmedabad</option>
                <option value="Delhi">🏭 Delhi (HO)</option>
                <option value="Ludhiana">🏭 Ludhiana</option>
                <option value="Mumbai">🏭 Mumbai</option>
                <option value="Global">🌐 Global</option>
              </select>
            </div>

            {/* Date Range Start */}
            <div>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  title="From Date"
                  placeholder="From Date"
                />
              </div>
            </div>

            {/* Date Range End */}
            <div>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-10 px-3 text-xs bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  title="To Date"
                  placeholder="To Date"
                />
              </div>
            </div>
          </div>

          {(searchQuery || categoryFilter !== "All" || branchFilter !== "All" || startDate || endDate) && (
            <div className="flex items-center justify-between border-t pt-3">
              <p className="text-xs text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredLogs.length}</span> matching audit records
              </p>
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Audit Log Table */}
      <Card className="border-border/60 shadow-xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border/50 font-semibold tracking-wider">
              <tr>
                <th className="p-4 text-left">Log ID &amp; Time</th>
                <th className="p-4 text-left">User Contributor</th>
                <th className="p-4 text-left">Action &amp; Category</th>
                <th className="p-4 text-left">Activity Narrative</th>
                <th className="p-4 text-left">Target Entity</th>
                <th className="p-4 text-left">Branch Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading system audit timeline...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground">
                    No audit logs found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const badgeStyle =
                    actionBadgeStyles[log.action] ||
                    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                      {/* Log ID & Timestamp */}
                      <td className="p-4">
                        <div className="font-mono font-bold text-xs text-foreground">
                          {log.id}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                          <span>
                            {new Date(log.timestamp).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* User Contributor */}
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                            {(log.userName || currentUser?.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-foreground">
                              {log.userName || currentUser?.name || "System User"}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {log.userRole || currentUser?.role || "User"} {log.userEmail || currentUser?.email ? `• ${log.userEmail || currentUser?.email}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action & Category */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeStyle}`}
                          >
                            {log.action}
                          </span>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            Category: <span className="text-foreground font-semibold">{log.category}</span>
                          </div>
                        </div>
                      </td>

                      {/* Activity Narrative */}
                      <td className="p-4 max-w-xs sm:max-w-md">
                        <p className="text-xs text-foreground leading-relaxed font-medium">
                          {log.details}
                        </p>
                      </td>

                      {/* Target Entity */}
                      <td className="p-4">
                        {log.target ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/50">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            {log.target}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Branch Scope */}
                      <td className="p-4">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted/60 text-foreground border border-border/40 inline-flex items-center gap-1">
                          🏭 {log.branch || "Global"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
