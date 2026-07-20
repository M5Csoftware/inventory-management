'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';

export default function ProductsPage() {
  const { products, deleteProduct } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage and edit your product directory.</p>
        </div>
        <Link href="/products/new">
          <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </div>

      <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Product List</CardTitle>
              <CardDescription>View, search, and manage products.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="h-9 w-full sm:w-64 rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            {filteredProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No products found matching your criteria.</p>
            ) : (
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Stock</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Supplier</th>
                    <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium font-mono text-xs">{product.id}</td>
                      <td className="p-4 align-middle font-medium">{product.name}</td>
                      <td className="p-4 align-middle text-muted-foreground">{product.category}</td>
                      <td className="p-4 align-middle font-mono">₹{product.price.toLocaleString('en-IN')}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          product.stock <= product.threshold ? 'bg-destructive/10 text-destructive animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {product.stock} units
                        </span>
                      </td>
                      <td className="p-4 align-middle text-muted-foreground">{product.supplier}</td>
                      <td className="p-4 align-middle text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteProduct(product.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
