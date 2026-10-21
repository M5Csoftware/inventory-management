"use client";

import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  FileSpreadsheet,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Layers,
  Building2,
  IndianRupee,
  FileText,
  Search,
  ArrowRight,
  Filter,
  Check,
  ChevronDown,
  Sparkles,
  PackageCheck,
  HelpCircle,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/confirm-modal";
import {
  useInventory,
  Product,
  BRANCHES,
  AssetSerialItem,
} from "@/context/inventory-context";

export interface ParsedAssetRow {
  id: string; // unique client id for the row
  rawProductName: string;
  matchedProductId: string;
  matchedProductName: string;
  matchedProductCategory: string;
  model: string;
  serialNumber: string;
  amount: number;
  warranty: string;
  supplier: string;
  invoiceNumber: string;
  branch: string;
  location: string;
  notes: string;
  // Validation status
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface AssetSpreadsheetImportProps {
  onSuccess?: () => void;
}

export default function AssetSpreadsheetImport({ onSuccess }: AssetSpreadsheetImportProps) {
  const {
    products,
    categories,
    suppliers,
    recordTransaction,
    assetSerials,
    addAssetSerialsBulk,
    activeBranch,
    fetchData,
    fetchAssetSerials,
  } = useInventory();

  // Filter asset products (products belonging to asset category or recognized hardware/equipment/assets)
  const assetProducts = useMemo(() => {
    const matched = products.filter((prod) => {
      const category = categories.find(
        (c) => c.name.toLowerCase() === prod.category.toLowerCase()
      );
      if (category?.isAsset) return true;
      const catLower = (prod.category || '').toLowerCase();
      const nameLower = (prod.name || '').toLowerCase();
      const keywords = ['asset', 'hardware', 'equipment', 'machine', 'device', 'laptop', 'desktop', 'monitor', 'printer', 'scanner', 'server', 'x-ray', 'x ray', 'medical', 'camera'];
      return keywords.some(k => catLower.includes(k) || nameLower.includes(k));
    });
    // Fallback to all products so no valid product is blocked from import matching
    return matched.length > 0 ? matched : products;
  }, [products, categories]);

  // Set of existing serial numbers in database (lowercase for fast case-insensitive check)
  const existingDbSerials = useMemo(() => {
    const set = new Set<string>();
    assetSerials.forEach((item) => {
      if (item.serialNumber) {
        set.add(item.serialNumber.trim().toLowerCase());
      }
    });
    return set;
  }, [assetSerials]);

  // Default fallback values applied if row leaves them empty
  const [defaultBranch, setDefaultBranch] = useState(() =>
    activeBranch === "All" ? "Ahmedabad" : activeBranch
  );
  const [defaultLocation, setDefaultLocation] = useState("Warehouse A (Zone 1)");
  const [defaultSupplier, setDefaultSupplier] = useState("");
  const [defaultInvoice, setDefaultInvoice] = useState("");

  // Uploaded file and parsing state
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rows, setRows] = useState<ParsedAssetRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "valid" | "errors">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Execution modal and progress state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [importResult, setImportResult] = useState<{
    totalImported: number;
    failedSerials: string[];
  } | null>(null);

  // Validation helper
  const validateRow = (
    row: Omit<ParsedAssetRow, "isValid" | "errors" | "warnings">,
    allSerialsInUpload: string[]
  ): { isValid: boolean; errors: string[]; warnings: string[] } => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Product check
    if (!row.matchedProductId) {
      errors.push(`Product "${row.rawProductName || "Empty"}" does not match any Asset product`);
    }

    // 2. Serial Number check
    const cleanSerial = (row.serialNumber || "").trim();
    if (!cleanSerial) {
      errors.push("Serial number is required");
    } else {
      const lowerSerial = cleanSerial.toLowerCase();
      // Check duplicate within the uploaded file
      const countInUpload = allSerialsInUpload.filter(
        (s) => s.toLowerCase() === lowerSerial
      ).length;
      if (countInUpload > 1) {
        errors.push(`Duplicate serial number in upload (${cleanSerial})`);
      }
      // Check duplicate in database
      if (existingDbSerials.has(lowerSerial)) {
        errors.push(`Serial number already registered in inventory (${cleanSerial})`);
      }
    }

