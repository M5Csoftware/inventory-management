"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  RefreshCw,
  Trash2,
  Plus,
  Search,
  IndianRupee,
  User,
  Building2,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Save,
  Hammer,
  HardHat,
  Phone,
  X,
  ChevronDown,
  Scissors,
  Package,
  AlertTriangle,
  Barcode,
  ShieldCheck,
  FileText,
  Download,
  Printer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/context/inventory-context";
import { toast } from "react-toastify";

// Define MaintenanceRecord type locally
interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  type: "Repair" | "Replace" | "Retire" | "Dismantle";
  date: string;
  cost: number;
  description: string;
  vendor?: string;
  vendorContact?: string;
  serialNumber?: string;
  repairDetails?: {
    issue: string;
    partsReplaced?: string[];
    laborCost?: number;
    partsCost?: number;
    estimatedTime?: string;
    technician?: string;
    warrantyClaim?: boolean;
  };
  replaceDetails?: {
    newProductId?: string;
    newProductName?: string;
    reason: string;
    disposalMethod?: string;
  };
  retireDetails?: {
    reason: string;
    disposalMethod: string;
    salvageValue?: number;
    retiredBy?: string;
  };
  dismantleDetails?: {
    reason: string;
    partsRecovered?: string[];
    recoveryValue?: number;
    disposalMethod?: string;
    dismantledBy?: string;
    location?: string;
    environmentalNotes?: string;
  };
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  notes?: string;
}

// Define Product type
interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  price?: number;
  stock?: number | Record<string, number>;
  suppliersList?: Array<{ supplierName: string; rate: number }>;
  [key: string]: any;
}

// Represents one physical unit's serial number
interface SerialEntry {
  value: string;
  label: string;
  model?: string;
  warrantyText?: string;
  purchaseDate?: string;
  invoiceNumber?: string;
  supplier?: string;
}

// ── API config ──
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const getAuthHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const dbName =
    typeof window !== "undefined" ? localStorage.getItem("dbName") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(dbName ? { "x-database": dbName } : {}),
  };
};

const MAINTENANCE_TYPES = [
  { value: "Repair" as const, label: "🔧 Repair", icon: Wrench },
  { value: "Replace" as const, label: "🔄 Replace", icon: RefreshCw },
  { value: "Retire" as const, label: "🗑️ Retire", icon: Trash2 },
  { value: "Dismantle" as const, label: "✂️ Dismantle", icon: Scissors },
];

