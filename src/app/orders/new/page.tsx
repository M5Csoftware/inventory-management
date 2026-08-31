'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useInventory } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, ArrowLeft, Building2, Package, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { ConfirmModal } from '@/components/confirm-modal';

export default function NewOrderPage() {
  const router = useRouter();
  const { suppliers, products, addOrder, activeBranch } = useInventory();
  
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ productId: '', name: '', quantity: 1, price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const submittingRef = useRef(false);

  // Filter products by selected supplier (both primary supplier & secondary supplier rate mapping)
  const availableProducts = useMemo(() => {
    if (!supplier) return [];
    const suppLower = supplier.toLowerCase().trim();
    return products.filter((p) => {
      const isPrimary = p.supplier?.toLowerCase().trim() === suppLower;
      const isSecondary = p.suppliersList?.some(
        (s) => s.supplierName.toLowerCase().trim() === suppLower
      );
      return isPrimary || isSecondary;
    });
  }, [products, supplier]);

  // Handle supplier change and auto-filter existing items
  const handleSupplierChange = (newSupplier: string) => {
    setSupplier(newSupplier);
    const suppLower = newSupplier.toLowerCase().trim();

    const newAvailable = products.filter((p) => {
      const isPrimary = p.supplier?.toLowerCase().trim() === suppLower;
      const isSecondary = p.suppliersList?.some(
        (s) => s.supplierName.toLowerCase().trim() === suppLower
      );
      return isPrimary || isSecondary;
    });

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (!item.productId) return item;
        const matched = newAvailable.find((p) => p.id === item.productId);
        if (!matched) {
          return { productId: '', name: '', quantity: 1, price: 0 };
        }

        let unitPrice = matched.price;
        const customRateObj = matched.suppliersList?.find(
          (s) => s.supplierName.toLowerCase().trim() === suppLower
        );
        if (customRateObj && customRateObj.rate > 0) {
          unitPrice = customRateObj.rate;
        }

        return { ...item, price: unitPrice };
      })
    );
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find((p) => p.id === value);
      let unitPrice = product ? product.price : 0;

      if (product && supplier) {
        const suppLower = supplier.toLowerCase().trim();
        const customRateObj = product.suppliersList?.find(
          (s) => s.supplierName.toLowerCase().trim() === suppLower
        );
        if (customRateObj && customRateObj.rate > 0) {
          unitPrice = customRateObj.rate;
        }
      }

      newItems[index] = {
        ...newItems[index],
        productId: value,
        name: product ? product.name : '',
        price: unitPrice,
      };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productId: '', name: '', quantity: 1, price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
  const gstAmount = subtotal * 0.18;
  const totalAmount = subtotal + gstAmount;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) {
      toast.error('Please select a supplier first.');
      return;
    }
    if (items.some((item) => !item.productId || item.quantity <= 0)) {
      toast.error('Please fill out all product details with valid quantities.');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeAddOrder = async () => {
    if (submittingRef.current) return;
    if (!supplier) {
      toast.error('Please select a supplier first.');
      return;
    }
    if (items.some((item) => !item.productId || item.quantity <= 0)) {
      toast.error('Please fill out all product details with valid quantities.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      await addOrder({
        supplier,
        items,
        totalAmount,
        status: 'Pending'
      });
      toast.success('Purchase order generated successfully!');
      setShowConfirmModal(false);
      router.push('/orders');
    } catch (err) {
      toast.error('Failed to create purchase order.');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500 w-full">
      {/* Header Bar */}
      <div className="flex items-center gap-4 border-b pb-5">
        <Link href="/orders">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Generate Purchase Order</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Select a vendor supplier to filter their offered catalog items and rates.</p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/40 pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-primary" /> Vendor &amp; Product Selection
            </CardTitle>
            <CardDescription className="text-xs">
              Selecting a supplier automatically restricts the product dropdown to items provided by that supplier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            
            {/* Supplier Selector */}
            <div className="space-y-2 max-w-lg">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Vendor Supplier *
              </Label>
              <select 
                className="w-full h-10 bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer transition-colors"
                value={supplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
                required
              >
                <option value="">-- Select a Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Empty Supplier Product Notice */}
            {supplier && availableProducts.length === 0 && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>No products are currently mapped to <strong>{supplier}</strong>.</span>
                </div>
                <Link href="/suppliers/products" className="shrink-0 underline font-semibold hover:text-amber-800">
                  Manage Supplier Products &rarr;
                </Link>
              </div>
            )}

            {/* Order Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-bold flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-primary" /> Required Products List
                  </Label>
                  {supplier && (
                    <span className="text-xs text-muted-foreground font-normal">
                      ({availableProducts.length} items supplied by {supplier})
                    </span>
                  )}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addItem} 
                  disabled={!supplier || availableProducts.length === 0}
                  className="gap-2 h-9"
                >
                  <PlusCircle className="h-4 w-4" />
                  Add Product Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const selectedProd = availableProducts.find((p) => p.id === item.productId);
                  const isCustomRate = selectedProd?.suppliersList?.some(
                    (s) => s.supplierName.toLowerCase().trim() === supplier.toLowerCase().trim() && s.rate > 0
                  );

                  return (
                    <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-muted/20 p-3.5 rounded-xl border border-border/50 transition-all hover:border-border">
                      
                      {/* Product Selector */}
                      <div className="flex-1 w-full space-y-1">
                        <Label className="text-xs text-muted-foreground">Product Item *</Label>
                        <select 
                          className="w-full h-10 bg-background border border-input rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          disabled={!supplier || availableProducts.length === 0}
                          required
                        >
                          <option value="">
                            {!supplier
                              ? '-- Select a Supplier First --'
                              : availableProducts.length === 0
                              ? '-- No Products for this Supplier --'
                              : 'Select Product...'}
                          </option>
                          {availableProducts.map((p, pIdx) => {
                            const stockCount = activeBranch === 'All' 
                              ? Object.values(p.stock || {}).reduce((a, b) => a + b, 0) 
                              : p.stock?.[activeBranch] || 0;
                            return (
                              <option key={`${p.id}-${pIdx}`} value={p.id}>
                                {p.name} (Cat: {p.category} | Stock: {stockCount})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="w-full sm:w-28 space-y-1">
                        <Label className="text-xs text-muted-foreground">Quantity *</Label>
                        <Input 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                          className="h-10"
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="w-full sm:w-32 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Unit Rate (₹)</Label>
                          {isCustomRate && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Vendor Rate</span>
                          )}
                        </div>
                        <Input 
                          type="number" 
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                          className="h-10 font-medium"
                          required
                        />
                      </div>

                      {/* Subtotal */}
                      <div className="w-full sm:w-32 space-y-1">
                        <Label className="text-xs text-muted-foreground">Subtotal</Label>
                        <div className="h-10 px-3 flex items-center text-sm font-semibold text-foreground bg-background/50 border border-input/40 rounded-lg">
                          ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {/* Remove Item */}
                      <div className="pt-5 flex-shrink-0">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeItem(index)} 
                          disabled={items.length === 1} 
                          className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="flex flex-col items-end pt-4 border-t border-border/50 gap-2">
              <div className="flex justify-between w-full sm:w-72 text-sm">
                <span className="text-muted-foreground">Items Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full sm:w-72 text-sm">
                <span className="text-muted-foreground">GST Tax (18%)</span>
                <span className="font-medium">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full sm:w-72 pt-2 border-t border-border/50">
                <span className="text-base font-semibold">Grand Total</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 px-6 py-4">
            <div className="flex w-full justify-between items-center">
              <Link href="/orders">
                <Button type="button" variant="outline" className="h-10 px-5">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting || !supplier || availableProducts.length === 0} className="h-10 px-6 font-semibold min-w-[140px] shadow-md">
                {isSubmitting ? 'Generating...' : 'Submit Order'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      {/* Confirmation Modal for Generating Purchase Order */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeAddOrder}
        title="Generate Purchase Order"
        description="Are you sure you want to generate and issue this purchase order?"
        variant="primary"
        confirmText="Generate Order"
        confirmLoadingText="Generating..."
        icon={<Building2 className="h-5 w-5" />}
        itemName={
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Supplier:</span>
              <span className="font-bold text-foreground">{supplier}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Items:</span>
              <span className="font-semibold text-foreground">{items.length} product(s)</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-border/40">
              <span className="text-muted-foreground">Grand Total (incl. GST):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        }
      />
    </div>
  );
}
