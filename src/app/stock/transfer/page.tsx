'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Package,
  FileText,
  Plus,
  Save,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Product } from '@/context/inventory-context';
import { toast } from 'react-toastify';

export default function StockTransferPage() {
  const { products, categories, transferStock, activeBranch } = useInventory();
  const router = useRouter();

  // Form states
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [destinationBranch, setDestinationBranch] = useState('');
  const [notes, setNotes] = useState('');

  const nonAssetProducts = products.filter((prod) => {
    const category = categories.find((c) => c.name.toLowerCase() === prod.category.toLowerCase());
    return !category?.isAsset;
  });

  const branches = ['Ahmedabad', 'Ludhiana', 'Delhi', 'Mumbai'].filter(b => b !== activeBranch);

  useEffect(() => {
    if (nonAssetProducts.length > 0 && !productId) {
      setProductId(nonAssetProducts[0].id);
    }
  }, [nonAssetProducts, productId]);

  useEffect(() => {
    if (branches.length > 0 && !branches.includes(destinationBranch)) {
      setDestinationBranch(branches[0]);
    }
  }, [activeBranch, branches, destinationBranch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || !destinationBranch) return;

    if (activeBranch === 'All') {
      toast.error('Please select a specific branch from the sidebar before transferring stock.');
      return;
    }

    const success = await transferStock(
      productId,
      parseInt(quantity),
      destinationBranch,
      notes || undefined
    );

    if (success) {
      router.push('/stock');
    }
  };

  if (activeBranch === 'All') {
    return (
      <div className="min-h-screen p-6 sm:p-8 flex items-center justify-center">
        <Card className="border border-border/50 bg-background/60 backdrop-blur-sm p-8 text-center max-w-md w-full">
          <p className="text-muted-foreground mb-4">Please select a specific branch from the sidebar to perform a stock transfer.</p>
          <Link href="/stock">
            <Button>Go Back</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-full space-y-4">
        {/* Header Section */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/stock">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-2 transition-all hover:scale-105 hover:border-primary/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Transfer Stock
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <ArrowRight className="h-3 w-3 text-purple-500" />
                Move inventory from {activeBranch} to another branch
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
            <span>Inter-branch Transfer</span>
          </div>
        </div>

        {nonAssetProducts.length === 0 ? (
          <Card className="border border-border/50 bg-background/60 backdrop-blur-sm p-8 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground">
              No transferable products found.
            </p>
            <Link href="/products/new">
              <Button size="sm">Create Product</Button>
            </Link>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-500" />
                    Transfer Details
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Select product, specify quantity, and destination branch
                  </CardDescription>
                </div>
                <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-medium text-purple-600">
                  Source: {activeBranch}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Select Product */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Package className="h-3 w-3" />
                    Select Product <span className="text-destructive">*</span>
                  </label>
                  <select 
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  >
                    {nonAssetProducts.map((prod: Product) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (Available in {activeBranch}: {prod.stock[activeBranch] || 0} units)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Quantity to Transfer <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 10"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      Destination Branch <span className="text-destructive">*</span>
                    </label>
                    <select 
                      value={destinationBranch}
                      onChange={(e) => setDestinationBranch(e.target.value)}
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_10px_center] bg-no-repeat hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    >
                      {branches.map(b => (
                        <option key={b} value={b}>📍 {b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Notes / Reference
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Requested by Delhi manager, transferred via truck."
                    className="w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 resize-y dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
                  <Link href="/stock" className="w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 transition-all hover:bg-muted/50 sm:w-auto h-9 text-sm"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="group w-full gap-2 bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] hover:shadow-purple-500/40 sm:w-auto h-9 text-sm"
                  >
                    <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                    Transfer Stock
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
