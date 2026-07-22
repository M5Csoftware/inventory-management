'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FolderPlus, Tag, FileText, Save, Edit2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';

export default function EditCategoryPage() {
  const { categories, updateCategory } = useInventory();
  const router = useRouter();
  const params = useParams();
  const decodedName = decodeURIComponent((params?.name as string) || '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAsset, setIsAsset] = useState(false);

  useEffect(() => {
    if (decodedName && categories.length > 0) {
      const category = categories.find((c) => c.name === decodedName);
      if (category) {
        setName(category.name);
        setDescription(category.description);
        setIsAsset(category.isAsset || false);
      }
    }
  }, [decodedName, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;

    await updateCategory(decodedName, { name, description, isAsset });
    router.push('/categories');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-full space-y-4">
        {/* Header Section - Compact */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/categories">
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
                Edit Category
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Edit2 className="h-3 w-3 text-primary" />
                Update details for this catalog segment
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card - Compact */}
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderPlus className="h-4 w-4 text-primary" />
                  Category Details
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Update details about the product classification
                </CardDescription>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                Required *
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  Category Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hardware Components"
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  Description <span className="text-destructive">*</span>
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what kinds of products belong in this category..."
                  className="w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 py-2 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 resize-y dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  required
                />
              </div>

              {/* Optional Fields - New Section */}
              <div className="rounded-lg bg-muted/30 p-3 sm:p-4">
                <div className="mt-2 flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isAsset" 
                    checked={isAsset}
                    onChange={(e) => setIsAsset(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label 
                    htmlFor="isAsset" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    This is an asset category
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Check this box if items in this category are non-exhaustible assets (like laptops or furniture) instead of consumable stock.
                    </p>
                  </label>
                </div>
              </div>

              {/* Action Buttons - Compact */}
              <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
                <Link href="/categories" className="w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-2 transition-all hover:bg-muted/50 sm:w-auto h-9 text-sm"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  className="group w-full gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/40 sm:w-auto h-9 text-sm"
                >
                  <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
