'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInventory } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewOrderPage() {
  const router = useRouter();
  const { suppliers, products, addOrder, activeBranch } = useInventory();
  
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ productId: '', name: '', quantity: 1, price: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        productId: value,
        name: product ? product.name : '',
        price: product ? product.price : 0,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) {
      alert('Please select a supplier.');
      return;
    }
    if (items.some(item => !item.productId || item.quantity <= 0)) {
      alert('Please fill out all product details with valid quantities.');
      return;
    }

    setIsSubmitting(true);
    await addOrder({
      supplier,
      items,
      totalAmount,
      status: 'Pending'
    });
    setIsSubmitting(false);
    router.push('/orders');
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generate New Order</h1>
          <p className="text-muted-foreground mt-1">Create a purchase order for a supplier.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Select the supplier and list the products required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            
            <div className="space-y-2">
              <Label>Supplier</Label>
              <select 
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-primary"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                required
              >
                <option value="">-- Select a Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Order Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-2 h-8">
                  <PlusCircle className="h-3.5 w-3.5" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-muted/20 p-3 rounded-lg border border-border/50">
                    
                    <div className="flex-1 w-full space-y-1">
                      <Label className="text-xs text-muted-foreground">Product</Label>
                      <select 
                        className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm outline-none"
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        required
                      >
                        <option value="">Select Product...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {activeBranch === 'All' ? Object.values(p.stock || {}).reduce((a, b) => a + b, 0) : p.stock?.[activeBranch] || 0})</option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-24 space-y-1">
                      <Label className="text-xs text-muted-foreground">Quantity</Label>
                      <Input 
                        type="number" 
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="w-full sm:w-28 space-y-1">
                      <Label className="text-xs text-muted-foreground">Unit Price (₹)</Label>
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                        required
                      />
                    </div>

                    <div className="w-full sm:w-24 space-y-1">
                      <Label className="text-xs text-muted-foreground">Subtotal</Label>
                      <div className="px-3 py-2 text-sm font-medium border border-transparent">
                        ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="pt-5 flex-shrink-0">
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1} className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end pt-4 border-t border-border/50 gap-2">
              <div className="flex justify-between w-full sm:w-64 text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full sm:w-64 text-sm">
                <span className="text-muted-foreground">GST (18%)</span>
                <span className="font-medium">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between w-full sm:w-64 pt-2 border-t border-border/50">
                <span className="text-base font-medium mt-1">Grand Total</span>
                <span className="text-2xl font-bold text-emerald-500">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-muted/10 border-t border-border/50 px-6 py-4">
            <div className="flex w-full justify-between items-center">
              <Link href="/orders">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                {isSubmitting ? 'Creating...' : 'Submit Order'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
