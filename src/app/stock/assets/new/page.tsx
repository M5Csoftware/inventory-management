'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInventory, Product, ASSET_DEPARTMENTS, ASSET_APPROVED_BY, BRANCHES } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Laptop, User, FileText, Package, ShieldCheck, Building2, CheckCircle2 } from 'lucide-react';

export default function NewAssetAssignmentPage() {
  const { products, categories, assignAsset, activeBranch } = useInventory();
  const router = useRouter();

  const [selectedBranch, setSelectedBranch] = useState<string>(() =>
    activeBranch === 'All' ? 'Ahmedabad' : activeBranch
  );

  useEffect(() => {
    if (activeBranch !== 'All') {
      setSelectedBranch(activeBranch);
    }
  }, [activeBranch]);

  const [productId, setProductId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [department, setDepartment] = useState<string>(ASSET_DEPARTMENTS[0]);
  const [approvedBy, setApprovedBy] = useState<string>(ASSET_APPROVED_BY[0]);
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [warranty, setWarranty] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Filter products that belong to an asset category
  const assetProducts = products.filter((prod) => {
    const category = categories.find((c) => c.name.toLowerCase() === (prod.category || '').toLowerCase());
    return category?.isAsset === true;
  });

  const getAvailableStock = (prod: Product, branch: string) => {
    if (!prod || !prod.stock) return 0;
    if (typeof prod.stock === 'number') return isNaN(prod.stock) ? 0 : prod.stock;
    if (typeof prod.stock === 'object') {
      if (branch === 'All') {
        return Object.values(prod.stock).reduce(
          (a, b) => a + (Number(b) || 0),
          0
        );
      }
      return Number(prod.stock[branch]) || 0;
    }
    return 0;
  };

  useEffect(() => {
    if (assetProducts.length > 0 && !productId) {
      setProductId(assetProducts[0].id);
    }
  }, [assetProducts, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !productId || !assignedTo || !quantity) return;

    const selectedProduct = products.find(p => p.id === productId);
    if (!selectedProduct) return;

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const success = await assignAsset({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        assignedTo,
        department,
        approvedBy,
        modelNumber: modelNumber || undefined,
        serialNumber: serialNumber || undefined,
        quantity: parseInt(quantity, 10) || 1,
        notes: notes || undefined,
        warranty: warranty || undefined,
        branch: selectedBranch as any,
      });

      if (success) {
        router.push('/stock/assets');
      }
    } finally {
      submittingRef.current = false;
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

        {assetProducts.length === 0 ? (
          <Card className="border border-border/50 bg-background/60 backdrop-blur-sm p-8 text-center space-y-4 max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground">
              You must have at least one asset product created before assigning assets. Ensure you have created a product under an asset category.
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
                Select an item from asset inventory to mark it as assigned.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Building2 className="h-3 w-3 text-primary" />
                      Branch Warehouse <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all appearance-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer font-medium"
                    >
                      {BRANCHES.map((b: string) => (
                        <option key={b} value={b}>
                          🏢 {b} Branch
                        </option>
                      ))}
                    </select>
                  </div>

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
                      {assetProducts.map((prod: Product) => {
                        const avail = getAvailableStock(prod, selectedBranch);
                        return (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} (Available: {avail} units in {selectedBranch})
                          </option>
                        );
                      })}
                    </select>
                  </div>
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

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      Department <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all appearance-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                      required
                    >
                      {ASSET_DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      Approved By <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={approvedBy}
                      onChange={(e) => setApprovedBy(e.target.value)}
                      className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all appearance-none focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                      required
                    >
                      {ASSET_APPROVED_BY.map((approver) => (
                        <option key={approver} value={approver}>
                          {approver}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Model Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={modelNumber}
                      onChange={(e) => setModelNumber(e.target.value)}
                      placeholder="e.g. Latitude 5420 / M5-X1"
                      className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Serial Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="e.g. SN-88392019"
                      className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <ShieldCheck className="h-3 w-3" />
                    Warranty Expires At (Optional)
                  </label>
                  <input
                    type="date"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="h-10 w-full rounded-lg border-2 border-muted bg-background px-3 text-sm shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                  />
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