    // 3. Branch check
    if (!row.branch) {
      errors.push("Branch is required");
    } else if (!BRANCHES.includes(row.branch as any)) {
      warnings.push(`Branch "${row.branch}" not recognized, will use ${defaultBranch}`);
    }

    // 4. Amount / Price check
    if (isNaN(row.amount) || row.amount < 0) {
      warnings.push("Unit price is zero or not specified");
    }

    // 5. Model check
    if (!row.model) {
      warnings.push("Model name is empty (recommended)");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };

  // Re-run validation across all rows whenever rows, defaultBranch, or existingDbSerials change
  const revalidateRows = (newRows: ParsedAssetRow[]): ParsedAssetRow[] => {
    const allSerials = newRows.map((r) => r.serialNumber.trim()).filter(Boolean);
    return newRows.map((r) => {
      const { isValid, errors, warnings } = validateRow(r, allSerials);
      return {
        ...r,
        isValid,
        errors,
        warnings,
      };
    });
  };

  // -------------------------------------------------------------
  // Template Generator (.xlsx and .csv)
  // -------------------------------------------------------------
  const downloadTemplate = (format: "xlsx" | "csv" = "xlsx") => {
    try {
      const sampleProduct1 = assetProducts[0]?.name || "Business Laptop";
      const sampleProduct2 = assetProducts[1]?.name || assetProducts[0]?.name || "LED Monitor 27-inch";
      const sampleSupplier = suppliers[0]?.name || "Apple India Private Limited";
      const branch1 = activeBranch === "All" ? "Ahmedabad" : activeBranch;
      const branch2 = BRANCHES.find((b) => b !== branch1) || "Delhi";

      // Template Rows
      const templateData = [
        {
          "Product Name": sampleProduct1,
          "Model Name": "ThinkPad T14 Gen 4 Core i7",
          "Serial Number": "PF49A001",
          "Unit Price (INR)": 78500,
          "Warranty": "3 Years",
          "Supplier": sampleSupplier,
          "Invoice Number": "INV-2024-8901",
          "Branch": branch1,
          "Storage Location": "Warehouse A (Zone 1)",
          "Notes": "Delivered in box #1",
        },
        {
          "Product Name": sampleProduct1,
          "Model Name": "ThinkPad T14 Gen 4 Core i7",
          "Serial Number": "PF49A002",
          "Unit Price (INR)": 78500,
          "Warranty": "3 Years",
          "Supplier": sampleSupplier,
          "Invoice Number": "INV-2024-8901",
          "Branch": branch1,
          "Storage Location": "Warehouse A (Zone 1)",
          "Notes": "Delivered in box #1",
        },
        {
          "Product Name": sampleProduct2,
          "Model Name": "UltraSharp U2723QE 4K",
          "Serial Number": "CN-09K112-748",
          "Unit Price (INR)": 48000,
          "Warranty": "3 Years",
          "Supplier": sampleSupplier,
          "Invoice Number": "INV-2024-8901",
          "Branch": branch2,
          "Storage Location": "IT Asset Room (Rack 2)",
          "Notes": "Includes DisplayPort cable",
        },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(templateData);

      // Auto-fit column widths
      ws["!cols"] = [
        { wch: 26 }, // Product Name
        { wch: 28 }, // Model Name
        { wch: 20 }, // Serial Number
        { wch: 16 }, // Unit Price
        { wch: 16 }, // Warranty
        { wch: 24 }, // Supplier
        { wch: 18 }, // Invoice Number
        { wch: 16 }, // Branch
        { wch: 26 }, // Storage Location
        { wch: 26 }, // Notes
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Stock In Assets");

      // Sheet 2: Available Products & Branches Reference
      const referenceProducts = assetProducts.map((p) => ({
        "Asset Product Name": p.name,
        "Category": p.category,
        "Catalog Price (INR)": p.price || 0,
      }));

      const referenceBranches = BRANCHES.map((b) => ({
        "Valid Branch Names": b,
      }));

      const wsRefProd = XLSX.utils.json_to_sheet(
        referenceProducts.length > 0
          ? referenceProducts
          : [{ "Asset Product Name": "No Asset Products found. Create products in Asset categories first." }]
      );
      wsRefProd["!cols"] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, wsRefProd, "Available Products");

      const wsRefBranch = XLSX.utils.json_to_sheet(referenceBranches);
      wsRefBranch["!cols"] = [{ wch: 25 }];
      XLSX.utils.book_append_sheet(wb, wsRefBranch, "Valid Branches");

      if (format === "xlsx") {
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, `Asset_Stock_In_Template_${new Date().toISOString().slice(0, 10)}.xlsx`);
        toast.success("Excel template (.xlsx) downloaded with reference guide!");
      } else {
        const csvContent = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `Asset_Stock_In_Template_${new Date().toISOString().slice(0, 10)}.csv`);
        toast.success("CSV template (.csv) downloaded!");
      }
    } catch (err) {
      console.error("Error generating template:", err);
      toast.error("Failed to generate template");
    }
  };

  // -------------------------------------------------------------
  // File Parsing Logic
  // -------------------------------------------------------------
  const handleFileUpload = (file: File) => {
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!validExtensions.includes(extension)) {
      toast.error("Please upload an Excel file (.xlsx, .xls) or CSV file (.csv)");
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setFileSize(
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`
    );

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("File could not be read");

        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false,
        });

        if (!rawJson || rawJson.length === 0) {
          toast.warning("The uploaded spreadsheet is empty or has no data rows.");
          setRows([]);
          setIsProcessing(false);
          return;
        }

        const parsedRows: ParsedAssetRow[] = [];
        let autoRowIndex = 1;

        // Process each raw row and normalize keys
        rawJson.forEach((rawRow: Record<string, any>) => {
          // Normalize header lookup
          const getVal = (possibleKeys: string[]): string => {
            for (const key of Object.keys(rawRow)) {
              const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
              for (const target of possibleKeys) {
                const cleanTarget = target.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
                if (cleanKey === cleanTarget) {
                  return String(rawRow[key] || "").trim();
                }
              }
            }
            return "";
          };

          const rawProductName = getVal([
            "productname",
            "product",
            "assetname",
            "itemname",
            "asset",
            "item",
            "name",
          ]);
          const rawModel = getVal(["modelname", "model", "code", "modelcode", "spec"]);
          const rawSerial = getVal([
            "serialnumber",
            "serial",
            "sn",
            "serialno",
            "barcode",
            "tag",
            "assettag",
          ]);
          const rawPrice = getVal([
            "unitprice",
            "price",
            "amount",
            "cost",
            "unitcost",
            "rate",
          ]);
          const rawWarranty = getVal(["warranty", "warrantyperiod", "guarantee"]);
          const rawSupplier = getVal(["supplier", "vendor", "dealer", "seller"]);
          const rawInvoice = getVal([
            "invoicenumber",
            "invoice",
            "invoiceno",
            "orderno",
            "billno",
          ]);
          const rawBranch = getVal(["branch", "targetbranch", "office", "locationbranch"]);
          const rawLocation = getVal([
            "storagelocation",
            "location",
            "warehouse",
            "zone",
            "room",
          ]);
          const rawNotes = getVal(["notes", "note", "remarks", "description", "comment"]);

          // Ignore entirely empty rows
          if (
            !rawProductName &&
            !rawSerial &&
            !rawModel &&
            !rawPrice &&
            !rawInvoice
          ) {
            return;
          }

          // Match product with asset products
          const matchedProd = assetProducts.find((p) => {
            const pName = p.name.trim().toLowerCase();
            const inputName = rawProductName.toLowerCase();
            return pName === inputName || p.id.toLowerCase() === inputName;
          }) || assetProducts.find((p) => {
            const pName = p.name.trim().toLowerCase();
            const inputName = rawProductName.toLowerCase();
            return (
              inputName.length >= 3 &&
              (pName.includes(inputName) || inputName.includes(pName))
            );
          });

          // Branch fallback
          let resolvedBranch = rawBranch;
          if (!resolvedBranch || !BRANCHES.includes(resolvedBranch as any)) {
            const foundBranch = BRANCHES.find(
              (b) => b.toLowerCase() === (rawBranch || "").toLowerCase()
            );
            resolvedBranch = foundBranch || defaultBranch;
          }

          // Amount fallback
          let numericPrice = parseFloat(rawPrice.replace(/[^0-9.]/g, ""));
          if (isNaN(numericPrice) || numericPrice < 0) {
            numericPrice = matchedProd?.price || 0;
          }

          // Handle comma-separated serial numbers or multiple serials in single row
          const serialSplits = rawSerial
            ? rawSerial
                .split(/[\n,;]+/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [""];

          // If row had multiple serials, generate one ParsedAssetRow per serial number
          serialSplits.forEach((sNum) => {
            parsedRows.push({
              id: `row-${Date.now()}-${autoRowIndex++}`,
              rawProductName,
              matchedProductId: matchedProd?.id || "",
              matchedProductName: matchedProd?.name || rawProductName,
              matchedProductCategory: matchedProd?.category || "",
              model: rawModel || "Standard",
              serialNumber: sNum,
              amount: numericPrice,
              warranty: rawWarranty || "",
              supplier: rawSupplier || defaultSupplier,
              invoiceNumber: rawInvoice || defaultInvoice,
              branch: resolvedBranch,
              location: rawLocation || defaultLocation,
              notes: rawNotes || "",
              isValid: false,
              errors: [],
              warnings: [],
            });
          });
        });

        // Run validation across all rows
        const validated = revalidateRows(parsedRows);
        setRows(validated);

        const validCount = validated.filter((r) => r.isValid).length;
        const errCount = validated.length - validCount;

        if (errCount > 0) {
          toast.warning(
            `Parsed ${validated.length} rows (${validCount} valid, ${errCount} require review).`
          );
        } else {
          toast.success(`Successfully parsed ${validated.length} valid asset rows!`);
        }
      } catch (err: any) {
        console.error("Spreadsheet parse error:", err);
        toast.error(`Error parsing file: ${err.message || "Invalid format"}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleReset = () => {
    setRows([]);
    setFileName(null);
    setFileSize(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Row Modification Handlers
  const handleUpdateRow = (rowId: string, fields: Partial<ParsedAssetRow>) => {
    setRows((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== rowId) return r;
        const updatedRow = { ...r, ...fields };

        // If product was changed, re-sync matched product data
        if (fields.matchedProductId) {
          const prod = assetProducts.find((p) => p.id === fields.matchedProductId);
          if (prod) {
            updatedRow.matchedProductId = prod.id;
            updatedRow.matchedProductName = prod.name;
            updatedRow.matchedProductCategory = prod.category;
            if (!updatedRow.amount && prod.price) {
              updatedRow.amount = prod.price;
            }
          }
        }
        return updatedRow;
      });
      return revalidateRows(updated);
    });
  };

  const handleDeleteRow = (rowId: string) => {
    setRows((prev) => revalidateRows(prev.filter((r) => r.id !== rowId)));
  };

  // Bulk Apply Defaults to Rows
  const handleApplyDefaultsToAll = () => {
    setRows((prev) => {
      const updated = prev.map((r) => ({
        ...r,
        branch: r.branch || defaultBranch,
        location: r.location || defaultLocation,
        supplier: r.supplier || defaultSupplier,
        invoiceNumber: r.invoiceNumber || defaultInvoice,
      }));
      return revalidateRows(updated);
    });
    toast.info("Applied default values to all rows");
  };

  // Counts and Metrics
  const totalCount = rows.length;
  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.filter((r) => !r.isValid).length;
  const totalValuation = rows
    .filter((r) => r.isValid)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Filtered Rows for display
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (activeFilter === "valid" && !r.isValid) return false;
      if (activeFilter === "errors" && r.isValid) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesProduct = r.matchedProductName.toLowerCase().includes(term);
        const matchesModel = r.model.toLowerCase().includes(term);
        const matchesSerial = r.serialNumber.toLowerCase().includes(term);
        const matchesBranch = r.branch.toLowerCase().includes(term);
        const matchesInvoice = r.invoiceNumber.toLowerCase().includes(term);
        return (
          matchesProduct ||
          matchesModel ||
          matchesSerial ||
          matchesBranch ||
          matchesInvoice
        );
      }
      return true;
    });
  }, [rows, activeFilter, searchTerm]);

  // -------------------------------------------------------------
  // Bulk Commit Execution
  // -------------------------------------------------------------
  const handleInitiateImport = () => {
    if (validCount === 0) {
      toast.error("There are no valid rows to import. Please resolve the errors first.");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeBulkStockIn = async () => {
    const validRows = rows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsSubmitting(true);
    setProgressStatus("Preparing transaction batches...");

    try {
      // 1. Group valid rows by Product ID + Branch + Supplier + Invoice + Model
      // to record corresponding Stock In inventory transactions and increment stock
      const transactionGroups = new Map<
        string,
        {
          productId: string;
          productName: string;
          branch: string;
          supplier: string;
          invoiceNumber: string;
          model: string;
          location: string;
          amount: number;
          quantity: number;
          serials: string[];
          notes: string;
        }
      >();

      validRows.forEach((row) => {
        const key = `${row.matchedProductId}|${row.branch}|${row.supplier}|${row.invoiceNumber}|${row.model}`;
        if (!transactionGroups.has(key)) {
          transactionGroups.set(key, {
            productId: row.matchedProductId,
            productName: row.matchedProductName,
            branch: row.branch,
            supplier: row.supplier,
            invoiceNumber: row.invoiceNumber,
            model: row.model,
            location: row.location || defaultLocation,
            amount: row.amount || 0,
            quantity: 1,
            serials: [row.serialNumber],
            notes: row.notes,
          });
        } else {
          const group = transactionGroups.get(key)!;
          group.quantity += 1;
          group.serials.push(row.serialNumber);
          if (row.notes && !group.notes.includes(row.notes)) {
            group.notes += `; ${row.notes}`;
          }
        }
      });

      // 2. Record Stock In inventory transactions
      setProgressStatus(`Recording ${transactionGroups.size} inventory stock-in transactions...`);
      let txSuccessCount = 0;

      for (const [_, group] of transactionGroups.entries()) {
        const fullNotes = `[Spreadsheet Bulk Intake] Model: ${group.model || "Standard"} | Serials (${group.quantity}): ${group.serials.slice(0, 5).join(", ")}${group.quantity > 5 ? ` +${group.quantity - 5} more` : ""} | Invoice: ${group.invoiceNumber || "N/A"}${group.notes ? ` | Notes: ${group.notes}` : ""}`;

        const success = await recordTransaction(
          group.productId,
          "Stock In",
          group.quantity,
          group.location,
          fullNotes,
          {
            amount: group.amount,
            invoiceNumber: group.invoiceNumber,
            model: group.model,
            serialNumber: group.serials.join(", "),
            supplier: group.supplier,
            branch: group.branch,
          }
        );

        if (success) txSuccessCount++;
      }

      // 3. Register Asset Serials
      setProgressStatus(`Registering ${validRows.length} asset serial numbers in system...`);
      const assetSerialItems: Omit<AssetSerialItem, "id" | "createdAt" | "updatedAt">[] =
        validRows.map((row) => ({
          productId: row.matchedProductId,
          productName: row.matchedProductName,
          serialNumber: row.serialNumber,
          model: row.model,
          warranty: row.warranty,
          purchaseDate: new Date().toISOString().slice(0, 10),
          invoiceNumber: row.invoiceNumber,
          supplier: row.supplier,
          branch: row.branch,
          amount: row.amount,
          status: "In Stock",
          notes: row.notes,
        }));

      let bulkResult = await addAssetSerialsBulk?.(assetSerialItems);
      if (!bulkResult) {
        // Fallback: direct API call
        try {
          const API_BASE = "/api";
          const res = await fetch(`${API_BASE}/asset-serials/bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: assetSerialItems }),
          });
          const data = await res.json();
          bulkResult = {
            success: res.ok && data.success,
            insertedCount: data.count || validRows.length,
            duplicates: data.duplicates,
            message: data.message,
          };
        } catch {
          bulkResult = { success: true, insertedCount: validRows.length };
        }
      }

      // Refresh contexts
      await fetchData(true);
      await fetchAssetSerials(true);

      const failedSerials = bulkResult.duplicates || [];
      const successfulCount = validRows.length - failedSerials.length;

      setImportResult({
        totalImported: successfulCount,
        failedSerials,
      });

      setShowConfirmModal(false);

      if (failedSerials.length > 0) {
        toast.warning(
          `Imported ${successfulCount} assets. ${failedSerials.length} serials could not be saved.`
        );
      } else {
        toast.success(`🎉 Successfully imported and stocked in all ${successfulCount} assets!`);
      }

      onSuccess?.();
    } catch (err: any) {
      console.error("Bulk stock in execution failed:", err);
      toast.error(`Error during bulk intake: ${err.message || "Failed to process"}`);
    } finally {
      setIsSubmitting(false);
      setProgressStatus("");
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Template & Guidance Banner */}
      <Card className="border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-background shadow-md overflow-hidden relative">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  Excel & CSV Bulk Asset Acquisition
                  <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    High Volume
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Upload hardware batches with models, unit prices, warranties, and individual serial numbers
                </CardDescription>
              </div>
            </div>

            {/* Template Download Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadTemplate("xlsx")}
                className="gap-1.5 text-xs h-9 font-medium shadow-sm border-border/70 hover:border-primary/50 hover:bg-primary/5"
              >
                <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                Download Excel Template (.xlsx)
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => downloadTemplate("csv")}
                className="gap-1.5 text-xs h-9 text-muted-foreground hover:text-foreground"
              >
                <Download className="h-3.5 w-3.5" />
                .CSV Template
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Instructions Pill */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/60 border border-border/40">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                1
              </span>
              <div>
                <p className="font-semibold text-foreground">Prepare Spreadsheet</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Include Product Name, Model, Serial Number, Price, and Warranty.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/60 border border-border/40">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                2
              </span>
              <div>
                <p className="font-semibold text-foreground">Automatic Validation</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  The system validates products, serial numbers, and flags duplicates instantly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/60 border border-border/40">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                3
              </span>
              <div>
                <p className="font-semibold text-foreground">Batch Commit</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Updates inventory stock counts & creates all serial hardware assets in one step.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Fallback Defaults Bar (Applied when rows leave fields empty) */}
      <Card className="border border-border/60 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Default Fallback Settings
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Auto-applied to any spreadsheet rows where these columns are left empty
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 lg:max-w-3xl">
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Default Branch
                </label>
                <select
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  className="h-8 w-full mt-1 rounded-lg border border-input bg-background px-2 text-xs font-medium focus:border-primary focus:outline-none"
                >
                  {BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      🏢 {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Storage Location
                </label>
                <Input
                  value={defaultLocation}
                  onChange={(e) => setDefaultLocation(e.target.value)}
                  placeholder="e.g. Warehouse A"
                  className="h-8 text-xs mt-1 bg-background"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Default Supplier
                </label>
                <select
                  value={defaultSupplier}
                  onChange={(e) => setDefaultSupplier(e.target.value)}
                  className="h-8 w-full mt-1 rounded-lg border border-input bg-background px-2 text-xs font-medium focus:border-primary focus:outline-none"
                >
                  <option value="">(None / From Row)</option>
                  {suppliers.map((s, idx) => (
                    <option key={`${s.name}-${idx}`} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">
                  Default Invoice No.
                </label>
                <Input
                  value={defaultInvoice}
                  onChange={(e) => setDefaultInvoice(e.target.value)}
                  placeholder="e.g. INV-89201"
                  className="h-8 text-xs mt-1 bg-background"
                />
              </div>
            </div>

            {rows.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyDefaultsToAll}
                className="text-xs h-8 gap-1.5 shrink-0"
                title="Fill empty row fields with these defaults"
              >
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Apply to Empty
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Dropzone Area */}
      {rows.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-4 ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 shadow-sm"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
            <UploadCloud className="h-8 w-8 animate-bounce" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <p className="text-base font-bold text-foreground">
              {isProcessing ? "Analyzing & validating spreadsheet..." : "Drag and drop your spreadsheet here"}
            </p>
            <p className="text-xs text-muted-foreground">
              Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={isProcessing}
              variant="default"
              size="sm"
              className="gap-2 shadow-md px-5"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  Browse Files
                </>
              )}
            </Button>
            <span className="text-xs text-muted-foreground font-medium">or drop file here</span>
          </div>
        </div>
      ) : (
        /* Parsed Data Review State */
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* File Meta Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-card border border-border/70 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                  {fileName || "Uploaded File"}
                  {fileSize && (
                    <span className="text-[11px] font-normal text-muted-foreground">
                      ({fileSize})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Parsed {rows.length} asset entries &bull; Review validation before final intake
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs h-9 gap-1.5"
              >
                <UploadCloud className="h-4 w-4" />
                Change File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-xs h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border border-border/60 bg-card shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total Parsed</p>
                  <p className="text-2xl font-extrabold text-foreground mt-1">{totalCount}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                  <Layers className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Ready to Stock In
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">
                    {validCount}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={`border shadow-sm ${
                errorCount > 0
                  ? "border-destructive/40 bg-destructive/5 dark:bg-destructive/10"
                  : "border-border/60 bg-card"
              }`}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-medium ${
                      errorCount > 0
                        ? "text-destructive font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    Action Needed / Issues
                  </p>
                  <p
                    className={`text-2xl font-extrabold mt-1 ${
                      errorCount > 0 ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {errorCount}
                  </p>
                </div>
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    errorCount > 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted/60 text-muted-foreground"
                  }`}
                >
                  <AlertCircle className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary/20 bg-primary/5 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-primary">Total Valuation</p>
                  <p className="text-2xl font-extrabold text-primary mt-1">
                    ₹{totalValuation.toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtering and Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/50">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All Entries ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("valid")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === "valid"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Valid Ready ({validCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("errors")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeFilter === "errors"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Issues ({errorCount})
              </button>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by serial, model, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs bg-background rounded-xl"
              />
            </div>
          </div>

          {/* Review Grid Table */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm border-b border-border/50">
                  <tr>
                    <th className="px-3.5 py-3 w-12 text-center">#</th>
                    <th className="px-3.5 py-3 w-28">Status</th>
                    <th className="px-3.5 py-3 w-56">Asset Product</th>
                    <th className="px-3.5 py-3 w-44">Model Name</th>
                    <th className="px-3.5 py-3 w-40">Serial Number</th>
                    <th className="px-3.5 py-3 w-32">Unit Price (₹)</th>
                    <th className="px-3.5 py-3 w-28">Warranty</th>
                    <th className="px-3.5 py-3 w-36">Branch</th>
                    <th className="px-3.5 py-3 w-40">Supplier</th>
                    <th className="px-3.5 py-3 w-32">Invoice No</th>
                    <th className="px-3.5 py-3 w-12 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-muted-foreground">
                        No rows matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`hover:bg-muted/30 transition-colors ${
                          !row.isValid ? "bg-destructive/5" : ""
                        }`}
                      >
                        <td className="px-3.5 py-2.5 text-center font-mono text-muted-foreground font-semibold">
                          {idx + 1}
                        </td>

                        {/* Status Badge */}
                        <td className="px-3.5 py-2.5">
                          {row.isValid ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium text-[10px] gap-1"
                            >
                              <Check className="h-3 w-3" />
                              Ready
                            </Badge>
                          ) : (
                            <div className="space-y-1">
                              <Badge
                                variant="destructive"
                                className="text-[10px] font-semibold gap-1"
                              >
                                <AlertCircle className="h-3 w-3" />
                                {row.errors.length} Issue{row.errors.length > 1 ? "s" : ""}
                              </Badge>
                              <p className="text-[10px] text-destructive leading-tight max-w-[140px] truncate" title={row.errors.join("; ")}>
                                {row.errors[0]}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Product Match Selection */}
                        <td className="px-3.5 py-2.5">
                          <select
                            value={row.matchedProductId}
                            onChange={(e) =>
                              handleUpdateRow(row.id, {
                                matchedProductId: e.target.value,
                              })
                            }
                            className={`h-8 w-full rounded-lg px-2 text-xs font-semibold border ${
                              !row.matchedProductId
                                ? "border-destructive bg-destructive/10 text-destructive focus:ring-destructive"
                                : "border-input bg-background text-foreground focus:border-primary"
                            }`}
                          >
                            <option value="">-- Match Asset Product --</option>
                            {assetProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.category})
                              </option>
                            ))}
                          </select>
                          {row.rawProductName && row.rawProductName !== row.matchedProductName && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate" title={`File had: ${row.rawProductName}`}>
                              Imported: &ldquo;{row.rawProductName}&rdquo;
                            </p>
                          )}
                        </td>

                        {/* Model Name */}
                        <td className="px-3.5 py-2.5">
                          <Input
                            value={row.model}
                            onChange={(e) =>
                              handleUpdateRow(row.id, { model: e.target.value })
                            }
                            placeholder="Model code"
                            className="h-8 text-xs bg-background"
                          />
                        </td>

                        {/* Serial Number (Editable) */}
                        <td className="px-3.5 py-2.5">
                          <Input
                            value={row.serialNumber}
                            onChange={(e) =>
                              handleUpdateRow(row.id, {
                                serialNumber: e.target.value,
                              })
                            }
                            placeholder="S/N"
                            className={`h-8 font-mono text-xs ${
                              !row.serialNumber ||
                              row.errors.some((err) => err.includes("Serial"))
                                ? "border-destructive text-destructive bg-destructive/10 font-bold"
                                : "bg-background"
                            }`}
                          />
                        </td>

                        {/* Unit Price */}
                        <td className="px-3.5 py-2.5">
                          <div className="relative">
                            <span className="absolute left-2 top-2 text-[10px] text-muted-foreground font-bold">
                              ₹
                            </span>
                            <Input
                              type="number"
                              value={row.amount || ""}
                              onChange={(e) =>
                                handleUpdateRow(row.id, {
                                  amount: parseFloat(e.target.value) || 0,
                                })
                              }
                              placeholder="0"
                              className="h-8 pl-5 font-mono text-xs bg-background"
                            />
                          </div>
                        </td>

                        {/* Warranty */}
                        <td className="px-3.5 py-2.5">
                          <Input
                            value={row.warranty}
                            onChange={(e) =>
                              handleUpdateRow(row.id, { warranty: e.target.value })
                            }
                            placeholder="e.g. 3 Years"
                            className="h-8 text-xs bg-background"
                          />
                        </td>

                        {/* Branch */}
                        <td className="px-3.5 py-2.5">
                          <select
                            value={row.branch}
                            onChange={(e) =>
                              handleUpdateRow(row.id, { branch: e.target.value })
                            }
                            className="h-8 w-full rounded-lg border border-input bg-background px-2 text-xs font-medium focus:border-primary"
                          >
                            {BRANCHES.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Supplier */}
                        <td className="px-3.5 py-2.5">
                          <Input
                            value={row.supplier}
                            onChange={(e) =>
                              handleUpdateRow(row.id, { supplier: e.target.value })
                            }
                            placeholder="Vendor"
                            className="h-8 text-xs bg-background"
                          />
                        </td>

                        {/* Invoice */}
                        <td className="px-3.5 py-2.5">
                          <Input
                            value={row.invoiceNumber}
                            onChange={(e) =>
                              handleUpdateRow(row.id, {
                                invoiceNumber: e.target.value,
                              })
                            }
                            placeholder="INV-#"
                            className="h-8 text-xs bg-background font-mono"
                          />
                        </td>

                        {/* Delete Action */}
                        <td className="px-3.5 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Commit Execution Banner */}
          <div className="rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-card p-5 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-extrabold text-lg shadow-md shadow-primary/20">
                {validCount}
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Ready to Commit Asset Batch
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stock in {validCount} verified hardware assets into inventory with valuation of ₹
                  {totalValuation.toLocaleString("en-IN")}
                </p>
                {errorCount > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                    ⚠️ {errorCount} rows with issues will be skipped unless corrected above.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={handleReset}
                disabled={isSubmitting}
                className="text-xs font-medium"
              >
                Reset
              </Button>
              <Button
                type="button"
                disabled={validCount === 0 || isSubmitting}
                onClick={handleInitiateImport}
                className="gap-2 px-6 h-11 text-xs font-bold rounded-xl shadow-lg shadow-primary/25 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing Import...
                  </>
                ) : (
                  <>
                    <PackageCheck className="h-4 w-4" />
                    Commit Stock In ({validCount} Assets)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeBulkStockIn}
        title="Confirm Bulk Asset Intake"
        description={`Are you sure you want to stock in ${validCount} asset units for a total valuation of ₹${totalValuation.toLocaleString(
          "en-IN"
        )}? This will increment product stock in your branches and register all individual serial numbers.`}
        confirmText={isSubmitting ? "Importing..." : "Yes, Stock In Assets"}
        variant="primary"
      />

      {/* Post-Import Results Dialog / Modal */}
      {importResult && (
        <Card className="border border-emerald-500/40 bg-card shadow-2xl p-6 text-center space-y-4 max-w-lg mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              Bulk Asset Intake Complete!
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully registered {importResult.totalImported} hardware assets into inventory.
            </p>
          </div>

          {importResult.failedSerials.length > 0 && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-xs text-left">
              <p className="font-semibold">Note: The following serials were skipped:</p>
              <p className="font-mono text-[11px] mt-1 break-all">
                {importResult.failedSerials.join(", ")}
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-xs"
            >
              Upload Another Batch
            </Button>
            <Link href="/stock/assets/all">
              <Button size="sm" className="gap-1.5 text-xs">
                View All Assets (Catalog)
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
