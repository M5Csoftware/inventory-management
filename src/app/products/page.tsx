import { Box, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Temporary mock data
const products = [
  { id: 'PROD-001', name: 'Premium Wireless Headphones', category: 'Electronics', price: '$129.99', stock: 45, supplier: 'AudioTech Ltd.' },
  { id: 'PROD-002', name: 'Ergonomic Office Chair', category: 'Furniture', price: '$249.50', stock: 12, supplier: 'ComfortSeats Co.' },
  { id: 'PROD-003', name: 'Stainless Steel Water Bottle', category: 'Lifestyle', price: '$24.99', stock: 150, supplier: 'EcoWare' },
  { id: 'PROD-004', name: 'USB-C Fast Charger', category: 'Electronics', price: '$19.99', stock: 8, supplier: 'AudioTech Ltd.' },
];

export default function ProductsPage() {
  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">Manage and edit your product directory.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Product List</CardTitle>
              <CardDescription>View, search, and manage products.</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search products..."
                className="h-9 w-full sm:w-64 rounded-md border border-input bg-background/50 pl-9 pr-3 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">ID</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Price</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Stock</th>
                  <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Supplier</th>
                  <th className="h-10 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:0">
                {products.map((product) => (
                  <tr key={product.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium font-mono text-xs">{product.id}</td>
                    <td className="p-4 align-middle font-medium">{product.name}</td>
                    <td className="p-4 align-middle text-muted-foreground">{product.category}</td>
                    <td className="p-4 align-middle font-mono">{product.price}</td>
                    <td className="p-4 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        product.stock <= 10 ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="p-4 align-middle text-muted-foreground">{product.supplier}</td>
                    <td className="p-4 align-middle text-right space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
