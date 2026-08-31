'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Edit2
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

export default function EditSupplierPage() {
  const { suppliers, updateSupplier } = useInventory();
  const router = useRouter();
  const params = useParams();
  const decodedName = decodeURIComponent((params?.name as string) || '');

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [branch, setBranch] = useState('Delhi');
  const [taxId, setTaxId] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (decodedName && suppliers.length > 0) {
      const supplier = suppliers.find((s) => s.name === decodedName);
      if (supplier) {
        setName(supplier.name);
        setContact(supplier.contact);
        setEmail(supplier.email);
        setPhone(supplier.phone);
        setLocation(supplier.location);
        setBranch(supplier.branch || 'Delhi');
        setTaxId(supplier.taxId || '');
        setWebsite(supplier.website || '');
      }
    }
  }, [decodedName, suppliers]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !email || !phone || !location) return;
    setShowConfirmModal(true);
  };

  const executeUpdateSupplier = async () => {
    if (submittingRef.current || !name || !contact || !email || !phone || !location) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await updateSupplier(decodedName, { name, contact, email, phone, location, branch, taxId, website });
      setShowConfirmModal(false);
      router.push('/suppliers');
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-full space-y-4">
        {/* Header Section - Compact */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/suppliers">
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
                Edit Supplier
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Edit2 className="h-3 w-3 text-primary" />
                Update partner supplier details
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
                  <UserPlus className="h-4 w-4 text-primary" />
                  Supplier Details
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Update corporate details and primary contact information
                </CardDescription>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                Required *
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Company & Contact Names */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    Supplier Company Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apex Industrial Supplies"
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <User className="h-3 w-3" />
                    Primary Contact Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. Jane Doe"
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    Email Address <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. contact@apexsupplies.com"
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    Phone Number <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 019-2834"
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    required
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  Corporate Office Address <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. 100 Main St, Suite 400, Seattle, WA"
                  className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                  required
                />
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Branch <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    required
                  >
                    <option value="Delhi">Delhi (HO)</option>
                    <option value="Ahmedabad">Ahmedabad</option>
                    <option value="Ludhiana">Ludhiana</option>
                    <option value="Mumbai">Mumbai</option>
                  </select>
                </div>
              </div>

              {/* Additional Info - Optional */}
              <div className="rounded-lg bg-muted/30 p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Additional Information
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Tax ID / VAT Number
                    </label>
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder="e.g. 12-3456789"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Website
                    </label>
                    <input
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="e.g. https://apexsupplies.com"
                      className="h-9 w-full rounded-lg border-2 border-gray-300 bg-white/90 px-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/50 hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 dark:border-gray-600 dark:bg-gray-900/90 dark:hover:border-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons - Compact */}
              <div className="flex flex-col-reverse gap-2 border-t border-border/50 pt-4 sm:flex-row sm:justify-end">
                <Link href="/suppliers" className="w-full sm:w-auto">
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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal for Supplier Update */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeUpdateSupplier}
        title="Save Supplier Changes"
        description="Are you sure you want to update this supplier profile and contact details?"
        variant="primary"
        confirmText="Save Changes"
        confirmLoadingText="Saving..."
        icon={<Save className="h-5 w-5" />}
        itemName={
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Supplier Name:</span>
              <span className="font-bold text-foreground">{name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Contact Person:</span>
              <span className="font-semibold text-foreground">{contact}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Location & Branch:</span>
              <span className="text-foreground">{location} ({branch})</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
