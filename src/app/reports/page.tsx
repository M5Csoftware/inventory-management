/* src/app/reports/page.tsx */
"use client";

import Link from "next/link";
import { FileText, BarChart3, ArrowRight, TrendingUp, History, Package, Laptop } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsHubPage() {
  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports &amp; Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Select a report module below to view detailed inventory movements, product master details, asset assignments, and monthly stock calculations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 pt-2">
        {/* Card 1: Transaction History */}
        <Card className="group relative overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-gradient-to-b from-card to-card/50">
          <div className="absolute top-0 right-0 p-8 text-primary/10 group-hover:text-primary/20 transition-colors pointer-events-none">
            <History className="w-32 h-32 -mr-8 -mt-8" />
          </div>
          <CardHeader className="pb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Transaction History
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Complete audit log of all inventory movements including Stock In, Stock Out, and Inter-branch transfers with multi-parameter filtering and Excel export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                Branch Filtering
              </span>
              <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                Date Range Filter
              </span>
              <span className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground">
                Excel Export
              </span>
            </div>
            <Link href="/reports/transactions" className="block">
              <Button className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-md">
                <span>View Transaction Report</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 2: Monthly Opening & Closing Stock */}
        <Card className="group relative overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 bg-gradient-to-b from-card to-card/50">
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors pointer-events-none">
            <TrendingUp className="w-32 h-32 -mr-8 -mt-8" />
          </div>
          <CardHeader className="pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Monthly Opening &amp; Closing Stock
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Comprehensive inventory valuation report showing Opening Stock at the beginning of the month, total Stock In, total Stock Out, Net Variance, and Closing Stock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Opening / Closing Valuation
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Month &amp; Year Picker
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Excel Export
              </span>
            </div>
            <Link href="/reports/monthly-stock" className="block">
              <Button className="w-full justify-between bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md">
                <span>View Monthly Stock Summary</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 3: Product Details Report */}
        <Card className="group relative overflow-hidden border-border/60 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 bg-gradient-to-b from-card to-card/50">
          <div className="absolute top-0 right-0 p-8 text-blue-500/10 group-hover:text-blue-500/20 transition-colors pointer-events-none">
            <Package className="w-32 h-32 -mr-8 -mt-8" />
          </div>
          <CardHeader className="pb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Package className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Product Details Report
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Detailed breakdown of product specifications, stock levels across all branches, unit valuations, low stock thresholds, and supplier mapping.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Branch Stock Breakdown
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Total Valuation
              </span>
              <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                Stock Status Filter
              </span>
            </div>
            <Link href="/reports/product-details" className="block">
              <Button className="w-full justify-between bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md">
                <span>View Product Details Report</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 4: Asset Details Report */}
        <Card className="group relative overflow-hidden border-border/60 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 bg-gradient-to-b from-card to-card/50">
          <div className="absolute top-0 right-0 p-8 text-purple-500/10 group-hover:text-purple-500/20 transition-colors pointer-events-none">
            <Laptop className="w-32 h-32 -mr-8 -mt-8" />
          </div>
          <CardHeader className="pb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Laptop className="w-6 h-6" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">
              Asset Details Report
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              Complete tracking and audit report of IT hardware, equipment, serial numbers, current employee assignments, and asset condition statuses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                Assignment Tracking
              </span>
              <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                Serial Number Audit
              </span>
              <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                Print &amp; Export
              </span>
            </div>
            <Link href="/reports/asset-details" className="block">
              <Button className="w-full justify-between bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-md">
                <span>View Asset Details Report</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
