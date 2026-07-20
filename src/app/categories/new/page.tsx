import Link from 'next/link';
import { ArrowLeft, FolderPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function NewCategoryPage() {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/categories">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Category</h1>
          <p className="text-muted-foreground mt-1">Create a new segment to organize your catalog products.</p>
        </div>
      </div>

      <Card className="bg-background/60 backdrop-blur-sm shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Category Details
          </CardTitle>
          <CardDescription>Enter details about the new product classification.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category Name</label>
              <input
                type="text"
                placeholder="e.g. Hardware Components"
                className="h-10 w-full rounded-md border border-input bg-background/50 px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                rows={4}
                placeholder="Describe what kinds of products belong in this category..."
                className="w-full rounded-md border border-input bg-background/50 p-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Link href="/categories">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" className="shadow-lg shadow-primary/20 hover:shadow-primary/40">
                Create Category
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
