"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useInventory, Quotation } from "@/context/inventory-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  GitCompare,
  ArrowLeft,
  ShoppingCart,
  Building2,
  Award,
  CheckCircle2,
  PlusCircle,
  TrendingDown,
  FileText,
} from "lucide-react";
import { toast } from "react-toastify";

export default function CompareQuotationsPage() {
  const { quotations, convertQuotationToOrder } = useInventory();

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return quotations.slice(0, 3).map((q) => q.id);
  });

  const activeSelectedIds = useMemo(() => {
    const valid = selectedIds.filter((id) => quotations.some((q) => q.id === id));
    if (valid.length === 0 && quotations.length > 0) {
      return quotations.slice(0, 3).map((q) => q.id);
    }
    return valid;
  }, [selectedIds, quotations]);

  const [convertingId, setConvertingId] = useState<string | null>(null);

  const toggleSelectQuotation = (id: string) => {
    if (activeSelectedIds.includes(id)) {
      if (activeSelectedIds.length <= 1) {
        toast.info("At least 1 quotation must remain selected.");
        return;
      }
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } else {
      if (activeSelectedIds.length >= 4) {
        toast.info("You can compare up to 4 quotations side-by-side.");
        return;
      }
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const selectedQuotations = useMemo(() => {
    return quotations.filter((q) => activeSelectedIds.includes(q.id));
  }, [quotations, activeSelectedIds]);

  if (quotations.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 w-full">
        <div className="border-b border-border/50 pb-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Compare Quotations
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Side-by-side vendor quotation pricing and rate comparison.
          </p>
        </div>

        <Card className="border-border/50 shadow-sm p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <GitCompare className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-bold text-foreground">No Quotations Found</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Your quotations collection is currently empty. Add your first vendor quotation to start comparing rates.
            </p>
            <div className="mt-6">
              <Link href="/quotations/new">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" /> Add Quotation
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const lowestTotalQuote = selectedQuotations.length > 0
    ? [...selectedQuotations].sort((a, b) => a.totalAmount - b.totalAmount)[0]
    : null;

  const allItemNames = Array.from(
    new Set(
      selectedQuotations.flatMap((q) =>
        q.items.map((it) => it.name.trim().toLowerCase()),
      ),
    ),
  );

  const handleConvert = async (q: Quotation) => {
    setConvertingId(q.id);
    try {
      await convertQuotationToOrder(q.id);
    } catch (e) {
      toast.error("Failed to convert quotation");
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Compare Quotations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Side-by-side vendor quotation pricing and rate comparison.
          </p>
        </div>
        <Link href="/quotations/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" /> Add Quotation
          </Button>
        </Link>
      </div>

      {/* Quotations Selection Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-bold">
            Select Quotations to Compare ({activeSelectedIds.length} Selected)
          </CardTitle>
          <CardDescription className="text-xs">
            Toggle vendor proposals to view side-by-side (up to 4 quotations).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {quotations.map((q) => {
              const isSelected = activeSelectedIds.includes(q.id);
              return (
                <Button
                  key={q.id}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSelectQuotation(q.id)}
                  className="h-8 text-xs gap-1.5"
                >
                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>{q.quotationNumber} ({q.supplier})</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lowest Rate Winner Recommendation Card */}
      {lowestTotalQuote && (
        <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500 text-white shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-foreground flex items-center gap-2">
                  Lowest Total Quote: {lowestTotalQuote.supplier}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <TrendingDown className="h-3 w-3" /> Best Value
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Quotation #{lowestTotalQuote.quotationNumber} has the lowest grand total of{" "}
                  <strong className="text-foreground">₹{lowestTotalQuote.totalAmount.toLocaleString("en-IN")}</strong>.
                </div>
              </div>
            </div>
            <Button
              size="sm"
              className="gap-2 shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => handleConvert(lowestTotalQuote)}
              disabled={convertingId === lowestTotalQuote.id || lowestTotalQuote.status === "Converted"}
            >
              <ShoppingCart className="h-4 w-4" />
              {lowestTotalQuote.status === "Converted" ? "Converted to PO" : "Approve & Create PO"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Overview Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedQuotations.map((q) => {
          const isLowest = lowestTotalQuote?.id === q.id;
          return (
            <Card
              key={q.id}
              className={`border-border/50 shadow-sm transition-colors ${
                isLowest ? "border-emerald-500/50 bg-emerald-500/[0.02]" : ""
              }`}
            >
              <CardHeader className="border-b border-border/50 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">
                    {q.quotationNumber}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted border border-border/50 font-medium">
                    🏭 {q.branch || "Delhi"}
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-foreground mt-1">
                  {q.supplier}
                </CardTitle>
                <CardDescription className="text-xs">
                  Date: {q.date}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 space-y-4 text-xs">
                <div className="bg-muted/40 p-3 rounded-lg border border-border/50 space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                    Grand Total
                  </div>
                  <div className="text-lg font-bold text-foreground font-mono">
                    ₹{q.totalAmount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Subtotal: ₹{q.subtotal.toLocaleString("en-IN")} | Tax: ₹{q.taxAmount.toLocaleString("en-IN")}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Total Line Items:</span>
                    <span className="font-medium text-foreground">{q.items.length} item(s)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    className="w-full gap-2 text-xs"
                    variant={isLowest ? "default" : "outline"}
                    onClick={() => handleConvert(q)}
                    disabled={convertingId === q.id || q.status === "Converted"}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {q.status === "Converted" ? "Converted to PO" : "Convert to Purchase Order"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Item-by-Item Rate Comparison Matrix */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Item-by-Item Price Breakdown Matrix
          </CardTitle>
          <CardDescription className="text-xs">
            Comparing line item unit rates across selected vendor quotations. Lowest price per item is highlighted.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-[650px]">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
              <tr>
                <th className="px-4 py-3.5 font-medium">Item Description</th>
                {selectedQuotations.map((q) => (
                  <th key={q.id} className="px-4 py-3.5 text-right font-medium">
                    <div className="font-bold text-foreground">{q.supplier}</div>
                    <div className="text-[10px] font-mono text-muted-foreground font-normal">
                      {q.quotationNumber}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {allItemNames.map((itemName, idx) => {
                const prices = selectedQuotations
                  .map((q) => {
                    const match = q.items.find(
                      (it) => it.name.trim().toLowerCase() === itemName,
                    );
                    return match ? { supplierId: q.id, price: match.unitPrice } : null;
                  })
                  .filter(Boolean);

                const lowestPrice = prices.length > 0
                  ? Math.min(...prices.map((p) => p!.price))
                  : null;

                return (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors text-xs">
                    <td className="px-4 sm:px-6 py-4 font-medium text-foreground capitalize">
                      {itemName}
                    </td>
                    {selectedQuotations.map((q) => {
                      const matchItem = q.items.find(
                        (it) => it.name.trim().toLowerCase() === itemName,
                      );
                      const isCheapest =
                        matchItem && lowestPrice && matchItem.unitPrice === lowestPrice;

                      return (
                        <td key={q.id} className="px-4 sm:px-6 py-4 text-right font-mono">
                          {matchItem ? (
                            <div>
                              <span
                                className={`font-bold ${
                                  isCheapest
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-foreground"
                                }`}
                              >
                                ₹{matchItem.unitPrice.toLocaleString("en-IN")}
                              </span>
                              {isCheapest && (
                                <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  Lowest
                                </span>
                              )}
                              <div className="text-[10px] text-muted-foreground font-sans mt-0.5">
                                Qty: {matchItem.quantity} | Tax: {matchItem.taxRate || 0}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
