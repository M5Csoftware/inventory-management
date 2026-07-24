'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Truck, AlertCircle, IndianRupee, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export default function Dashboard() {
  const { products, transactions, categories, orders, activeBranch } = useInventory();
  const [stockFlowDays, setStockFlowDays] = useState(7);
  const [monthlyTimeframe, setMonthlyTimeframe] = useState<'current_month' | 'last_month' | 'last_6_months'>('last_6_months');
  const [selectedMonthlyProductId, setSelectedMonthlyProductId] = useState<string>('All');

  const getStock = (p: any) => {
    if (!p.stock) return 0;
    if (typeof p.stock === 'number') return p.stock;
    if (activeBranch === 'All') {
      return Object.values(p.stock as Record<string, number>).reduce((acc, curr) => acc + (curr || 0), 0);
    }
    return (p.stock as Record<string, number>)[activeBranch] || 0;
  };

  // Metrics
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((acc, curr) => acc + getStock(curr), 0);
  const lowStockAlerts = products.filter((p) => getStock(p) <= p.threshold).length;
  const totalInventoryValue = products.reduce((acc, curr) => acc + (getStock(curr) * curr.price), 0);
  const activeOrdersCount = orders ? orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length : 0;

  // Category Distribution (Value)
  const categoryData = categories.map((cat) => {
    const value = products
      .filter((p) => (p.category || '').toLowerCase() === (cat.name || '').toLowerCase())
      .reduce((acc, p) => acc + (getStock(p) * (p.price || 0)), 0);
    return { name: cat.name || 'Unknown', value };
  }).filter(c => c.value > 0);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  // Stock Movement Data (Grouped by Date)
  const transactionsByDate = transactions.reduce((acc: any, curr) => {
    const date = curr.date.split(' ')[0]; // yyyy-mm-dd
    if (!acc[date]) {
      acc[date] = { date, 'Stock In': 0, 'Stock Out': 0 };
    }
    if (curr.type === 'Stock In') {
      acc[date]['Stock In'] += curr.quantity;
    } else {
      acc[date]['Stock Out'] += curr.quantity;
    }
    return acc;
  }, {});
  
  // Generate last N days array
  const lastNDays = Array.from({ length: stockFlowDays }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - ((stockFlowDays - 1) - i));
    return d.toISOString().split('T')[0];
  });

  const movementData = lastNDays.map(date => {
    return transactionsByDate[date] || { date, 'Stock In': 0, 'Stock Out': 0 };
  });

  // Calculate Monthly Opening & Closing Stock Data (Start of month vs End of month)
  const monthlyStockChartData = (() => {
    const data: { label: string; 'Opening Stock': number; 'Closing Stock': number; 'Stock In': number; 'Stock Out': number }[] = [];
    const now = new Date();

    const targetProducts = selectedMonthlyProductId === 'All'
      ? products
      : products.filter(p => p.id === selectedMonthlyProductId);
    
    const targetTransactions = selectedMonthlyProductId === 'All'
      ? transactions
      : transactions.filter(t => t.productId === selectedMonthlyProductId);

    const calculateMonthData = (year: number, monthIdx: number, customLabel?: string) => {
      const monthStart = new Date(year, monthIdx, 1, 0, 0, 0, 0);
      const monthEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
      const monthName = monthStart.toLocaleString("default", { month: "short" });
      const label = customLabel || `${monthName}${year !== now.getFullYear() ? ` '${String(year).slice(-2)}` : ""}`;

      let openingStock = 0;
      let stockIn = 0;
      let stockOut = 0;

      if (targetTransactions.length > 0) {
        for (const tx of targetTransactions) {
          const txDate = new Date(tx.date || (tx as any).createdAt);
          if (txDate < monthStart) {
            if (tx.type === "Stock In") openingStock += tx.quantity;
            else if (tx.type === "Stock Out") openingStock -= tx.quantity;
          } else if (txDate >= monthStart && txDate <= monthEnd) {
            if (tx.type === "Stock In") stockIn += tx.quantity;
            else if (tx.type === "Stock Out") stockOut += tx.quantity;
          }
        }
      } else {
        for (const p of targetProducts) {
          openingStock += getStock(p);
        }
      }

      if (openingStock <= 0 && targetTransactions.length === 0) {
        openingStock = targetProducts.reduce((acc, p) => acc + getStock(p), 0);
      }

      const closingStock = Math.max(0, openingStock + stockIn - stockOut);

      return {
        label,
        "Opening Stock": Math.max(0, openingStock),
        "Stock In": stockIn,
        "Stock Out": stockOut,
        "Closing Stock": closingStock,
      };
    };

    if (monthlyTimeframe === 'current_month') {
      data.push(calculateMonthData(now.getFullYear(), now.getMonth(), `Current (${now.toLocaleString("default", { month: "short" })})`));
    } else if (monthlyTimeframe === 'last_month') {
      const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const targetMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const lastMonthName = new Date(targetYear, targetMonth, 1).toLocaleString("default", { month: "short" });
      data.push(calculateMonthData(targetYear, targetMonth, `Last (${lastMonthName})`));
    } else {
      // Last 6 Months
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        data.push(calculateMonthData(d.getFullYear(), d.getMonth()));
      }
    }

    return data;
  })();

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Crucial inventory insights at a glance.</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="bg-background/50 backdrop-blur-sm border-dashed text-xs sm:text-sm">
              View Reports
            </Button>
          </Link>
          <Link href="/products/new">
            <Button size="sm" className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5 text-xs sm:text-sm">
              <Package className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <motion.div 
        className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
        <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Inventory Value</CardTitle>
            <div className="p-2 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight font-mono group-hover:text-primary transition-colors">₹{totalInventoryValue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Total worth of current stock</p>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
        <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Unique Products</CardTitle>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight group-hover:text-blue-500 transition-colors">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Active SKUs cataloged</p>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
        <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Stock Units</CardTitle>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight group-hover:text-emerald-500 transition-colors">{totalStockUnits}</div>
            <p className="text-xs text-muted-foreground mt-1">Physical items in warehouse</p>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
        <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-destructive/5 hover:-translate-y-1 duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-destructive/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Low Stock Alerts</CardTitle>
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/20 relative transition-transform duration-300 group-hover:scale-110">
              <AlertCircle className="h-4 w-4" />
              {lowStockAlerts > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive animate-pulse ring-2 ring-card"></span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-destructive group-hover:scale-105 transform origin-left transition-transform">{lowStockAlerts}</div>
            <p className="text-xs text-muted-foreground mt-1">Items below minimum threshold</p>
          </CardContent>
        </Card>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Active Orders</CardTitle>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 transition-transform duration-300 group-hover:scale-110">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight group-hover:text-amber-500 transition-colors">{activeOrdersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Orders in progress</p>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        
        {/* Category Value Distribution */}
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/50 transition-all hover:shadow-xl hover:border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Valuation by Category</CardTitle>
            <CardDescription>Capital distribution.</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px]">
            {categoryData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No category data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`₹${(Number(value) || 0).toLocaleString('en-IN')}`, 'Value']}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} 
                    iconType="circle" 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Items List */}
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/50 transition-all hover:shadow-xl hover:border-destructive/20 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0 border-b border-border/50 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Attention Required</CardTitle>
                <CardDescription>Items below stock threshold.</CardDescription>
              </div>
              <div className="bg-destructive/10 text-destructive px-2 py-1 rounded-md text-xs font-bold">
                {lowStockAlerts}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[230px] overflow-y-auto pr-2 space-y-3 pt-2">
            {products.filter((p) => getStock(p) <= p.threshold).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All stock levels are healthy.</p>
            ) : (
              products.filter((p) => getStock(p) <= p.threshold).slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium leading-none">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Threshold: {p.threshold} units</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-destructive">{getStock(p)}</p>
                    <p className="text-[10px] text-muted-foreground">Remaining</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Monthly Opening & Closing Stock Comparison Chart (Horizontal Layout) */}
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/50 transition-all hover:shadow-xl hover:border-primary/20">
          <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg bg-gradient-to-r from-blue-500 to-emerald-500 bg-clip-text text-transparent">
                Monthly Stock Overview
              </CardTitle>
              <CardDescription>
                Opening Stock vs Closing Stock.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {/* Product Selector Dropdown */}
              <select
                value={selectedMonthlyProductId}
                onChange={(e) => setSelectedMonthlyProductId(e.target.value)}
                className="h-7 text-xs bg-background border border-border rounded-md px-2 py-0 focus:outline-none focus:ring-1 focus:ring-primary max-w-[120px] truncate"
              >
                <option value="All">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Timeframe Selector Dropdown */}
              <select
                value={monthlyTimeframe}
                onChange={(e) => setMonthlyTimeframe(e.target.value as 'current_month' | 'last_month' | 'last_6_months')}
                className="h-7 text-xs bg-background border border-border rounded-md px-2 py-0 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="current_month">Current Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_6_months">Last 6 Months</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="h-[240px] pt-4">
            {monthlyStockChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No monthly stock data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={monthlyStockChartData}
                  margin={{ top: 10, right: 25, left: 10, bottom: 0 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#94a3b8" opacity={0.15} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#94a3b8', opacity: 0.3 }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#94a3b8', opacity: 0.3 }} width={85} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 8 }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 bg-card border border-border rounded-xl shadow-xl space-y-1.5 text-xs">
                            <p className="font-bold text-foreground border-b border-border/50 pb-1">{label}</p>
                            <div className="flex justify-between gap-4 text-blue-500 font-medium">
                              <span>Opening Stock (Start):</span>
                              <span className="font-bold">{data["Opening Stock"]}</span>
                            </div>
                            {data["Stock In"] > 0 && (
                              <div className="flex justify-between gap-4 text-emerald-500 font-medium">
                                <span>Stock In (+):</span>
                                <span className="font-bold">+{data["Stock In"]}</span>
                              </div>
                            )}
                            {data["Stock Out"] > 0 && (
                              <div className="flex justify-between gap-4 text-amber-500 font-medium">
                                <span>Stock Out (-):</span>
                                <span className="font-bold">-{data["Stock Out"]}</span>
                              </div>
                            )}
                            <div className="flex justify-between gap-4 text-emerald-500 font-bold border-t border-border/40 pt-1">
                              <span>Closing Stock (End):</span>
                              <span>{data["Closing Stock"]}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} iconType="circle" />
                  <Bar dataKey="Opening Stock" fill="#3b82f6" radius={[0, 6, 6, 0]} maxBarSize={16} />
                  <Bar dataKey="Closing Stock" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Daily Stock Movement Trend */}
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/50 transition-all hover:shadow-xl hover:border-primary/20">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">Stock Flow</CardTitle>
              <CardDescription>Daily in vs out.</CardDescription>
            </div>
            <div className="flex gap-1.5">
              <Button 
                variant={stockFlowDays === 7 ? "default" : "outline"} 
                size="sm" 
                onClick={() => setStockFlowDays(7)}
                className="text-xs h-7 px-2"
              >
                7D
              </Button>
              <Button 
                variant={stockFlowDays === 15 ? "default" : "outline"} 
                size="sm" 
                onClick={() => setStockFlowDays(15)}
                className="text-xs h-7 px-2"
              >
                15D
              </Button>
              <Button 
                variant={stockFlowDays === 30 ? "default" : "outline"} 
                size="sm" 
                onClick={() => setStockFlowDays(30)}
                className="text-xs h-7 px-2"
              >
                30D
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[240px] pt-4">
            {movementData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No movement data.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={movementData} margin={{ top: 20, right: 15, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="#94a3b8" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={true} axisLine={true} tickMargin={12} tickFormatter={(val) => val.split('-')[2]} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={true} axisLine={true} />
                  <Tooltip 
                    cursor={false}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                  <Bar dataKey="Stock In" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={24} />
                  <Bar dataKey="Stock Out" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity (Bottom) */}
      <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/50">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/50">
          <div>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <CardDescription>Latest movements in your inventory.</CardDescription>
          </div>
          <Link href="/stock">
            <Button variant="secondary" size="sm" className="text-xs rounded-lg hover:shadow-md transition-shadow">View All</Button>
          </Link>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-70">
                <Truck className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No recent transactions recorded.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {recentTransactions.map((item, i) => (
                  <div key={i} className="group flex items-center p-4 bg-background/40 rounded-2xl hover:bg-muted/50 transition-all border border-border/40 hover:border-border hover:shadow-md">
                    <div className={`p-3 rounded-xl mr-4 shadow-sm transition-transform duration-300 group-hover:scale-110 ${
                      item.type === 'Stock In'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}>
                      {item.type === 'Stock In' ? <Truck className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 space-y-1 overflow-hidden">
                      <p className="text-sm font-bold leading-none truncate group-hover:text-primary transition-colors">
                        {item.productName}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <span className={`font-medium ${item.type === 'Stock In' ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                          {item.type}
                        </span> 
                        <span className="mx-1.5 opacity-50">•</span> 
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded-md">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground whitespace-nowrap ml-3 bg-background px-2 py-1 rounded-lg border border-border/50 shadow-sm">
                      {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
