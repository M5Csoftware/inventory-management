'use client';

import Link from 'next/link';
import { Package, Truck, Activity, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';

export default function Dashboard() {
  const { products, transactions, categories } = useInventory();

  // Calculate metrics
  const totalProducts = products.length;
  
  // Total units in stock
  const totalStockUnits = products.reduce((acc, curr) => acc + curr.stock, 0);

  // Low stock alerts
  const lowStockAlerts = products.filter((p) => p.stock <= p.threshold).length;

  // Category counts
  const categorySummary = categories.map((cat) => {
    const count = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).length;
    const totalQty = products.filter((p) => p.category.toLowerCase() === cat.name.toLowerCase()).reduce((acc, p) => acc + p.stock, 0);
    return { name: cat.name, count, totalQty };
  });

  const totalCatQty = categorySummary.reduce((acc, curr) => acc + curr.totalQty, 0) || 1;

  // Recent transactions
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans">Overview</h1>
          <p className="text-muted-foreground mt-1">Here is the latest data for your inventory.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/reports">
            <Button variant="outline" className="hidden sm:flex bg-background/50 backdrop-blur-sm border-dashed">
              View Reports
            </Button>
          </Link>
          <Link href="/products/new">
            <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
              <Package className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative overflow-hidden bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Products</CardTitle>
            <div className="p-2 rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Items cataloged in system</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock Units</CardTitle>
            <div className="p-2 rounded-md bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{totalStockUnits}</div>
            <p className="text-xs text-muted-foreground mt-1">Total physical items tracked</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-destructive/30">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
            <div className="p-2 rounded-md bg-destructive/10 text-destructive ring-1 ring-destructive/20 relative">
              <AlertCircle className="h-4 w-4" />
              {lowStockAlerts > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-pulse"></span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-destructive">{lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20 shadow-md transition-all hover:shadow-lg hover:shadow-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">System Health</CardTitle>
            <div className="p-2 rounded-md bg-primary/20 text-primary">
              <Activity className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-primary">99.9%</div>
            <p className="text-xs text-primary/85 mt-1">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest movements in your inventory.</CardDescription>
              </div>
              <Link href="/stock">
                <Button variant="ghost" size="sm" className="text-xs">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentTransactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No recent transactions recorded.</p>
              ) : (
                recentTransactions.map((item, i) => (
                  <div key={i} className="flex items-center group cursor-pointer">
                    <div className={`p-2 rounded-full mr-4 ring-1 ring-inset transition-transform group-hover:scale-110 ${
                      item.type === 'Stock In'
                        ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20'
                        : 'bg-blue-500/10 text-blue-500 ring-blue-500/20'
                    }`}>
                      {item.type === 'Stock In' ? <Truck className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">
                        {item.type === 'Stock In' ? 'Received' : 'Dispatched'} {item.productName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.reasonOrLocation} <span className="mx-1">•</span> Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-xs font-medium text-muted-foreground">{item.date}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Top Categories</CardTitle>
            <CardDescription>Inventory distribution by category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categorySummary.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No categories defined.</p>
              ) : (
                categorySummary.map((cat, i) => {
                  const percent = Math.round((cat.totalQty / totalCatQty) * 100) || 0;
                  const colors = [
                    'bg-primary',
                    'bg-blue-500',
                    'bg-emerald-500',
                    'bg-amber-500',
                  ];
                  return (
                    <div key={i} className="group">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">{cat.name}</span>
                        <span className="text-sm text-muted-foreground font-mono">{percent}%</span>
                      </div>
                      <div className="w-full bg-secondary/50 rounded-full h-2.5 overflow-hidden ring-1 ring-inset ring-border/50">
                        <div className={`${colors[i % colors.length]} h-2.5 rounded-full transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Generate Report</p>
                <p className="text-xs text-muted-foreground mt-0.5">Get detailed category breakdown</p>
              </div>
              <Link href="/reports">
                <Button variant="secondary" size="sm" className="shadow-sm">Create</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
