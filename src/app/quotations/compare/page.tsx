"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInventory, Product, ProductSupplierEntry } from "@/context/inventory-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GitCompare,
  Search,
  ShoppingCart,
  Award,
  TrendingDown,
  Building2,
  Download,
  CheckCircle2,
  Filter,
  Layers,
  ArrowUpDown,
  Calculator,
  Plus,
  Minus,
  Sparkles,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { M5C_LOGO_BASE64 } from "@/lib/company-logo";

interface VendorRateInfo {
  supplierName: string;
  rate: number;
  isPrimary: boolean;
}

interface ProductWithRates {
  product: Product;
  rates: Map<string, number>; // vendorName.toLowerCase() -> rate
  primaryVendor?: string;
  minRate: number | null;
  maxRate: number | null;
  spread: number | null; // max - min
  bestVendors: string[]; // vendor names with minRate
}

interface BasketItem {
  productId: string;
  productName: string;
  quantity: number;
}

export default function CompareQuotationsPage() {
  const router = useRouter();
  const { products, suppliers, activeBranch, categories } = useInventory();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [onlyCompeting, setOnlyCompeting] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "savings" | "lowestPrice">("savings");
  const [activeTab, setActiveTab] = useState<"matrix" | "cards" | "simulator">("matrix");
  const [mainTab, setMainTab] = useState<"overview" | "comparison">("overview");

  // Quotation Basket Simulator state
  const [basket, setBasket] = useState<Record<string, number>>({});

  // 1. Extract all vendors with listed product rates
  const { allVendors, productRatesList } = useMemo(() => {
    const vendorMap = new Map<
      string,
      {
        displayName: string;
        productsCount: number;
        totalRateSum: number;
      }
    >();

    const processedProducts: ProductWithRates[] = products.map((p) => {
      const ratesMap = new Map<string, number>();

      // Read from suppliersList
      if (p.suppliersList && Array.isArray(p.suppliersList)) {
        p.suppliersList.forEach((s: ProductSupplierEntry) => {
          if (s.supplierName && typeof s.rate === "number" && s.rate > 0) {
            const trimmed = s.supplierName.trim();
            const key = trimmed.toLowerCase();
            ratesMap.set(key, s.rate);

            if (!vendorMap.has(key)) {
              vendorMap.set(key, { displayName: trimmed, productsCount: 0, totalRateSum: 0 });
            }
          }
        });
      }

      // Read from primary supplier
      if (p.supplier && typeof p.price === "number" && p.price > 0) {
        const trimmed = p.supplier.trim();
        const key = trimmed.toLowerCase();
        if (!ratesMap.has(key)) {
          ratesMap.set(key, p.price);
        }
        if (!vendorMap.has(key)) {
          vendorMap.set(key, { displayName: trimmed, productsCount: 0, totalRateSum: 0 });
        }
      }

      // Calculate min, max, spread
      const ratesArr = Array.from(ratesMap.values());
      const minRate = ratesArr.length > 0 ? Math.min(...ratesArr) : null;
      const maxRate = ratesArr.length > 0 ? Math.max(...ratesArr) : null;
      const spread = minRate !== null && maxRate !== null ? maxRate - minRate : null;

      const bestVendors: string[] = [];
      ratesMap.forEach((rate, vendorKey) => {
        if (minRate !== null && rate === minRate) {
          const info = vendorMap.get(vendorKey);
          if (info) bestVendors.push(info.displayName);
        }
      });

      return {
        product: p,
        rates: ratesMap,
        primaryVendor: p.supplier,
        minRate,
        maxRate,
        spread,
        bestVendors,
      };
    });

    // Populate vendor stats
    processedProducts.forEach(({ rates }) => {
      rates.forEach((rate, vendorKey) => {
        const entry = vendorMap.get(vendorKey);
        if (entry) {
          entry.productsCount += 1;
          entry.totalRateSum += rate;
        }
      });
    });

    const vendorList = Array.from(vendorMap.values()).sort(
      (a, b) => b.productsCount - a.productsCount,
    );

    return {
      allVendors: vendorList,
      productRatesList: processedProducts,
    };
  }, [products]);

  // Selected Vendors state (defaults to top 3 vendors)
  const [selectedVendors, setSelectedVendors] = useState<string[]>(() => {
    return allVendors.slice(0, 3).map((v) => v.displayName);
  });

  // Ensure selectedVendors are valid
  const activeSelectedVendors = useMemo(() => {
    const valid = selectedVendors.filter((v) =>
      allVendors.some((av) => av.displayName.toLowerCase() === v.toLowerCase()),
    );
    if (valid.length === 0 && allVendors.length > 0) {
      return allVendors.slice(0, 3).map((v) => v.displayName);
    }
    return valid;
  }, [selectedVendors, allVendors]);

  // 3 long boxes state for Tab 1 (Vendor slots: min 2, max 3) - NOT auto-picked
  const [slotVendors, setSlotVendors] = useState<[string, string, string]>(["", "", ""]);

  // Synchronized product being compared in Tab 1 - NOT auto-picked
  const [comparedProductId, setComparedProductId] = useState<string>("");

  const [compareQty, setCompareQty] = useState<number>(100);

  const comparedProduct = useMemo(() => {
    if (!comparedProductId) return null;
    return products.find((p) => p.id === comparedProductId) || null;
  }, [products, comparedProductId]);

  const getVendorRate = (vName: string, prod: Product | null | undefined): number | null => {
    if (!vName || !prod) return null;
    const vKey = vName.trim().toLowerCase();

    if (prod.suppliersList && Array.isArray(prod.suppliersList)) {
      const entry = prod.suppliersList.find(
        (s) => s.supplierName?.trim().toLowerCase() === vKey && typeof s.rate === "number" && s.rate > 0,
      );
      if (entry) return entry.rate;
    }

    if (prod.supplier?.trim().toLowerCase() === vKey && typeof prod.price === "number" && prod.price > 0) {
      return prod.price;
    }

    return null;
  };

  const threeBoxAnalysis = useMemo(() => {
    if (!comparedProduct) return null;

    const slots = [
      { slotIdx: 0, vendorName: slotVendors[0], label: "Vendor 1" },
      { slotIdx: 1, vendorName: slotVendors[1], label: "Vendor 2" },
      ...(slotVendors[2] ? [{ slotIdx: 2, vendorName: slotVendors[2], label: "Vendor 3" }] : []),
    ];

    const slotRates = slots.map((s) => {
      const rate = getVendorRate(s.vendorName, comparedProduct);
      return {
        ...s,
        rate,
        totalCost: rate !== null ? rate * compareQty : null,
      };
    });

    const validRates = slotRates.filter((sr): sr is typeof sr & { rate: number; totalCost: number } => sr.rate !== null);
    if (validRates.length < 2) return null;

    const minRate = Math.min(...validRates.map((sr) => sr.rate));
    const maxRate = Math.max(...validRates.map((sr) => sr.rate));
    const winningSlots = validRates.filter((sr) => sr.rate === minRate);
    const winningVendor = winningSlots[0]?.vendorName || null;
    const maxSavingsPerUnit = maxRate > minRate ? maxRate - minRate : 0;
    const totalMaxSavings = maxSavingsPerUnit * compareQty;

    return {
      slotRates,
      minRate,
      maxRate,
      winningVendor,
      maxSavingsPerUnit,
      totalMaxSavings,
      validRatesCount: validRates.length,
    };
  }, [comparedProduct, slotVendors, compareQty]);

  // Toggle vendor selection
  const toggleVendor = (vendorName: string) => {
    const exists = activeSelectedVendors.some(
      (v) => v.toLowerCase() === vendorName.toLowerCase(),
    );
    if (exists) {
      if (activeSelectedVendors.length <= 1) {
        toast.info("Keep at least 1 vendor selected.");
        return;
      }
      setSelectedVendors((prev) =>
        prev.filter((v) => v.toLowerCase() !== vendorName.toLowerCase()),
      );
    } else {
      if (activeSelectedVendors.length >= 6) {
        toast.info("You can compare up to 6 vendors side-by-side.");
        return;
      }
      setSelectedVendors((prev) => [...prev, vendorName]);
    }
  };

  const selectAllVendors = () => {
    setSelectedVendors(allVendors.slice(0, 6).map((v) => v.displayName));
  };

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    const selectedKeys = activeSelectedVendors.map((v) => v.toLowerCase());

    return productRatesList
      .filter(({ product, rates }) => {
        // Must be quoted by at least one selected vendor
        const quotedBySelected = selectedKeys.filter((k) => rates.has(k));
        if (quotedBySelected.length === 0) return false;

        // If only competing is active, require at least 2 selected vendors quoting
        if (onlyCompeting && quotedBySelected.length < 2) return false;

        // Category filter
        if (
          selectedCategory !== "All" &&
          product.category?.toLowerCase() !== selectedCategory.toLowerCase()
        ) {
          return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchSku = product.sku?.toLowerCase().includes(q);
          const matchCategory = product.category?.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.product.name.localeCompare(b.product.name);
        }
        if (sortBy === "savings") {
          // Compare spread (savings opportunity) among selected vendors
          const aSelectedRates = activeSelectedVendors
            .map((v) => a.rates.get(v.toLowerCase()))
            .filter((r): r is number => typeof r === "number");
          const bSelectedRates = activeSelectedVendors
            .map((v) => b.rates.get(v.toLowerCase()))
            .filter((r): r is number => typeof r === "number");

          const aSpread =
            aSelectedRates.length > 1
              ? Math.max(...aSelectedRates) - Math.min(...aSelectedRates)
              : 0;
          const bSpread =
            bSelectedRates.length > 1
              ? Math.max(...bSelectedRates) - Math.min(...bSelectedRates)
              : 0;

          return bSpread - aSpread;
        }
        if (sortBy === "lowestPrice") {
          const aMin = a.minRate || 999999;
          const bMin = b.minRate || 999999;
          return aMin - bMin;
        }
        return 0;
      });
  }, [
    productRatesList,
    activeSelectedVendors,
    onlyCompeting,
    selectedCategory,
    searchTerm,
    sortBy,
  ]);

  // Vendor statistics among the active comparison
  const vendorScorecards = useMemo(() => {
    const selectedKeys = activeSelectedVendors.map((v) => v.toLowerCase());

    return activeSelectedVendors.map((vName) => {
      const vKey = vName.toLowerCase();
      let quotedCount = 0;
      let lowestWinsCount = 0;
      let totalRateSum = 0;

      // Find details from suppliers list
      const details = suppliers.find(
        (s) => s.name.toLowerCase() === vKey,
      );

      filteredProducts.forEach(({ rates }) => {
        const thisRate = rates.get(vKey);
        if (typeof thisRate === "number") {
          quotedCount += 1;
          totalRateSum += thisRate;

          // Check if this vendor has the strictly lowest or tied lowest among selected
          const activeRates = selectedKeys
            .map((k) => rates.get(k))
            .filter((r): r is number => typeof r === "number");
          if (activeRates.length > 0 && thisRate === Math.min(...activeRates)) {
            lowestWinsCount += 1;
          }
        }
      });

      const avgRate = quotedCount > 0 ? Math.round(totalRateSum / quotedCount) : 0;

      return {
        vendorName: vName,
        details,
        quotedCount,
        lowestWinsCount,
        avgRate,
        winPercentage: quotedCount > 0 ? Math.round((lowestWinsCount / quotedCount) * 100) : 0,
      };
    });
  }, [activeSelectedVendors, filteredProducts, suppliers]);

  // Overall winner recommendation
  const recommendedVendor = useMemo(() => {
    if (vendorScorecards.length === 0) return null;
    return [...vendorScorecards].sort((a, b) => {
      if (b.lowestWinsCount !== a.lowestWinsCount) {
        return b.lowestWinsCount - a.lowestWinsCount;
      }
      return b.quotedCount - a.quotedCount;
    })[0];
  }, [vendorScorecards]);

  // Basket simulator calculations
  const basketAnalysis = useMemo(() => {
    const basketKeys = Object.keys(basket).filter((id) => basket[id] > 0);
    if (basketKeys.length === 0) return null;

    const results = activeSelectedVendors.map((vName) => {
      const vKey = vName.toLowerCase();
      let grandTotal = 0;
      let itemsCovered = 0;
      const breakdown: { productName: string; qty: number; unitPrice: number; lineTotal: number }[] = [];

      basketKeys.forEach((pId) => {
        const pItem = productRatesList.find((pr) => pr.product.id === pId);
        if (pItem) {
          const qty = basket[pId] || 0;
          const rate = pItem.rates.get(vKey);
          if (typeof rate === "number" && rate > 0) {
            grandTotal += qty * rate;
            itemsCovered += 1;
            breakdown.push({
              productName: pItem.product.name,
              qty,
              unitPrice: rate,
              lineTotal: qty * rate,
            });
          }
        }
      });

      return {
        vendorName: vName,
        grandTotal,
        itemsCovered,
        totalItems: basketKeys.length,
        isFullyCovered: itemsCovered === basketKeys.length,
        breakdown,
      };
    });

    const eligible = results.filter((r) => r.itemsCovered > 0);
    const winner = eligible.length > 0
      ? [...eligible].sort((a, b) => {
          if (b.itemsCovered !== a.itemsCovered) {
            return b.itemsCovered - a.itemsCovered;
          }
          return a.grandTotal - b.grandTotal;
        })[0]
      : null;

    return {
      results,
      winner,
      basketItemCount: basketKeys.length,
    };
  }, [basket, activeSelectedVendors, productRatesList]);

  // Handle adding product to basket
  const updateBasketQty = (productId: string, delta: number) => {
    setBasket((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  // Convert Basket to PO
  const handleConvertBasketToPO = (vendorName: string) => {
    if (!basketAnalysis || !basketAnalysis.winner) return;
    const vendorResult = basketAnalysis.results.find((r) => r.vendorName === vendorName);
    if (!vendorResult || vendorResult.breakdown.length === 0) {
      toast.error("No valid items in basket for this vendor.");
      return;
    }

    const orderItems = vendorResult.breakdown.map((item) => {
      const pItem = productRatesList.find((pr) => pr.product.name === item.productName);
      return {
        productId: pItem?.product.id || "",
        name: item.productName,
        quantity: item.qty,
        price: item.unitPrice,
      };
    });

    const encodedItems = encodeURIComponent(JSON.stringify(orderItems));
    router.push(`/orders/new?supplier=${encodeURIComponent(vendorName)}&items=${encodedItems}`);
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredProducts.length === 0) {
      toast.info("No data to export.");
      return;
    }

    try {
      const exportData = filteredProducts.map(({ product, rates }) => {
        const activeRates = activeSelectedVendors
          .map((v) => rates.get(v.toLowerCase()))
          .filter((r): r is number => typeof r === "number");

        const min = activeRates.length > 0 ? Math.min(...activeRates) : null;
        const max = activeRates.length > 0 ? Math.max(...activeRates) : null;
        const spread = min !== null && max !== null && max > min ? max - min : 0;

        const best = activeSelectedVendors
          .filter((v) => rates.get(v.toLowerCase()) === min)
          .join(", ");

        const row: Record<string, any> = {
          "Product Name": product.name,
          "SKU": product.sku || "-",
          "Category": product.category || "-",
          "UOM": product.uom || "unit",
        };

        // Add columns for each selected vendor
        activeSelectedVendors.forEach((v) => {
          const rate = rates.get(v.toLowerCase());
          row[`${v} (₹)`] = rate !== undefined ? rate : "Not Quoted";
        });

        row["Lowest Rate (₹)"] = min !== null ? min : "-";
        row["Best Vendor"] = best || "-";
        row["Potential Savings / Spread (₹)"] = spread;
        row["Branch Stock"] =
          activeBranch === "All"
            ? Object.values(product.stock || {}).reduce((a, b) => a + b, 0)
            : product.stock?.[activeBranch] || 0;

        return row;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Quotation Comparison");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(
        blob,
        `Vendor_Quotation_Comparison_${activeBranch}_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      toast.success("Quotation comparison Excel (.xlsx) downloaded successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export Excel file.");
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredProducts.length === 0) {
      toast.info("No data to export.");
      return;
    }

    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // Title & Header
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text("Vendor Quotation Price Comparison Matrix", 40, 45);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`Branch: ${activeBranch}  |  Generated: ${new Date().toLocaleDateString("en-IN")}  |  Compared Vendors: ${activeSelectedVendors.join(", ")}`, 40, 62);

      const tableHead = [
        [
          "Product Description",
          "Category",
          "SKU",
          ...activeSelectedVendors,
          "Lowest Rate",
          "Best Vendor",
        ],
      ];

      const tableBody = filteredProducts.map(({ product, rates }) => {
        const activeRates = activeSelectedVendors
          .map((v) => rates.get(v.toLowerCase()))
          .filter((r): r is number => typeof r === "number");

        const min = activeRates.length > 0 ? Math.min(...activeRates) : null;
        const best = activeSelectedVendors
          .filter((v) => rates.get(v.toLowerCase()) === min)
          .join(", ");

        const vCols = activeSelectedVendors.map((v) => {
          const rate = rates.get(v.toLowerCase());
          return rate !== undefined ? `₹${rate.toLocaleString("en-IN")}` : "-";
        });

        return [
          product.name,
          product.category || "-",
          product.sku || "-",
          ...vCols,
          min !== null ? `₹${min.toLocaleString("en-IN")}` : "-",
          best || "-",
        ];
      });

      autoTable(doc, {
        head: tableHead,
        body: tableBody,
        startY: 75,
        theme: "striped",
        styles: { fontSize: 8, cellPadding: 5 },
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (data) => {
          // Highlight lowest price cell if applicable
          if (data.section === "body" && data.column.index >= 3 && data.column.index < 3 + activeSelectedVendors.length) {
            const vIdx = data.column.index - 3;
            const vName = activeSelectedVendors[vIdx];
            const pItem = filteredProducts[data.row.index];
            if (pItem) {
              const activeRates = activeSelectedVendors
                .map((v) => pItem.rates.get(v.toLowerCase()))
                .filter((r): r is number => typeof r === "number");
              const min = activeRates.length > 0 ? Math.min(...activeRates) : null;
              const rate = pItem.rates.get(vName.toLowerCase());
              if (rate !== undefined && min !== null && rate === min) {
                data.cell.styles.textColor = [16, 185, 129];
                data.cell.styles.fontStyle = "bold";
              }
            }
          }
        },
      });

      doc.save(`Vendor_Quotations_Comparison_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Quotation comparison PDF exported successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF.");
    }
  };

  // If no products with vendors exist
  if (allVendors.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 w-full">
        <div className="border-b border-border/50 pb-5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Compare Quotations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Side-by-side vendor quotation pricing and rate comparison.
          </p>
        </div>

        <Card className="border-border/50 shadow-sm p-12 text-center">
          <div className="flex flex-col items-center justify-center">
            <GitCompare className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-bold text-foreground">No Vendor Product Rates Found</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Your catalog items do not have vendor pricing configured yet. Add suppliers or map vendor rates on your products to compare quotation prices.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Link href="/suppliers/rates">
                <Button variant="outline" className="gap-2">
                  <Building2 className="h-4 w-4" /> Manage Supplier Rates
                </Button>
              </Link>
              <Link href="/products">
                <Button className="gap-2">
                  <Layers className="h-4 w-4" /> View Products Catalog
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 w-full">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Compare Quotations
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary border border-primary/20">
              Live Product Rates
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Side-by-side pricing analysis across vendors using active catalog rates ({allVendors.length} vendors listed).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportExcel}
            className="gap-2 text-xs h-9"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            className="gap-2 text-xs h-9"
          >
            <Download className="h-4 w-4 text-primary" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-px">
        <button
          type="button"
          onClick={() => setMainTab("overview")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            mainTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Vendor Selection & Overview</span>
        </button>
        <button
          type="button"
          onClick={() => setMainTab("comparison")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            mainTab === "comparison"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GitCompare className="h-4 w-4" />
          <span>Price & Rate Comparison</span>
        </button>
      </div>

      {/* Tab 1: 3 Long Boxes Direct Comparison */}
      {mainTab === "overview" && (
        <div className="space-y-6">
          {/* Winning Recommendation Banner */}
          {threeBoxAnalysis && threeBoxAnalysis.winningVendor && threeBoxAnalysis.minRate !== null && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 shadow-sm">
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500 text-white shrink-0 shadow-sm">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2 flex-wrap">
                      Lowest Rate Winner: {threeBoxAnalysis.winningVendor}
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                        <TrendingDown className="h-3 w-3" /> Best Price
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Offers the lowest rate of <strong className="text-foreground">₹{threeBoxAnalysis.minRate.toLocaleString("en-IN")}</strong> per unit (Total: <strong className="text-foreground">₹{(threeBoxAnalysis.minRate * compareQty).toLocaleString("en-IN")}</strong> for {compareQty} units).
                      {threeBoxAnalysis.totalMaxSavings > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1">
                          Saves ₹{threeBoxAnalysis.totalMaxSavings.toLocaleString("en-IN")} compared to other vendors!
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Three Long Boxes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {[0, 1, 2].map((slotIdx) => {
              const vendorName = slotVendors[slotIdx];
              const slotTitle = `Vendor ${slotIdx + 1}`;

              // If slot 2 is empty, show "+ Add 3rd Vendor" card
              if (slotIdx === 2 && !vendorName) {
                return (
                  <Card
                    key={slotIdx}
                    className="border-dashed border-2 border-border/70 bg-muted/10 p-6 flex flex-col items-center justify-center text-center min-h-[540px] rounded-xl"
                  >
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                      <Plus className="h-8 w-8" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">Add 3rd Vendor</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                      Add a third vendor to compare 3 quotations simultaneously.
                    </p>

                    <div className="w-full max-w-[240px] mt-4">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            setSlotVendors([slotVendors[0], slotVendors[1], e.target.value]);
                          }
                        }}
                        className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">-- Choose 3rd Vendor --</option>
                        {allVendors
                          .filter(
                            (v) =>
                              v.displayName.toLowerCase() !== slotVendors[0]?.toLowerCase() &&
                              v.displayName.toLowerCase() !== slotVendors[1]?.toLowerCase(),
                          )
                          .map((v) => (
                            <option key={v.displayName} value={v.displayName}>
                              {v.displayName} ({v.productsCount} items)
                            </option>
                          ))}
                      </select>
                    </div>
                  </Card>
                );
              }

              // Details for selected vendor
              const vendorDetails = suppliers.find(
                (s) => s.name.toLowerCase() === vendorName?.toLowerCase(),
              );
              const vendorMeta = allVendors.find(
                (av) => av.displayName.toLowerCase() === vendorName?.toLowerCase(),
              );

              // Rate for compared product
              const rate = getVendorRate(vendorName, comparedProduct);
              const isQuoted = typeof rate === "number";
              const isWinner =
                isQuoted &&
                threeBoxAnalysis !== null &&
                threeBoxAnalysis.minRate !== null &&
                rate === threeBoxAnalysis.minRate;

              const diffFromMin =
                isQuoted && threeBoxAnalysis !== null && threeBoxAnalysis.minRate !== null
                  ? rate - threeBoxAnalysis.minRate
                  : null;

              const savingsVsMax =
                isWinner &&
                threeBoxAnalysis !== null &&
                threeBoxAnalysis.maxRate !== null &&
                threeBoxAnalysis.maxRate > rate
                  ? threeBoxAnalysis.maxRate - rate
                  : null;

              const savingsPct =
                savingsVsMax &&
                threeBoxAnalysis !== null &&
                threeBoxAnalysis.maxRate !== null &&
                threeBoxAnalysis.maxRate > 0
                  ? Math.round((savingsVsMax / threeBoxAnalysis.maxRate) * 100)
                  : null;

              const branchStock =
                activeBranch === "All"
                  ? Object.values(comparedProduct?.stock || {}).reduce((a, b) => a + b, 0)
                  : comparedProduct?.stock?.[activeBranch] || 0;

              return (
                <Card
                  key={slotIdx}
                  className={`border-border/50 shadow-sm flex flex-col justify-between min-h-[540px] transition-all relative overflow-hidden ${
                    isWinner
                      ? "ring-2 ring-emerald-500/70 border-emerald-500/50 bg-emerald-500/[0.02]"
                      : ""
                  }`}
                >
                  {isWinner && (
                    <div className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5" /> Best Quotation Winner
                      </span>
                      {savingsVsMax && savingsPct && (
                        <span>Save {savingsPct}%</span>
                      )}
                    </div>
                  )}

                  <div className="p-5 space-y-5 flex-1">
                    {/* Slot Header */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-3">
                      <span className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {slotTitle}
                      </span>
                      {slotIdx === 2 && (
                        <button
                          type="button"
                          onClick={() => setSlotVendors([slotVendors[0], slotVendors[1], ""])}
                          className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Remove Vendor
                        </button>
                      )}
                    </div>

                    {/* Step 1: Select Vendor */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-primary" /> 1. Select Vendor
                      </label>
                      <select
                        value={vendorName}
                        onChange={(e) => {
                          const val = e.target.value;
                          const next: [string, string, string] = [...slotVendors];
                          next[slotIdx] = val;
                          setSlotVendors(next);
                        }}
                        className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 font-semibold text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
                      >
                        <option value="">-- Choose Vendor --</option>
                        {allVendors.map((v) => (
                          <option key={v.displayName} value={v.displayName}>
                            {v.displayName} ({v.productsCount} catalog items)
                          </option>
                        ))}
                      </select>

                      {vendorName ? (
                        <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-[11px] text-muted-foreground space-y-0.5 mt-1.5">
                          <div className="font-semibold text-foreground flex items-center justify-between">
                            <span>{vendorDetails?.location || "Logistics Vendor"}</span>
                            <span className="text-[10px] text-primary">{vendorMeta?.productsCount || 0} items listed</span>
                          </div>
                          {vendorDetails?.contact && <div>Contact: {vendorDetails.contact}</div>}
                          {vendorDetails?.phone && <div>Phone: {vendorDetails.phone}</div>}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-muted/20 border border-dashed border-border/40 text-[11px] text-muted-foreground/70 text-center">
                          Select a vendor to view details
                        </div>
                      )}
                    </div>

                    {/* Step 2: Select Product (Syncs across all boxes) */}
                    <div className="space-y-1.5 pt-2 border-t border-border/40">
                      <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Layers className="h-3.5 w-3.5 text-primary" /> 2. Select Product to Compare
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal lowercase">(syncs all boxes)</span>
                      </label>
                      <select
                        value={comparedProductId}
                        onChange={(e) => setComparedProductId(e.target.value)}
                        disabled={!vendorName}
                        className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 py-1 font-medium text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {(() => {
                          if (!vendorName) {
                            return <option value="">-- Select Vendor in Step 1 first --</option>;
                          }

                          const vendorProducts = products.filter(
                            (p) => getVendorRate(vendorName, p) !== null,
                          );

                          if (vendorProducts.length === 0) {
                            return <option value="">No products listed for this vendor</option>;
                          }

                          const isComparedInList = vendorProducts.some(
                            (p) => p.id === comparedProductId,
                          );

                          return (
                            <>
                              <option value="">
                                -- Select Product ({vendorProducts.length} items) --
                              </option>
                              {!isComparedInList && comparedProduct && (
                                <option value={comparedProduct.id}>
                                  {comparedProduct.name} (Not quoted by {vendorName})
                                </option>
                              )}
                              {vendorProducts.map((p) => {
                                const pRate = getVendorRate(vendorName, p);
                                return (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {pRate ? `(₹${pRate})` : ""}
                                  </option>
                                );
                              })}
                            </>
                          );
                        })()}
                      </select>
                    </div>

                    {/* Step 3: Product Rate & Quotation Card */}
                    <div className="space-y-2 pt-2 border-t border-border/40">
                      <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
                        3. Vendor Quotation Outcome
                      </div>

                      {!comparedProductId ? (
                        <div className="p-5 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center text-xs text-muted-foreground space-y-1">
                          <Layers className="h-5 w-5 mx-auto text-muted-foreground/40 mb-1" />
                          <div className="font-semibold text-foreground">No Product Selected</div>
                          <p className="text-[11px]">
                            Select a product in step 2 above to compare rates.
                          </p>
                        </div>
                      ) : !vendorName ? (
                        <div className="p-5 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center text-xs text-muted-foreground space-y-1">
                          <Building2 className="h-5 w-5 mx-auto text-muted-foreground/40 mb-1" />
                          <div className="font-semibold text-foreground">No Vendor Selected</div>
                          <p className="text-[11px]">
                            Select a vendor in step 1 above to view quotation rates.
                          </p>
                        </div>
                      ) : isQuoted ? (
                        <div
                          className={`p-3.5 rounded-xl border transition-all ${
                            isWinner
                              ? "border-emerald-500/50 bg-emerald-500/[0.05]"
                              : "border-border/50 bg-muted/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                                Unit Rate
                              </div>
                              <div className="text-2xl font-bold font-mono text-foreground mt-0.5">
                                ₹{rate.toLocaleString("en-IN")}
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                  / {comparedProduct?.uom || "unit"}
                                </span>
                              </div>
                            </div>

                            {isWinner ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                <Award className="h-3 w-3" /> Best Rate
                              </span>
                            ) : diffFromMin && diffFromMin > 0 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                                +₹{diffFromMin.toLocaleString("en-IN")} vs lowest
                              </span>
                            ) : null}
                          </div>

                          {/* Savings / Price Advantage note */}
                          {savingsVsMax && savingsPct && (
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                              <TrendingDown className="h-3.5 w-3.5" />
                              Save ₹{savingsVsMax.toLocaleString("en-IN")} per unit ({savingsPct}% cheaper)
                            </div>
                          )}

                          {/* Order Simulator subtotal with inline editable quantity */}
                          <div className="mt-3 pt-2.5 border-t border-border/40 flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <span>Order Qty:</span>
                              <input
                                type="number"
                                min="1"
                                value={compareQty}
                                onChange={(e) => setCompareQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 h-6 text-center font-mono text-xs rounded border border-border/60 bg-background px-1 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                              />
                            </div>
                            <span className="font-bold font-mono text-foreground text-sm">
                              ₹{(rate * compareQty).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="mt-1 flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>Branch Stock ({activeBranch}):</span>
                            <span className="font-mono font-medium text-foreground">{branchStock} units</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-center text-xs text-muted-foreground space-y-1">
                          <AlertCircle className="h-5 w-5 mx-auto text-muted-foreground/40 mb-1" />
                          <div className="font-semibold text-foreground">Not Quoted</div>
                          <p className="text-[11px]">
                            {vendorName} has not listed a price for {comparedProduct?.name || "this product"}.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Box Footer Action */}
                  <div className="p-4 border-t border-border/40 bg-muted/10">
                    <Link
                      href={
                        vendorName && comparedProduct && isQuoted
                          ? `/orders/new?supplier=${encodeURIComponent(vendorName)}&productId=${comparedProduct?.id}&items=${encodeURIComponent(
                              JSON.stringify([
                                {
                                  productId: comparedProduct?.id,
                                  name: comparedProduct?.name,
                                  quantity: compareQty,
                                  price: rate || comparedProduct?.price || 0,
                                },
                              ]),
                            )}`
                          : "#"
                      }
                      className="w-full block"
                    >
                      <Button
                        className="w-full gap-2 text-xs h-9"
                        variant={isWinner ? "default" : "outline"}
                        disabled={!vendorName || !comparedProductId || !isQuoted}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isWinner
                          ? `Create PO with Winner (${vendorName})`
                          : vendorName
                          ? `Create PO with ${vendorName}`
                          : "Create PO"}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Detailed Price Comparison Section */}
      {mainTab === "comparison" && (
        <div className="space-y-6">
          {/* View Mode Switcher & Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/50 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "matrix"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GitCompare className="h-3.5 w-3.5" /> Price Matrix
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cards")}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "cards"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="h-3.5 w-3.5" /> Vendor Scorecards
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 relative ${
              activeTab === "simulator"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calculator className="h-3.5 w-3.5 text-primary" /> PO Basket Simulator
            {Object.keys(basket).length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-primary text-primary-foreground font-bold">
                {Object.keys(basket).length}
              </span>
            )}
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search product, SKU..."
              className="pl-8 text-xs h-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs h-9 rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs h-9 rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="savings">Sort: Highest Savings</option>
            <option value="name">Sort: Product Name</option>
            <option value="lowestPrice">Sort: Lowest Price</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyCompeting(!onlyCompeting)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors h-9 ${
              onlyCompeting
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border/60 bg-background text-muted-foreground hover:bg-muted"
            }`}
            title="Only show products quoted by 2 or more of the selected vendors"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Head-to-Head Only</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Comparison Matrix */}
      {activeTab === "matrix" && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Side-by-Side Product Rate Comparison
                </CardTitle>
                <CardDescription className="text-xs">
                  Showing {filteredProducts.length} product(s). Rates are retrieved directly from listed vendor catalog pricing.
                </CardDescription>
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                Branch: <strong className="text-foreground">{activeBranch}</strong>
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[700px]">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 font-semibold w-1/4">Product & Details</th>
                  <th className="px-3 py-3 font-semibold text-center w-24">Branch Stock</th>
                  {activeSelectedVendors.map((vName) => (
                    <th key={vName} className="px-4 py-3 font-semibold text-right">
                      <div className="font-bold text-foreground capitalize truncate max-w-[160px] ml-auto">
                        {vName}
                      </div>
                      <div className="text-[10px] text-muted-foreground lowercase font-normal">
                        unit price
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 font-semibold text-center w-32">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeSelectedVendors.length + 3}
                      className="px-4 py-12 text-center text-muted-foreground text-xs"
                    >
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                      No products match your current vendor selection or filters.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(({ product, rates }) => {
                    // Extract rates among selected vendors
                    const activeVendorRates = activeSelectedVendors.map((v) => {
                      const rate = rates.get(v.toLowerCase());
                      return {
                        vendorName: v,
                        rate,
                      };
                    });

                    const validRates = activeVendorRates
                      .filter((vr): vr is { vendorName: string; rate: number } => typeof vr.rate === "number");

                    const minRate = validRates.length > 0 ? Math.min(...validRates.map((r) => r.rate)) : null;
                    const maxRate = validRates.length > 0 ? Math.max(...validRates.map((r) => r.rate)) : null;
                    const spread = minRate !== null && maxRate !== null && maxRate > minRate ? maxRate - minRate : 0;
                    const winnerVendor = validRates.find((vr) => vr.rate === minRate)?.vendorName;

                    const branchStock =
                      activeBranch === "All"
                        ? Object.values(product.stock || {}).reduce((a, b) => a + b, 0)
                        : product.stock?.[activeBranch] || 0;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-muted/30 transition-colors text-xs group"
                      >
                        {/* Product Info */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-foreground text-sm">
                            {product.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                            {product.sku && (
                              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                {product.sku}
                              </span>
                            )}
                            {product.category && (
                              <span className="capitalize">{product.category}</span>
                            )}
                            {product.uom && <span>• {product.uom}</span>}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="px-3 py-3.5 text-center font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full font-medium ${
                              branchStock <= (product.threshold || 5)
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                : "bg-muted text-foreground"
                            }`}
                          >
                            {branchStock}
                          </span>
                        </td>

                        {/* Vendor Rate Columns */}
                        {activeSelectedVendors.map((vName) => {
                          const rate = rates.get(vName.toLowerCase());
                          const isQuoted = typeof rate === "number";
                          const isCheapest = isQuoted && minRate !== null && rate === minRate;

                          // Calculate difference if there are competing rates
                          const diffFromMax = isCheapest && spread > 0 ? spread : null;
                          const pctSavings =
                            diffFromMax && maxRate ? Math.round((diffFromMax / maxRate) * 100) : null;

                          return (
                            <td
                              key={vName}
                              className={`px-4 py-3.5 text-right font-mono transition-colors ${
                                isCheapest && validRates.length > 1
                                  ? "bg-emerald-500/[0.04]"
                                  : ""
                              }`}
                            >
                              {isQuoted ? (
                                <div>
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span
                                      className={`text-sm font-bold ${
                                        isCheapest && validRates.length > 1
                                          ? "text-emerald-600 dark:text-emerald-400"
                                          : "text-foreground"
                                      }`}
                                    >
                                      ₹{rate.toLocaleString("en-IN")}
                                    </span>
                                    {isCheapest && validRates.length > 1 && (
                                      <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                        Best
                                      </span>
                                    )}
                                  </div>
                                  {diffFromMax && pctSavings ? (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium mt-0.5">
                                      -₹{diffFromMax.toLocaleString("en-IN")} ({pctSavings}% off)
                                    </div>
                                  ) : (
                                    <div className="text-[10px] text-muted-foreground font-sans mt-0.5">
                                      Listed Rate
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground/60 italic text-[11px] font-sans">
                                  Not Quoted
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Quick Action */}
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {winnerVendor && (
                              <Link
                                href={`/orders/new?supplier=${encodeURIComponent(winnerVendor)}&productId=${product.id}`}
                                title={`Order from cheapest vendor (${winnerVendor})`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[11px] px-2 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                >
                                  <ShoppingCart className="h-3 w-3" /> Order
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                updateBasketQty(product.id, 1);
                                toast.success(`Added ${product.name} to PO Simulator`);
                              }}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Add to PO Quotation Simulator"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Vendor Scorecards */}
      {activeTab === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendorScorecards.map((score) => {
            const isTop = recommendedVendor?.vendorName === score.vendorName;
            return (
              <Card
                key={score.vendorName}
                className={`border-border/50 shadow-sm transition-all relative overflow-hidden ${
                  isTop ? "ring-1 ring-emerald-500/50 bg-emerald-500/[0.02]" : ""
                }`}
              >
                {isTop && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                    <Award className="h-3 w-3" /> #1 Best Value
                  </div>
                )}

                <CardHeader className="border-b border-border/50 pb-4">
                  <div className="flex items-center justify-between pr-12">
                    <CardTitle className="text-base font-bold text-foreground truncate">
                      {score.vendorName}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {score.details?.location || "Primary Logistics Vendor"}
                    {score.details?.branch ? ` • ${score.details.branch}` : ""}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Products Quoted
                      </div>
                      <div className="text-base font-bold font-mono text-foreground mt-0.5">
                        {score.quotedCount} items
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        in active catalog
                      </div>
                    </div>

                    <div className="bg-muted/40 p-3 rounded-lg border border-border/40">
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold">
                        Lowest Price Wins
                      </div>
                      <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                        {score.lowestWinsCount} items
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {score.winPercentage}% of catalog
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-3 rounded-lg border border-border/40 flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">Avg Quoted Price:</span>
                    <span className="font-bold text-sm font-mono text-foreground">
                      ₹{score.avgRate.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {score.details?.contact && (
                    <div className="text-[11px] text-muted-foreground space-y-1 pt-1 border-t border-border/40">
                      <div>Contact: {score.details.contact}</div>
                      {score.details.phone && <div>Phone: {score.details.phone}</div>}
                    </div>
                  )}

                  <div className="pt-2">
                    <Link
                      href={`/orders/new?supplier=${encodeURIComponent(score.vendorName)}`}
                      className="w-full block"
                    >
                      <Button
                        className="w-full gap-2 text-xs"
                        variant={isTop ? "default" : "outline"}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Create Purchase Order
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Tab 3: Interactive Quotation Basket Simulator */}
      {activeTab === "simulator" && (
        <div className="space-y-6">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" /> PO Basket Quotation Simulator
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Add products and quantities to simulate a full order requirement. Compare which vendor offers the best total invoice quotation.
                  </CardDescription>
                </div>
                {Object.keys(basket).length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setBasket({})}
                    className="text-xs h-7 text-muted-foreground hover:text-destructive"
                  >
                    Clear Basket
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 space-y-6">
              {/* Basket Items Selector / Adjuster */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Order Items & Quantities
                </div>

                {filteredProducts.slice(0, 8).map(({ product }) => {
                  const qty = basket[product.id] || 0;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between gap-4 p-2.5 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs text-foreground truncate">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {product.sku || product.category || "Item"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBasketQty(product.id, -10)}
                          disabled={qty === 0}
                          className="h-7 w-7 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          value={qty || ""}
                          placeholder="0"
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setBasket((prev) => ({ ...prev, [product.id]: Math.max(0, val) }));
                          }}
                          className="w-16 h-7 text-center font-mono text-xs px-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateBasketQty(product.id, 10)}
                          className="h-7 w-7 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Basket Comparison Results */}
              {basketAnalysis && basketAnalysis.basketItemCount > 0 ? (
                <div className="pt-4 border-t border-border/50 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Vendor Total Quotation Outcomes
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {basketAnalysis.results.map((res) => {
                      const isWinner = basketAnalysis.winner?.vendorName === res.vendorName;
                      return (
                        <Card
                          key={res.vendorName}
                          className={`border-border/50 p-4 transition-all ${
                            isWinner ? "border-emerald-500 bg-emerald-500/[0.03] shadow-md" : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-bold text-sm text-foreground">
                              {res.vendorName}
                            </div>
                            {isWinner && (
                              <span className="rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5">
                                Best Grand Total
                              </span>
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="text-xs text-muted-foreground">Estimated Order Total:</div>
                            <div className="text-xl font-bold font-mono text-foreground mt-0.5">
                              ₹{res.grandTotal.toLocaleString("en-IN")}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              Supplies {res.itemsCovered} of {res.totalItems} requested items
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-border/40">
                            <Button
                              onClick={() => handleConvertBasketToPO(res.vendorName)}
                              className="w-full gap-2 text-xs"
                              variant={isWinner ? "default" : "outline"}
                              disabled={res.itemsCovered === 0}
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Convert to PO ({res.vendorName})
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs border border-dashed border-border/60 rounded-xl">
                  Set quantities above to simulate and compare total order quotations across vendors.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
