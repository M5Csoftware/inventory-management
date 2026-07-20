'use client';

import Link from 'next/link';
import { UserPlus, Mail, Phone, MapPin, Building, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory, Supplier, Product } from '@/context/inventory-context';

export default function SuppliersPage() {
  const { suppliers, products, deleteSupplier } = useInventory();

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage and connect with your suppliers.</p>
        </div>
        <Link href="/suppliers/new">
          <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
            <UserPlus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <Card className="bg-background/60 backdrop-blur-sm border-border/50 p-12 text-center">
          <p className="text-muted-foreground text-sm">No suppliers added yet. Click Add Supplier to start!</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier: Supplier) => {
            const linkedProductsCount = products.filter(
              (p: Product) => p.supplier.toLowerCase() === supplier.name.toLowerCase()
            ).length;

            return (
              <Card key={supplier.name} className="group bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30 flex flex-col justify-between">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:scale-115 transition-transform">
                      <Building className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">{supplier.name}</CardTitle>
                      <CardDescription className="text-xs">Primary Contact: {supplier.contact}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary/70" />
                      <span className="truncate">{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary/70" />
                      <span>{supplier.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary/70" />
                      <span>{supplier.location}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t pt-4 border-border/50 text-xs">
                    <span className="font-semibold text-primary">{linkedProductsCount} products linked</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        onClick={() => deleteSupplier(supplier.name)}
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
