"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  ArrowLeft,
  UserCheck,
  Lock,
  User,
  RefreshCw,
  CheckCircle2,
  Save,
} from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SIDEBAR_TABS_STRUCTURE, SidebarFolderGroup } from "../../new/page";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/inventory";
const DB_HEADER = { "x-database": "m5c-inventory", "Content-Type": "application/json" };

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // User credentials
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "stock_manager" | "invoice_manager" | "custom">("stock_manager");
  const [branch, setBranch] = useState("Ahmedabad");

  // Selected sidebar tabs (array of route paths)
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/users/${userId}`, {
          headers: {
            ...DB_HEADER,
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (data.success && data.data) {
          const u = data.data;
          setName(u.name || "");
          setEmail(u.email || "");
          const r = (u.role as any) || "stock_manager";
          setRole(r);
          setBranch(u.branch || "Ahmedabad");
          setSelectedTabs(u.permissions || []);
        } else {
          toast.error(data.message || "Failed to load user details");
        }
      } catch (err) {
        toast.error("Network error while fetching user");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  // Toggle individual tab
  const toggleTab = (path: string) => {
    setSelectedTabs((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  // Select or Deselect entire folder tabs
  const toggleFolderTabs = (folderGroup: SidebarFolderGroup) => {
    const folderPaths = folderGroup.tabs.map((t) => t.path);
    const allSelected = folderPaths.every((p) => selectedTabs.includes(p));

    if (allSelected) {
      setSelectedTabs((prev) => prev.filter((p) => !folderPaths.includes(p)));
    } else {
      setSelectedTabs((prev) => Array.from(new Set([...prev, ...folderPaths])));
    }
  };

  // Quick Preset Actions
  const applyPreset = (preset: "all" | "standard" | "invoice" | "reports" | "clear") => {
    if (preset === "all") {
      setRole("admin");
      const allPaths = SIDEBAR_TABS_STRUCTURE.flatMap((f) => f.tabs.map((t) => t.path));
      setSelectedTabs(allPaths);
    } else if (preset === "standard") {
      setRole("stock_manager");
      setSelectedTabs([
        "/",
        "/stock",
        "/stock/in",
        "/stock/out",
        "/stock/transfer",
        "/stock/alerts",
        "/products",
        "/categories",
        "/reports/transactions",
      ]);
    } else if (preset === "invoice") {
      setRole("invoice_manager");
      setSelectedTabs([
        "/",
        "/invoice",
        "/invoice/new",
        "/invoice/approvals",
        "/invoice/audit",
      ]);
    } else if (preset === "reports") {
      setRole("custom");
      setSelectedTabs([
        "/",
        "/stock",
        "/products",
        "/categories",
        "/suppliers",
        "/orders",
        "/reports/transactions",
        "/reports/monthly-stock",
        "/reports/product-details",
        "/reports/asset-details",
      ]);
    } else {
      setRole("custom");
      setSelectedTabs([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    if (password.trim() && password !== confirmPassword) {
      toast.error("New Password and Confirm Password do not match");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const isFullAdmin = role === "admin";
      const updatePayload: Record<string, any> = {
        name,
        email,
        role,
        branch,
        permissions: isFullAdmin ? ["*"] : selectedTabs,
      };
      if (password.trim()) {
        updatePayload.password = password;
      }

      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: "PUT",
        headers: {
          ...DB_HEADER,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatePayload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("User account & tab permissions updated successfully!");
        router.push("/manage-roles");
      } else {
        toast.error(data.message || "Failed to update user");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span>Loading user account &amp; permissions...</span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/manage-roles"
            className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Edit User &amp; Permissions
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-600 border-purple-500/20">
                <UserCheck className="w-3.5 h-3.5" /> ID: {userId}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Modify credentials for <span className="font-semibold text-foreground">{name}</span> ({email}).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/manage-roles">
            <Button variant="outline" className="h-10 px-4">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            form="edit-user-form"
            disabled={submitting}
            className="h-10 px-5 gap-2 bg-primary text-primary-foreground font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "Saving Changes..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-6">
        {/* ROW 1: Profile Credentials (Left) & Account Access Role (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Profile Credentials */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-primary" /> Profile Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Update account name, email login, password, and branch
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    New Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Keep current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Confirm Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full h-10 px-3.5 text-sm bg-background border rounded-lg focus:outline-none focus:ring-1 transition-colors ${
                      password && confirmPassword && confirmPassword !== password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-input focus:ring-primary"
                    }`}
                  />
                  {password && confirmPassword && confirmPassword !== password && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Assigned Branch Scope
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                >
                  <option value="Ahmedabad">🏭 Ahmedabad Branch</option>
                  <option value="Delhi">🏭 Delhi (HO)</option>
                  <option value="Ludhiana">🏭 Ludhiana Branch</option>
                  <option value="Mumbai">🏭 Mumbai Branch</option>
                  <option value="All">🌐 All Branches (Global)</option>
                </select>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">
                  Selecting &quot;All Branches (Global)&quot; enables branch switching and viewing data across all branches for any assigned role.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Account Access Role */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="w-4.5 h-4.5 text-purple-500" /> Account Access Role
              </CardTitle>
              <CardDescription className="text-xs">
                Select role preset template or customize tab permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <button
                type="button"
                onClick={() => applyPreset("all")}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  role === "admin"
                    ? "border-purple-500 bg-purple-500/10 text-foreground ring-1 ring-purple-500 shadow-xs"
                    : "border-border/60 bg-card hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                    👑
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Full Admin</div>
                    <div className="text-xs text-muted-foreground">See all sidebar folders &amp; system tabs</div>
                  </div>
                </div>
                {role === "admin" && <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => applyPreset("standard")}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  role === "stock_manager"
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary shadow-xs"
                    : "border-border/60 bg-card hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    📦
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Stock Operations Manager</div>
                    <div className="text-xs text-muted-foreground">Standard stock &amp; product sidebar tabs</div>
                  </div>
                </div>
                {role === "stock_manager" && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => applyPreset("invoice")}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  role === "invoice_manager"
                    ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500 shadow-xs"
                    : "border-border/60 bg-card hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0">
                    🧾
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Invoice &amp; Inward Specialist</div>
                    <div className="text-xs text-muted-foreground">Inward Invoice check-in, approvals &amp; audit history</div>
                  </div>
                </div>
                {role === "invoice_manager" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => applyPreset("reports")}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  role === "custom"
                    ? "border-blue-500 bg-blue-500/10 text-foreground ring-1 ring-blue-500 shadow-xs"
                    : "border-border/60 bg-card hover:bg-accent/40 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                    📑
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">Custom Tab Access</div>
                    <div className="text-xs text-muted-foreground">Handpick individual sidebar tabs below</div>
                  </div>
                </div>
                {role === "custom" && <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />}
              </button>
            </CardContent>
          </Card>
        </div>

        {/* ROW 2: Full Width Sidebar Tab Permissions */}
        <Card className="border-border/60 shadow-sm w-full">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Lock className="w-4.5 h-4.5 text-primary" /> Sidebar Tab Permissions
                </CardTitle>
                <CardDescription className="text-xs">
                  Check the exact tabs this user will be allowed to see in their sidebar menu.
                </CardDescription>
              </div>

              {/* Preset Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => applyPreset("all")}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-accent hover:bg-accent/80 text-foreground transition-colors"
                >
                  Select All Tabs
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("standard")}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-accent hover:bg-accent/80 text-foreground transition-colors"
                >
                  Standard Preset
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("clear")}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-accent hover:bg-accent/80 text-muted-foreground transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-5 space-y-6">
            {role === "admin" && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Full Admin Mode: User will see all sidebar tabs.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SIDEBAR_TABS_STRUCTURE.map((group) => {
                const selectedCount = group.tabs.filter((t) => selectedTabs.includes(t.path)).length;
                const allSelected = selectedCount === group.tabs.length;

                return (
                  <div
                    key={group.folder}
                    className="rounded-xl border border-border/60 bg-card p-4 space-y-3 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Folder Section Header */}
                      <div className="flex items-center justify-between border-b pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{group.icon}</span>
                          <span className="font-bold text-sm text-foreground">{group.folder}</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            ({selectedCount}/{group.tabs.length})
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={role === "admin"}
                          onClick={() => toggleFolderTabs(group)}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
                        >
                          {allSelected ? "Hide All" : "Show All"}
                        </button>
                      </div>

                      {/* List of Sidebar Tabs */}
                      <div className="space-y-2">
                        {group.tabs.map((tab) => {
                          const isVisible = role === "admin" || selectedTabs.includes(tab.path);

                          return (
                            <label
                              key={tab.path}
                              className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                                isVisible
                                  ? "bg-primary/10 border-primary/40 text-foreground font-semibold"
                                  : "bg-muted/20 border-border/40 text-muted-foreground hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  disabled={role === "admin"}
                                  checked={isVisible}
                                  onChange={() => toggleTab(tab.path)}
                                  className="rounded border-input text-primary focus:ring-primary h-4 w-4 shrink-0 cursor-pointer"
                                />
                                <span className="text-xs truncate">{tab.label}</span>
                              </div>

                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                                  isVisible
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {isVisible ? "Visible" : "Hidden"}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t pt-5">
          <Link href="/manage-roles">
            <Button variant="outline" type="button" className="h-10 px-5">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="h-10 px-6 gap-2 bg-primary text-primary-foreground font-semibold shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? "Saving Changes..." : "Save Changes"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
