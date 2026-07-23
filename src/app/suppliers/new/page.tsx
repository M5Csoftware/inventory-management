'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  Save,
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

export default function NewSupplierPage() {
  const { addSupplier, activeBranch } = useInventory();
  const router = useRouter();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [branch, setBranch] = useState(activeBranch && activeBranch !== 'All' ? activeBranch : 'Delhi');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !contact || !email || !phone || !location) return;

    await addSupplier({ name, contact, email, phone, location, branch });
    router.push('/suppliers');
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
                Add New Supplier
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <UserPlus className="h-3 w-3 text-primary" />
                Register a partner supplier for supply logistics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span>New</span>
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
                  Enter corporate details and primary contact information
                </CardDescription>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                Required *
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    Branch
                    <span className="text-destructive">*</span>
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
                  className="group w-full gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/40 sm:w-auto h-9 text-sm"
                >
                  <Save className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                  Create Supplier
                  <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Tip - Compact */}
        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground/70">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/20 text-[9px]">
            i
          </span>
          <span>
            All fields marked with <span className="text-destructive">*</span> are required
          </span>
        </div>
      </div>
    </div>
  );
}
