'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Truck, AlertCircle, IndianRupee, ShoppingCart, Layers, Laptop, ShoppingBag, X, ExternalLink, ChevronRight, Building2, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function Dashboard() {
  const { products, transactions, categories, orders, assets, assetSerials, suppliers, activeBranch } = useInventory();
  const [activeModalCard, setActiveModalCard] = useState<'bopp' | 'woven' | 'assets' | 'orders' | null>(null);

  const getStock = useCallback((p: any) => {
    if (!p.stock) return 0;
    if (typeof p.stock === 'number') return p.stock;
    if (activeBranch === 'All') {
      return Object.values(p.stock as Record<string, number>).reduce((acc, curr) => acc + (curr || 0), 0);
    }
    return (p.stock as Record<string, number>)[activeBranch] || 0;
  }, [activeBranch]);

  // General Metrics
  const { lowStockAlerts, activeOrdersCount } = useMemo(() => {
    const lowStockAlerts = products.filter((p) => getStock(p) <= p.threshold).length;
    const activeOrdersCount = orders ? orders.filter(o => o.status === 'Pending' || o.status === 'Processing' || o.status === 'Partial').length : 0;
    return { lowStockAlerts, activeOrdersCount };
  }, [products, orders, getStock]);

  // Orders Metrics & Detailed Data (All Orders)
  const allOrdersData = useMemo(() => {
    const list = orders || [];
    const totalOrdersCount = list.length;
    const totalOrderValue = list.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalItemsCount = list.reduce(
      (sum, o) => sum + (o.items ? o.items.reduce((iSum, item) => iSum + (item.quantity || 0), 0) : 0),
      0
    );

    // Group items across ALL orders for a products summary
    const allItemsMap: Record<string, { id: string; name: string; quantity: number; price: number; orderIds: string[] }> = {};
    list.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.productId || item.name;
        if (!allItemsMap[key]) {
          allItemsMap[key] = {
            id: item.productId || '',
            name: item.name,
            quantity: 0,
            price: item.price || 0,
            orderIds: [],
          };
        }
        allItemsMap[key].quantity += item.quantity || 0;
        if (!allItemsMap[key].orderIds.includes(order.id)) {
          allItemsMap[key].orderIds.push(order.id);
        }
      });
    });

    const allProductsList = Object.values(allItemsMap);

    return {
      list,
      totalOrdersCount,
      totalOrderValue,
      totalItemsCount,
      allProductsList,
    };
  }, [orders]);

  // BOPP Tape Metrics & Products
  const boppData = useMemo(() => {
    const boppProducts = products.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('bopp') || name.includes('bopp');
    });
    const totalStock = boppProducts.reduce((acc, p) => acc + getStock(p), 0);
    const totalValue = boppProducts.reduce((acc, p) => acc + (getStock(p) * (p.price || 0)), 0);
    const skuCount = boppProducts.length;
    return { boppProducts, totalStock, totalValue, skuCount };
  }, [products, getStock]);

  // Woven Bags Metrics & Products
  const wovenData = useMemo(() => {
    const wovenProducts = products.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      return cat.includes('woven') || name.includes('woven');
    });
    const totalStock = wovenProducts.reduce((acc, p) => acc + getStock(p), 0);
    const totalValue = wovenProducts.reduce((acc, p) => acc + (getStock(p) * (p.price || 0)), 0);
    const skuCount = wovenProducts.length;
    return { wovenProducts, totalStock, totalValue, skuCount };
  }, [products, getStock]);

  // Assets Metrics & Data
  const assetData = useMemo(() => {
    const assetProducts = products.filter((p) => {
      const catObj = (categories || []).find((c) => (c.name || '').toLowerCase() === (p.category || '').toLowerCase());
      const catName = (p.category || '').toLowerCase();
      const prodName = (p.name || '').toLowerCase();
      return catObj?.isAsset || catName.includes('asset') || prodName.includes('asset');
    });

    const totalAssetProductsStock = assetProducts.reduce((acc, p) => acc + getStock(p), 0);
    const totalAssetProductsValue = assetProducts.reduce((acc, p) => acc + (getStock(p) * (p.price || 0)), 0);

    const totalSerialUnits = assetSerials ? assetSerials.length : 0;
    const totalSerialValue = assetSerials ? assetSerials.reduce((sum, s) => sum + (s.amount || 0), 0) : 0;
    const assignedSerialsCount = assetSerials ? assetSerials.filter((s) => s.status === 'Assigned').length : 0;
    const assignedAssetsCount = assets ? assets.filter((a) => a.status === 'Assigned').length : 0;

    const totalUnits = totalSerialUnits > 0 ? totalSerialUnits : (totalAssetProductsStock > 0 ? totalAssetProductsStock : (assets ? assets.length : 0));
    const totalValue = totalSerialValue > 0 ? totalSerialValue : totalAssetProductsValue;
    const activeAssigned = assignedSerialsCount > 0 ? assignedSerialsCount : (assignedAssetsCount > 0 ? assignedAssetsCount : 0);

    return {
      assetProducts,
      assetSerials: assetSerials || [],
      assets: assets || [],
      totalUnits,
      totalValue,
      activeAssigned,
      skuCount: assetProducts.length,
    };
  }, [products, categories, assetSerials, assets, getStock]);

  // Category Distribution (Value)
  const categoryData = useMemo(() => {
    return categories.map((cat) => {
      const value = products
        .filter((p) => (p.category || '').toLowerCase() === (cat.name || '').toLowerCase())
        .reduce((acc, p) => acc + (getStock(p) * (p.price || 0)), 0);
      return { name: cat.name || 'Unknown', value };
    }).filter(c => c.value > 0);
  }, [categories, products, getStock]);

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

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

      {/* Top Metric Cards */}
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
        {/* BOPP Tape Card */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
          <div onClick={() => setActiveModalCard('bopp')} className="block h-full cursor-pointer">
            <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">BOPP Tape</CardTitle>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 ring-1 ring-indigo-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Layers className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight font-mono group-hover:text-indigo-500 transition-colors">
                  {boppData.totalStock.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">units</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                  <span>₹{boppData.totalValue.toLocaleString('en-IN')} val</span>
                  <span className="font-medium bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[10px]">{boppData.skuCount} SKUs &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Woven Bags Card */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
          <div onClick={() => setActiveModalCard('woven')} className="block h-full cursor-pointer">
            <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Woven Bags</CardTitle>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 ring-1 ring-cyan-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                  <ShoppingBag className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight font-mono group-hover:text-cyan-500 transition-colors">
                  {wovenData.totalStock.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">units</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                  <span>₹{wovenData.totalValue.toLocaleString('en-IN')} val</span>
                  <span className="font-medium bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded text-[10px]">{wovenData.skuCount} SKUs &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Assets Card */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
          <div onClick={() => setActiveModalCard('assets')} className="block h-full cursor-pointer">
            <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Assets</CardTitle>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Laptop className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight font-mono group-hover:text-purple-500 transition-colors">
                  {assetData.totalUnits.toLocaleString('en-IN')} <span className="text-xs font-normal text-muted-foreground">units</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                  <span>₹{assetData.totalValue.toLocaleString('en-IN')} val</span>
                  <span className="font-medium bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded text-[10px]">{assetData.activeAssigned} Assigned &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Low Stock Alerts Card */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
          <Link href="/stock/alerts" className="block h-full cursor-pointer">
            <Card className="group relative h-full overflow-hidden bg-gradient-to-br from-card to-card/50 backdrop-blur-xl border-border/50 shadow-sm transition-all hover:shadow-xl hover:shadow-destructive/10 hover:-translate-y-1 duration-300 hover:border-destructive/30">
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
                <p className="text-xs text-muted-foreground mt-1">Items below minimum threshold &rarr;</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Active Orders Card */}
        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } }}>
          <div onClick={() => setActiveModalCard('orders')} className="block h-full cursor-pointer">
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
                <p className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
                  <span>{allOrdersData.totalItemsCount} units</span>
                  <span className="font-medium bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded text-[10px]">View Products &rarr;</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts & Suppliers Section */}
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

        {/* Suppliers List Card */}
        <Card className="bg-card/50 backdrop-blur-xl shadow-lg border-border/50 transition-all hover:shadow-xl hover:border-primary/20 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0 border-b border-border/50 mb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">Suppliers Directory</CardTitle>
                <CardDescription>Active vendor partners & contacts.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-bold">
                  {suppliers ? suppliers.length : 0} Suppliers
                </span>
                <Link href="/suppliers">
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary">
                    View All <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[230px] overflow-y-auto pr-2 space-y-2.5 pt-2">
            {!suppliers || suppliers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No suppliers recorded.</p>
            ) : (
              suppliers.map((s, index) => {
                const suppliedProductsCount = products.filter(
                  (p) =>
                    (p.supplier || '').toLowerCase() === (s.name || '').toLowerCase() ||
                    (p.suppliersList || []).some((sl) => (sl.supplierName || '').toLowerCase() === (s.name || '').toLowerCase())
                ).length;

                return (
                  <div key={`${s.name}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold leading-none">{s.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          {s.contact && <span>Contact: {s.contact}</span>}
                          {s.phone && <span>• {s.phone}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
                        {suppliedProductsCount} {suppliedProductsCount === 1 ? 'Product' : 'Products'}
                      </span>
                    </div>
                  </div>
                );
              })
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
          <Link href="/reports/audit-log">
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

      {/* ========================================================================= */}
      {/* CARD DETAILS MODAL OVERLAY */}
      {/* ========================================================================= */}
      {activeModalCard && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl sm:max-w-6xl max-h-[90vh] bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  activeModalCard === 'bopp'
                    ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                    : activeModalCard === 'woven'
                    ? 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                    : activeModalCard === 'assets'
                    ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {activeModalCard === 'bopp' && <Layers className="h-5 w-5" />}
                  {activeModalCard === 'woven' && <ShoppingBag className="h-5 w-5" />}
                  {activeModalCard === 'assets' && <Laptop className="h-5 w-5" />}
                  {activeModalCard === 'orders' && <ShoppingCart className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {activeModalCard === 'bopp' && 'BOPP Tape Inventory Details'}
                    {activeModalCard === 'woven' && 'Woven Bags Inventory Details'}
                    {activeModalCard === 'assets' && 'Assets & Equipment Overview'}
                    {activeModalCard === 'orders' && 'All Purchase Orders & Products'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {activeModalCard === 'bopp' && 'Detailed breakdown of all BOPP tape products and stock levels.'}
                    {activeModalCard === 'woven' && 'Detailed breakdown of all woven bag products and stock levels.'}
                    {activeModalCard === 'assets' && 'Comprehensive tracking of all physical assets and serial allocations.'}
                    {activeModalCard === 'orders' && 'Overview of all purchase orders across all statuses and their ordered products.'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActiveModalCard(null)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Top Summary Chips */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium">Total Quantity</span>
                  <div className="text-xl font-bold font-mono text-foreground">
                    {activeModalCard === 'bopp' && `${boppData.totalStock.toLocaleString('en-IN')} units`}
                    {activeModalCard === 'woven' && `${wovenData.totalStock.toLocaleString('en-IN')} units`}
                    {activeModalCard === 'assets' && `${assetData.totalUnits.toLocaleString('en-IN')} units`}
                    {activeModalCard === 'orders' && `${allOrdersData.totalItemsCount.toLocaleString('en-IN')} units`}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium">Estimated Valuation</span>
                  <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    ₹
                    {activeModalCard === 'bopp' && boppData.totalValue.toLocaleString('en-IN')}
                    {activeModalCard === 'woven' && wovenData.totalValue.toLocaleString('en-IN')}
                    {activeModalCard === 'assets' && assetData.totalValue.toLocaleString('en-IN')}
                    {activeModalCard === 'orders' && allOrdersData.totalOrderValue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 space-y-0.5">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {activeModalCard === 'assets' ? 'Assigned Devices' : activeModalCard === 'orders' ? 'Total Orders Count' : 'Cataloged SKUs'}
                  </span>
                  <div className="text-xl font-bold font-mono text-primary">
                    {activeModalCard === 'bopp' && `${boppData.skuCount} SKUs`}
                    {activeModalCard === 'woven' && `${wovenData.skuCount} SKUs`}
                    {activeModalCard === 'assets' && `${assetData.activeAssigned} Assigned`}
                    {activeModalCard === 'orders' && `${allOrdersData.totalOrdersCount} Orders`}
                  </div>
                </div>
              </div>

              {/* BOPP & Woven Bags Product Breakdown Table */}
              {(activeModalCard === 'bopp' || activeModalCard === 'woven') && (
                <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
                  <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      Product Catalog Breakdown ({activeModalCard === 'bopp' ? boppData.boppProducts.length : wovenData.wovenProducts.length})
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Branch: {activeBranch}</span>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-muted/20 text-[11px] text-muted-foreground uppercase border-b border-border/40 sticky top-0 bg-card z-10">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Product Name</th>
                          <th className="px-4 py-2.5 font-semibold">Category</th>
                          <th className="px-4 py-2.5 font-semibold">Price / Unit</th>
                          <th className="px-4 py-2.5 font-semibold">Stock</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Total Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {(activeModalCard === 'bopp' ? boppData.boppProducts : wovenData.wovenProducts).length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                              No products found matching this category.
                            </td>
                          </tr>
                        ) : (
                          (activeModalCard === 'bopp' ? boppData.boppProducts : wovenData.wovenProducts).map((prod) => {
                            const stock = getStock(prod);
                            const val = stock * (prod.price || 0);
                            const isLow = stock <= prod.threshold;
                            return (
                              <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-2.5 font-bold text-foreground">
                                  <Link
                                    href={`/reports/product-details?productId=${encodeURIComponent(prod.id)}`}
                                    className="hover:text-primary transition-colors flex items-center gap-1.5"
                                  >
                                    {prod.name}
                                    <ExternalLink className="h-3 w-3 opacity-50" />
                                  </Link>
                                </td>
                                <td className="px-4 py-2.5 text-muted-foreground">{prod.category || 'General'}</td>
                                <td className="px-4 py-2.5 font-mono">₹{(prod.price || 0).toLocaleString('en-IN')}</td>
                                <td className="px-4 py-2.5 font-mono">
                                  <span className={`px-2 py-0.5 rounded-md font-bold ${
                                    isLow ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  }`}>
                                    {stock} {prod.uom || 'units'}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-mono font-bold text-right text-foreground">
                                  ₹{val.toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Assets Breakdown Table */}
              {activeModalCard === 'assets' && (
                <div className="border border-border/60 rounded-xl overflow-hidden bg-card space-y-0">
                  <div className="px-4 py-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
                    <span className="font-bold text-foreground">
                      Tracked Asset Units &amp; Allocations ({assetData.assetSerials.length})
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Branch: {activeBranch}</span>
                  </div>
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-muted/20 text-[11px] text-muted-foreground uppercase border-b border-border/40 sticky top-0 bg-card z-10">
                        <tr>
                          <th className="px-4 py-2.5 font-semibold">Serial / ID</th>
                          <th className="px-4 py-2.5 font-semibold">Device &amp; Model</th>
                          <th className="px-4 py-2.5 font-semibold">Status</th>
                          <th className="px-4 py-2.5 font-semibold">Assigned Holder</th>
                          <th className="px-4 py-2.5 font-semibold text-right">Value (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {assetData.assetSerials.length === 0 ? (
                          assetData.assets.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                                No tracked assets registered in active inventory.
                              </td>
                            </tr>
                          ) : (
                            assetData.assets.map((ast) => (
                              <tr key={ast.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-2.5 font-mono font-bold text-primary">{ast.id}</td>
                                <td className="px-4 py-2.5 font-bold text-foreground">{ast.productName}</td>
                                <td className="px-4 py-2.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                    {ast.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-medium text-foreground">👤 {ast.assignedTo}</td>
                                <td className="px-4 py-2.5 text-right font-mono font-bold text-muted-foreground">—</td>
                              </tr>
                            ))
                          )
                        ) : (
                          assetData.assetSerials.map((s) => (
                            <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-2.5 font-mono font-bold text-primary">{s.serialNumber || s.id}</td>
                              <td className="px-4 py-2.5">
                                <span className="font-bold text-foreground block">{s.productName}</span>
                                {s.model && <span className="text-[10px] text-muted-foreground">Model: {s.model}</span>}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  s.status === 'In Stock'
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    : s.status === 'Assigned'
                                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                    : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                }`}>
                                  {s.status}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                {s.assignedTo ? (
                                  <span className="font-medium text-foreground">👤 {s.assignedTo}</span>
                                ) : (
                                  <span className="text-muted-foreground italic">—</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 font-mono font-bold text-right text-foreground">
                                ₹{(s.amount || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* All Orders Breakdown */}
              {activeModalCard === 'orders' && (
                <div className="space-y-4">
                  {/* All Orders List */}
                  <div className="border border-border/60 rounded-xl overflow-hidden bg-card">
                    <div className="px-4 py-3 bg-amber-500/10 border-b border-border/50 flex items-center justify-between">
                      <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <ShoppingCart className="h-4 w-4 text-amber-500" /> Purchase Orders Registry ({allOrdersData.list.length} Total Orders)
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Branch: {activeBranch}</span>
                    </div>
                    <div className="p-4 space-y-3.5 max-h-[420px] overflow-y-auto">
                      {allOrdersData.list.length === 0 ? (
                        <p className="text-center py-6 text-muted-foreground italic">No purchase orders found.</p>
                      ) : (
                        allOrdersData.list.map((order, idx) => (
                          <div key={`${order.id}-${idx}`} className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{order.id}</span>
                                <span className="font-bold text-foreground">🏢 {order.supplier}</span>
                                {order.branch && <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{order.branch}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  order.status === 'Completed'
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    : order.status === 'Pending'
                                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                    : order.status === 'Processing'
                                    ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  {order.status}
                                </span>
                                <span className="font-mono font-bold text-foreground">
                                  ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                            {/* Items list inside order */}
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">Order Items:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {(order.items || []).map((item, i) => (
                                  <div key={i} className="flex items-center justify-between px-2.5 py-1 rounded bg-background/80 border border-border/30 text-[11px]">
                                    <span className="font-medium truncate mr-2">{item.name}</span>
                                    <span className="font-mono font-bold text-amber-600 shrink-0">{item.quantity} Qty</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">Click any item for full product details</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModalCard(null)}
                  className="text-xs cursor-pointer"
                >
                  Close
                </Button>

                {activeModalCard === 'assets' ? (
                  <Link href="/stock/assets">
                    <Button size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
                      Manage Assets Page <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : activeModalCard === 'orders' ? (
                  <Link href="/orders">
                    <Button size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
                      View Orders Page <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/stock">
                    <Button size="sm" className="text-xs font-bold gap-1.5 cursor-pointer">
                      View Stock Inventory <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
