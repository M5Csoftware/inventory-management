'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDownLeft, ArrowUpRight, Search, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';

export default function StockPage() {
  const { transactions } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate monthly stats based on live transactions
  const monthlyInflows = transactions
    .filter((tx) => tx.type === 'Stock In')
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const monthlyOutflows = transactions
    .filter((tx) => tx.type === 'Stock Out')
    .reduce((acc, curr) => acc + curr.quantity, 0);

  const netVariance = monthlyInflows - monthlyOutflows;

  const filteredTransactions = transactions.filter((tx) =>
    tx.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.reasonOrLocation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground mt-1">Record shipments, adjust stock levels, and view transaction history.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/stock/out">
            <Button variant="outline" className="shadow-sm">
              <Minus className="mr-2 h-4 w-4 text-destructive" /> Stock Out
            </Button>
          </Link>
          <Link href="/stock/in">
            <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
              <Plus className="mr-2 h-4 w-4" /> Stock In
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Inflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthlyInflows.toLocaleString()} units</div>
            <p className="text-xs text-muted-foreground mt-1">Total physical stock items received</p>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{monthlyOutflows.toLocaleString()} units</div>
            <p className="text-xs text-muted-foreground mt-1">Total physical stock items dispatched</p>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Stock Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${netVariance >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
              {netVariance >= 0 ? '+' : ''}{netVariance.toLocaleString()} units
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net variance in active inventory</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Recent Stock Transactions</CardTitle>
              <CardDescription>History of stock inflows and outflows.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="h-9 w-full sm:w-64 rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            {filteredTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No transactions recorded yet.</p>
            ) : (
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Transaction ID</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Quantity</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Details / Location</th>
                    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle text-muted-foreground text-xs">{tx.date}</td>
                      <td className="p-4 align-middle font-mono font-medium text-xs">{tx.id}</td>
                      <td className="p-4 align-middle font-medium">{tx.productName}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          tx.type === 'Stock In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className={`p-4 align-middle font-semibold ${
                        tx.type === 'Stock In' ? 'text-emerald-500' : 'text-blue-500'
                      }`}>
                        {tx.type === 'Stock In' ? '+' : '-'}{tx.quantity}
                      </td>
                      <td className="p-4 align-middle text-muted-foreground text-xs">{tx.reasonOrLocation}</td>
                      <td className="p-4 align-middle">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">
                          Completed
                        </span>
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
