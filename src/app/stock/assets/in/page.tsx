"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Laptop,
  Plus,
  Save,
  Package,
  Trash2,
  Check,
  ChevronDown,
  ShieldCheck,
  IndianRupee,
  Barcode,
  Search,
  FileText,
  Layers,
  Building2,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInventory, Product, BRANCHES } from "@/context/inventory-context";
import { toast } from "react-toastify";

export interface AssetModelGroup {
  id: string;
  model: string;
  amount: string;
  warrantyYears: string;
  warrantyMonths: string;
  warrantyDays: string;
  quantity: number;
  serialNumbers: string[];
  showBulkPaste?: boolean;
  bulkText?: string;
}

export default function StockInAssetsPage() {
  const { products, categories, suppliers, recordTransaction, activeBranch } =
    useInventory();
  const router = useRouter();

  // General Intake Info
  const [productId, setProductId] = useState("");
  const [targetBranch, setTargetBranch] = useState(() =>
    activeBranch === "All" ? "Ahmedabad" : activeBranch,
  );
  const [supplier, setSupplier] = useState("");
  const [customSupplier, setCustomSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [location, setLocation] = useState("Warehouse A (Zone 1)");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (activeBranch !== "All") {
      setTargetBranch(activeBranch);
    }
  }, [activeBranch]);

  // Searchable Item Name dropdown states
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const productDropdownRef = useRef<HTMLDivElement>(null);

  // Model Groups State (Supports multiple models in 1 intake session)
  const [modelGroups, setModelGroups] = useState<AssetModelGroup[]>([
    {
      id: "group-1",
      model: "",
      amount: "",
      warrantyYears: "",
      warrantyMonths: "",
      warrantyDays: "",
      quantity: 1,
      serialNumbers: [""],
      showBulkPaste: false,
      bulkText: "",
    },
  ]);

  // Filter products that belong to an asset category
  const assetProducts = products.filter((prod) => {
    const category = categories.find(
      (c) => c.name.toLowerCase() === prod.category.toLowerCase(),
    );
    return category?.isAsset === true;
  });

  const filteredAssetProducts = assetProducts.filter(
    (prod) =>
      prod.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      prod.category.toLowerCase().includes(productSearchTerm.toLowerCase()),
  );

  const selectedProduct = assetProducts.find((p) => p.id === productId);

  // Set default product selection
  useEffect(() => {
    if (assetProducts.length > 0 && !productId) {
      setProductId(assetProducts[0].id);
    }
  }, [assetProducts, productId]);

  // Set default supplier selection
  useEffect(() => {
    if (suppliers.length > 0 && !supplier) {
      setSupplier(suppliers[0].name);
    }
  }, [suppliers, supplier]);

  // Auto-fill price in model group 1 if selectedProduct price exists
  useEffect(() => {
    if (selectedProduct && selectedProduct.price && modelGroups.length > 0) {
      if (!modelGroups[0].amount) {
        setModelGroups((prev) =>
          prev.map((g, idx) =>
            idx === 0 ? { ...g, amount: selectedProduct.price.toString() } : g,
          ),
        );
      }
    }
  }, [selectedProduct]);

  // Dropdown outside click handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(e.target as Node)
      ) {
        setProductSearchOpen(false);
        setProductSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStockLabel = (prod: Product) =>
    activeBranch === "All"
      ? Object.values(prod.stock || {}).reduce((a, b) => a + b, 0)
      : prod.stock?.[activeBranch] || 0;

  // Model Group Handlers
  const handleAddModelGroup = () => {
    const newId = `group-${Date.now()}`;
    const defaultAmount = selectedProduct?.price
      ? selectedProduct.price.toString()
      : "";
    setModelGroups((prev) => [
      ...prev,
      {
        id: newId,
        model: "",
        amount: defaultAmount,
        warrantyYears: "",
        warrantyMonths: "",
        warrantyDays: "",
        quantity: 1,
        serialNumbers: [""],
        showBulkPaste: false,
        bulkText: "",
      },
    ]);
  };

  const handleRemoveModelGroup = (id: string) => {
    if (modelGroups.length <= 1) return;
    setModelGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const updateModelGroup = (id: string, fields: Partial<AssetModelGroup>) => {
    setModelGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...fields } : g)),
    );
  };

  const handleQuantityChange = (groupId: string, newQty: number) => {
    const qty = Math.max(1, Math.min(100, newQty || 1));
    setModelGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;

        // Resize serial numbers array preserving existing values
        const currentSerials = g.serialNumbers || [];
        const newSerials = Array.from({ length: qty }).map(
          (_, idx) => currentSerials[idx] || "",
        );

        return {
          ...g,
          quantity: qty,
          serialNumbers: newSerials,
        };
      }),
    );
  };

  const handleSerialNumberChange = (
    groupId: string,
    serialIdx: number,
    val: string,
  ) => {
    setModelGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const updatedSerials = [...g.serialNumbers];
        updatedSerials[serialIdx] = val;
        return { ...g, serialNumbers: updatedSerials };
      }),
    );
  };

  // Totals calculations
  const totalUnits = modelGroups.reduce((acc, g) => acc + (g.quantity || 0), 0);
  const totalValuation = modelGroups.reduce(
    (acc, g) => acc + (g.quantity || 0) * (parseFloat(g.amount) || 0),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !productId || totalUnits <= 0) return;

    submittingRef.current = true;
    setIsSubmitting(true);

    const finalSupplier =
      supplier === "CUSTOM_SUPPLIER" ? customSupplier : supplier;

    // Use targetBranch for the transaction
    const branchToUse = targetBranch || activeBranch || "Delhi";

    try {
      let overallSuccess = true;
      const failedSerials: string[] = [];

      for (const group of modelGroups) {
        const serialsList = group.serialNumbers
          .map((s) => s.trim())
          .filter(Boolean);

        // Build warranty string from individual fields
        const warrantyParts = [];
        if (group.warrantyYears && parseInt(group.warrantyYears) > 0) {
          warrantyParts.push(
            `${group.warrantyYears} Year${parseInt(group.warrantyYears) > 1 ? "s" : ""}`,
          );
        }
        if (group.warrantyMonths && parseInt(group.warrantyMonths) > 0) {
          warrantyParts.push(
            `${group.warrantyMonths} Month${parseInt(group.warrantyMonths) > 1 ? "s" : ""}`,
          );
        }
        if (group.warrantyDays && parseInt(group.warrantyDays) > 0) {
          warrantyParts.push(
            `${group.warrantyDays} Day${parseInt(group.warrantyDays) > 1 ? "s" : ""}`,
          );
        }
        const warrantyString =
          warrantyParts.length > 0 ? warrantyParts.join(" ") : "";

        const summaryParts = [
          `Model: ${group.model || "Standard"}`,
          warrantyString ? `Warranty: ${warrantyString}` : "",
          group.amount ? `Price: ₹${group.amount}` : "",
          serialsList.length > 0
            ? `S/Ns (${serialsList.length}): ${serialsList.join(", ")}`
            : "",
          invoiceNumber ? `Invoice: ${invoiceNumber}` : "",
          finalSupplier ? `Supplier: ${finalSupplier}` : "",
          notes ? `Notes: ${notes}` : "",
        ].filter(Boolean);

        const fullNotes = `[Asset Intake] ${summaryParts.join(" | ")}`;

        // Record the transaction with the branch
        const success = await recordTransaction(
          productId,
          "Stock In",
          group.quantity,
          location,
          fullNotes,
          {
            amount: parseFloat(group.amount) || 0,
            supplier: finalSupplier,
            invoiceNumber,
            model: group.model,
            serialNumber: serialsList.join(", "),
            branch: branchToUse,
          },
        );

        if (!success) {
          overallSuccess = false;
          continue;
        }

        // Save each serial number to AssetSerial collection
        if (serialsList.length > 0) {
          const API_BASE =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          const token = localStorage.getItem("token");
          const dbName = localStorage.getItem("dbName");

          for (const serial of serialsList) {
            try {
              const response = await fetch(`${API_BASE}/asset-serials`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                  ...(dbName ? { "x-database": dbName } : {}),
                },
                body: JSON.stringify({
                  productId: productId,
                  productName: selectedProduct?.name || "Unknown",
                  serialNumber: serial,
                  model: group.model || "",
                  warranty: warrantyString,
                  purchaseDate: new Date().toISOString().slice(0, 10),
                  invoiceNumber: invoiceNumber || "",
                  supplier: finalSupplier || "",
                  branch: branchToUse,
                  amount: parseFloat(group.amount) || 0,
                  status: "In Stock",
                  notes: notes || "",
                }),
              });

              const result = await response.json();

              if (!response.ok) {
                console.error(`Failed to save serial ${serial}:`, result);
                failedSerials.push(serial);
              }
            } catch (err) {
              console.error(`Failed to save serial ${serial}:`, err);
              failedSerials.push(serial);
            }
          }
        }
      }

      if (overallSuccess) {
        if (failedSerials.length > 0) {
          toast.warning(
            `Successfully registered ${totalUnits} asset units, but failed to save serial numbers: ${failedSerials.join(", ")}`,
          );
        } else {
          toast.success(
            `Successfully registered ${totalUnits} asset units into inventory!`,
          );
        }
        router.push("/stock/assets");
      } else {
        toast.error("Failed to complete asset intake. Please try again.");
      }
    } catch (err) {
      console.error("Asset intake error:", err);
      toast.error("An error occurred during asset intake.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2.5">
              <Laptop className="h-7 w-7 text-primary" />
              Stock In Assets & Hardware Acquisition
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <ArrowUpRight className="h-4 w-4 text-primary" />
              Register incoming asset batches with model pricing, warranties,
              and individual serial number tracking
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>Branch: {activeBranch}</span>
        </div>
      </div>

      {assetProducts.length === 0 ? (
        <Card className="border border-border/50 bg-background/60 backdrop-blur-sm p-8 text-center space-y-4 max-w-lg mx-auto shadow-xl">
          <p className="text-sm text-muted-foreground">
            You must have at least one asset product created (under an asset
            category) before recording stock in for assets.
          </p>
          <Link href="/products/new">
            <Button size="sm">Create Asset Product</Button>
          </Link>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* 1. General Shipment Setup Card */}
          <Card className="w-full border-0 shadow-lg shadow-primary/5 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative z-20 overflow-visible">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                    1
                  </span>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      General Shipment & Vendor Setup
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Select item type, supplier, invoice reference, and
                      warehouse storage location
                    </CardDescription>
                  </div>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Step 1 of 2
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-5 overflow-visible">
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {/* Item Name Dropdown */}
                <div className="space-y-1.5 md:col-span-2 xl:col-span-2 relative z-30">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Package className="h-3.5 w-3.5 text-primary" />
                    Asset Item Name / Product{" "}
                    <span className="text-destructive">*</span>
                  </label>

                  <div className="relative" ref={productDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setProductSearchOpen((prev) => !prev)}
                      className="h-10 w-full rounded-xl border-2 border-gray-300 bg-white/90 px-3.5 text-sm shadow-sm transition-all hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 flex items-center justify-between text-left"
                    >
                      <span className="truncate font-medium">
                        {selectedProduct
                          ? `${selectedProduct.name} (${selectedProduct.category}) — Current Stock: ${getStockLabel(selectedProduct)} units`
                          : "Select an asset product"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </button>

                    {productSearchOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-border bg-background shadow-2xl overflow-hidden p-2 space-y-2 max-h-64 overflow-y-auto">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            autoFocus
                            value={productSearchTerm}
                            onChange={(e) =>
                              setProductSearchTerm(e.target.value)
                            }
                            placeholder="Search asset items..."
                            className="h-9 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="divide-y divide-border/50">
                          {filteredAssetProducts.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-3">
                              No asset products found.
                            </p>
                          ) : (
                            filteredAssetProducts.map((prod) => (
                              <button
                                type="button"
                                key={prod.id}
                                onClick={() => {
                                  setProductId(prod.id);
                                  setProductSearchOpen(false);
                                  setProductSearchTerm("");
                                }}
                                className="w-full text-left px-3 py-2.5 text-xs hover:bg-muted/60 transition-colors flex items-center justify-between rounded-lg"
                              >
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {prod.name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {prod.category}
                                  </p>
                                </div>
                                {prod.id === productId && (
                                  <Check className="h-4 w-4 text-primary shrink-0" />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Supplier */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Supplier / Vendor
                  </label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-gray-300 bg-white/90 px-3 text-xs font-medium shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 cursor-pointer"
                  >
                    {suppliers.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="CUSTOM_SUPPLIER">
                      + Custom Supplier...
                    </option>
                  </select>

                  {supplier === "CUSTOM_SUPPLIER" && (
                    <Input
                      placeholder="Custom supplier name"
                      value={customSupplier}
                      onChange={(e) => setCustomSupplier(e.target.value)}
                      className="h-9 text-xs mt-1.5 bg-background rounded-lg"
                    />
                  )}
                </div>

                {/* Invoice / Reference */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Invoice / Order No.
                  </label>
                  <Input
                    placeholder="e.g. INV-88492"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600"
                  />
                </div>

                {/* Target Branch */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 text-primary" />
                    Target Branch <span className="text-destructive">*</span>
                  </label>
                  {activeBranch === "All" ? (
                    <select
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="h-10 w-full rounded-xl border-2 border-gray-300 bg-white/90 px-3 text-xs font-semibold shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-gray-600 dark:bg-gray-900/90 cursor-pointer"
                    >
                      {BRANCHES.map((b: string) => (
                        <option key={b} value={b}>
                          🏢 {b} Branch
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="h-10 w-full rounded-xl border-2 border-gray-200 bg-muted/40 px-3 text-xs flex items-center font-semibold text-foreground">
                      🏢 {activeBranch} Branch
                    </div>
                  )}
                </div>

                {/* Storage Location */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Storage Location <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Warehouse A (Zone 1)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600"
                    required
                  />
                </div>

                {/* Intake Notes */}
                <div className="space-y-1.5 md:col-span-2 lg:col-span-4 xl:col-span-5">
                  <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Intake Notes (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Shipment delivered in 2 boxes via BlueDart Express"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Model Groups & Serial Number Registration */}
          <div className="w-full space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/40 p-4 rounded-2xl border border-border/50">
              <div>
                <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  2. Model Groups & Individual Serial Numbers
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure model names, unit prices, warranties, quantities,
                  and serial numbers per model group
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAddModelGroup}
                variant="outline"
                size="sm"
                className="gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/10 text-xs h-10 px-4 rounded-xl shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Add Another Model Group
              </Button>
            </div>

            {modelGroups.map((group, groupIdx) => (
              <Card
                key={group.id}
                className="w-full border border-border/60 shadow-md bg-card/90 backdrop-blur-sm rounded-2xl overflow-hidden"
              >
                <CardHeader className="bg-muted/30 pb-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-sm">
                        {groupIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold">
                          {group.model
                            ? `Model: ${group.model}`
                            : `Model Group #${groupIdx + 1}`}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {group.quantity} Unit{group.quantity > 1 ? "s" : ""}{" "}
                          &bull;{" "}
                          {group.amount
                            ? `₹${(parseFloat(group.amount) * group.quantity).toLocaleString("en-IN")}`
                            : "Price not set"}
                        </p>
                      </div>
                    </div>
                    {modelGroups.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveModelGroup(group.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                        title="Remove model group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-5 space-y-5">
                  {/* Model Specification Grid */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Model Name */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Model Name / Code{" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <Input
                        placeholder="e.g. ThinkPad T14 Gen 3"
                        value={group.model}
                        onChange={(e) =>
                          updateModelGroup(group.id, { model: e.target.value })
                        }
                        className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-semibold"
                        required
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Unit Price (₹){" "}
                        <span className="text-destructive">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-3 text-xs text-muted-foreground font-bold">
                          ₹
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="75000"
                          value={group.amount}
                          onChange={(e) =>
                            updateModelGroup(group.id, {
                              amount: e.target.value,
                            })
                          }
                          className="h-10 pl-7 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-mono font-bold"
                          required
                        />
                      </div>
                    </div>

                    {/* Warranty Period - Three boxes for Years, Months, Days */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Warranty Period{" "}
                        <span className="text-[9px] text-muted-foreground font-normal">
                          (Optional)
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            type="number"
                            min="0"
                            placeholder="Yrs"
                            value={group.warrantyYears}
                            onChange={(e) =>
                              updateModelGroup(group.id, {
                                warrantyYears: e.target.value,
                              })
                            }
                            className="h-9 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 text-center"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            min="0"
                            max="11"
                            placeholder="Mon"
                            value={group.warrantyMonths}
                            onChange={(e) =>
                              updateModelGroup(group.id, {
                                warrantyMonths: e.target.value,
                              })
                            }
                            className="h-9 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 text-center"
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            placeholder="Days"
                            value={group.warrantyDays}
                            onChange={(e) =>
                              updateModelGroup(group.id, {
                                warrantyDays: e.target.value,
                              })
                            }
                            className="h-9 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 text-center"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Enter duration in Years, Months, and/or Days
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Quantity <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={group.quantity}
                        onChange={(e) =>
                          handleQuantityChange(
                            group.id,
                            parseInt(e.target.value),
                          )
                        }
                        className="h-10 text-xs bg-background rounded-xl border-2 border-gray-300 dark:border-gray-600 font-extrabold text-primary"
                        required
                      />
                    </div>
                  </div>

                  {/* Serial Numbers Section */}
                  <div className="pt-3 border-t border-border/40 space-y-3">
                    <div className="flex items-center gap-2">
                      <Barcode className="h-4 w-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        Individual Serial Numbers ({group.quantity} Required)
                      </h4>
                    </div>

                    {/* Individual Serial Input Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {group.serialNumbers.map((sn, snIdx) => (
                        <div key={snIdx} className="space-y-1">
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-[10px] font-mono font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-md">
                              #{snIdx + 1}
                            </span>
                            <Input
                              placeholder={`S/N #${snIdx + 1}`}
                              value={sn}
                              onChange={(e) =>
                                handleSerialNumberChange(
                                  group.id,
                                  snIdx,
                                  e.target.value,
                                )
                              }
                              className="h-9 pl-11 text-xs font-mono bg-background rounded-xl border border-input focus:border-primary"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Full-Width Total Summary & Submit Banner */}
          <div className="w-full rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/30 p-5 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-extrabold text-lg shadow-md shadow-primary/20">
                {totalUnits}
              </div>
              <div>
                <h4 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Total Acquisition Summary
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {modelGroups.length} Model Group
                  {modelGroups.length > 1 ? "s" : ""} &bull; {totalUnits} Total
                  Asset Unit{totalUnits > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
                  Total Asset Valuation
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-primary font-mono">
                  ₹{totalValuation.toLocaleString("en-IN")}
                </span>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || totalUnits <= 0}
                className="gap-2 bg-primary text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90 h-11 px-6 text-sm font-semibold rounded-xl"
              >
                <Save className="h-4 w-4" />
                {isSubmitting
                  ? "Processing Asset Stock In..."
                  : "Complete Asset Stock In"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
