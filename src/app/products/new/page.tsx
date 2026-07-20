import Link from 'next/link';
import { ArrowLeft, Box } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewProductPage() {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Product</h1>
          <p className="text-muted-foreground mt-1">Create a new entry in your global product catalog.</p>
        </div>
      </div>

      <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Product Details</CardTitle>
          <CardDescription>Enter product specification, pricing, and initial stock values.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ergonomic Office Desk"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU / Barcode</label>
                <input
                  type="text"
                  placeholder="e.g. FURN-DSK-02"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm font-mono transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
                <select className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="electronics">Electronics</option>
                  <option value="furniture">Furniture</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="supplies">Office Supplies</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Supplier</label>
                <select className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="audiotech">AudioTech Ltd.</option>
                  <option value="comfortseats">ComfortSeats Co.</option>
                  <option value="ecoware">EcoWare Solutions</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unit Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Initial Stock Qty</label>
                <input
                  type="number"
                  placeholder="0"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Minimum Stock Alert</label>
                <input
                  type="number"
                  placeholder="10"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Link href="/products">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" className="shadow-lg shadow-primary/20 hover:shadow-primary/40">
                Create Product
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
