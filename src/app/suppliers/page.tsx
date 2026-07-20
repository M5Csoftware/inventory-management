import { UserPlus, Mail, Phone, MapPin, Building, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock Supplier Data
const suppliers = [
  { name: 'AudioTech Ltd.', contact: 'Sarah Jenkins', email: 'sjenkins@audiotech.com', phone: '+1 (555) 123-4567', location: 'San Francisco, CA', productsCount: 12 },
  { name: 'ComfortSeats Co.', contact: 'Michael Chang', email: 'mchang@comfortseats.co', phone: '+1 (555) 987-6543', location: 'Chicago, IL', productsCount: 4 },
  { name: 'EcoWare Solutions', contact: 'Emma Stone', email: 'estones@ecoware.org', phone: '+1 (555) 456-7890', location: 'Portland, OR', productsCount: 18 },
];

export default function SuppliersPage() {
  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage and connect with your suppliers.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
          <UserPlus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {suppliers.map((supplier) => (
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
                <span className="font-semibold text-primary">{supplier.productsCount} products linked</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
