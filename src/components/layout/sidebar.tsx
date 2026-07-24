"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  LayoutDashboard,
  Box,
  Truck,
  Users,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  List,
  LogOut,
  ShoppingCart,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useInventory } from "@/context/inventory-context";
import { useAuth } from "@/context/auth-context";

export interface SubNavItem {
  href: string;
  label: string;
  icon: any;
}

export interface NavItem {
  label: string;
  href?: string;
  icon: any;
  subItems?: SubNavItem[];
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Products",
    icon: Box,
    subItems: [
      { href: "/products", label: "All Products", icon: List },
      { href: "/products/new", label: "Add Product", icon: PlusCircle },
    ],
  },
  {
    label: "Stock",
    icon: Truck,
    subItems: [
      { href: "/stock", label: "Current Stock", icon: List },
      { href: "/stock/in", label: "Stock In (Add)", icon: PlusCircle },
      { href: "/stock/out", label: "Stock Out (Remove)", icon: PlusCircle },
      { href: "/stock/transfer", label: "Transfer Stock", icon: Truck },
      { href: "/stock/assets", label: "Assets (Assigned)", icon: List },
    ],
  },
  {
    label: "Categories",
    icon: Package,
    subItems: [
      { href: "/categories", label: "All Categories", icon: List },
      { href: "/categories/new", label: "Add Category", icon: PlusCircle },
    ],
  },
  {
    label: "Suppliers",
    icon: Users,
    subItems: [
      { href: "/suppliers", label: "All Suppliers", icon: List },
      { href: "/suppliers/new", label: "Add Supplier", icon: PlusCircle },
    ],
  },
  {
    label: "Orders",
    icon: ShoppingCart,
    subItems: [
      { href: "/orders", label: "All Orders", icon: List },
      { href: "/orders/new", label: "Generate Order", icon: PlusCircle },
    ],
  },
  {
    label: "Reports",
    icon: FileText,
    subItems: [
      { href: "/reports/transactions", label: "Transaction History", icon: List },
      { href: "/reports/monthly-stock", label: "Monthly Stock Summary", icon: BarChart3 },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeBranch, setActiveBranch } = useInventory();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Track open states of submenus. By default, keep active section open.
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>(
    () => {
      const initialState: Record<string, boolean> = {};
      navItems.forEach((item) => {
        if (item.subItems) {
          const hasActiveChild = item.subItems.some(
            (sub) => pathname === sub.href,
          );
          initialState[item.label] = hasActiveChild;
        }
      });
      return initialState;
    },
  );

  if (pathname === "/login") return null;

  const toggleSubMenu = (label: string) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  return (
    <aside className="hidden md:flex md:w-56 lg:w-64 flex-col border-r bg-background/50 backdrop-blur-xl shrink-0">
      <div className="flex h-16 items-center gap-2 border-b px-4 lg:px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Package className="h-5 w-5" />
        </div>
        <span className="text-base lg:text-lg font-bold tracking-tight truncate">
          M5C Logistics
        </span>
      </div>

      {/* Branch Selector (Only for Master Admin) */}
      <div className="px-3 lg:px-4 py-3 border-b">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
          Current Branch
        </label>
        {user?.role === "admin" ? (
          <div className="relative">
            <select
              value={activeBranch}
              onChange={(e) => setActiveBranch(e.target.value)}
              className="w-full h-9 bg-accent/50 border border-border/50 text-foreground text-sm rounded-md pl-3 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors cursor-pointer"
            >
              <option value="Delhi">🏭 Delhi (HO)</option>
              <option value="Ahmedabad">🏭 Ahmedabad</option>
              <option value="Ludhiana">🏭 Ludhiana</option>
              <option value="Mumbai">🏭 Mumbai</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-9 bg-accent/30 border border-border/30 text-foreground text-sm rounded-md px-3 flex items-center truncate">
            🏭 {activeBranch}
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-3 lg:p-4 overflow-y-auto hide-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.subItems) {
            const isExpanded = openSubMenus[item.label];
            const hasActiveChild = item.subItems.some(
              (sub) => pathname === sub.href,
            );

            return (
              <div key={item.label} className="space-y-1">
                <Link
                  href={item.subItems[0].href}
                  onClick={() => toggleSubMenu(item.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm lg:text-base font-medium transition-all text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    hasActiveChild && "text-foreground font-semibold",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <motion.div
                      layoutId={`icon-${item.label}`}
                      className="h-5 w-5 shrink-0"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      layoutId={`icon-${item.label}`}
                      className="h-5 w-5 shrink-0"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </motion.div>
                  )}
                </Link>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="pl-4 lg:pl-6 space-y-1 mt-1 border-l ml-5 border-border">
                        {item.subItems.map((sub) => {
                          const SubIcon = sub.icon;
                          const isActive = pathname === sub.href;
                          return (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                isActive
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                              )}
                            >
                              <SubIcon className="h-4 w-4 shrink-0" />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // Item with no children (like Dashboard, Reports)
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href || "#"}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm lg:text-base font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3 lg:p-4 border-t space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm lg:text-base font-medium transition-all",
            pathname === "/settings"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="truncate">Settings</span>
        </Link>
        <Link
          href="/manage-roles"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm lg:text-base font-medium transition-all",
            pathname === "/manage-roles"
              ? "bg-primary/10 text-primary font-semibold"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Users className="h-5 w-5 shrink-0" />
          <span className="truncate">Manage Roles</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm lg:text-base font-medium transition-all text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
