"use client";

import { useState } from "react";
import Link from "next/link";
import {
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Building,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory, Supplier, Product } from "@/context/inventory-context";
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal";

export default function SuppliersPage() {
  const { suppliers, products, deleteSupplier, activeBranch } = useInventory();
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Suppliers
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage and connect with your suppliers.
          </p>
        </div>
        <Link href="/suppliers/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
            <UserPlus className="mr-2 h-4 w-4" /> Add Supplier
          </Button>
        </Link>
      </div>

      {suppliers.length === 0 ? (
        <Card className="bg-background/60 backdrop-blur-sm border-border/50 p-8 sm:p-12 text-center">
          <p className="text-muted-foreground text-sm">
            No suppliers added yet. Click Add Supplier to start!
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {suppliers
            .filter(
              (s: Supplier) =>
                activeBranch === "Delhi" ||
                !s.branch ||
                s.branch === "All" ||
                s.branch === activeBranch,
            )
            .map((supplier: Supplier) => {
              const linkedProductsCount = products.filter(
                (p: Product) =>
                  p.supplier.toLowerCase() === supplier.name.toLowerCase(),
              ).length;

              return (
                <Card
                  key={supplier.name}
                  className="group bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30 flex flex-col justify-between"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:scale-115 transition-transform shrink-0">
                        <Building className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg group-hover:text-primary transition-colors truncate">
                          {supplier.name}
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          Primary Contact: {supplier.contact}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm text-muted-foreground min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-4 w-4 text-primary/70 shrink-0" />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-4 w-4 text-primary/70 shrink-0" />
                        <span className="truncate">{supplier.location}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 min-w-0">
                        <Building className="h-4 w-4 text-primary/70 shrink-0" />
                        <span className="truncate">
                          {supplier.branch && supplier.branch !== "All"
                            ? supplier.branch
                            : "Delhi"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Phone className="h-4 w-4 text-primary/70 shrink-0" />
                        <span className="truncate">{supplier.phone}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2 border-t pt-4 border-border/50 text-xs">
                      <span className="font-semibold text-primary truncate">
                        {linkedProductsCount} products linked
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <Link
                          href={`/suppliers/edit/${encodeURIComponent(supplier.name)}`}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => setSupplierToDelete(supplier.name)}
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

      <ConfirmDeleteModal
        isOpen={supplierToDelete !== null}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={async () => {
          if (supplierToDelete) {
            await deleteSupplier(supplierToDelete);
          }
        }}
        title="Delete Supplier"
        description="Are you sure you want to delete this supplier? Any linked products may need reassignment."
        itemName={supplierToDelete || ""}
      />
    </div>
  );
}
