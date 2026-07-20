import Link from 'next/link';
import { ArrowLeft, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function StockOutPage() {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/stock">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Out (Dispatch Stock)</h1>
          <p className="text-muted-foreground mt-1">Record outward stock movement, sales, or product wastage.</p>
        </div>
      </div>

      <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5 text-blue-500" />
            Stock Out Details
          </CardTitle>
          <CardDescription>Select product, specify outgoing quantity, and reasons for dispatch.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Product</label>
              <select className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="prod1">Premium Wireless Headphones (Current: 45)</option>
                <option value="prod2">Ergonomic Office Chair (Current: 12)</option>
                <option value="prod3">Stainless Steel Water Bottle (Current: 150)</option>
                <option value="prod4">USB-C Fast Charger (Current: 8)</option>
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dispatched Quantity</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason / Destination</label>
                <select className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="sale">Customer Order / Sale</option>
                  <option value="scrap">Damage / Scrap / Waste</option>
                  <option value="return">Return to Supplier</option>
                  <option value="internal">Internal Usage</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes / Order Reference</label>
              <textarea
                rows={3}
                placeholder="e.g. Customer Invoice #INV-0043, shipped via Local courier."
                className="w-full rounded-md border border-input bg-background/50 p-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Link href="/stock">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" className="shadow-lg shadow-blue-500/10 bg-blue-600 hover:bg-blue-700 text-white">
                Record Stock Out
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
