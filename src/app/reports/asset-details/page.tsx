"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Laptop,
  Search,
  Filter,
  Download,
  Printer,
  RefreshCw,
  User,
  Building2,
  CheckCircle2,
  Clock,
  Wrench,
  X,
  Eye,
  ShieldCheck,
  Tag,
  Sparkles,
  Users,
  AlertCircle,
  Calendar,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/context/inventory-context";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/inventory";

interface AssetAssignment {
  _id?: string;
  id: string;
  productId: string;
  productName: string;
  assignedToName: string;
  assignedToEmail: string;
  branch: string;
  assignedDate: string;
  returnDate?: string;
  status: "Assigned" | "Returned" | "Maintenance" | "Available" | string;
  serialNumber?: string;
  remarks?: string;
}

export default function AssetDetailsReportPage() {
  const { activeBranch } = useInventory();
  const [assets, setAssets] = useState<AssetAssignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // View modes: "audit" | "custodians" | "branch-breakdown"
  const [viewMode, setViewMode] = useState<"audit" | "custodians" | "branch-breakdown">("audit");

  // Filters
  const [branchFilter, setBranchFilter] = useState<string>(activeBranch || "All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [durationFilter, setDurationFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Drawer modal state & tabs
  const [selectedAsset, setSelectedAsset] = useState<AssetAssignment | null>(null);
  const [drawerTab, setDrawerTab] = useState<"overview" | "custodian" | "lifecycle">("overview");

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

      const params = new URLSearchParams();
      if (branchFilter && branchFilter !== "All") {
        params.append("branch", branchFilter);
      }

      const res = await fetch(`${API_BASE}/assets?${params.toString()}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.success) {
        setAssets(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load asset details report:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [branchFilter]);

  // Compute days assigned
  const getDaysAssigned = (assignedDateStr: string) => {
    if (!assignedDateStr) return 0;
    const start = new Date(assignedDateStr).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  // Filtered dataset
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Status filter
      if (statusFilter !== "All" && asset.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Duration filter
      const days = getDaysAssigned(asset.assignedDate);
      if (durationFilter === "recent" && days >= 30) return false;
      if (durationFilter === "mid" && (days < 30 || days > 90)) return false;
      if (durationFilter === "long" && days <= 90) return false;

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchId = asset.id?.toLowerCase().includes(term);
        const matchProduct = asset.productName?.toLowerCase().includes(term);
        const matchName = asset.assignedToName?.toLowerCase().includes(term);
        const matchEmail = asset.assignedToEmail?.toLowerCase().includes(term);
        const matchSerial = asset.serialNumber?.toLowerCase().includes(term);
        const matchBranch = asset.branch?.toLowerCase().includes(term);

        if (!matchId && !matchProduct && !matchName && !matchEmail && !matchSerial && !matchBranch) {
          return false;
        }
      }

      return true;
    });
  }, [assets, statusFilter, durationFilter, searchTerm]);

  // Metrics summary
  const metrics = useMemo(() => {
    let assignedCount = 0;
    let returnedCount = 0;
    let maintenanceCount = 0;
    let longTermCount = 0;

    filteredAssets.forEach((a) => {
      const st = (a.status || "").toLowerCase();
      if (st === "assigned") assignedCount++;
      else if (st === "returned" || st === "available") returnedCount++;
      else if (st === "maintenance") maintenanceCount++;

      if (getDaysAssigned(a.assignedDate) > 90 && st === "assigned") {
        longTermCount++;
      }
    });

    const utilizationRate =
      filteredAssets.length > 0
        ? Math.round((assignedCount / filteredAssets.length) * 100)
        : 0;

    return {
      total: filteredAssets.length,
      assignedCount,
      returnedCount,
      maintenanceCount,
      longTermCount,
      utilizationRate,
    };
  }, [filteredAssets]);

  // Custodian Grouping Summary
  const custodianSummary = useMemo(() => {
    const map: Record<
      string,
      { name: string; email: string; branch: string; assetCount: number; assets: AssetAssignment[] }
    > = {};

    filteredAssets.forEach((a) => {
      const key = (a.assignedToEmail || a.assignedToName || "Unassigned").toLowerCase();
      if (!map[key]) {
        map[key] = {
          name: a.assignedToName || "Unknown",
          email: a.assignedToEmail || "No Email",
          branch: a.branch || "All",
          assetCount: 0,
          assets: [],
        };
      }
      map[key].assetCount += 1;
      map[key].assets.push(a);
    });

    return Object.values(map).sort((a, b) => b.assetCount - a.assetCount);
  }, [filteredAssets]);

  // Branch Summary Breakdown
  const branchSummary = useMemo(() => {
    const branches = ["Delhi", "Ahmedabad", "Ludhiana", "Mumbai"];
    return branches.map((br) => {
      const branchAssets = filteredAssets.filter((a) => a.branch === br);
      const assigned = branchAssets.filter((a) => a.status?.toLowerCase() === "assigned").length;
      const returned = branchAssets.filter((a) => a.status?.toLowerCase() === "returned").length;
      const maintenance = branchAssets.filter((a) => a.status?.toLowerCase() === "maintenance").length;

      return {
        branch: br,
        total: branchAssets.length,
        assigned,
        returned,
        maintenance,
      };
    });
  }, [filteredAssets]);

  // Export CSV
  const exportToCSV = () => {
    const headers = [
      "Asset Tag/ID",
      "Product / Asset Name",
      "Serial Number",
      "Branch",
      "Assigned To (Name)",
      "Assigned To (Email)",
      "Assigned Date",
      "Days Active",
      "Return Date",
      "Status",
      "Remarks",
    ];

    const rows = filteredAssets.map((a) => {
      const days = getDaysAssigned(a.assignedDate);
      return [
        `"${a.id || ""}"`,
        `"${(a.productName || "").replace(/"/g, '""')}"`,
        `"${a.serialNumber || "N/A"}"`,
        `"${a.branch || ""}"`,
        `"${(a.assignedToName || "").replace(/"/g, '""')}"`,
        `"${a.assignedToEmail || ""}"`,
        `"${a.assignedDate ? new Date(a.assignedDate).toLocaleDateString() : ""}"`,
        days,
        `"${a.returnDate ? new Date(a.returnDate).toLocaleDateString() : ""}"`,
        `"${a.status || "Assigned"}"`,
        `"${(a.remarks || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `asset_details_report_${branchFilter.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 w-full print:p-0">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Asset Details Report
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
              <ShieldCheck className="w-3 h-3" /> Equipment Audit &amp; Lifecycle
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Complete audit log of IT hardware, custodian employee mapping, serial numbers, active assignment durations, and maintenance logs.
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
            disabled={filteredAssets.length === 0}
            className="h-9 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold">M5C Logistics — Asset Details Report</h1>
        <p className="text-sm text-gray-600">
          Branch Scope: {branchFilter} | Generated on: {new Date().toLocaleString()}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 print:grid-cols-5">
        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Assets
            </CardTitle>
            <Laptop className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Logged equipment items</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Assigned
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.assignedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Utilization: {metrics.utilizationRate}%</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Returned / Stock
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {metrics.returnedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available for re-issue</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              In Repair
            </CardTitle>
            <Wrench className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {metrics.maintenanceCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Undergoing service</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/60 col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Long-term (&gt;90 Days)
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metrics.longTermCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Extended deployment</p>
          </CardContent>
        </Card>
      </div>

      {/* View Switcher Tabs & Filter Bar */}
      <div className="flex flex-col space-y-4 print:hidden">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
            <button
              onClick={() => setViewMode("audit")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "audit"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Asset Audit Log</span>
            </button>
            <button
              onClick={() => setViewMode("custodians")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "custodians"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Employee Custodians ({custodianSummary.length})</span>
            </button>
            <button
              onClick={() => setViewMode("branch-breakdown")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === "branch-breakdown"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Branch Breakdown</span>
            </button>
          </div>

          <div className="text-xs text-muted-foreground hidden sm:block">
            Showing <span className="font-bold text-foreground">{filteredAssets.length}</span> of {assets.length} assets
          </div>
        </div>

        {/* Filter Controls Bar */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search Tag, Serial, Asset Name, Person..."
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

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">All Asset Statuses</option>
                  <option value="Assigned">🔵 Assigned</option>
                  <option value="Returned">🟢 Returned</option>
                  <option value="Maintenance">🟠 Maintenance</option>
                </select>
              </div>

              {/* Deployment Duration Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={durationFilter}
                  onChange={(e) => setDurationFilter(e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="All">All Deployment Durations</option>
                  <option value="recent">Recent (&lt; 30 Days)</option>
                  <option value="mid">Standard (30 - 90 Days)</option>
                  <option value="long">Long Term (&gt; 90 Days)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VIEW 1: Asset Audit Log Table */}
      {viewMode === "audit" && (
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-3.5 px-4">Asset ID</th>
                  <th className="py-3.5 px-4">Product / Asset Name</th>
                  <th className="py-3.5 px-4">Serial Number</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4">Assigned Custodian</th>
                  <th className="py-3.5 px-4 text-center">Assigned Date</th>
                  <th className="py-3.5 px-4 text-center">Duration</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                      Loading Asset Details Report...
                    </td>
                  </tr>
                ) : filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      No asset records found matching your current filter selection.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset) => {
                    const status = asset.status || "Assigned";
                    const daysActive = getDaysAssigned(asset.assignedDate);

                    return (
                      <tr
                        key={asset.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setDrawerTab("overview");
                        }}
                      >
                        <td className="py-3 px-4 font-mono font-medium text-xs text-purple-600 dark:text-purple-400">
                          {asset.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {asset.productName}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {asset.serialNumber || "N/A"}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-accent/50 text-foreground font-medium">
                            <Building2 className="h-3 w-3 text-muted-foreground" />
                            {asset.branch}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-xs flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {asset.assignedToName}
                          </div>
                          {asset.assignedToEmail && (
                            <div className="text-[11px] text-muted-foreground">
                              {asset.assignedToEmail}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                          {asset.assignedDate
                            ? new Date(asset.assignedDate).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium ${
                              daysActive > 90
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {daysActive} days
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {status.toLowerCase() === "assigned" && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20">
                              Assigned
                            </span>
                          )}
                          {status.toLowerCase() === "returned" && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">
                              Returned
                            </span>
                          )}
                          {status.toLowerCase() === "maintenance" && (
                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20">
                              Maintenance
                            </span>
                          )}
                        </td>
                        <td
                          className="py-3 px-4 text-center print:hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-purple-600"
                            onClick={() => {
                              setSelectedAsset(asset);
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

      {/* VIEW 2: Employee Custodians Breakdown */}
      {viewMode === "custodians" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {custodianSummary.map((cust) => (
            <Card key={cust.email} className="border-border/60 shadow-sm hover:border-purple-500/50 transition-all">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-sm">
                      {cust.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{cust.name}</CardTitle>
                      <CardDescription className="text-xs">{cust.email}</CardDescription>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                    {cust.assetCount} Assets
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Assigned Hardware List
                </div>
                <div className="space-y-2">
                  {cust.assets.map((ast) => (
                    <div
                      key={ast.id}
                      className="p-2.5 rounded-lg bg-muted/30 border border-border/40 flex items-center justify-between text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedAsset(ast);
                        setDrawerTab("overview");
                      }}
                    >
                      <div>
                        <div className="font-semibold text-foreground">{ast.productName}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">SN: {ast.serialNumber || "N/A"}</div>
                      </div>
                      <span className="font-mono text-purple-600 dark:text-purple-400 font-medium">{ast.id}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* VIEW 3: Branch Summary Breakdown */}
      {viewMode === "branch-breakdown" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {branchSummary.map((b) => (
            <Card key={b.branch} className="border-border/60 shadow-sm">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-500" />
                    {b.branch}
                  </CardTitle>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold bg-muted">
                    {b.total} Assets
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-blue-500/10 text-xs">
                  <span className="text-blue-700 dark:text-blue-400 font-medium">Assigned to Staff</span>
                  <span className="font-bold text-sm text-blue-700 dark:text-blue-400">{b.assigned}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-emerald-500/10 text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Returned / Available</span>
                  <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">{b.returned}</span>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-amber-500/10 text-xs">
                  <span className="text-amber-700 dark:text-amber-400 font-medium">Under Repair</span>
                  <span className="font-bold text-sm text-amber-700 dark:text-amber-400">{b.maintenance}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Slide-over Detail Drawer */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm print:hidden">
          <div className="w-full max-w-lg bg-card border-l border-border shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-xs mb-1 text-purple-600 border-purple-500/30">
                  {selectedAsset.id}
                </span>
                <h2 className="text-xl font-bold">{selectedAsset.productName}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAsset(null)}
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
                onClick={() => setDrawerTab("custodian")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  drawerTab === "custodian" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Custodian Details
              </button>
              <button
                onClick={() => setDrawerTab("lifecycle")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  drawerTab === "lifecycle" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Lifecycle Audit
              </button>
            </div>

            {/* Tab 1: Overview */}
            {drawerTab === "overview" && (
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Equipment Identifiers
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                      <span className="text-xs text-muted-foreground block">Serial Number</span>
                      <span className="font-mono font-medium">{selectedAsset.serialNumber || "N/A"}</span>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                      <span className="text-xs text-muted-foreground block">Current Status</span>
                      <span className="font-semibold">{selectedAsset.status || "Assigned"}</span>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                      <span className="text-xs text-muted-foreground block">Facility Branch</span>
                      <span className="font-medium">{selectedAsset.branch}</span>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                      <span className="text-xs text-muted-foreground block">Days Deployed</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {getDaysAssigned(selectedAsset.assignedDate)} Days
                      </span>
                    </div>
                  </div>
                </div>

                {selectedAsset.remarks && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Condition &amp; Remarks
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/20 border border-border/40">
                      {selectedAsset.remarks}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Custodian */}
            {drawerTab === "custodian" && (
              <div className="space-y-4 flex-1">
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-base">
                      {selectedAsset.assignedToName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-base">{selectedAsset.assignedToName}</h4>
                      <p className="text-xs text-muted-foreground">{selectedAsset.assignedToEmail}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground border-t border-purple-500/20 pt-2 flex justify-between">
                    <span>Branch Location:</span>
                    <span className="font-semibold text-foreground">{selectedAsset.branch}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Lifecycle */}
            {drawerTab === "lifecycle" && (
              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                    <span className="text-xs text-muted-foreground block">Assigned Date</span>
                    <span className="font-medium">
                      {selectedAsset.assignedDate
                        ? new Date(selectedAsset.assignedDate).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-lg border border-border/50">
                    <span className="text-xs text-muted-foreground block">Return Date</span>
                    <span className="font-medium">
                      {selectedAsset.returnDate
                        ? new Date(selectedAsset.returnDate).toLocaleDateString()
                        : "Active"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-accent/40 border border-border/50 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deployment Status:</span>
                    <span className="font-semibold">{selectedAsset.status || "Assigned"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Active Days:</span>
                    <span className="font-bold">{getDaysAssigned(selectedAsset.assignedDate)} days</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => setSelectedAsset(null)}
            >
              Close Drawer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
