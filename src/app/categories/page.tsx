'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FolderPlus, Package, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory, Category, Product } from '@/context/inventory-context';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';

export default function CategoriesPage() {
  const { categories, products, deleteCategory, activeBranch } = useInventory();
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const getStock = (p: any) => {
    if (!p.stock) return 0;
    if (typeof p.stock === 'number') return p.stock;
    if (activeBranch === 'All') {
      return Object.values(p.stock as Record<string, number>).reduce((acc, curr) => acc + (curr || 0), 0);
    }
    return (p.stock as Record<string, number>)[activeBranch] || 0;
  };

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Group products and manage inventory segments.</p>
        </div>
        <Link href="/categories/new">
          <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
            <FolderPlus className="mr-2 h-4 w-4" /> Add Category
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category: Category) => {
          const categoryProducts = products.filter(
            (p: Product) => p.category.toLowerCase() === category.name.toLowerCase()
          );
          
          const totalValuation = categoryProducts.reduce(
            (acc: number, curr: Product) => acc + curr.price * getStock(curr),
            0
          );

          return (
            <Card key={category.name} className="group relative overflow-hidden bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <CardHeader className="relative flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{category.name}</CardTitle>
                    {category.isAsset && (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 ring-1 ring-inset ring-blue-500/20">
                        Asset
                      </span>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 mt-1">{category.description}</CardDescription>
                </div>
                <div className="p-2 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Package className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex justify-between items-center border-t pt-4 border-border/50 text-sm">
                  <div className="space-y-0.5">
                    <span className="text-muted-foreground block text-xs">Total Products</span>
                    <span className="font-semibold text-lg">{categoryProducts.length} items</span>
                  </div>
                  <div className="space-y-0.5 text-right">
                    <span className="text-muted-foreground block text-xs">Estimated Value</span>
                    <span className="font-semibold text-lg font-mono">₹{totalValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-1 mt-4 border-t pt-3 border-border/50">
                  <Link href={`/categories/edit/${encodeURIComponent(category.name)}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                      <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                    </Button>
                  </Link>
                  <Button 
                    onClick={() => setCategoryToDelete(category.name)}
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfirmDeleteModal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={async () => {
          if (categoryToDelete) {
            await deleteCategory(categoryToDelete);
          }
        }}
        title="Delete Category"
        description="Are you sure you want to delete this category? Products under this category will need category updates."
        itemName={categoryToDelete || ''}
      />
    </div>
  );
}
