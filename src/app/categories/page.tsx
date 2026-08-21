"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderPlus,
  Package,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Layers,
  Sparkles,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Category, Product } from "@/context/inventory-context";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

export default function CategoriesPage() {
  const router = useRouter();
  const { categories, products, deleteCategory, activeBranch } = useInventory();
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "major" | "sub">("all");

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

  // Find subcategories map by parent category name
  const subcategoriesByParent = useMemo(() => {
    const map: Record<string, Category[]> = {};
    (categories || []).forEach((c) => {
      if (c.parentCategory) {
        const parentKey = c.parentCategory.trim().toLowerCase();
        if (!map[parentKey]) map[parentKey] = [];
        map[parentKey].push(c);
      }
    });
    return map;
  }, [categories]);

  // Filtered list based on filter tab
  const displayedCategories = useMemo(() => {
    return (categories || []).filter((c) => {
      if (filterMode === "major") return !c.parentCategory;
      if (filterMode === "sub") return !!c.parentCategory;
      return true;
    });
  }, [categories, filterMode]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="h-7 w-7 text-primary" />
            Categories &amp; Hierarchy
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Organize inventory into Major / Master Categories and Subcategories.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Link href="/categories/new?type=major" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 shadow-sm transition-all gap-1.5"
            >
              <Layers className="h-4 w-4" /> + Major Category
            </Button>
          </Link>
          <Link href="/categories/new?type=sub" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 gap-1.5">
              <FolderPlus className="h-4 w-4" /> + Subcategory
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50 w-fit">
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === "all"
                ? "bg-background text-foreground shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("major")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === "major"
                ? "bg-background text-purple-600 dark:text-purple-400 shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Major Categories ({categories.filter((c) => !c.parentCategory).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("sub")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === "sub"
                ? "bg-background text-primary shadow-sm font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Subcategories ({categories.filter((c) => !!c.parentCategory).length})
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {displayedCategories.map((category: Category) => {
          const isMajor = !category.parentCategory;
          const directSubcategories =
            subcategoriesByParent[category.name.trim().toLowerCase()] || [];

          // Products in this exact category
          const directProducts = products.filter(
            (p: Product) =>
              p.category.toLowerCase() === category.name.toLowerCase(),
          );

          // All products (including subcategories if it's a major category)
          const allFamilyCategoryNames = [
            category.name.toLowerCase(),
            ...directSubcategories.map((sc) => sc.name.toLowerCase()),
          ];
          const rollupProducts = products.filter((p: Product) =>
            allFamilyCategoryNames.includes(p.category.toLowerCase()),
          );

          const totalValuation = rollupProducts.reduce(
            (acc: number, curr: Product) => acc + curr.price * getStock(curr),
            0,
          );
          const isExpanded = expandedCategory === category.name;

          return (
            <Card
              key={category.name}
              className={`group relative cursor-pointer overflow-hidden backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md ${
                isMajor
                  ? "bg-gradient-to-br from-purple-500/[0.03] to-card hover:border-purple-500/40"
                  : "bg-background/60 hover:border-primary/40"
              }`}
              onClick={() =>
                setExpandedCategory((current) =>
                  current === category.name ? null : category.name,
                )
              }
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>

              <CardHeader className="relative flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors truncate">
                      {category.name}
                    </CardTitle>

                    {isMajor ? (
                      <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 ring-1 ring-inset ring-purple-500/20 shrink-0">
                        Major Category
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary ring-1 ring-inset ring-primary/20 shrink-0">
                        Subcategory of {category.parentCategory}
                      </span>
                    )}

                    {category.isAsset && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 ring-1 ring-inset ring-blue-500/20 shrink-0">
                        Asset
                      </span>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 text-xs">
                    {category.description}
                  </CardDescription>

                  {/* Subcategories preview tags for Major Categories */}
                  {isMajor && directSubcategories.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Subcategories ({directSubcategories.length}):
                      </span>
                      {directSubcategories.map((sub) => (
                        <span
                          key={sub.name}
                          className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground"
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`p-2 rounded-xl ring-1 shrink-0 ${
                    isMajor
                      ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20"
                      : "bg-primary/10 text-primary ring-primary/20"
                  }`}
                >
                  {isMajor ? <Layers className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                </div>
              </CardHeader>

              <CardContent className="relative pt-2">
                <div className="flex justify-between items-center gap-3 border-t pt-3 border-border/50 text-sm">
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-muted-foreground block text-xs">
                      {isMajor && directSubcategories.length > 0
                        ? "Total Rollup Products"
                        : "Total Products"}
                    </span>
                    <span className="font-semibold text-base truncate">
                      {rollupProducts.length} items
                    </span>
                  </div>
                  <div className="space-y-0.5 text-right min-w-0">
                    <span className="text-muted-foreground block text-xs">
                      Estimated Valuation
                    </span>
                    <span className="font-semibold text-base font-mono text-emerald-600 dark:text-emerald-400 truncate">
                      ₹
                      {totalValuation.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t pt-2.5 border-border/50">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      setExpandedCategory((current) =>
                        current === category.name ? null : category.name,
                      );
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {isExpanded ? "Hide products" : `View products (${rollupProducts.length})`}
                  </button>

                  <div className="flex justify-end gap-1 items-center">
                    {isMajor && (
                      <Link
                        href={`/categories/new?type=sub&parent=${encodeURIComponent(category.name)}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-primary hover:bg-primary/10"
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" /> Subcategory
                        </Button>
                      </Link>
                    )}
                    <Link
                      href={`/categories/edit/${encodeURIComponent(category.name)}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="mr-1 h-3.5 w-3.5" /> Edit
                      </Button>
                    </Link>
                    <Button
                      onClick={(event) => {
                        event.stopPropagation();
                        setCategoryToDelete(category.name);
                      }}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>

                {/* Expanded Products List */}
                {isExpanded && (
                  <div className="mt-3 rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wide">
                        Products ({rollupProducts.length})
                      </span>
                    </div>

                    {rollupProducts.length > 0 ? (
                      <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {rollupProducts.map((product: Product) => (
                          <li
                            key={product.id}
                            className="rounded-md border border-border/40 bg-background/80 px-2.5 py-1.5 text-xs hover:border-primary/40 transition-colors"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-2 text-left"
                              onClick={(event) => {
                                event.stopPropagation();
                                router.push(
                                  `/reports/product-details?productId=${encodeURIComponent(
                                    product.id,
                                  )}`,
                                );
                              }}
                            >
                              <div className="truncate">
                                <span className="font-medium">{product.name}</span>
                                {product.category !== category.name && (
                                  <span className="text-[10px] text-muted-foreground ml-1.5">
                                    ({product.category})
                                  </span>
                                )}
                              </div>
                              <span className="text-muted-foreground shrink-0 font-mono">
                                {getStock(product)} in stock
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground py-1">
                        No products currently assigned to this category.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={async () => {
          if (categoryToDelete) {
            await deleteCategory(categoryToDelete);
          }
        }}
        title="Delete Category"
        description="Are you sure you want to delete this category? Products currently assigned to this category will need category reassignment."
        itemName={categoryToDelete || ""}
      />
    </div>
  );
}
