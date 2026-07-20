'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Printer, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { products, transactions } = useInventory();
  const [activeTab, setActiveTab] = useState<'inventory' | 'movement' | 'low-stock'>('inventory');

  // Compute reports metrics
  const totalStockValuation = products.reduce((acc, curr) => acc + curr.price * curr.stock, 0);
  const totalSKUs = products.length;

  const lowStockItems = products.filter((p) => p.stock <= p.threshold);

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans">Reports</h1>
          <p className="text-muted-foreground mt-1">Review inventory metrics, trends, and history reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button size="sm" className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-border/50 max-w-md">
        <button
          onClick={() => setActiveTab('inventory')}
          className={cn(
            "flex-1 pb-3 text-sm font-semibold transition-all border-b-2 text-center",
            activeTab === 'inventory'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Current Inventory
        </button>
        <button
          onClick={() => setActiveTab('movement')}
          className={cn(
            "flex-1 pb-3 text-sm font-semibold transition-all border-b-2 text-center",
            activeTab === 'movement'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Stock Movement
        </button>
        <button
          onClick={() => setActiveTab('low-stock')}
          className={cn(
            "flex-1 pb-3 text-sm font-semibold transition-all border-b-2 text-center",
            activeTab === 'low-stock'
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          Low Stock Alert
        </button>
      </div>

      {activeTab === 'inventory' && (
        <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Current Inventory Report</CardTitle>
            <CardDescription>Overview of total stock valuation and levels across all warehouses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-4">
                  <span className="text-xs text-muted-foreground font-medium block">Total Stock Valuation</span>
                  <span className="text-2xl font-bold font-mono mt-1 block">
                    ₹{totalStockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <span className="text-xs text-muted-foreground font-medium block">Total Handled SKUs</span>
                  <span className="text-2xl font-bold mt-1 block">{totalSKUs} items</span>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <span className="text-xs text-muted-foreground font-medium block">Warehouse Space Utilization</span>
                  <span className="text-2xl font-bold mt-1 block">72.4%</span>
                </div>
              </div>
              
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">In Stock</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Unit Value</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{product.name}</td>
                        <td className="p-4 align-middle text-muted-foreground">{product.category}</td>
                        <td className="p-4 align-middle">{product.stock} units</td>
                        <td className="p-4 align-middle font-mono">₹{product.price.toLocaleString('en-IN')}</td>
                        <td className="p-4 align-middle font-mono font-medium">₹{(product.price * product.stock).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'movement' && (
        <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
          <CardHeader>
            <CardTitle>Stock Movement History</CardTitle>
            <CardDescription>Visualizing product flow activity over the past 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="relative w-full overflow-auto">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No movement history recorded.</p>
                ) : (
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Time</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Direction</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Qty Change</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-4 align-middle text-muted-foreground text-xs">{tx.date}</td>
                          <td className="p-4 align-middle font-medium">{tx.productName}</td>
                          <td className="p-4 align-middle">
                            <span className={`inline-flex items-center text-xs font-semibold gap-1 ${
                              tx.type === 'Stock In' ? 'text-emerald-500' : 'text-blue-500'
                            }`}>
                              {tx.type === 'Stock In' ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                              {tx.type === 'Stock In' ? 'Inflow' : 'Outflow'}
                            </span>
                          </td>
                          <td className={`p-4 align-middle font-bold ${
                            tx.type === 'Stock In' ? 'text-emerald-500' : 'text-blue-500'
                          }`}>
                            {tx.type === 'Stock In' ? '+' : '-'}{tx.quantity}
                          </td>
                          <td className="p-4 align-middle text-muted-foreground text-xs">{tx.reasonOrLocation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'low-stock' && (
        <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              Low Stock Report
            </CardTitle>
            <CardDescription>Items that require immediate reordering to avoid stockouts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-auto">
              {lowStockItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">All items are sufficiently stocked.</p>
              ) : (
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Current Stock</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Threshold</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Supplier</th>
                      <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((product) => (
                      <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{product.name}</td>
                        <td className="p-4 align-middle font-semibold text-destructive">{product.stock} units</td>
                        <td className="p-4 align-middle text-muted-foreground">{product.threshold} units</td>
                        <td className="p-4 align-middle text-muted-foreground">{product.supplier}</td>
                        <td className="p-4 align-middle text-right">
                          <Link href="/stock/in">
                            <Button size="sm" variant="destructive" className="h-8">Reorder</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
