'use client';

import { useState } from 'react';
import { FileText, ArrowUpRight, ArrowDownRight, Printer, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'movement' | 'low-stock'>('inventory');

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-1">Review inventory metrics, trends, and history reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex">
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
                  <span className="text-2xl font-bold font-mono mt-1 block">$146,800.00</span>
                </div>
                <div className="rounded-xl border bg-card p-4">
                  <span className="text-xs text-muted-foreground font-medium block">Total Handled SKUs</span>
                  <span className="text-2xl font-bold mt-1 block">487 items</span>
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
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">Premium Wireless Headphones</td>
                      <td className="p-4 align-middle text-muted-foreground">Electronics</td>
                      <td className="p-4 align-middle">45 units</td>
                      <td className="p-4 align-middle font-mono font-medium">$5,849.55</td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle font-medium">Stainless Steel Water Bottle</td>
                      <td className="p-4 align-middle text-muted-foreground">Lifestyle</td>
                      <td className="p-4 align-middle">150 units</td>
                      <td className="p-4 align-middle font-mono font-medium">$3,748.50</td>
                    </tr>
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
              <div className="rounded-xl border bg-card p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-sm font-medium">Velocity Report (Last 30 Days)</span>
                  <span className="text-xs text-muted-foreground block">Most active category is Electronics.</span>
                </div>
                <Button size="sm" variant="outline">
                  <Eye className="mr-2 h-4 w-4" /> View Details
                </Button>
              </div>

              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Time</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Direction</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Qty Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle text-muted-foreground text-xs">Today, 10:30 AM</td>
                      <td className="p-4 align-middle font-medium">Premium Wireless Headphones</td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center text-emerald-500 text-xs font-semibold gap-1">
                          <ArrowUpRight className="h-3.5 w-3.5" /> Inflow
                        </span>
                      </td>
                      <td className="p-4 align-middle font-semibold text-emerald-500">+20</td>
                    </tr>
                    <tr className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle text-muted-foreground text-xs">Today, 09:15 AM</td>
                      <td className="p-4 align-middle font-medium">USB-C Fast Charger</td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center text-red-500 text-xs font-semibold gap-1">
                          <ArrowDownRight className="h-3.5 w-3.5" /> Outflow
                        </span>
                      </td>
                      <td className="p-4 align-middle font-semibold text-red-500">-5</td>
                    </tr>
                  </tbody>
                </table>
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
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">USB-C Fast Charger</td>
                    <td className="p-4 align-middle font-semibold text-destructive">8 units</td>
                    <td className="p-4 align-middle text-muted-foreground">15 units</td>
                    <td className="p-4 align-middle text-muted-foreground">AudioTech Ltd.</td>
                    <td className="p-4 align-middle text-right">
                      <Button size="sm" variant="destructive" className="h-8">Reorder</Button>
                    </td>
                  </tr>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">Ergonomic Office Chair</td>
                    <td className="p-4 align-middle font-semibold text-amber-500">12 units</td>
                    <td className="p-4 align-middle text-muted-foreground">15 units</td>
                    <td className="p-4 align-middle text-muted-foreground">ComfortSeats Co.</td>
                    <td className="p-4 align-middle text-right">
                      <Button size="sm" variant="outline" className="h-8 border-amber-500 text-amber-500 hover:bg-amber-500/10">Reorder</Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
