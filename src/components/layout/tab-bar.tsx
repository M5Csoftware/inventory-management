"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, XCircle, Layout } from "lucide-react";
import { useTabs } from "@/context/tab-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function TabBar() {
  const pathname = usePathname();
  const { tabs, closeTab, closeAllTabs } = useTabs();

  if (pathname === "/login") return null;

  return (
    <div className="flex items-stretch justify-between w-full h-full overflow-hidden select-none">
      {/* Scrollable Tabs List */}
      <div className="flex items-stretch overflow-x-auto hide-scrollbar flex-1 min-w-0 h-full">
        <AnimatePresence initial={false}>
          {tabs.map((tab, index) => {
            const isActive = pathname === tab.href;
            const isDashboard = tab.href === "/";
            const isFirst = index === 0;

            return (
              <motion.div
                key={tab.href}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, width: 0 }}
                transition={{ duration: 0.12 }}
                className="h-full shrink-0 flex items-stretch"
              >
                <div
                  className={cn(
                    "group flex items-center justify-between gap-2.5 h-full px-3.5 sm:px-4 border-r border-border/60 border-b-2 text-xs transition-all duration-150 cursor-pointer",
                    isFirst && "border-l border-l-border/60",
                    isActive
                      ? "border-b-red-500 text-foreground bg-background/80 font-semibold"
                      : "border-b-muted-foreground/30 text-muted-foreground hover:text-foreground hover:bg-muted/30 hover:border-b-muted-foreground/60"
                  )}
                >
                  <Link
                    href={tab.href}
                    className="flex items-center gap-2 truncate max-w-[140px] sm:max-w-[190px] h-full"
                  >
                    <Layout className={cn("h-3.5 w-3.5 shrink-0 transition-colors", isActive ? "text-red-500" : "text-muted-foreground/60")} />
                    <span className="truncate tracking-tight">{tab.label}</span>
                  </Link>

                  {/* Close button for tab (Dashboard cannot be closed) */}
                  {!isDashboard && (
                    <button
                      type="button"
                      onClick={(e) => closeTab(tab.href, e)}
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded transition-colors ml-1",
                        isActive
                          ? "text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
                          : "text-muted-foreground/50 hover:bg-muted-foreground/20 hover:text-foreground"
                      )}
                      title={`Close ${tab.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Close All Tabs Button */}
      {tabs.length > 1 && (
        <div className="flex items-center shrink-0 px-2">
          <button
            type="button"
            onClick={closeAllTabs}
            className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border/40 bg-muted/20 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all duration-150 active:scale-95 ml-2"
            title="Close all tabs"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Close All</span>
          </button>
        </div>
      )}
    </div>
  );
}
