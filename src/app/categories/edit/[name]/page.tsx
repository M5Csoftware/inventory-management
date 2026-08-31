'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  FolderPlus,
  Tag,
  FileText,
  Save,
  Edit2,
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
import { ConfirmModal } from '@/components/confirm-modal';
import { toast } from 'react-toastify';

export default function EditCategoryPage() {
  const { categories, updateCategory } = useInventory();
  const router = useRouter();
  const params = useParams();
  const decodedName = decodeURIComponent((params?.name as string) || '');

  const [categoryType, setCategoryType] = useState<'major' | 'sub'>('major');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentCategory, setParentCategory] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [isAsset, setIsAsset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const submittingRef = useRef(false);

  // Categories that can act as parent (excluding self and subcategories)
  const potentialParentCategories = (categories || []).filter(
    (c) => c.name.toLowerCase() !== decodedName.toLowerCase() && !c.parentCategory,
  );

  useEffect(() => {
    if (decodedName && categories.length > 0) {
      const category = categories.find((c) => c.name.toLowerCase() === decodedName.toLowerCase());
      if (category) {
        setName(category.name);
        setDescription(category.description);
        setIsAsset(category.isAsset || false);
        setParentCategory(category.parentCategory || '');
        setCategoryCode(category.categoryCode || '');
        setCategoryType(category.parentCategory ? 'sub' : 'major');
      }
    }
  }, [decodedName, categories]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    if (categoryType === 'sub' && !parentCategory) {
      toast.error('Please select a Major Category for this subcategory.');
      return;
    }
    setShowConfirmModal(true);
  };

  const executeUpdateCategory = async () => {
    if (submittingRef.current || !name.trim() || !description.trim()) return;

    if (categoryType === 'sub' && !parentCategory) {
      toast.error('Please select a Major Category for this subcategory.');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await updateCategory(decodedName, {
        name: name.trim(),
        description: description.trim(),
        isAsset,
        parentCategory: categoryType === 'sub' ? parentCategory : undefined,
        categoryCode: categoryCode.trim() || undefined,
      });
      setShowConfirmModal(false);
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
                <Edit2 className="h-6 w-6 text-primary" />
                Edit Category
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                Update classification, major category assignment, and category details
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="border-0 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-semibold">1. Category Classification</CardTitle>
            <CardDescription className="text-xs">
              Change whether this is a parent Major Category or a child Subcategory.
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
                    Top-level group (e.g. <i>IT Hardware, Furniture</i>)
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
                    Child category under a Major Category
                  </p>
                </div>
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* If Subcategory: Choose Major Category */}
              {categoryType === 'sub' && (
                <div className="space-y-1.5 p-3.5 rounded-xl bg-primary/5 border border-primary/20 animate-in fade-in duration-200">
                  <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <Layers className="h-3.5 w-3.5" />
                    Assign to Major (Parent) Category <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={parentCategory}
                    onChange={(e) => setParentCategory(e.target.value)}
                    className="h-10 w-full rounded-lg border-2 border-primary/30 bg-background px-3 text-sm font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Major Category --</option>
                    {potentialParentCategories.map((c) => (
                      <option key={c.name} value={c.name}>
                        📁 {c.name}
                      </option>
                    ))}
                  </select>
                  {potentialParentCategories.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      No other Major Categories found. Please create a Major Category first to link this subcategory.
                    </p>
                  )}
                </div>
              )}

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
                  {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal for Category Update */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeUpdateCategory}
        title="Save Category Changes"
        description="Are you sure you want to update this category configuration?"
        variant="primary"
        confirmText="Save Changes"
        confirmLoadingText="Saving..."
        icon={<Save className="h-5 w-5" />}
        itemName={
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Category Name:</span>
              <span className="font-bold text-foreground">{name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-semibold text-primary">{categoryType === 'major' ? 'Major Category (Top Level)' : `Subcategory (under ${parentCategory})`}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Asset Tracking:</span>
              <span className="text-foreground">{isAsset ? 'Yes (Fixed Asset)' : 'No (Consumable)'}</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
