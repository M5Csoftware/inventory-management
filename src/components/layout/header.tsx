"use client";

import { Bell, Search, AlertTriangle, Package, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useInventory } from "@/context/inventory-context";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MobileSidebar } from "./mobile-sidebar";

export function Header() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return <HeaderInner />;
}

function HeaderInner() {
  const pathname = usePathname();
  const { products, activeBranch } = useInventory();
  const [open, setOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const getStock = (p: any) => {
    if (!p.stock) return 0;
    if (typeof p.stock === "number") return p.stock;
    if (activeBranch === "All") {
      return Object.values(p.stock as Record<string, number>).reduce(
        (acc, curr) => acc + (curr || 0),
        0,
      );
    }
    return (p.stock as Record<string, number>)[activeBranch] || 0;
  };

  // Derive low-stock list directly from context (no extra state needed)
  const lowStockProducts = products.filter((p) => getStock(p) <= p.threshold);
  const alertCount = lowStockProducts.length;

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/login") return null;

  return (
    <>
      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/50 backdrop-blur-xl px-4 md:px-6">
        {/* Mobile Hamburger & Search */}
        <div className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search inventory..."
              className="h-9 w-64 rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Bell with popover */}
          <div className="relative" ref={popoverRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
              onClick={() => setOpen((v) => !v)}
            >
              <Bell className="h-5 w-5" />
              {alertCount > 0 && (
                <>
                  {/* Count badge */}
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                  {/* Pulse dot */}
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive animate-ping opacity-75" />
                </>
              )}
            </Button>

            {/* Notification Panel */}
            {open && (
              <div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-sm sm:w-80 rounded-xl border border-border bg-background shadow-2xl shadow-black/20 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div>
                    <h4 className="text-sm font-semibold">Low Stock Alerts</h4>
                    <p className="text-xs text-muted-foreground">
                      Products that need reordering
                    </p>
                  </div>
                  {alertCount > 0 && (
                    <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      {alertCount} item{alertCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* List */}
                <div className="max-h-72 overflow-y-auto">
                  {lowStockProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center px-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium">All stocked up! 🎉</p>
                      <p className="text-xs text-muted-foreground">
                        No products are below their minimum level.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {lowStockProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                        >
                          {/* Icon */}
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.category} &bull; Supplier:{" "}
                              {product.supplier}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                                {getStock(product)} left
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Min: {product.threshold}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {lowStockProducts.length > 0 && (
                  <div className="border-t border-border px-4 py-3 flex gap-2">
                    <Link
                      href="/stock/in"
                      className="flex-1"
                      onClick={() => setOpen(false)}
                    >
                      <Button size="sm" className="w-full text-xs h-8">
                        Restock Now
                      </Button>
                    </Link>
                    <Link
                      href="/products"
                      className="flex-1"
                      onClick={() => setOpen(false)}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                      >
                        View All
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-red-500 to-rose-600 ring-2 ring-background border border-border" />
        </div>
      </header>
    </>
  );
}