const STATUSES = [
  {
    value: "Pending" as const,
    label: "Pending",
    color: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  },
  {
    value: "In Progress" as const,
    label: "In Progress",
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  {
    value: "Completed" as const,
    label: "Completed",
    color: "bg-green-500/10 text-green-600 border-green-200",
  },
  {
    value: "Cancelled" as const,
    label: "Cancelled",
    color: "bg-red-500/10 text-red-600 border-red-200",
  },
];

// Badge component
const Badge = ({
  children,
  className,
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}) => (
  <span
    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
      variant === "outline" ? "border-border bg-transparent" : ""
    } ${className || ""}`}
  >
    {children}
  </span>
);

// Dialog components
const Dialog = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col space-y-1.5 text-center sm:text-left">
    {children}
  </div>
);

const DialogTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={`text-lg font-semibold leading-none tracking-tight ${className || ""}`}
  >
    {children}
  </h2>
);

const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground">{children}</p>
);

const DialogFooter = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
    {children}
  </div>
);

// Searchable Select component
const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = "Search and select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No options found",
  label,
  required = false,
  disabled = false,
  className = "",
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`space-y-1.5 ${className}`} ref={wrapperRef}>
      {label && (
        <label className="text-xs font-medium text-muted-foreground">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary ${
            disabled ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          <span
            className={
              selectedOption ? "text-foreground" : "text-muted-foreground"
            }
          >
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  {emptyLabel}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={`${option.value}-${option.label.substring(0, 10)}`}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className={`flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                      value === option.value
                        ? "bg-accent text-accent-foreground"
                        : ""
                    }`}
                  >
                    {option.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Parses a warranty string like "2 Years 3 Months" into total days
const parseWarrantyDurationDays = (text: string): number | null => {
  if (!text) return null;

  let totalDays = 0;

  // Parse Years
  const yearsMatch = text.match(/(\d+)\s*(?:year|years|yr|yrs)/i);
  if (yearsMatch) {
    totalDays += parseInt(yearsMatch[1]) * 365;
  }

  // Parse Months
  const monthsMatch = text.match(/(\d+)\s*(?:month|months|mon|mons)/i);
  if (monthsMatch) {
    totalDays += parseInt(monthsMatch[1]) * 30;
  }

  // Parse Days
  const daysMatch = text.match(/(\d+)\s*(?:day|days|d)/i);
  if (daysMatch) {
    totalDays += parseInt(daysMatch[1]);
  }

  return totalDays > 0 ? totalDays : null;
};

// Pulls the "Warranty: X" fragment out of a Stock In transaction's combined notes/reason text
const extractWarrantyFromText = (text: string): string => {
  if (!text) return "";
  const match = text.match(/Warranty:\s*([^|]+)/i);
  return match && match[1] ? match[1].trim() : "";
};

// Fallback: pulls serial numbers out of the "S/Ns (n): 0987654, 0987655" fragment in notes
const extractSerialsFromText = (text: string): string[] => {
  if (!text) return [];
  const match = text.match(/S\/Ns\s*\([^)]*\)\s*:\s*([^|]+)/i);
  if (!match || !match[1]) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// Transaction dates are saved as "YYYY-MM-DD HH:MM"
const parseTxDate = (value?: string): Date | null => {
  if (!value) return null;
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)
    ? value.replace(" ", "T")
    : value;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
};

interface WarrantyStatus {
  warrantyText: string;
  remainingDays: number | null;
  expired: boolean | null;
  expiryDate: Date | null;
}

// Given a serial's stock-in record, figures out whether its warranty is still active
const getWarrantyStatus = (entry?: SerialEntry): WarrantyStatus | null => {
  if (!entry || !entry.warrantyText) return null;

  const durationDays = parseWarrantyDurationDays(entry.warrantyText);
  const purchase = parseTxDate(entry.purchaseDate);

  if (!durationDays || !purchase) {
    return {
      warrantyText: entry.warrantyText,
      remainingDays: null,
      expired: null,
      expiryDate: null,
    };
  }

  const expiry = new Date(purchase);
  expiry.setDate(expiry.getDate() + durationDays);
  const now = new Date();
  const remainingDays = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    warrantyText: entry.warrantyText,
    remainingDays,
    expired: remainingDays <= 0,
    expiryDate: expiry,
  };
};

export default function MaintenancePage() {
  const { assets, products, categories, activeBranch } = useInventory();
  const [maintenanceRecords, setMaintenanceRecords] = useState<
    MaintenanceRecord[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedRecord, setSelectedRecord] =
    useState<MaintenanceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [serialOptions, setSerialOptions] = useState<SerialEntry[]>([]);
  const [isLoadingSerials, setIsLoadingSerials] = useState(false);
  const [serialRefreshTick, setSerialRefreshTick] = useState(0);

  const [formData, setFormData] = useState({
    assetId: "",
    serialNumber: "",
    type: "Repair" as MaintenanceRecord["type"],
    date: new Date().toISOString().slice(0, 10),
    cost: "",
    description: "",
    vendor: "",
    vendorContact: "",
    issue: "",
    partsReplaced: "",
    laborCost: "",
    partsCost: "",
    estimatedTime: "",
    technician: "",
    warrantyClaim: false,
    replaceReason: "",
    disposalMethod: "",
    salvageValue: "",
    retireReason: "",
    retiredBy: "",
    dismantleReason: "",
    partsRecovered: "",
    recoveryValue: "",
    dismantleDisposalMethod: "",
    dismantledBy: "",
    location: "",
    environmentalNotes: "",
    notes: "",
    status: "Pending" as MaintenanceRecord["status"],
  });

  // Convert ONLY hardware & IT equipment assets to select options
  const productOptions = useMemo(() => {
    const productArray = Array.isArray(products) ? products : [];
    const categoryArray = Array.isArray(categories) ? categories : [];

    const assetCategoryNames = new Set(
      categoryArray
        .filter((c) => c.isAsset === true)
        .map((c) => c.name.toLowerCase().trim()),
    );

    const assetKeywords = [
      "laptop",
      "desktop",
      "monitor",
      "keyboard",
      "mouse",
      "printer",
      "hardware",
      "equipment",
      "electronics",
      "phone",
      "server",
      "switch",
      "router",
      "display",
      "macbook",
      "pc",
      "tablet",
      "cpu",
      "ups",
      "scanner",
      "projector",
      "camera",
    ];

    const nonAssetKeywords = [
      "bag",
      "box",
      "tape",
      "packaging",
      "stationery",
      "paper",
      "consumable",
      "carton",
      "bubble",
      "wrap",
      "pouch",
      "envelope",
      "marker",
      "pen",
    ];

    const productMap = new Map<string, Product>();

    productArray.forEach((product) => {
      if (!product || !product.id) return;

      const catLower = (product.category || "").toLowerCase().trim();
      const nameLower = (product.name || "").toLowerCase().trim();

      const isNonAsset = nonAssetKeywords.some(
        (kw) => catLower.includes(kw) || nameLower.includes(kw),
      );
      if (isNonAsset) return;

      const isExplicitAssetCat = assetCategoryNames.has(catLower);
      const isHardwareAsset = assetKeywords.some(
        (kw) => catLower.includes(kw) || nameLower.includes(kw),
      );

      if (
        isExplicitAssetCat ||
        isHardwareAsset ||
        (assetCategoryNames.size === 0 && !isNonAsset)
      ) {
        if (
          !productMap.has(product.id) ||
          productMap.get(product.id)?.name !== product.name
        ) {
          productMap.set(product.id, product);
        }
      }
    });

    return Array.from(productMap.values()).map((product) => {
      let totalStock = 0;
      if (typeof product.stock === "number") {
        totalStock = product.stock;
      } else if (product.stock && typeof product.stock === "object") {
        totalStock = Object.values(product.stock).reduce(
          (sum, val) => sum + (typeof val === "number" ? val : 0),
          0,
        );
      }

      const labelParts = [
        `💻 ${product.name}`,
        product.sku ? `(${product.sku})` : "",
        `Stock: ${totalStock}`,
        product.category ? `| ${product.category}` : "",
      ].filter((part) => part !== "");

      return {
        value: product.id,
        label: labelParts.join(" "),
      };
    });
  }, [products, categories]);

  const serialSelectOptions = useMemo(
    () => serialOptions.map((s) => ({ value: s.value, label: s.label })),
    [serialOptions],
  );

  const filteredRecords = maintenanceRecords.filter((record) => {
    const matchesSearch =
      record.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || record.type === filterType;
    const matchesStatus =
      filterStatus === "All" || record.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const fetchMaintenanceRecords = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/maintenance`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setMaintenanceRecords(json.data || []);
      } else {
        toast.error(json.message || "Failed to load maintenance records");
      }
    } catch (error) {
      console.error("Failed to load maintenance records:", error);
      toast.error("Failed to load maintenance records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  // Fetch serial numbers from asset-serials endpoint
  useEffect(() => {
    const fetchSerialsForProduct = async () => {
      if (!formData.assetId) {
        setSerialOptions([]);
        return;
      }

      setIsLoadingSerials(true);
      try {
        const productArray = Array.isArray(products) ? products : [];
        const selectedProd = productArray.find(
          (p: Product) => p.id === formData.assetId,
        );

        // Fetch from asset-serials endpoint
        const res = await fetch(
          `${API_BASE}/asset-serials/product/${formData.assetId}`,
          {
            headers: getAuthHeaders(),
          },
        );

        const json = await res.json();

        if (json.success && json.data) {
          const assetSerials = json.data;

          const entries: SerialEntry[] = assetSerials.map((asset: any) => ({
            value: asset.serialNumber,
            label: `${asset.serialNumber}${asset.model ? ` — ${asset.model}` : ""}`,
            model: asset.model,
            warrantyText: asset.warranty,
            purchaseDate: asset.purchaseDate,
            invoiceNumber: asset.invoiceNumber,
            supplier: asset.supplier,
          }));

          setSerialOptions(entries);

          if (entries.length === 0) {
            toast.info(
              `No serial numbers found for "${selectedProd?.name || "this product"}"`,
            );
          }
          setIsLoadingSerials(false);
          return;
        }

        // Fallback: try the old transactions method
        const fallbackRes = await fetch(`${API_BASE}/transactions`, {
          headers: getAuthHeaders(),
        });
        const fallbackJson = await fallbackRes.json();

        if (fallbackJson.success && fallbackJson.data) {
          const allTxs = fallbackJson.data;
          const stockInTxs = allTxs.filter((t: any) => {
            const type = (t.type || "").toString().trim().toLowerCase();
            return type === "stock in" || type === "stockin";
          });

          const normalizedAssetId = formData.assetId.trim().toLowerCase();
          const normalizedProductName = (selectedProd?.name || "")
            .trim()
            .toLowerCase();

          const matchedTxs = stockInTxs.filter((t: any) => {
            const txProductId = (t.productId || "")
              .toString()
              .trim()
              .toLowerCase();
            const txProductName = (t.productName || "")
              .toString()
              .trim()
              .toLowerCase();
            return (
              txProductId === normalizedAssetId ||
              (!!normalizedProductName &&
                txProductName === normalizedProductName)
            );
          });

          const entries: SerialEntry[] = [];

          matchedTxs.forEach((tx: any) => {
            const combinedText = `${tx.notes || ""} ${tx.reasonOrLocation || ""} ${tx.reason || ""}`;
            let serials: string[] = [];

            if (tx.serialNumber) {
              if (typeof tx.serialNumber === "string") {
                if (tx.serialNumber.includes(",")) {
                  serials = tx.serialNumber
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean);
                } else {
                  serials = [tx.serialNumber.trim()];
                }
              } else if (Array.isArray(tx.serialNumber)) {
                serials = tx.serialNumber
                  .map((s: any) => String(s).trim())
                  .filter(Boolean);
              }
            }

            if (serials.length === 0) {
              serials = extractSerialsFromText(combinedText);
            }

            if (serials.length === 0) return;

            const warrantyText = extractWarrantyFromText(combinedText);
            const purchaseDate = tx.purchaseDate || tx.date || tx.createdAt;

            serials.forEach((sn: string) => {
              const exists = entries.some((e) => e.value === sn);
              if (!exists) {
                entries.push({
                  value: sn,
                  label: `${sn}${tx.model ? ` — ${tx.model}` : ""}`,
                  model: tx.model,
                  warrantyText,
                  purchaseDate,
                  invoiceNumber: tx.invoiceNumber,
                  supplier: tx.supplier,
                });
              }
            });
          });

          setSerialOptions(entries);
        } else {
          setSerialOptions([]);
        }
      } catch (error) {
        console.error("[Serial lookup] Failed to load serial numbers:", error);
        setSerialOptions([]);
      } finally {
        setIsLoadingSerials(false);
      }
    };

    fetchSerialsForProduct();
  }, [formData.assetId, products, serialRefreshTick]);

  // Shows a toast telling the user how much warranty is left
  const checkWarrantyForSelectedSerial = () => {
    if (!formData.serialNumber) {
      toast.warn("Please select a Serial Number first to check its warranty.");
      return;
    }

    const entry = serialOptions.find((s) => s.value === formData.serialNumber);
    const status = getWarrantyStatus(entry);

    if (!status) {
      toast.warn(
        `No warranty information was recorded for serial number ${formData.serialNumber}.`,
      );
      return;
    }

    if (status.remainingDays === null) {
      toast.info(
        `Serial ${formData.serialNumber} has warranty: "${status.warrantyText}".`,
      );
      return;
    }

    if (status.expired) {
      toast.error(
        `⚠️ Serial ${formData.serialNumber}: warranty ("${status.warrantyText}") expired ${Math.abs(
          status.remainingDays,
        )} day(s) ago.`,
        {
          position: "top-center",
          autoClose: 5000,
        },
      );
    } else {
      toast.success(
        `✅ Serial ${formData.serialNumber}: warranty ("${status.warrantyText}") — ${status.remainingDays} day(s) remaining.`,
        {
          position: "top-center",
          autoClose: 5000,
        },
      );
    }
  };

  // Handle serial number change with auto warranty check
  const handleSerialChange = (value: string) => {
    setFormData({ ...formData, serialNumber: value });

    if (formData.warrantyClaim && value) {
      const entry = serialOptions.find((s) => s.value === value);
      const status = getWarrantyStatus(entry);

      if (status && status.remainingDays !== null && !status.expired) {
        toast.info(
          `🛡️ Serial ${value} has ${status.remainingDays} days of warranty remaining.`,
          {
            position: "bottom-center",
            autoClose: 3000,
          },
        );
      } else if (status && status.expired) {
        toast.warning(`⚠️ Serial ${value} warranty has expired.`, {
          position: "bottom-center",
          autoClose: 3000,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productArray = Array.isArray(products) ? products : [];
      const selectedProduct = productArray.find(
        (p: Product) => p.id === formData.assetId,
      );

      // For Dismantle type, cost is optional (default to 0)
      const costValue =
        formData.type === "Dismantle"
          ? parseFloat(formData.cost) || 0
          : parseFloat(formData.cost) || 0;

      const payload: Record<string, any> = {
        assetId: formData.assetId,
        assetName: selectedProduct?.name || "Unknown Product",
        serialNumber: formData.serialNumber || undefined,
        type: formData.type,
        date: formData.date,
        cost: costValue,
        description: formData.description,
        vendor: formData.vendor || undefined,
        vendorContact: formData.vendorContact || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      };

      // For Dismantle type, if description is empty, auto-generate it
      if (formData.type === "Dismantle" && !formData.description) {
        payload.description = `Dismantled ${selectedProduct?.name || "product"} - ${formData.dismantleReason || "No reason provided"}`;
      }

      if (formData.type === "Repair") {
        payload.repairDetails = {
          issue: formData.issue,
          partsReplaced: formData.partsReplaced
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          laborCost: parseFloat(formData.laborCost) || 0,
          partsCost: parseFloat(formData.partsCost) || 0,
          estimatedTime: formData.estimatedTime,
          technician: formData.technician,
          warrantyClaim: formData.warrantyClaim,
        };
      } else if (formData.type === "Replace") {
        payload.replaceDetails = {
          reason: formData.replaceReason,
          disposalMethod: formData.disposalMethod || undefined,
        };
      } else if (formData.type === "Retire") {
        payload.retireDetails = {
          reason: formData.retireReason,
          disposalMethod: formData.disposalMethod || "Scrap",
          salvageValue: parseFloat(formData.salvageValue) || 0,
          retiredBy: formData.retiredBy || undefined,
        };
      } else if (formData.type === "Dismantle") {
        payload.dismantleDetails = {
          reason: formData.dismantleReason,
          partsRecovered: formData.partsRecovered
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          recoveryValue: parseFloat(formData.recoveryValue) || 0,
          disposalMethod: formData.dismantleDisposalMethod || undefined,
          dismantledBy: formData.dismantledBy || undefined,
          location: formData.location || undefined,
          environmentalNotes: formData.environmentalNotes || undefined,
        };
      }

      // Create the maintenance record
      const res = await fetch(`${API_BASE}/maintenance`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setMaintenanceRecords([json.data, ...maintenanceRecords]);

        // If type is Dismantle and there's a serial number, delete it from AssetSerial
        if (formData.type === "Dismantle" && formData.serialNumber) {
          try {
            // First, find the asset serial by serial number and product ID
            const findRes = await fetch(
              `${API_BASE}/asset-serials?serialNumber=${encodeURIComponent(formData.serialNumber)}&productId=${formData.assetId}`,
              {
                headers: getAuthHeaders(),
              },
            );
            const findJson = await findRes.json();

            if (findJson.success && findJson.data && findJson.data.length > 0) {
              const assetSerial = findJson.data[0];

              // Delete the asset serial
              const deleteRes = await fetch(
                `${API_BASE}/asset-serials/${assetSerial.id}`,
                {
                  method: "DELETE",
                  headers: getAuthHeaders(),
                },
              );
              const deleteJson = await deleteRes.json();

              if (deleteJson.success) {
                toast.success(
                  `Serial number ${formData.serialNumber} has been removed from inventory due to dismantling.`,
                );

                // Also update the serial options to remove this serial
                setSerialOptions((prev) =>
                  prev.filter((s) => s.value !== formData.serialNumber),
                );
              } else {
                toast.warning(
                  `Maintenance record created but failed to remove serial number: ${deleteJson.message}`,
                );
              }
            } else {
              toast.warning(
                `Serial number ${formData.serialNumber} not found in asset inventory. It may have already been removed.`,
              );
            }
          } catch (error) {
            console.error("Failed to delete asset serial:", error);
            toast.warning(
              "Maintenance record created but failed to remove serial number from inventory.",
            );
          }
        }

        toast.success("Maintenance record created successfully!");
        setIsModalOpen(false);
        resetForm();
      } else {
        toast.error(json.message || "Failed to create maintenance record");
      }
    } catch (error) {
      console.error("Failed to create maintenance record:", error);
      toast.error("Failed to create maintenance record");
    }
  };

  const resetForm = () => {
    setFormData({
      assetId: "",
      serialNumber: "",
      type: "Repair",
      date: new Date().toISOString().slice(0, 10),
      cost: "",
      description: "",
      vendor: "",
      vendorContact: "",
      issue: "",
      partsReplaced: "",
      laborCost: "",
      partsCost: "",
      estimatedTime: "",
      technician: "",
      warrantyClaim: false,
      replaceReason: "",
      disposalMethod: "",
      salvageValue: "",
      retireReason: "",
      retiredBy: "",
      dismantleReason: "",
      partsRecovered: "",
      recoveryValue: "",
      dismantleDisposalMethod: "",
      dismantledBy: "",
      location: "",
      environmentalNotes: "",
      notes: "",
      status: "Pending",
    });
    setSerialOptions([]);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUSES.find((s) => s.value === status);
    if (!statusConfig) return null;
    return (
      <Badge
        className={`${statusConfig.color} border px-2 py-0.5 text-xs font-medium`}
      >
        {status === "In Progress" ? (
          <RefreshCw className="h-3 w-3 mr-1 inline animate-spin" />
        ) : status === "Pending" ? (
          <Clock className="h-3 w-3 mr-1 inline" />
        ) : status === "Completed" ? (
          <CheckCircle className="h-3 w-3 mr-1 inline" />
        ) : (
          <AlertCircle className="h-3 w-3 mr-1 inline" />
        )}
        {status}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Repair":
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case "Replace":
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case "Retire":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "Dismantle":
        return <Scissors className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Repair":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "Replace":
        return "bg-orange-500/10 text-orange-600 border-orange-200";
      case "Retire":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "Dismantle":
        return "bg-purple-500/10 text-purple-600 border-purple-200";
      default:
        return "";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get the model/asset category for a product
  const getProductDetails = (assetId: string) => {
    const product = products.find((p: Product) => p.id === assetId);
    return {
      model: product?.sku || product?.name || "N/A",
      category: product?.category || "N/A",
    };
  };

  // Get the assigned person from notes or description
  const getAssignedTo = (record: MaintenanceRecord) => {
    if (record.repairDetails?.technician)
      return record.repairDetails.technician;
    if (record.retireDetails?.retiredBy) return record.retireDetails.retiredBy;
    if (record.dismantleDetails?.dismantledBy)
      return record.dismantleDetails.dismantledBy;
    return "N/A";
  };

  // Get the approved by (vendor or notes)
  const getApprovedBy = (record: MaintenanceRecord) => {
    if (record.vendor) return record.vendor;
    return "N/A";
  };

  // Get remarks (description or notes)
  const getRemarks = (record: MaintenanceRecord) => {
    if (record.notes) return record.notes;
    if (record.description) return record.description;
    return "N/A";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="mx-auto max-w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/assets">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full border-2 transition-all hover:scale-105 hover:border-primary/50"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                <Hammer className="h-6 w-6 text-amber-500" />
                Product Maintenance
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <HardHat className="h-3 w-3 text-amber-500" />
                Manage repair, replacement, retirement, and dismantling of
                products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsReportModalOpen(true)}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50 h-9 text-sm"
            >
              <FileText className="h-4 w-4 mr-1" />
              Report
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-amber-600 to-amber-500 shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] hover:shadow-amber-500/40 h-9 text-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Maintenance
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">
                    {maintenanceRecords.length}
                  </p>
                </div>
                <div className="rounded-full bg-blue-500/20 p-2">
                  <HardHat className="h-5 w-5 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">
                    {
                      maintenanceRecords.filter(
                        (r) => r.status === "In Progress",
                      ).length
                    }
                  </p>
                </div>
                <div className="rounded-full bg-yellow-500/20 p-2">
                  <RefreshCw className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">
                    {
                      maintenanceRecords.filter((r) => r.status === "Completed")
                        .length
                    }
                  </p>
                </div>
                <div className="rounded-full bg-green-500/20 p-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Dismantled</p>
                  <p className="text-2xl font-bold">
                    {
                      maintenanceRecords.filter((r) => r.type === "Dismantle")
                        .length
                    }
                  </p>
                </div>
                <div className="rounded-full bg-purple-500/20 p-2">
                  <Scissors className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-red-500/10 to-red-500/5 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      maintenanceRecords.reduce((sum, r) => sum + r.cost, 0),
                    )}
                  </p>
                </div>
                <div className="rounded-full bg-red-500/20 p-2">
                  <IndianRupee className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm bg-background/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search maintenance records..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="h-9 w-[130px] rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="All">All Types</option>
                  {MAINTENANCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-9 w-[130px] rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="All">All Status</option>
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("All");
                  setFilterStatus("All");
                }}
                className="h-9"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Records Table */}
        <Card className="border-0 shadow-sm bg-background/60 backdrop-blur-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Product
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Loading maintenance records...
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No maintenance records found
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-border hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs">
                          {record.id}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{record.assetName}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.assetId}
                              {record.serialNumber
                                ? ` • S/N: ${record.serialNumber}`
                                : ""}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`border ${getTypeColor(record.type)} px-2 py-0.5 text-xs font-medium`}
                          >
                            {getTypeIcon(record.type)}
                            <span className="ml-1">{record.type}</span>
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {new Date(record.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate">
                          {record.description}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(record.cost)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsViewModalOpen(true);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Maintenance Report
                </DialogTitle>
                <DialogDescription>
                  Complete maintenance records with all details
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8"
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const headers = [
                      "Model Number",
                      "Asset Category",
                      "Product Serial Number",
                      "Assigned To",
                      "Approved By",
                      "Remarks",
                      "Status",
                    ];
                    const rows = maintenanceRecords.map((record) => {
                      const productDetails = getProductDetails(record.assetId);
                      return [
                        productDetails.model,
                        productDetails.category,
                        record.serialNumber || "N/A",
                        getAssignedTo(record),
                        getApprovedBy(record),
                        getRemarks(record),
                        `${record.type} - ${record.status}`,
                      ];
                    });

                    const csvContent = [
                      headers.join(","),
                      ...rows.map((row) => row.join(",")),
                    ].join("\n");

                    const blob = new Blob([csvContent], { type: "text/csv" });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `maintenance_report_${new Date().toISOString().slice(0, 10)}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);

                    toast.success("Report exported successfully!");
                  }}
                  className="h-8"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4">
            {maintenanceRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No maintenance records found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Model Number
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Asset Category
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Product Serial Number
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Assigned To
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Approved By
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Remarks
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRecords.map((record) => {
                      const productDetails = getProductDetails(record.assetId);
                      return (
                        <tr
                          key={record.id}
                          className="border-b border-border hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs">
                            {productDetails.model}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-xs">
                              {productDetails.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {record.serialNumber || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getAssignedTo(record)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getApprovedBy(record)}
                          </td>
                          <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                            {getRemarks(record)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              className={`border ${getTypeColor(record.type)} px-2 py-0.5 text-xs font-medium`}
                            >
                              {getTypeIcon(record.type)}
                              <span className="ml-1">{record.type}</span>
                              <span className="mx-1 text-muted-foreground">
                                •
                              </span>
                              {getStatusBadge(record.status)}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground text-right">
              Total Records: {maintenanceRecords.length} | Generated:{" "}
              {new Date().toLocaleString("en-IN")}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReportModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Maintenance Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Hammer className="h-5 w-5 text-amber-500" />
              New Maintenance Record
            </DialogTitle>
            <DialogDescription>
              Record a repair, replacement, retirement, or dismantling for a
              product
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product selection - Full width */}
              <SearchableSelect
                options={productOptions}
                value={formData.assetId}
                onChange={(value) =>
                  setFormData({ ...formData, assetId: value, serialNumber: "" })
                }
                label="Product"
                placeholder="Search for a product..."
                searchPlaceholder="Search IT hardware assets & equipment..."
                emptyLabel="No IT hardware assets found"
                required={true}
                className="md:col-span-2"
              />

              {/* Serial Number - Full width */}
              <div className="md:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground">
                    Serial Number
                  </label>
                  {formData.assetId && (
                    <button
                      type="button"
                      onClick={() => setSerialRefreshTick((n) => n + 1)}
                      disabled={isLoadingSerials}
                      className="text-[11px] text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${isLoadingSerials ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </button>
                  )}
                </div>
                <SearchableSelect
                  options={serialSelectOptions}
                  value={formData.serialNumber}
                  onChange={handleSerialChange}
                  placeholder={
                    !formData.assetId
                      ? "Select a product first"
                      : isLoadingSerials
                        ? "Loading serial numbers..."
                        : serialSelectOptions.length === 0
                          ? "No serial numbers found for this product"
                          : "Search and select serial number..."
                  }
                  searchPlaceholder="Search serial numbers..."
                  emptyLabel="No serial numbers found"
                  disabled={!formData.assetId}
                />

                {formData.serialNumber && (
                  <div className="mt-2 p-2 rounded-lg bg-muted/30 border border-border">
                    {(() => {
                      const entry = serialOptions.find(
                        (s) => s.value === formData.serialNumber,
                      );
                      const status = getWarrantyStatus(entry);
                      if (!status) {
                        return (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            No warranty information available for this serial
                            number
                          </p>
                        );
                      }
                      if (status.remainingDays === null) {
                        return (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-blue-500" />
                            Warranty: {status.warrantyText}
                          </p>
                        );
                      }
                      if (status.expired) {
                        return (
                          <p className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Warranty expired {Math.abs(
                              status.remainingDays,
                            )}{" "}
                            days ago
                          </p>
                        );
                      }
                      return (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Warranty: {status.remainingDays} days remaining
                        </p>
                      );
                    })()}
                  </div>
                )}

                {formData.assetId &&
                !isLoadingSerials &&
                serialSelectOptions.length === 0 ? (
                  <p className="text-[11px] text-amber-600 flex items-start gap-1">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    No serial numbers on record for this product. Serials are
                    only captured for stock added via the Stock In Assets intake
                    page.
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Barcode className="h-3 w-3" />
                    Pulled from Stock In Asset intake records for this product
                  </p>
                )}
              </div>

              {/* Maintenance Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Maintenance Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      type: e.target.value as MaintenanceRecord["type"],
                    })
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {MAINTENANCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Cost - Optional for Dismantle */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Cost (₹){" "}
                  {formData.type !== "Dismantle" && (
                    <span className="text-red-500">*</span>
                  )}
                  {formData.type === "Dismantle" && (
                    <span className="text-xs text-muted-foreground">
                      (Optional)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({ ...formData, cost: e.target.value })
                    }
                    placeholder={
                      formData.type === "Dismantle" ? "Optional" : "0.00"
                    }
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required={formData.type !== "Dismantle"}
                  />
                </div>
              </div>

              {/* Vendor */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Vendor / Service Provider
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) =>
                      setFormData({ ...formData, vendor: e.target.value })
                    }
                    placeholder="Vendor name"
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Vendor Contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Vendor Contact
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.vendorContact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vendorContact: e.target.value,
                      })
                    }
                    placeholder="Contact person & number"
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as MaintenanceRecord["status"],
                    })
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Notes
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional notes..."
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Description - Full width */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Description{" "}
                  {formData.type !== "Dismantle" && (
                    <span className="text-red-500">*</span>
                  )}
                  {formData.type === "Dismantle" && (
                    <span className="text-xs text-muted-foreground">
                      (Optional - auto-generated if empty)
                    </span>
                  )}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder={
                    formData.type === "Dismantle"
                      ? "Optional description..."
                      : "Describe the maintenance issue or reason"
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[60px]"
                  required={formData.type !== "Dismantle"}
                />
              </div>
            </div>

            {/* Dynamic Fields Based on Type */}
            {formData.type === "Repair" && (
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-500" />
                  Repair Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Issue Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.issue}
                      onChange={(e) =>
                        setFormData({ ...formData, issue: e.target.value })
                      }
                      placeholder="Describe the issue in detail"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[50px]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Parts Replaced
                    </label>
                    <input
                      type="text"
                      value={formData.partsReplaced}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          partsReplaced: e.target.value,
                        })
                      }
                      placeholder="Screen, Battery, etc. (comma separated)"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Technician Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.technician}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            technician: e.target.value,
                          })
                        }
                        placeholder="Technician name"
                        className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Labor Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.laborCost}
                      onChange={(e) =>
                        setFormData({ ...formData, laborCost: e.target.value })
                      }
                      placeholder="0.00"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Parts Cost (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.partsCost}
                      onChange={(e) =>
                        setFormData({ ...formData, partsCost: e.target.value })
                      }
                      placeholder="0.00"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={formData.estimatedTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimatedTime: e.target.value,
                        })
                      }
                      placeholder="e.g., 2 hours, 1 day"
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="space-y-1.5 flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.warrantyClaim}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData({ ...formData, warrantyClaim: checked });
                          if (checked) {
                            checkWarrantyForSelectedSerial();
                          }
                        }}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">
                        Warranty Claim
                      </span>
                    </label>
                    {formData.warrantyClaim && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={checkWarrantyForSelectedSerial}
                        className="h-7 px-2 text-xs text-primary"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                        Check Warranty
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formData.type === "Replace" && (
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-orange-500" />
                  Replacement Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Reason for Replacement{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.replaceReason}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          replaceReason: e.target.value,
                        })
                      }
                      placeholder="Why is this product being replaced?"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[50px]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Disposal Method
                    </label>
                    <select
                      value={formData.disposalMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          disposalMethod: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select disposal method</option>
                      <option value="Recycle">Recycle</option>
                      <option value="Scrap">Scrap</option>
                      <option value="Donate">Donate</option>
                      <option value="Return to Vendor">Return to Vendor</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {formData.type === "Retire" && (
              <div className="space-y-4 border-t border-border pt-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Retirement Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Reason for Retirement{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.retireReason}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          retireReason: e.target.value,
                        })
                      }
                      placeholder="Why is this product being retired?"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[50px]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Disposal Method <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.disposalMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          disposalMethod: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                    >
                      <option value="">Select disposal method</option>
                      <option value="Scrap">Scrap</option>
                      <option value="Recycle">Recycle</option>
                      <option value="Donate">Donate</option>
                      <option value="Auction">Auction</option>
                      <option value="Return to Vendor">Return to Vendor</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Salvage Value (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.salvageValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salvageValue: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Retired By
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.retiredBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            retiredBy: e.target.value,
                          })
                        }
                        placeholder="Person authorizing retirement"
                        className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {formData.type === "Dismantle" && (
              <div className="space-y-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-purple-500" />
                    Dismantle Details
                  </h4>
                  <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">
                    <Package className="h-3 w-3 mr-1" />
                    Parts Recovery
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Reason for Dismantling{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.dismantleReason}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dismantleReason: e.target.value,
                        })
                      }
                      placeholder="Why is this product being dismantled? (e.g., end of life, salvage parts, upgrade)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[50px]"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Parts Recovered
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.partsRecovered}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partsRecovered: e.target.value,
                          })
                        }
                        placeholder="CPU, RAM, Storage, Power Supply, etc. (comma separated)"
                        className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      List all usable parts recovered from dismantling
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Recovery Value (₹)
                    </label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.recoveryValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            recoveryValue: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estimated value of recovered parts
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Disposal Method
                    </label>
                    <select
                      value={formData.dismantleDisposalMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          dismantleDisposalMethod: e.target.value,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select disposal method</option>
                      <option value="Recycle">♻️ Recycle</option>
                      <option value="Scrap">🗑️ Scrap</option>
                      <option value="Donate">🎁 Donate</option>
                      <option value="Landfill">🏭 Landfill</option>
                      <option value="Return to Vendor">
                        📦 Return to Vendor
                      </option>
                      <option value="E-Waste">💻 E-Waste Recycling</option>
                      <option value="Other">📌 Other</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      How will the remaining materials be disposed?
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Dismantled By
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.dismantledBy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dismantledBy: e.target.value,
                          })
                        }
                        placeholder="Person performing dismantling"
                        className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      Location
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            location: e.target.value,
                          })
                        }
                        placeholder="Workshop, Warehouse, etc."
                        className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      Environmental & Safety Notes
                    </label>
                    <textarea
                      value={formData.environmentalNotes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          environmentalNotes: e.target.value,
                        })
                      }
                      placeholder="Any environmental concerns, safety precautions, or special handling requirements..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[50px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Note any hazardous materials, recycling requirements, or
                      safety protocols
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                <Save className="h-4 w-4 mr-2" />
                Create Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Maintenance Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Maintenance Record Details
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.id} - {selectedRecord?.assetName}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <Badge
                    className={`border ${getTypeColor(selectedRecord.type)} px-2 py-0.5 text-xs font-medium mt-1`}
                  >
                    {getTypeIcon(selectedRecord.type)}
                    <span className="ml-1">{selectedRecord.type}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                </div>
                {selectedRecord.serialNumber && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Serial Number
                    </p>
                    <p className="text-sm font-mono font-medium mt-1">
                      {selectedRecord.serialNumber}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium mt-1">
                    {new Date(selectedRecord.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="text-sm font-medium text-red-600 mt-1">
                    {formatCurrency(selectedRecord.cost)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm mt-1">{selectedRecord.description}</p>
                </div>
              </div>

              {selectedRecord.vendor && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-2">
                    Vendor Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Vendor</p>
                      <p className="text-sm mt-1">{selectedRecord.vendor}</p>
                    </div>
                    {selectedRecord.vendorContact && (
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="text-sm mt-1">
                          {selectedRecord.vendorContact}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRecord.repairDetails && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Wrench className="h-4 w-4 text-blue-500" />
                    Repair Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Issue</p>
                      <p className="text-sm mt-1">
                        {selectedRecord.repairDetails.issue}
                      </p>
                    </div>
                    {selectedRecord.repairDetails.partsReplaced &&
                      selectedRecord.repairDetails.partsReplaced.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Parts Replaced
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRecord.repairDetails.partsReplaced.map(
                              (part, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {part}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {selectedRecord.repairDetails.laborCost !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Labor Cost
                        </p>
                        <p className="text-sm mt-1">
                          {formatCurrency(
                            selectedRecord.repairDetails.laborCost,
                          )}
                        </p>
                      </div>
                    )}
                    {selectedRecord.repairDetails.partsCost !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Parts Cost
                        </p>
                        <p className="text-sm mt-1">
                          {formatCurrency(
                            selectedRecord.repairDetails.partsCost,
                          )}
                        </p>
                      </div>
                    )}
                    {selectedRecord.repairDetails.technician && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Technician
                        </p>
                        <p className="text-sm mt-1">
                          {selectedRecord.repairDetails.technician}
                        </p>
                      </div>
                    )}
                    {selectedRecord.repairDetails.estimatedTime && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Estimated Time
                        </p>
                        <p className="text-sm mt-1">
                          {selectedRecord.repairDetails.estimatedTime}
                        </p>
                      </div>
                    )}
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">
                        Warranty Claim
                      </p>
                      <p className="text-sm mt-1">
                        {selectedRecord.repairDetails.warrantyClaim
                          ? "Yes"
                          : "No"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedRecord.replaceDetails && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-orange-500" />
                    Replacement Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Reason</p>
                      <p className="text-sm mt-1">
                        {selectedRecord.replaceDetails.reason}
                      </p>
                    </div>
                    {selectedRecord.replaceDetails.disposalMethod && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Disposal Method
                        </p>
                        <p className="text-sm mt-1">
                          {selectedRecord.replaceDetails.disposalMethod}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRecord.retireDetails && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    Retirement Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Reason</p>
                      <p className="text-sm mt-1">
                        {selectedRecord.retireDetails.reason}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Disposal Method
                      </p>
                      <p className="text-sm mt-1">
                        {selectedRecord.retireDetails.disposalMethod}
                      </p>
                    </div>
                    {selectedRecord.retireDetails.salvageValue !==
                      undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Salvage Value
                        </p>
                        <p className="text-sm mt-1">
                          {formatCurrency(
                            selectedRecord.retireDetails.salvageValue,
                          )}
                        </p>
                      </div>
                    )}
                    {selectedRecord.retireDetails.retiredBy && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Retired By
                        </p>
                        <p className="text-sm mt-1">
                          {selectedRecord.retireDetails.retiredBy}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRecord.dismantleDetails && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <Scissors className="h-4 w-4 text-purple-500" />
                    Dismantle Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Reason</p>
                      <p className="text-sm mt-1">
                        {selectedRecord.dismantleDetails.reason}
                      </p>
                    </div>
                    {selectedRecord.dismantleDetails.partsRecovered &&
                      selectedRecord.dismantleDetails.partsRecovered.length >
                        0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Parts Recovered
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedRecord.dismantleDetails.partsRecovered.map(
                              (part, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs bg-purple-500/5"
                                >
                                  <Package className="h-3 w-3 mr-1" />
                                  {part}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {selectedRecord.dismantleDetails.recoveryValue !==
                      undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Recovery Value
                        </p>
                        <p className="text-sm mt-1 text-green-600 font-medium">
                          {formatCurrency(
                            selectedRecord.dismantleDetails.recoveryValue,
                          )}
                        </p>
                      </div>
                    )}
                    {selectedRecord.dismantleDetails.disposalMethod && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Disposal Method
                        </p>
                        <p className="text-sm mt-1">
                          {selectedRecord.dismantleDetails.disposalMethod}
                        </p>
                      </div>
                    )}
                    {selectedRecord.dismantleDetails.dismantledBy && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Dismantled By
                        </p>
                        <p className="text-sm mt-1">
                          {selectedRecord.dismantleDetails.dismantledBy}
                        </p>
                      </div>
                    )}
                    {selectedRecord.dismantleDetails.location && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Location
                        </p>
                        <p className="text-sm mt-1">
                          {selectedRecord.dismantleDetails.location}
                        </p>
                      </div>
                    )}
                    {selectedRecord.dismantleDetails.environmentalNotes && (
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          Environmental & Safety Notes
                        </p>
                        <p className="text-sm mt-1">
                          {selectedRecord.dismantleDetails.environmentalNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedRecord.notes && (
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedRecord.notes}
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
