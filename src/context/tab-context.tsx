"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface TabItem {
  id: string;
  href: string;
  label: string;
}

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/products": "All Products",
  "/products/new": "Add Product",
  "/stock": "Current Stock",
  "/stock/in": "Stock In (Add)",
  "/stock/out": "Stock Out (Remove)",
  "/stock/transfer": "Transfer Stock",
  "/stock/assets/in": "Stock In Assets",
  "/stock/assets": "Assets (Assigned)",
  "/categories": "All Categories",
  "/categories/new": "Add Category",
  "/suppliers": "All Suppliers",
  "/suppliers/rates": "Supplier Rates",
  "/suppliers/products": "Supplier Products",
  "/suppliers/new": "Add Supplier",
  "/orders": "All Orders",
  "/orders/new": "Generate Order",
  "/reports/transactions": "Transaction History",
  "/reports/monthly-stock": "Monthly Stock Summary",
  "/settings": "Settings",
  "/manage-roles": "Manage Roles",
};

export function getTabLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) {
    return ROUTE_LABELS[pathname];
  }
  // Fallback for dynamic nested routes
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "Dashboard";
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " "))
    .join(" - ");
}

interface TabContextType {
  tabs: TabItem[];
  activeTab: string;
  closeTab: (href: string, e?: React.MouseEvent) => void;
  closeAllTabs: () => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export function TabProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tabs, setTabs] = useState<TabItem[]>([
    { id: "/", href: "/", label: "Dashboard" },
  ]);

  useEffect(() => {
    if (!pathname || pathname === "/login") return;

    setTabs((prevTabs) => {
      // Ensure Dashboard is always at position 0
      const dashboardTab = { id: "/", href: "/", label: "Dashboard" };
      const nonDashboardTabs = prevTabs.filter((t) => t.href !== "/");
      const baseTabs = [dashboardTab, ...nonDashboardTabs];

      if (pathname === "/" || baseTabs.some((t) => t.href === pathname)) {
        return baseTabs;
      }

      const label = getTabLabel(pathname);
      return [...baseTabs, { id: pathname, href: pathname, label }];
    });
  }, [pathname]);

  const closeTab = (hrefToClose: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Dashboard tab cannot be closed
    if (hrefToClose === "/") return;

    setTabs((prevTabs) => {
      const filtered = prevTabs.filter((t) => t.href !== hrefToClose);
      
      // Ensure Dashboard is always present as first tab
      const dashboardTab = { id: "/", href: "/", label: "Dashboard" };
      const finalTabs = filtered.some((t) => t.href === "/")
        ? filtered
        : [dashboardTab, ...filtered];

      // If we closed the active tab, switch to adjacent tab
      if (pathname === hrefToClose) {
        const closedIndex = prevTabs.findIndex((t) => t.href === hrefToClose);
        const nextTab = finalTabs[Math.max(0, closedIndex - 1)] || dashboardTab;
        router.push(nextTab.href);
      }

      return finalTabs;
    });
  };

  const closeAllTabs = () => {
    const dashboardTab = { id: "/", href: "/", label: "Dashboard" };
    setTabs([dashboardTab]);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTab: pathname,
        closeTab,
        closeAllTabs,
      }}
    >
      {children}
    </TabContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error("useTabs must be used within a TabProvider");
  }
  return context;
}
