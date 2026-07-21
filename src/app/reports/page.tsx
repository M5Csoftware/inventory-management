'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ArrowDownRight, Printer, Download, Eye, Truck, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { products, transactions, categories } = useInventory();
  const [activeTab, setActiveTab] = useState<'inventory' | 'movement' | 'low-stock'>('inventory');

  // Compute reports metrics
  const totalStockValuation = products.reduce((acc, curr) => acc + curr.price * curr.stock, 0);
  const totalSKUs = products.length;

  const lowStockItems = products.filter((p) => p.stock <= p.threshold);

  // Prepare Chart Data
  const categoryData = categories.map((cat) => {
    const value = products
      .filter((p) => (p.category || '').toLowerCase() === (cat.name || '').toLowerCase())
      .reduce((acc, p) => acc + ((p.stock || 0) * (p.price || 0)), 0);
    return { name: cat.name || 'Unknown', value };
  }).filter(c => c.value > 0);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  const transactionsByDate = transactions.reduce((acc: any, curr) => {
    const date = curr.date.split(' ')[0];
    if (!acc[date]) acc[date] = { date, 'Stock In': 0, 'Stock Out': 0 };
    if (curr.type === 'Stock In') acc[date]['Stock In'] += curr.quantity;
    else acc[date]['Stock Out'] += curr.quantity;
    return acc;
  }, {});
  
  const movementData = Object.values(transactionsByDate)
    .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleExportExcel = () => {
    let ws;
    let filename = '';

    if (activeTab === 'inventory') {
      const data = products.map(p => ({
        'Product Name': p.name,
        'Category': p.category,
        'Stock': p.stock,
        'Unit Value (INR)': p.price,
        'Total Value (INR)': p.price * p.stock,
      }));
      ws = XLSX.utils.json_to_sheet(data);
      filename = 'Current_Inventory_Report.xlsx';
    } else if (activeTab === 'movement') {
      const data = transactions.map(t => ({
        'Date': t.date,
        'Product': t.productName,
        'Type': t.type,
        'Quantity': t.quantity,
        'Details': t.reasonOrLocation
      }));
      ws = XLSX.utils.json_to_sheet(data);
      filename = 'Stock_Movement_Report.xlsx';
    } else if (activeTab === 'low-stock') {
      const data = lowStockItems.map(p => ({
        'Product': p.name,
        'Current Stock': p.stock,
        'Threshold': p.threshold,
        'Supplier': p.supplier
      }));
      ws = XLSX.utils.json_to_sheet(data);
      filename = 'Low_Stock_Report.xlsx';
    }

    if (ws) {
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, filename);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Review inventory metrics, trends, and history reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="hidden sm:flex bg-background/50 backdrop-blur-sm border-dashed hover:bg-muted" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print Report
          </Button>
          <Button size="sm" className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Download Excel
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
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
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
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          )}
        >
          Stock Movement
        </button>
        <button
          onClick={() => setActiveTab('low-stock')}
          className={cn(
            "flex-1 pb-3 text-sm font-semibold transition-all border-b-2 text-center",
            activeTab === 'low-stock'
              ? "border-destructive text-destructive"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
          )}
        >
          Low Stock Alerts
        </button>
      </div>

      {activeTab === 'inventory' && (
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle>Current Inventory Report</CardTitle>
            <CardDescription>Overview of total stock valuation and levels across all warehouses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-border/50 bg-background/50 p-6 flex flex-col justify-center">
                  <span className="text-sm text-muted-foreground font-medium block">Total Stock Valuation</span>
                  <span className="text-3xl font-bold font-mono mt-2 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent block">
                    ₹{totalStockValuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/50 p-6 flex flex-col justify-center">
                  <span className="text-sm text-muted-foreground font-medium block">Total Handled SKUs</span>
                  <span className="text-3xl font-bold mt-2 block">{totalSKUs} items</span>
                </div>
                <div className="rounded-2xl border border-border/50 bg-background/50 p-6 flex flex-col justify-center">
                  <span className="text-sm text-muted-foreground font-medium block">Categories</span>
                  <span className="text-3xl font-bold mt-2 block">{categories.length} segments</span>
                </div>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-border/50 bg-background/50 p-6">
                  <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Valuation by Category</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                          {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => [`₹${(Number(value) || 0).toLocaleString('en-IN')}`, 'Value']} contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden flex flex-col">
                  <h3 className="text-sm font-semibold p-6 pb-2 text-muted-foreground">Product Detail Breakdown</h3>
                  <div className="relative w-full overflow-auto flex-1">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                        <tr className="border-b transition-colors">
                          <th className="h-10 px-6 text-left align-middle font-medium text-muted-foreground">Product</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Stock</th>
                          <th className="h-10 px-6 text-right align-middle font-medium text-muted-foreground">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product) => (
                          <tr key={product.id} className="border-b border-border/40 transition-colors hover:bg-muted/30">
                            <td className="p-4 px-6 align-middle font-medium">{product.name}</td>
                            <td className="p-4 align-middle text-muted-foreground text-xs">{product.category}</td>
                            <td className="p-4 align-middle font-medium">{product.stock}</td>
                            <td className="p-4 px-6 align-middle font-mono font-semibold text-right">₹{(product.price * product.stock).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'movement' && (
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle>Stock Movement History</CardTitle>
            <CardDescription>Visualizing product flow activity over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              
              <div className="rounded-2xl border border-border/50 bg-background/50 p-6">
                <h3 className="text-sm font-semibold mb-6 text-muted-foreground">Volume Trend</h3>
                <div className="h-[250px]">
                  {movementData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No movement data.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={movementData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(val) => val.split('-').slice(1).join('/')} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }} />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="Stock In" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                        <Area type="monotone" dataKey="Stock Out" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden">
                <h3 className="text-sm font-semibold p-6 pb-4 text-muted-foreground border-b border-border/50">Transaction Log</h3>
                <div className="relative w-full overflow-auto max-h-[400px]">
                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-10">No movement history recorded.</p>
                  ) : (
                    <table className="w-full caption-bottom text-sm">
                      <thead className="[&_tr]:border-b sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                        <tr className="border-b border-border/50 transition-colors">
                          <th className="h-10 px-6 text-left align-middle font-medium text-muted-foreground">Date</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Flow</th>
                          <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Quantity</th>
                          <th className="h-10 px-6 text-left align-middle font-medium text-muted-foreground">Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="border-b border-border/40 transition-colors hover:bg-muted/30">
                            <td className="p-4 px-6 align-middle text-muted-foreground text-xs font-mono">{tx.date}</td>
                            <td className="p-4 align-middle font-medium">{tx.productName}</td>
                            <td className="p-4 align-middle">
                              <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold gap-1.5 ${
                                tx.type === 'Stock In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {tx.type === 'Stock In' ? <Truck className="h-3.5 w-3.5" /> : <Package className="h-3.5 w-3.5" />}
                                {tx.type}
                              </span>
                            </td>
                            <td className={`p-4 align-middle font-bold font-mono ${
                              tx.type === 'Stock In' ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                              {tx.type === 'Stock In' ? '+' : '-'}{tx.quantity}
                            </td>
                            <td className="p-4 px-6 align-middle text-muted-foreground text-xs">{tx.reasonOrLocation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'low-stock' && (
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-destructive/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              Low Stock Report
              <span className="bg-destructive/10 text-destructive text-xs px-2 py-1 rounded-full font-bold ml-2">
                {lowStockItems.length} items
              </span>
            </CardTitle>
            <CardDescription>Items that require immediate reordering to avoid stockouts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden">
              <div className="relative w-full overflow-auto">
                {lowStockItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12 font-medium">All items are sufficiently stocked.</p>
                ) : (
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                      <tr className="border-b border-border/50 transition-colors">
                        <th className="h-10 px-6 text-left align-middle font-medium text-muted-foreground">Product</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Current Stock</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Threshold</th>
                        <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Supplier</th>
                        <th className="h-10 px-6 align-middle font-medium text-muted-foreground text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((product) => (
                        <tr key={product.id} className="border-b border-border/40 transition-colors hover:bg-destructive/5">
                          <td className="p-4 px-6 align-middle font-semibold">{product.name}</td>
                          <td className="p-4 align-middle font-bold text-destructive text-lg">{product.stock}</td>
                          <td className="p-4 align-middle text-muted-foreground font-mono">{product.threshold}</td>
                          <td className="p-4 align-middle text-muted-foreground text-xs">{product.supplier}</td>
                          <td className="p-4 px-6 align-middle text-right">
                            <Link href="/stock">
                              <Button size="sm" variant="destructive" className="h-8 shadow-sm">Reorder</Button>
                            </Link>
                          </td>
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
    </div>
  );
}
