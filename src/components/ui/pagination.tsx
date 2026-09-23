"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
  showPageSizeSelector?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  showPageSizeSelector = true,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Calculate visible page numbers with ellipsis
  const visiblePages = useMemo(() => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (safeTotalPages <= maxVisible) {
      for (let i = 1; i <= safeTotalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, safeCurrentPage - 1);
      let end = Math.min(safeTotalPages, safeCurrentPage + 1);

      if (safeCurrentPage <= 3) {
        start = 1;
        end = 4;
      } else if (safeCurrentPage >= safeTotalPages - 2) {
        start = safeTotalPages - 3;
        end = safeTotalPages;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < safeTotalPages) {
        if (end < safeTotalPages - 1) pages.push("...");
        pages.push(safeTotalPages);
      }
    }

    return pages;
  }, [safeCurrentPage, safeTotalPages]);

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border border-border/60 bg-card/60 backdrop-blur-xs rounded-xl shadow-xs text-xs transition-all duration-200",
        className
      )}
    >
      {/* Items count & page size select */}
      <div className="flex items-center gap-3 text-muted-foreground font-medium">
        <span>
          Showing <strong className="text-foreground">{startItem}</strong> to{" "}
          <strong className="text-foreground">{endItem}</strong> of{" "}
          <strong className="text-foreground">{totalItems}</strong> entries
        </span>

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-border/60 pl-3">
            <span className="hidden sm:inline">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-7 px-2 py-0.5 rounded-md border border-input bg-background/80 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage === 1}
          title="First Page"
          className="rounded-lg h-7 w-7"
        >
          <ChevronsLeft className="size-3.5" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage === 1}
          title="Previous Page"
          className="rounded-lg h-7 w-7"
        >
          <ChevronLeft className="size-3.5" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1">
          {visiblePages.map((page, idx) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1.5 text-muted-foreground font-semibold select-none"
                >
                  •••
                </span>
              );
            }

            const isCurrent = page === safeCurrentPage;
            return (
              <Button
                key={page}
                variant={isCurrent ? "default" : "ghost"}
                size="icon-xs"
                onClick={() => onPageChange(page)}
                className={cn(
                  "h-7 w-7 rounded-lg text-xs font-medium transition-all duration-150",
                  isCurrent
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90"
                    : "text-foreground hover:bg-muted"
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next page */}
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage === safeTotalPages}
          title="Next Page"
          className="rounded-lg h-7 w-7"
        >
          <ChevronRight className="size-3.5" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="icon-xs"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage === safeTotalPages}
          title="Last Page"
          className="rounded-lg h-7 w-7"
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Custom React hook for seamless client-side pagination.
 */
export function usePagination<T>(items: T[], defaultPageSize: number = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Auto-reset to page 1 when data list changes or filter is applied
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length, pageSize]);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedItems = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, validCurrentPage, pageSize]);

  return {
    currentPage: validCurrentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    paginatedItems,
  };
}
