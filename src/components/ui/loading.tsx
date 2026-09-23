"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
    xl: "h-12 w-12 border-4",
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full border-primary/30 border-t-primary animate-spin shrink-0",
          sizeMap[size],
        )}
      />
      {label && (
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      )}
    </div>
  );
}

export function LoadingSkeleton({
  className,
  count = 1,
}: {
  className?: string;
  count?: number;
}) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-lg bg-muted/60 dark:bg-muted/30 border border-border/30",
            className,
          )}
        />
      ))}
    </>
  );
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full space-y-3 p-4 bg-background/50 rounded-xl border border-border/50 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <LoadingSkeleton className="h-6 w-48" />
        <LoadingSkeleton className="h-8 w-32" />
      </div>
      <div className="space-y-2.5 pt-1">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 py-2 border-b border-border/20">
            {Array.from({ length: cols }).map((_, c) => (
              <LoadingSkeleton
                key={c}
                className={cn(
                  "h-5 rounded-md",
                  c === 0 ? "w-1/3" : c === cols - 1 ? "w-16" : "flex-1",
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-5 rounded-xl border border-border/50 bg-card/40 space-y-4 animate-pulse"
        >
          <div className="flex justify-between items-center pb-2 border-b border-border/30">
            <LoadingSkeleton className="h-5 w-28" />
            <LoadingSkeleton className="h-4 w-16" />
          </div>
          <LoadingSkeleton className="h-9 w-full" />
          <LoadingSkeleton className="h-9 w-full" />
          <div className="pt-2 border-t border-border/30">
            <LoadingSkeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoading({
  title = "Loading Inventory Data...",
  subtitle = "Fetching live catalog, rates, and stock details from server",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-[380px] w-full flex flex-col items-center justify-center text-center p-8 bg-muted/5 rounded-2xl border border-dashed border-border/50 animate-in fade-in duration-300">
      <div className="relative mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-25" />
        <div className="p-4 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm relative">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
      <h3 className="text-base font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
}

export function HeaderLoadingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-primary/20 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 animate-pulse w-full origin-left" />
    </div>
  );
}
