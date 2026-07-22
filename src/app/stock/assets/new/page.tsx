'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInventory, Product } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Laptop, User, FileText, Package } from 'lucide-react';

export default function NewAssetAssignmentPage() {
  const { products, assignAsset, activeBranch } = useInventory();
  const router = useRouter();

  const [productId, setProductId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (products.length > 0 && !productId) {
      setProductId(products[0].id);
    }
  }, [products, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !assignedTo || !quantity) return;

    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) return;

    setIsSubmitting(true);
    const success = await assignAsset({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      assignedTo,
      quantity: parseInt(quantity),
      notes: notes || undefined,
    });

    if (success) {
      router.push('/stock/assets');
    } else {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/stock/assets">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-2 transition-all hover:scale-105 hover:border-primary/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Assign Asset
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                Assign a product as an asset to an individual or department.
              </p>
            </div>
          </div>
        </div>

        {products.length === 0 ? (
          <Card className="border border-border/50 bg-background/60 backdrop-blur-sm p-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              You must have at least one product created before assigning an asset.
            </p>
            <Link href="/products/new">
              <Button size="sm">Create Product</Button>
            </Link>
          </Card>
        ) : (
          <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Laptop className="h-4 w-4 text-blue-500" />
                Asset Details
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Select an item from inventory to mark it as assigned. This will deduct from the available stock.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Package className="h-3 w-3" />
                    Select Item <span className="text-destructive">*</span>
                  </label>
                  <select 
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all appearance-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {products.map((prod: Product) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (Available: {activeBranch === 'All' ? Object.values(prod.stock || {}).reduce((a, b) => a + b, 0) : prod.stock?.[activeBranch] || 0} units)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <User className="h-3 w-3" />
                      Assigned To <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Quantity <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      min="1"
                      className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    Notes / Conditions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Laptop condition is good, includes charger."
                    className="w-full rounded-lg border-2 border-muted bg-background px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end pt-4 border-t border-border/50">
                  <Link href="/stock/assets" className="w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-2 transition-all hover:bg-muted/50 h-10"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto h-10 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/40"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Assigning...' : 'Assign Asset'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
