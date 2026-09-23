"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitCompare, ArrowRight } from "lucide-react";

export default function DeprecatedAddQuotationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/quotations/compare");
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/50 shadow-sm text-center p-6">
        <CardContent className="space-y-4 pt-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <GitCompare className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Redirecting to Compare Quotations...</h2>
            <p className="text-xs text-muted-foreground mt-1.5">
              Manual quotation entry is no longer needed. Vendor quotations and rates are automatically compared using already listed products and vendor pricing.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/quotations/compare">
              <Button className="w-full gap-2 text-xs">
                Go to Compare Quotations <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
