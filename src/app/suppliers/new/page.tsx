import Link from 'next/link';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewSupplierPage() {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/suppliers">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Supplier</h1>
          <p className="text-muted-foreground mt-1">Register a partner supplier for supply logistics.</p>
        </div>
      </div>

      <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Supplier Details
          </CardTitle>
          <CardDescription>Enter corporate details and primary contact information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apex Industrial Supplies"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. contact@apexsupplies.com"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Corporate Office Address</label>
              <input
                type="text"
                placeholder="e.g. 100 Main St, Suite 400, Seattle, WA"
                className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Link href="/suppliers">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" className="shadow-lg shadow-primary/20 hover:shadow-primary/40">
                Create Supplier
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
