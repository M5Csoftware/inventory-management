"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInventory, QuotationItem, generateQuotationNumber } from "@/context/inventory-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Building2,
  Calculator,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";

export default function AddQuotationPage() {
  const router = useRouter();
  const { suppliers, products, activeBranch, quotations, addQuotation } = useInventory();

  const [supplier, setSupplier] = useState("");
  const [branch, setBranch] = useState(
    activeBranch && activeBranch !== "All" ? activeBranch : "Delhi",
  );
  const [quotationNumber, setQuotationNumber] = useState(() =>
    generateQuotationNumber("", activeBranch && activeBranch !== "All" ? activeBranch : "Delhi", quotations)
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  // Automatically update semantic auto-incrementing quotation number when supplier or branch changes
  useEffect(() => {
    const autoNum = generateQuotationNumber(supplier, branch, quotations);
    setQuotationNumber(autoNum);
  }, [supplier, branch, quotations]);

  const [items, setItems] = useState<QuotationItem[]>([
    {
      name: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 18,
      discount: 0,
      totalPrice: 0,
    },
  ]);

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProd = products.find((p) => p.id === productId);
    if (!selectedProd) return;

    setItems((prev) => {
      const updated = [...prev];
      const qty = updated[index].quantity || 1;
      const price = selectedProd.price || 0;
      const tax = updated[index].taxRate || 18;
      const disc = updated[index].discount || 0;

      const sub = qty * price;
      const discAmt = (sub * disc) / 100;
      const taxable = sub - discAmt;
      const taxAmt = (taxable * tax) / 100;
      const total = taxable + taxAmt;

      updated[index] = {
        ...updated[index],
        productId: selectedProd.id,
        name: selectedProd.name,
        unitPrice: price,
        totalPrice: total,
      };
      return updated;
    });
  };

  const handleItemChange = (
    index: number,
    field: keyof QuotationItem,
    value: any,
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };

      const qty = Number(current.quantity) || 0;
      const price = Number(current.unitPrice) || 0;
      const tax = Number(current.taxRate) || 0;
      const disc = Number(current.discount) || 0;

      const sub = qty * price;
      const discAmt = (sub * disc) / 100;
      const taxable = sub - discAmt;
      const taxAmt = (taxable * tax) / 100;
      const total = taxable + taxAmt;

      current.totalPrice = total;
      updated[index] = current;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        name: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
        discount: 0,
        totalPrice: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length === 1) {
      toast.warn("At least one line item is required.");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce(
    (acc, it) => acc + (it.quantity * it.unitPrice - (it.quantity * it.unitPrice * (it.discount || 0)) / 100),
    0,
  );
  const taxAmount = items.reduce(
    (acc, it) => {
      const taxable = it.quantity * it.unitPrice - (it.quantity * it.unitPrice * (it.discount || 0)) / 100;
      return acc + (taxable * (it.taxRate || 0)) / 100;
    },
    0,
  );
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplier.trim()) {
      toast.error("Please select or enter a supplier.");
      return;
    }

    if (items.some((it) => !it.name.trim() || it.quantity <= 0)) {
      toast.error("Please ensure all items have valid names and quantities.");
      return;
    }

    try {
      await addQuotation({
        quotationNumber,
        supplier,
        branch,
        date,
        items,
        subtotal,
        taxAmount,
        totalAmount: grandTotal,
        status: "Pending",
        notes,
        terms,
      });

      router.push("/quotations");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save quotation.");
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-500 w-full">
      {/* Header Bar */}
      <div className="border-b pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Add New Quotation
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Fill in supplier information, line item rates, and terms to save a quotation.
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e)}>
        <div className="space-y-6">
          {/* Card 1: Supplier & Facility Selection */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-4.5 h-4.5 text-primary" /> Vendor &amp; Facility Selection
              </CardTitle>
              <CardDescription className="text-xs">
                Select vendor supplier, quotation dates, and receiving branch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quotation Number *
                  </Label>
                  <Input
                    value={quotationNumber}
                    onChange={(e) => setQuotationNumber(e.target.value)}
                    required
                    className="font-mono text-sm bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select Vendor Supplier *
                  </Label>
                  <Input
                    placeholder="Enter or select supplier..."
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    list="suppliers-list"
                    required
                    className="bg-background"
                  />
                  <datalist id="suppliers-list">
                    {suppliers.map((s) => (
                      <option key={s.name} value={s.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Destination Branch *
                  </Label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Delhi">Delhi Branch</option>
                    <option value="Ahmedabad">Ahmedabad Branch</option>
                    <option value="Ludhiana">Ludhiana Branch</option>
                    <option value="Mumbai">Mumbai Branch</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Quotation Date
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="bg-background"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Line Items Table */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calculator className="w-4.5 h-4.5 text-primary" /> Itemized Pricing &amp; Rates
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Specify items, quantities, rates, and tax percentages.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItemRow}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[700px]">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="px-4 py-3 min-w-[220px]">Item Description</th>
                      <th className="px-4 py-3 w-24 text-center">Qty</th>
                      <th className="px-4 py-3 w-32 text-right">Unit Price (₹)</th>
                      <th className="px-4 py-3 w-24 text-center">Tax (%)</th>
                      <th className="px-4 py-3 w-24 text-center">Disc (%)</th>
                      <th className="px-4 py-3 w-36 text-right">Total (₹)</th>
                      <th className="px-4 py-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {items.map((item, index) => (
                      <tr key={index} className="hover:bg-muted/20">
                        <td className="p-3 space-y-1">
                          <Input
                            placeholder="Enter item name..."
                            value={item.name}
                            onChange={(e) =>
                              handleItemChange(index, "name", e.target.value)
                            }
                            required
                            className="h-8 text-xs bg-background"
                          />
                          <select
                            className="w-full text-[11px] bg-muted/40 rounded border border-border p-1"
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled>
                              -- Select from catalog --
                            </option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (₹{p.price})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-3">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(index, "quantity", e.target.value)
                            }
                            required
                            className="h-8 text-xs text-center bg-background"
                          />
                        </td>

                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(index, "unitPrice", e.target.value)
                            }
                            required
                            className="h-8 text-xs text-right font-mono bg-background"
                          />
                        </td>

                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemChange(index, "taxRate", e.target.value)
                            }
                            className="h-8 text-xs text-center bg-background"
                          />
                        </td>

                        <td className="p-3">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount}
                            onChange={(e) =>
                              handleItemChange(index, "discount", e.target.value)
                            }
                            className="h-8 text-xs text-center bg-background"
                          />
                        </td>

                        <td className="p-3 text-right font-medium font-mono text-foreground">
                          ₹{item.totalPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </td>

                        <td className="p-3 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItemRow(index)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Notes & Summary */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Remarks / Notes
                  </Label>
                  <textarea
                    rows={3}
                    placeholder="Enter any additional details or warranty terms..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <div className="bg-muted/40 p-4 rounded-lg border border-border/50 space-y-2 text-right">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>GST Tax:</span>
                    <span className="font-mono">₹{taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border/50">
                    <span>Grand Total:</span>
                    <span className="font-mono">₹{grandTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-border/50">
                <Link href="/quotations">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleSubmit(e)}
                >
                  Save as Draft
                </Button>
                <Button type="submit">
                  Submit Quotation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
