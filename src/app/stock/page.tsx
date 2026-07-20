import { ArrowDownLeft, ArrowUpRight, Search, Plus, Minus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock Transaction History
const transactions = [
  { id: 'TX-101', date: '2026-07-20 10:30', product: 'Premium Wireless Headphones', type: 'Stock In', quantity: '+20', location: 'Warehouse A', status: 'Completed' },
  { id: 'TX-102', date: '2026-07-20 09:15', product: 'USB-C Fast Charger', type: 'Stock Out', quantity: '-5', location: 'Warehouse B', status: 'Completed' },
  { id: 'TX-103', date: '2026-07-19 15:45', product: 'Ergonomic Office Chair', type: 'Stock In', quantity: '+10', location: 'Warehouse A', status: 'Completed' },
];

export default function StockPage() {
  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground mt-1">Record shipments, adjust stock levels, and view transaction history.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-sm">
            <Minus className="mr-2 h-4 w-4 text-destructive" /> Stock Out
          </Button>
          <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
            <Plus className="mr-2 h-4 w-4" /> Stock In
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Inflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,840 units</div>
            <div className="flex items-center mt-1 text-xs text-emerald-500 font-medium">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +14% <span className="text-muted-foreground font-normal ml-1">since last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Outflows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,210 units</div>
            <div className="flex items-center mt-1 text-xs text-destructive font-medium">
              <ArrowDownLeft className="mr-1 h-3 w-3" />
              -3% <span className="text-muted-foreground font-normal ml-1">since last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/60 backdrop-blur-sm border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Variance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">+630 units</div>
            <p className="text-xs text-muted-foreground mt-1">Growth in active inventory</p>
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
                placeholder="Search transactions..."
                className="h-9 w-full sm:w-64 rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Transaction ID</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Product</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Quantity</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle text-muted-foreground text-xs">{tx.date}</td>
                    <td className="p-4 align-middle font-mono font-medium text-xs">{tx.id}</td>
                    <td className="p-4 align-middle font-medium">{tx.product}</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.type === 'Stock In' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`p-4 align-middle font-semibold ${
                      tx.type === 'Stock In' ? 'text-emerald-500' : 'text-blue-500'
                    }`}>{tx.quantity}</td>
                    <td className="p-4 align-middle text-muted-foreground">{tx.location}</td>
                    <td className="p-4 align-middle">
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
