'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  FolderPlus,
  Tag,
  FileText,
  Plus,
  Save,
  Layers,
  FolderTree,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/context/inventory-context';
import { toast } from 'react-toastify';

function NewCategoryForm() {
  const { categories, addCategory } = useInventory();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialType = searchParams?.get('type') === 'sub' ? 'sub' : 'major';
  const initialParent = searchParams?.get('parent') || '';

  const [categoryType, setCategoryType] = useState<'major' | 'sub'>(initialType);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategory, setParentCategory] = useState(initialParent);
  const [categoryCode, setCategoryCode] = useState('');
  const [isAsset, setIsAsset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  // Top-level categories that can act as parent categories
  const topLevelCategories = (categories || []).filter((c) => !c.parentCategory);

  useEffect(() => {
    if (initialParent) {
      setCategoryType('sub');
      setParentCategory(initialParent);
    }
  }, [initialParent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !name.trim() || !description.trim()) return;

    if (categoryType === 'sub' && !parentCategory) {
      toast.error('Please select a Major Category for this subcategory.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await addCategory({
        name: name.trim(),
        description: description.trim(),
        isAsset,
        parentCategory: categoryType === 'sub' ? parentCategory : undefined,
        categoryCode: categoryCode.trim() || undefined,
      });
      router.push('/categories');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header Section */}
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
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                <FolderTree className="h-6 w-6 text-primary" />
                {categoryType === 'major' ? 'Create Major Category' : 'Create Subcategory'}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                {categoryType === 'major'
                  ? 'Define a top-level classification to group multiple subcategories'
                  : 'Add a specialized category linked under an existing Major Category'}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-semibold">1. Choose Category Classification</CardTitle>
            <CardDescription className="text-xs">
              Select whether this is a parent Major Category or a child Subcategory.
            </CardDescription>

            {/* Type Selector Tabs */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCategoryType('major');
                  setParentCategory('');
                }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  categoryType === 'major'
                    ? 'border-purple-500 bg-purple-500/10 shadow-sm'
                    : 'border-border/60 hover:border-border hover:bg-muted/30'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    categoryType === 'major'
                      ? 'bg-purple-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">Major Category</span>
                    {categoryType === 'major' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Top-level group (e.g. <i>IT Hardware, Furniture, Consumables</i>)
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCategoryType('sub')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                  categoryType === 'sub'
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border/60 hover:border-border hover:bg-muted/30'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    categoryType === 'sub'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <FolderPlus className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">Subcategory</span>
                    {categoryType === 'sub' && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Child category (e.g. <i>Laptops under IT Hardware</i>)
                  </p>
                </div>
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* If Subcategory: Choose Major Category */}
              {categoryType === 'sub' && (
                <div className="space-y-1.5 p-3.5 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in duration-200">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <Layers className="h-3.5 w-3.5" />
                    Select Major (Parent) Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className="h-10 w-full rounded-lg border-2 border-primary/30 bg-background px-3 text-sm font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Major Category --</option>
                    {topLevelCategories.map((c) => (
                      <option key={c.name} value={c.name}>
                        📁 {c.name}
                      </option>
                    ))}
                  </select>
                  {topLevelCategories.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      No Major Categories found. Please switch to &quot;Major Category&quot; above to create your first top-level category!
                    </p>
                  )}
                </div>
              )}

              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  {categoryType === 'major' ? 'Major Category Name' : 'Subcategory Name'}{' '}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    categoryType === 'major'
                      ? 'e.g. IT & Electronics, Office Supplies'
                      : 'e.g. Laptops, Desktop Monitors, Printers'
                  }
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

              {/* Category Code & Asset Flag */}
              <div className="rounded-lg bg-muted/30 p-3 sm:p-4 space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Category Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CAT-HW-001"
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 font-mono text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  />
                </div>

                <div className="flex items-center space-x-2 border-t border-border/50 pt-3">
                  <input
                    type="checkbox"
                    id="isAsset"
                    checked={isAsset}
                    onChange={(e) => setIsAsset(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                  <label
                    htmlFor="isAsset"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    This is an asset category
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Check this box if items in this category are capital assets (like laptops or furniture) instead of consumable stock.
                    </p>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
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
                  disabled={isSubmitting}
                  className="group w-full gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/40 sm:w-auto h-9 text-sm disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  {isSubmitting
                    ? 'Creating...'
                    : categoryType === 'major'
                    ? 'Create Major Category'
                    : 'Create Subcategory'}
                  <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function NewCategoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>}>
      <NewCategoryForm />
    </Suspense>
  );
}
