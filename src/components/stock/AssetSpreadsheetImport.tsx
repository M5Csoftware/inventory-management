"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
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
  Plus,
  ShieldAlert,
  XCircle,
  ExternalLink,
  Wrench,
  X,
  PackagePlus,
  Info,
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
  Category,
} from "@/context/inventory-context";

export type ValidationErrorType =
  | "UNCREATED_PRODUCT"
  | "MISSING_PRODUCT"
  | "CATEGORY_NON_ASSET"
  | "DUPLICATE_SERIAL_FILE"
  | "DUPLICATE_SERIAL_DB"
  | "MISSING_SERIAL"
  | "INVALID_BRANCH"
  | "INVALID_PRICE";

export interface RowIssue {
  type: ValidationErrorType;
  severity: "error" | "warning";
  field: "product" | "serialNumber" | "branch" | "amount" | "supplier" | "model";
  message: string;
  suggestedFix?: string;
  meta?: any;
}

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
  issues: RowIssue[];
  isUncreatedProduct: boolean;
  hasDuplicateSerial: boolean;
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
    addProduct,
    addCategory,
    updateCategory,
  } = useInventory();

  // Filter asset products (products belonging to asset category or recognized hardware/equipment/assets)
  const assetProducts = useMemo(() => {
    const matched = products.filter((prod) => {
      const category = categories.find(
        (c) => c.name.toLowerCase() === (prod.category || "").toLowerCase()
      );
      if (category?.isAsset) return true;
      const catLower = (prod.category || "").toLowerCase();
      const nameLower = (prod.name || "").toLowerCase();
      const keywords = [
        "asset",
        "hardware",
        "equipment",
        "machine",
        "device",
        "laptop",
        "desktop",
        "monitor",
        "printer",
        "scanner",
        "server",
        "x-ray",
        "x ray",
        "medical",
        "camera",
      ];
      return keywords.some((k) => catLower.includes(k) || nameLower.includes(k));
    });
    // Fallback to all products so no valid product is blocked from import matching
    return matched.length > 0 ? matched : products;
  }, [products, categories]);

  // Map of existing serial numbers in database with metadata for rich feedback
  const existingDbSerialsMap = useMemo(() => {
    const map = new Map<string, AssetSerialItem>();
    assetSerials.forEach((item) => {
      if (item.serialNumber) {
        map.set(item.serialNumber.trim().toLowerCase(), item);
      }
    });
    return map;
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
  const [activeFilter, setActiveFilter] = useState<
    "all" | "valid" | "errors" | "uncreated" | "duplicates" | "branches"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Execution modal and progress state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showValidationBlockerModal, setShowValidationBlockerModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [importResult, setImportResult] = useState<{
    totalImported: number;
    failedSerials: string[];
  } | null>(null);

  // Quick Product Creation Modal State
  const [quickProductModal, setQuickProductModal] = useState<{
    isOpen: boolean;
    productName: string;
    category: string;
    isAssetCategory: boolean;
    price: number;
    threshold: number;
    model: string;
    supplier: string;
    description: string;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    productName: "",
    category: "Assets",
    isAssetCategory: true,
    price: 0,
    threshold: 5,
    model: "",
    supplier: "",
    description: "",
    isSubmitting: false,
  });

  // Validation helper: examines each row and classifies issues with high precision
  const validateRow = (
    row: Omit<ParsedAssetRow, "isValid" | "errors" | "warnings" | "issues" | "isUncreatedProduct" | "hasDuplicateSerial">,
    allSerialsInUpload: string[]
  ): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    issues: RowIssue[];
    isUncreatedProduct: boolean;
    hasDuplicateSerial: boolean;
  } => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const issues: RowIssue[] = [];
    let isUncreatedProduct = false;
    let hasDuplicateSerial = false;

    // 1. PRODUCT VALIDATION
    const cleanRawName = (row.rawProductName || "").trim();

    if (!cleanRawName && !row.matchedProductId) {
      const msg = "Product name is missing in row";
      errors.push(msg);
      issues.push({
        type: "MISSING_PRODUCT",
        severity: "error",
        field: "product",
        message: msg,
        suggestedFix: "Enter a valid product name or select from catalog",
      });
    } else if (!row.matchedProductId) {
      // Check if product exists in general catalog but wasn't auto-matched
      const existingProduct = products.find(
        (p) => p.name.trim().toLowerCase() === cleanRawName.toLowerCase()
      );

      if (existingProduct) {
        // Matched now
        row.matchedProductId = existingProduct.id;
        row.matchedProductName = existingProduct.name;
        row.matchedProductCategory = existingProduct.category;
      } else {
        isUncreatedProduct = true;
        const msg = `Product "${cleanRawName}" does not exist in inventory catalog. Please create this product or select an existing one.`;
        errors.push(msg);
        issues.push({
          type: "UNCREATED_PRODUCT",
          severity: "error",
          field: "product",
          message: msg,
          suggestedFix: `Create "${cleanRawName}" as a new asset product`,
          meta: { rawProductName: cleanRawName },
        });
      }
    }

    if (row.matchedProductId) {
      const prod = products.find((p) => p.id === row.matchedProductId);
      if (!prod) {
        const msg = `Selected product ID "${row.matchedProductId}" does not exist in system`;
        errors.push(msg);
        issues.push({
          type: "UNCREATED_PRODUCT",
          severity: "error",
          field: "product",
          message: msg,
          suggestedFix: "Select a valid product from catalog",
        });
      } else {
        // Check if category has isAsset flag
        const cat = categories.find(
          (c) => c.name.toLowerCase() === (prod.category || "").toLowerCase()
        );
        if (cat && !cat.isAsset) {
          const warnMsg = `Category "${prod.category}" is not configured as Asset (serial tracking will still be applied)`;
          warnings.push(warnMsg);
          issues.push({
            type: "CATEGORY_NON_ASSET",
            severity: "warning",
            field: "product",
            message: warnMsg,
            suggestedFix: "Category will be auto-linked to asset tracking",
          });
        }
      }
    }

    // 2. SERIAL NUMBER VALIDATION
    const cleanSerial = (row.serialNumber || "").trim();
    if (!cleanSerial) {
      const msg = "Serial number is required for asset intake";
      errors.push(msg);
      issues.push({
        type: "MISSING_SERIAL",
        severity: "error",
        field: "serialNumber",
        message: msg,
        suggestedFix: "Provide a unique hardware serial number",
      });
    } else {
      const lowerSerial = cleanSerial.toLowerCase();

      // Check duplicates within the uploaded spreadsheet
      const countInUpload = allSerialsInUpload.filter(
        (s) => s.toLowerCase() === lowerSerial
      ).length;

      if (countInUpload > 1) {
        hasDuplicateSerial = true;
        const msg = `Duplicate serial number "${cleanSerial}" appears ${countInUpload} times in this upload`;
        errors.push(msg);
        issues.push({
          type: "DUPLICATE_SERIAL_FILE",
          severity: "error",
          field: "serialNumber",
          message: msg,
          suggestedFix: "Ensure each hardware unit has a distinct serial number",
        });
      }

      // Check duplicate in database
      const existingDbAsset = existingDbSerialsMap.get(lowerSerial);
      if (existingDbAsset) {
        hasDuplicateSerial = true;
        const msg = `Serial number "${cleanSerial}" is already registered in system (Product: ${existingDbAsset.productName || "Asset"} in ${existingDbAsset.branch} • Status: ${existingDbAsset.status || "Active"})`;
        errors.push(msg);
        issues.push({
          type: "DUPLICATE_SERIAL_DB",
          severity: "error",
          field: "serialNumber",
          message: msg,
          suggestedFix: "Check if this hardware was already stocked in or verify S/N",
          meta: existingDbAsset,
        });
      }
    }

    // 3. BRANCH VALIDATION
    const cleanBranch = (row.branch || "").trim();
    if (!cleanBranch) {
      const msg = "Branch is required";
      errors.push(msg);
      issues.push({
        type: "INVALID_BRANCH",
        severity: "error",
        field: "branch",
        message: msg,
        suggestedFix: `Assign a branch (${BRANCHES.join(", ")})`,
      });
    } else if (!BRANCHES.includes(cleanBranch as any)) {
      const msg = `Branch "${cleanBranch}" is not a recognized branch. Valid branches: ${BRANCHES.join(", ")}`;
      errors.push(msg);
      issues.push({
        type: "INVALID_BRANCH",
        severity: "error",
        field: "branch",
        message: msg,
        suggestedFix: `Select from valid branches: ${BRANCHES.join(", ")}`,
      });
    }

    // 4. UNIT PRICE / FINANCIALS VALIDATION
    if (isNaN(row.amount) || row.amount < 0) {
      const msg = "Unit price must be a valid non-negative number";
      errors.push(msg);
      issues.push({
        type: "INVALID_PRICE",
        severity: "error",
        field: "amount",
        message: msg,
        suggestedFix: "Enter a valid positive number for unit price",
      });
    } else if (row.amount === 0) {
      warnings.push("Unit price is ₹0 (Confirm if this is intended)");
    }

    // 5. MODEL CHECK
    if (!row.model || !row.model.trim()) {
      warnings.push('Model name is empty (defaulting to "Standard")');
    }

    // 6. SUPPLIER CHECK
    if (row.supplier && row.supplier.trim()) {
      const supplierExists = suppliers.some(
        (s) => s.name.toLowerCase() === row.supplier.trim().toLowerCase()
      );
      if (!supplierExists) {
        warnings.push(`Supplier "${row.supplier}" is not registered in system (recorded as text)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      issues,
      isUncreatedProduct,
      hasDuplicateSerial,
    };
  };

  // Re-run validation across all rows whenever rows, defaultBranch, or existingDbSerialsMap change
  const revalidateRows = (newRows: ParsedAssetRow[]): ParsedAssetRow[] => {
    const allSerials = newRows.map((r) => r.serialNumber.trim()).filter(Boolean);
    return newRows.map((r) => {
      const validation = validateRow(r, allSerials);
      return {
        ...r,
        ...validation,
      };
    });
  };

  // Re-validate when products catalog or assetSerials change
  useEffect(() => {
    if (rows.length > 0) {
      setRows((prev) => revalidateRows(prev));
    }
  }, [products, assetSerials]);

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

      ws["!cols"] = [
        { wch: 26 },
        { wch: 28 },
        { wch: 20 },
        { wch: 16 },
        { wch: 16 },
        { wch: 24 },
        { wch: 18 },
        { wch: 16 },
        { wch: 26 },
        { wch: 26 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, "Stock In Assets");

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
  // Export Errored Rows for Excel Repair
  // -------------------------------------------------------------
  const exportErrorsToExcel = () => {
    const errorRows = rows.filter((r) => !r.isValid);
    if (errorRows.length === 0) {
      toast.info("No error rows to export!");
      return;
    }

    const data = errorRows.map((r, i) => ({
      "#": i + 1,
      "Validation Errors (Reasons)": r.errors.join(" | "),
      "Product Name (in File)": r.rawProductName || "(Empty)",
      "Matched Status": r.matchedProductId
        ? `Matched: ${r.matchedProductName}`
        : "NOT CREATED IN SYSTEM",
      "Model Name": r.model,
      "Serial Number": r.serialNumber,
      "Unit Price (INR)": r.amount,
      "Warranty": r.warranty,
      "Branch": r.branch,
      "Supplier": r.supplier,
      "Invoice Number": r.invoiceNumber,
      "Storage Location": r.location,
      "Notes": r.notes,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 20 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Import Errors");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `Asset_Bulk_Upload_Errors_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`Exported ${errorRows.length} error rows with failure reasons!`);
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

        rawJson.forEach((rawRow: Record<string, any>) => {
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

          if (
            !rawProductName &&
            !rawSerial &&
            !rawModel &&
            !rawPrice &&
            !rawInvoice
          ) {
            return;
          }

          // Matching logic against all products
          const matchedProd =
            assetProducts.find((p) => {
              const pName = p.name.trim().toLowerCase();
              const inputName = rawProductName.toLowerCase();
              return pName === inputName || p.id.toLowerCase() === inputName;
            }) ||
            products.find((p) => {
              const pName = p.name.trim().toLowerCase();
              const inputName = rawProductName.toLowerCase();
              return pName === inputName || p.id.toLowerCase() === inputName;
            }) ||
            assetProducts.find((p) => {
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

          const serialSplits = rawSerial
            ? rawSerial
                .split(/[\n,;]+/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [""];

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
              issues: [],
              isUncreatedProduct: false,
              hasDuplicateSerial: false,
            });
          });
        });

        const validated = revalidateRows(parsedRows);
        setRows(validated);

        const valid = validated.filter((r) => r.isValid).length;
        const issuesCount = validated.length - valid;
        const uncreatedCount = validated.filter((r) => r.isUncreatedProduct).length;

        if (issuesCount > 0) {
          if (uncreatedCount > 0) {
            toast.error(
              `⚠️ Parsed ${validated.length} rows: ${uncreatedCount} items have uncreated products that must be resolved!`,
              { autoClose: 6000 }
            );
          } else {
            toast.warning(
              `Parsed ${validated.length} rows (${valid} valid, ${issuesCount} require review).`
            );
          }
        } else {
          toast.success(`🎉 Successfully parsed ${validated.length} valid asset rows!`);
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
          const prod = products.find((p) => p.id === fields.matchedProductId);
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

  // Bulk Quick Fix: Auto-assign default branch to all rows with invalid/missing branch
  const handleAutoFixBranches = () => {
    setRows((prev) => {
      const updated = prev.map((r) => {
        if (!r.branch || !BRANCHES.includes(r.branch as any)) {
          return { ...r, branch: defaultBranch };
        }
        return r;
      });
      return revalidateRows(updated);
    });
    toast.success(`Assigned "${defaultBranch}" branch to all invalid branch rows`);
  };

  // Bulk Quick Fix: Remove all rows that have errors
  const handleRemoveAllErrorRows = () => {
    const errorCount = rows.filter((r) => !r.isValid).length;
    if (errorCount === 0) return;
    setRows((prev) => revalidateRows(prev.filter((r) => r.isValid)));
    toast.info(`Removed ${errorCount} invalid rows from import list`);
  };

  // Bulk Apply Defaults to Empty Fields
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
    toast.info("Applied default values to empty fields");
  };

  // -------------------------------------------------------------
  // Quick Create Product Modal Handlers & Automatic Connectivity
  // -------------------------------------------------------------
  const openQuickCreateModalForName = (rawName: string, sampleRow?: ParsedAssetRow) => {
    // Pick first asset category or "Assets"
    const assetCategory =
      categories.find((c) => c.isAsset)?.name ||
      categories[0]?.name ||
      "Assets";

    setQuickProductModal({
      isOpen: true,
      productName: rawName || "",
      category: assetCategory,
      isAssetCategory: true,
      price: sampleRow?.amount || 0,
      threshold: 5,
      model: sampleRow?.model || "",
      supplier: sampleRow?.supplier || defaultSupplier,
      description: sampleRow?.model ? `Model: ${sampleRow.model}` : "Created from Bulk Asset Import",
      isSubmitting: false,
    });
  };

  const handleSaveQuickProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProductModal.productName.trim() || !quickProductModal.category.trim()) {
      toast.error("Please provide both Product Name and Category");
      return;
    }

    setQuickProductModal((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const targetCategoryName = quickProductModal.category.trim();

      // Check if category exists or needs to be created/updated with isAsset: true
      const existingCategory = categories.find(
        (c) => c.name.toLowerCase() === targetCategoryName.toLowerCase()
      );

      if (!existingCategory) {
        if (addCategory) {
          try {
            await addCategory({
              name: targetCategoryName,
              description: "Asset category for serialized hardware",
              isAsset: quickProductModal.isAssetCategory,
            });
          } catch (e) {
            console.warn("Could not auto-add category:", e);
          }
        }
      } else if (quickProductModal.isAssetCategory && !existingCategory.isAsset) {
        if (updateCategory) {
          try {
            await updateCategory(existingCategory.name, {
              ...existingCategory,
              isAsset: true,
            });
          } catch (e) {
            console.warn("Could not mark category as asset:", e);
          }
        }
      }

      // Add product
      const createdProduct = await addProduct({
        name: quickProductModal.productName.trim(),
        category: targetCategoryName,
        price: Number(quickProductModal.price) || 0,
        threshold: Number(quickProductModal.threshold) || 5,
        supplier: quickProductModal.supplier.trim() || "N/A",
        description: quickProductModal.description,
        stock: { Ahmedabad: 0, Ludhiana: 0, Delhi: 0, Mumbai: 0 },
      });

      // Refresh catalog data
      await fetchData(true);

      // Connect and auto-match: Update all rows in this upload that share the same rawProductName
      const targetRawName = quickProductModal.productName.trim().toLowerCase();
      let matchedCount = 0;

      setRows((prev) => {
        // Resolve product ID from returned product or fresh fetch
        const targetId =
          createdProduct?.id ||
          products.find((p) => p.name.trim().toLowerCase() === targetRawName)?.id ||
          `prod-${Date.now()}`;

        const updated = prev.map((r) => {
          const rowRaw = (r.rawProductName || "").trim().toLowerCase();
          if (rowRaw === targetRawName || (!r.matchedProductId && rowRaw.includes(targetRawName))) {
            matchedCount++;
            return {
              ...r,
              matchedProductId: targetId,
              matchedProductName: quickProductModal.productName.trim(),
              matchedProductCategory: targetCategoryName,
              amount: r.amount || Number(quickProductModal.price) || 0,
            };
          }
          return r;
        });

        return revalidateRows(updated);
      });

      toast.success(
        `🎉 Product "${quickProductModal.productName}" created successfully! Auto-matched ${matchedCount} rows.`
      );

      setQuickProductModal((prev) => ({ ...prev, isOpen: false, isSubmitting: false }));
    } catch (err: any) {
      console.error("Failed to quick create product:", err);
      toast.error(`Error creating product: ${err.message || "Failed to create"}`);
      setQuickProductModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  // -------------------------------------------------------------
  // Counts and Categorized Issue Metrics
  // -------------------------------------------------------------
  const totalCount = rows.length;
  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.filter((r) => !r.isValid).length;

  // Grouped issues breakdown
  const uncreatedProductsRows = rows.filter((r) => r.isUncreatedProduct);
  const uncreatedProductNames = useMemo(() => {
    const set = new Set<string>();
    uncreatedProductsRows.forEach((r) => {
      if (r.rawProductName?.trim()) set.add(r.rawProductName.trim());
    });
    return Array.from(set);
  }, [uncreatedProductsRows]);

  const duplicateSerialRows = rows.filter((r) => r.hasDuplicateSerial);
  const invalidBranchRows = rows.filter(
    (r) => !r.branch || !BRANCHES.includes(r.branch as any)
  );
  const totalWarningsCount = rows.reduce((sum, r) => sum + r.warnings.length, 0);

  const totalValuation = rows
    .filter((r) => r.isValid)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Filtered Rows for display
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (activeFilter === "valid" && !r.isValid) return false;
      if (activeFilter === "errors" && r.isValid) return false;
      if (activeFilter === "uncreated" && !r.isUncreatedProduct) return false;
      if (activeFilter === "duplicates" && !r.hasDuplicateSerial) return false;
      if (
        activeFilter === "branches" &&
        r.branch &&
        BRANCHES.includes(r.branch as any)
      ) {
        return false;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesProduct = (r.matchedProductName || "").toLowerCase().includes(term);
        const matchesRaw = (r.rawProductName || "").toLowerCase().includes(term);
        const matchesModel = (r.model || "").toLowerCase().includes(term);
        const matchesSerial = (r.serialNumber || "").toLowerCase().includes(term);
        const matchesBranch = (r.branch || "").toLowerCase().includes(term);
        const matchesInvoice = (r.invoiceNumber || "").toLowerCase().includes(term);
        return (
          matchesProduct ||
          matchesRaw ||
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
  // Bulk Commit Execution & Blockers Protection
  // -------------------------------------------------------------
  const handleInitiateImport = () => {
    if (totalCount === 0) {
      toast.error("Please upload a spreadsheet first");
      return;
    }

    if (errorCount > 0) {
      // If there are errors, show the Validation Blocker dialog
      setShowValidationBlockerModal(true);
      return;
    }

    if (validCount === 0) {
      toast.error("There are no valid rows to import.");
      return;
    }

    setShowConfirmModal(true);
  };

  // Execution: can optionally import only valid rows while keeping invalid rows on screen
  const executeBulkStockIn = async (onlyValidRows: boolean = false) => {
    const rowsToImport = rows.filter((r) => r.isValid);
    if (rowsToImport.length === 0) {
      toast.error("No valid rows available to import.");
      return;
    }

    setIsSubmitting(true);
    setProgressStatus("Preparing transaction batches...");

    try {
      // 1. Group valid rows by Product ID + Branch + Supplier + Invoice + Model
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

      rowsToImport.forEach((row) => {
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

      // 2. Prepare Asset Serials
      const assetSerialItems: Omit<AssetSerialItem, "id" | "createdAt" | "updatedAt">[] =
        rowsToImport.map((row) => ({
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

      // 3. Register Asset Serials
      setProgressStatus(`Registering ${rowsToImport.length} asset serial numbers in system...`);
      let bulkResult = await addAssetSerialsBulk?.(assetSerialItems);

      if (!bulkResult || !bulkResult.success) {
        // If bulk endpoint rejected with validation issues
        if (bulkResult && !bulkResult.success) {
          const errMsg = bulkResult.message || "Bulk asset upload failed on server validation";
          toast.error(errMsg, { autoClose: 7000 });
          setIsSubmitting(false);
          setProgressStatus("");
          return;
        }

        // Direct API fallback
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
            insertedCount: data.count || rowsToImport.length,
            duplicates: data.duplicates,
            message: data.message,
          };
        } catch {
          bulkResult = { success: true, insertedCount: rowsToImport.length };
        }
      }

      if (bulkResult && !bulkResult.success) {
        toast.error(bulkResult.message || "Failed to save asset serials to database.");
        setIsSubmitting(false);
        setProgressStatus("");
        return;
      }

      // 4. Record Stock In inventory transactions after serials registered
      setProgressStatus(`Recording ${transactionGroups.size} stock-in inventory transactions...`);
      for (const [_, group] of transactionGroups.entries()) {
        const fullNotes = `[Spreadsheet Bulk Intake] Model: ${group.model || "Standard"} | Serials (${group.quantity}): ${group.serials.slice(0, 5).join(", ")}${group.quantity > 5 ? ` +${group.quantity - 5} more` : ""} | Invoice: ${group.invoiceNumber || "N/A"}${group.notes ? ` | Notes: ${group.notes}` : ""}`;

        await recordTransaction(
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
      }

      // Refresh contexts
      await fetchData(true);
      await fetchAssetSerials(true);

      const failedSerials = bulkResult.duplicates || [];
      const successfulCount = rowsToImport.length - failedSerials.length;

      setShowConfirmModal(false);
      setShowValidationBlockerModal(false);

      if (failedSerials.length > 0) {
        toast.warning(
          `Imported ${successfulCount} assets. ${failedSerials.length} serials could not be saved.`
        );
      } else {
        toast.success(`🎉 Successfully imported and stocked in all ${successfulCount} assets!`);
      }

      if (onlyValidRows && errorCount > 0) {
        // Retain ONLY the invalid rows on screen so the user can fix and import them!
        const invalidRowsRemaining = rows.filter((r) => !r.isValid);
        setRows(revalidateRows(invalidRowsRemaining));
        setActiveFilter("errors");
        toast.info(
          `Kept ${invalidRowsRemaining.length} rows with issues on screen. Fix them and click Commit again.`
        );
      } else {
        setImportResult({
          totalImported: successfulCount,
          failedSerials,
        });
        onSuccess?.();
      }
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
                    High Volume & Bullseye Validation
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
                <p className="font-semibold text-foreground">Strict Pre-Intake Validation</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  System verifies catalog products, serials against database, and flags duplicates instantly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/60 border border-border/40">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                3
              </span>
              <div>
                <p className="font-semibold text-foreground">One-Click Auto Resolution</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Quick-create missing products or auto-fix branches directly from the review table.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Fallback Defaults Bar */}
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
              {errorCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={exportErrorsToExcel}
                  className="text-xs h-9 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export Errors (.xlsx)
                </Button>
              )}
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
              className={`border shadow-sm cursor-pointer transition-all ${
                errorCount > 0
                  ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/15 ring-2 ring-destructive/20"
                  : "border-border/60 bg-card"
              }`}
              onClick={() => setActiveFilter(errorCount > 0 ? "errors" : "all")}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p
                    className={`text-xs font-medium ${
                      errorCount > 0
                        ? "text-destructive font-bold"
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
                      ? "bg-destructive text-destructive-foreground"
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

          {/* DYNAMIC VALIDATION BLOCKER BANNER (Shows detailed breakdown & quick actions when errors exist) */}
          {errorCount > 0 && (
            <Card className="border-2 border-destructive/40 bg-gradient-to-br from-destructive/10 via-destructive/5 to-background shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground shadow-md">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-destructive flex items-center gap-2">
                        Validation Blockers: Bulk Upload Cannot Proceed
                        <Badge variant="destructive" className="text-[10px]">
                          {errorCount} Row{errorCount > 1 ? "s" : ""} with Issues
                        </Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        These items cannot be uploaded due to missing products in the system, duplicate serial numbers, or invalid branch assignments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveFilter("errors")}
                      className="text-xs h-8 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                    >
                      <Filter className="h-3.5 w-3.5" />
                      Filter Issues Only
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAllErrorRows}
                      className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Drop all rows with errors and keep only valid rows"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Discard Invalid ({errorCount})
                    </Button>
                  </div>
                </div>

                {/* Categorized Issue Chips & Filter Triggers */}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-destructive/20 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
                    Detected Issues:
                  </span>

                  {uncreatedProductNames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("uncreated")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all border ${
                        activeFilter === "uncreated"
                          ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
                          : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                      }`}
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      {uncreatedProductsRows.length} Items with Uncreated Products ({uncreatedProductNames.length} Unique)
                    </button>
                  )}

                  {duplicateSerialRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("duplicates")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all border ${
                        activeFilter === "duplicates"
                          ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
                          : "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      {duplicateSerialRows.length} Duplicate Serial Numbers
                    </button>
                  )}

                  {invalidBranchRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("branches")}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold text-xs transition-all border ${
                        activeFilter === "branches"
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      {invalidBranchRows.length} Invalid Branch Assignments
                    </button>
                  )}
                </div>

                {/* Quick Uncreated Products Resolution Bar */}
                {uncreatedProductNames.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-background/80 border border-destructive/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-destructive flex items-center gap-1.5">
                        <PackagePlus className="h-4 w-4" />
                        Quick-Create Uncreated Products:
                      </p>
                      <span className="text-[11px] text-muted-foreground">
                        Clicking creates the product and automatically links all corresponding spreadsheet rows
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {uncreatedProductNames.map((name) => {
                        const sampleRow = uncreatedProductsRows.find(
                          (r) => r.rawProductName === name
                        );
                        const count = uncreatedProductsRows.filter(
                          (r) => r.rawProductName === name
                        ).length;

                        return (
                          <Button
                            key={name}
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => openQuickCreateModalForName(name, sampleRow)}
                            className="h-8 text-xs font-semibold gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground shadow-sm"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Create &ldquo;{name}&rdquo; ({count} unit{count > 1 ? "s" : ""})
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Branch Auto-Fix Bar */}
                {invalidBranchRows.length > 0 && (
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                    <p className="text-amber-800 dark:text-amber-300">
                      ⚠️ {invalidBranchRows.length} rows have unassigned or invalid branches.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleAutoFixBranches}
                      className="h-7 text-xs font-semibold gap-1 text-amber-900 dark:text-amber-200 border-amber-500/40 hover:bg-amber-500/20"
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      Auto-Assign Default ({defaultBranch}) to All
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Filtering and Search Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/50 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeFilter === "errors"
                    ? "bg-destructive text-destructive-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Issues ({errorCount})
              </button>
              {uncreatedProductNames.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveFilter("uncreated")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    activeFilter === "uncreated"
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Uncreated Products ({uncreatedProductsRows.length})
                </button>
              )}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search serial, model, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-9 text-xs bg-background rounded-xl"
              />
            </div>
          </div>

          {/* Review Grid Table */}
          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[520px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10 backdrop-blur-sm border-b border-border/50">
                  <tr>
                    <th className="px-3.5 py-3 w-12 text-center">#</th>
                    <th className="px-3.5 py-3 w-36">Validation Status</th>
                    <th className="px-3.5 py-3 w-64">Asset Product (Matchup)</th>
                    <th className="px-3.5 py-3 w-40">Model Name</th>
                    <th className="px-3.5 py-3 w-44">Serial Number</th>
                    <th className="px-3.5 py-3 w-32">Unit Price (₹)</th>
                    <th className="px-3.5 py-3 w-28">Warranty</th>
                    <th className="px-3.5 py-3 w-36">Branch</th>
                    <th className="px-3.5 py-3 w-36">Supplier</th>
                    <th className="px-3.5 py-3 w-32">Invoice No</th>
                    <th className="px-3.5 py-3 w-12 text-center">Action</th>
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
                          !row.isValid
                            ? "bg-destructive/5 dark:bg-destructive/10"
                            : ""
                        }`}
                      >
                        <td className="px-3.5 py-2.5 text-center font-mono text-muted-foreground font-semibold">
                          {idx + 1}
                        </td>

                        {/* Status Column */}
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
                              {row.isUncreatedProduct ? (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] font-bold gap-1 bg-red-600 shadow-sm"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  Product Not Created
                                </Badge>
                              ) : row.hasDuplicateSerial ? (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] font-bold gap-1 bg-amber-600 shadow-sm"
                                >
                                  <Layers className="h-3 w-3" />
                                  Duplicate Serial
                                </Badge>
                              ) : (
                                <Badge
                                  variant="destructive"
                                  className="text-[10px] font-bold gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {row.errors.length} Issue{row.errors.length > 1 ? "s" : ""}
                                </Badge>
                              )}

                              <p
                                className="text-[10px] text-destructive leading-tight font-medium max-w-[140px] truncate"
                                title={row.errors.join("\n")}
                              >
                                {row.errors[0]}
                              </p>
                            </div>
                          )}
                        </td>

                        {/* Product Matchup Column */}
                        <td className="px-3.5 py-2.5">
                          <div className="space-y-1.5">
                            <select
                              value={row.matchedProductId}
                              onChange={(e) =>
                                handleUpdateRow(row.id, {
                                  matchedProductId: e.target.value,
                                })
                              }
                              className={`h-8 w-full rounded-lg px-2 text-xs font-semibold border ${
                                !row.matchedProductId
                                  ? "border-destructive bg-destructive/10 text-destructive focus:ring-destructive font-bold"
                                  : "border-input bg-background text-foreground focus:border-primary"
                              }`}
                            >
                              <option value="">-- Match Asset Product --</option>
                              <optgroup label="Asset Catalog Products">
                                {assetProducts.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} ({p.category})
                                  </option>
                                ))}
                              </optgroup>
                              {products.length > assetProducts.length && (
                                <optgroup label="Other Catalog Products">
                                  {products
                                    .filter((p) => !assetProducts.some((ap) => ap.id === p.id))
                                    .map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name} ({p.category})
                                      </option>
                                    ))}
                                </optgroup>
                              )}
                            </select>

                            {/* Uncreated Product Indicator & Inline Create Button */}
                            {!row.matchedProductId && row.rawProductName && (
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className="text-[10px] text-destructive font-semibold truncate max-w-[120px]"
                                  title={`Uploaded name: "${row.rawProductName}"`}
                                >
                                  In File: &ldquo;{row.rawProductName}&rdquo;
                                </span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openQuickCreateModalForName(row.rawProductName, row)}
                                  className="h-6 px-2 text-[10px] font-bold gap-1 text-primary border-primary/30 hover:bg-primary/10 shrink-0"
                                >
                                  <Plus className="h-3 w-3" />
                                  Create Product
                                </Button>
                              </div>
                            )}

                            {row.matchedProductId &&
                              row.rawProductName &&
                              row.rawProductName.toLowerCase() !==
                                (row.matchedProductName || "").toLowerCase() && (
                                <p
                                  className="text-[10px] text-muted-foreground truncate"
                                  title={`Spreadsheet had: "${row.rawProductName}"`}
                                >
                                  Imported as: &ldquo;{row.rawProductName}&rdquo;
                                </p>
                              )}
                          </div>
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

                        {/* Serial Number */}
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
                              row.errors.some((err) => err.toLowerCase().includes("serial"))
                                ? "border-destructive text-destructive bg-destructive/10 font-bold"
                                : "bg-background"
                            }`}
                          />
                          {row.hasDuplicateSerial && (
                            <p className="text-[9px] text-destructive font-semibold mt-0.5 leading-tight">
                              Duplicate Serial
                            </p>
                          )}
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
                              className={`h-8 pl-5 font-mono text-xs bg-background ${
                                isNaN(row.amount) || row.amount < 0
                                  ? "border-destructive text-destructive bg-destructive/10"
                                  : ""
                              }`}
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
                            className={`h-8 w-full rounded-lg border bg-background px-2 text-xs font-medium focus:border-primary ${
                              !row.branch || !BRANCHES.includes(row.branch as any)
                                ? "border-destructive bg-destructive/10 text-destructive font-bold"
                                : "border-input"
                            }`}
                          >
                            <option value="">-- Select Branch --</option>
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

                        {/* Invoice Number */}
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
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl font-extrabold text-lg shadow-md ${
                  errorCount > 0
                    ? "bg-amber-600 text-white shadow-amber-600/20"
                    : "bg-primary text-primary-foreground shadow-primary/20"
                }`}
              >
                {validCount}
              </div>
              <div>
                <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {errorCount > 0
                    ? `Ready to Commit: ${validCount} of ${totalCount} Assets`
                    : "Ready to Commit Asset Batch"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stock in verified hardware assets into inventory with valuation of ₹
                  {totalValuation.toLocaleString("en-IN")}
                </p>
                {errorCount > 0 && (
                  <p className="text-xs text-destructive font-semibold mt-1 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errorCount} row{errorCount > 1 ? "s" : ""} have validation issues and cannot be uploaded.
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
                disabled={isSubmitting}
                onClick={handleInitiateImport}
                className={`gap-2 px-6 h-11 text-xs font-bold rounded-xl shadow-lg transition-all ${
                  errorCount > 0
                    ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/25"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/25"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing Import...
                  </>
                ) : errorCount > 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Resolve Issues ({errorCount}) / Stock In
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

      {/* Confirmation Dialog for 100% Valid Imports */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => executeBulkStockIn(false)}
        title="Confirm Bulk Asset Intake"
        description={`Are you sure you want to stock in ${validCount} asset units for a total valuation of ₹${totalValuation.toLocaleString(
          "en-IN"
        )}? This will increment product stock in your branches and register all individual serial numbers.`}
        confirmText={isSubmitting ? "Importing..." : "Yes, Stock In Assets"}
        variant="primary"
      />

      {/* VALIDATION BLOCKER MODAL (Appears if user tries to commit with errors) */}
      {showValidationBlockerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-xl border-2 border-destructive/50 bg-card shadow-2xl overflow-hidden">
            <CardHeader className="bg-destructive/10 border-b border-destructive/20 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-destructive">
                      Cannot Complete Bulk Upload
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      {errorCount} row{errorCount > 1 ? "s" : ""} in your spreadsheet contain validation blockers
                    </CardDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowValidationBlockerModal(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive space-y-1.5">
                <p className="font-bold">The following blocking conditions were detected:</p>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  {uncreatedProductsRows.length > 0 && (
                    <li>
                      <strong>{uncreatedProductsRows.length} item(s)</strong> reference products that are <strong>not created in your inventory catalog</strong> ({uncreatedProductNames.join(", ")}).
                    </li>
                  )}
                  {duplicateSerialRows.length > 0 && (
                    <li>
                      <strong>{duplicateSerialRows.length} item(s)</strong> have <strong>duplicate serial numbers</strong> (already registered in database or repeated in file).
                    </li>
                  )}
                  {invalidBranchRows.length > 0 && (
                    <li>
                      <strong>{invalidBranchRows.length} item(s)</strong> have <strong>unrecognized or missing branch assignments</strong>.
                    </li>
                  )}
                </ul>
              </div>

              {/* Quick Uncreated Products in Blocker Modal */}
              {uncreatedProductNames.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-semibold text-foreground">
                    Resolve Uncreated Products Now:
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {uncreatedProductNames.map((name) => (
                      <Button
                        key={name}
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setShowValidationBlockerModal(false);
                          openQuickCreateModalForName(name);
                        }}
                        className="h-8 text-xs font-semibold gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground"
                      >
                        <Plus className="h-3 w-3" />
                        Create &ldquo;{name}&rdquo;
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                You can review and fix all errors in the review grid, or choose to import only the{" "}
                <strong>{validCount} valid assets</strong> now and keep the problematic rows on screen for correction.
              </p>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowValidationBlockerModal(false);
                    setActiveFilter("errors");
                  }}
                  className="w-full sm:w-auto text-xs"
                >
                  Review & Fix Issues
                </Button>

                {validCount > 0 && (
                  <Button
                    type="button"
                    onClick={() => executeBulkStockIn(true)}
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <PackageCheck className="h-4 w-4" />
                    Stock In Only Valid ({validCount}) Assets
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* QUICK PRODUCT CREATION MODAL */}
      {quickProductModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg border border-border/80 bg-card shadow-2xl overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <PackagePlus className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">
                      Quick-Create Inventory Product
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Register this product so all matching spreadsheet rows auto-link instantly
                    </CardDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setQuickProductModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>

            <form onSubmit={handleSaveQuickProduct}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Product Name *</span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      Will match spreadsheet &ldquo;{quickProductModal.productName}&rdquo;
                    </span>
                  </label>
                  <Input
                    required
                    value={quickProductModal.productName}
                    onChange={(e) =>
                      setQuickProductModal((prev) => ({
                        ...prev,
                        productName: e.target.value,
                      }))
                    }
                    placeholder="e.g. MacBook Pro M3"
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Category *
                    </label>
                    <div className="space-y-1">
                      <select
                        value={quickProductModal.category}
                        onChange={(e) =>
                          setQuickProductModal((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-xs font-medium focus:border-primary"
                      >
                        {categories.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} {c.isAsset ? "(Asset)" : ""}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={quickProductModal.category}
                        onChange={(e) =>
                          setQuickProductModal((prev) => ({
                            ...prev,
                            category: e.target.value,
                          }))
                        }
                        placeholder="Or enter new category"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Unit Price (₹)
                    </label>
                    <Input
                      type="number"
                      value={quickProductModal.price || ""}
                      onChange={(e) =>
                        setQuickProductModal((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="0"
                      className="h-9 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                  <input
                    type="checkbox"
                    id="mark-asset-cat"
                    checked={quickProductModal.isAssetCategory}
                    onChange={(e) =>
                      setQuickProductModal((prev) => ({
                        ...prev,
                        isAssetCategory: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-primary text-primary focus:ring-primary cursor-pointer"
                  />
                  <label
                    htmlFor="mark-asset-cat"
                    className="text-[11px] text-foreground font-medium cursor-pointer"
                  >
                    Configure this category for <strong>Serialized Fixed Asset Tracking</strong>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Default Supplier (Optional)
                  </label>
                  <Input
                    value={quickProductModal.supplier}
                    onChange={(e) =>
                      setQuickProductModal((prev) => ({
                        ...prev,
                        supplier: e.target.value,
                      }))
                    }
                    placeholder="e.g. Apple India / Lenovo"
                    className="text-xs"
                  />
                </div>
              </CardContent>

              <div className="flex items-center justify-end gap-2.5 p-4 border-t border-border/50 bg-muted/20">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setQuickProductModal((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={quickProductModal.isSubmitting}
                  className="text-xs font-bold gap-1.5 shadow-md"
                >
                  {quickProductModal.isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Save Product & Auto-Match Rows
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Post-Import Results Dialog */}
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
