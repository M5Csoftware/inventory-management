import { FolderPlus, Package, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Mock Category Data
const categories = [
  { name: 'Electronics', count: 142, description: 'Smartphones, audio, computing accessories and chargers', value: '$84,500' },
  { name: 'Furniture', count: 32, description: 'Office chairs, standing desks, cabinets and lounge furniture', value: '$45,200' },
  { name: 'Lifestyle', count: 98, description: 'Eco-friendly bottles, gear bags, water bottles, and gym apparel', value: '$12,800' },
  { name: 'Office Supplies', count: 215, description: 'Paper, journals, pens, organizers, and stationery supplies', value: '$4,100' },
];

export default function CategoriesPage() {
  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground mt-1">Group products and manage inventory segments.</p>
        </div>
        <Button className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
          <FolderPlus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {categories.map((category) => (
          <Card key={category.name} className="group relative overflow-hidden bg-background/60 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
              <div className="space-y-1">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{category.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">{category.description}</CardDescription>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <Package className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center border-t pt-4 border-border/50 text-sm">
                <div className="space-y-0.5">
                  <span className="text-muted-foreground block text-xs">Total Products</span>
                  <span className="font-semibold text-lg">{category.count} items</span>
                </div>
                <div className="space-y-0.5 text-right">
                  <span className="text-muted-foreground block text-xs">Estimated Value</span>
                  <span className="font-semibold text-lg font-mono">{category.value}</span>
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-4 border-t pt-3 border-border/50">
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground">
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
