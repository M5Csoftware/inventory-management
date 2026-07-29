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
  label,
  required = false,
  className = "",
}: {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
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
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search IT hardware assets & equipment..."
                  className="h-8 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                  No IT hardware assets found
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

export default function MaintenancePage() {
  const { assets, products, categories } = useInventory();
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

  // Form state for new maintenance record
  const [formData, setFormData] = useState({
    assetId: "",
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
    // Dismantle fields
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

    // Map of asset category names (where isAsset === true)
    const assetCategoryNames = new Set(
      categoryArray
        .filter((c) => c.isAsset === true)
        .map((c) => c.name.toLowerCase().trim())
    );

    // Hardware / IT Asset keywords
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

    // Non-asset consumables & packaging to strictly exclude
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

      // Exclude non-asset packaging/consumables (e.g. Bags, Boxes, Tapes)
      const isNonAsset = nonAssetKeywords.some(
        (kw) => catLower.includes(kw) || nameLower.includes(kw)
      );
      if (isNonAsset) return;

      // Include if it belongs to an asset category OR matches hardware equipment keywords
      const isExplicitAssetCat = assetCategoryNames.has(catLower);
      const isHardwareAsset = assetKeywords.some(
        (kw) => catLower.includes(kw) || nameLower.includes(kw)
      );

      if (isExplicitAssetCat || isHardwareAsset || (assetCategoryNames.size === 0 && !isNonAsset)) {
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
          0
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

  // Load maintenance records from the real API
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find the selected product
      const productArray = Array.isArray(products) ? products : [];
      const selectedProduct = productArray.find(
        (p: Product) => p.id === formData.assetId,
      );

      const payload: Record<string, any> = {
        assetId: formData.assetId,
        assetName: selectedProduct?.name || "Unknown Product",
        type: formData.type,
        date: formData.date,
        cost: parseFloat(formData.cost) || 0,
        description: formData.description,
        vendor: formData.vendor || undefined,
        vendorContact: formData.vendorContact || undefined,
        status: formData.status,
        notes: formData.notes || undefined,
      };

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

      const res = await fetch(`${API_BASE}/maintenance`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        setMaintenanceRecords([json.data, ...maintenanceRecords]);
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

  // Format currency in Rupees
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product selection with searchable dropdown - showing ALL products */}
              <SearchableSelect
                options={productOptions}
                value={formData.assetId}
                onChange={(value) =>
                  setFormData({ ...formData, assetId: value })
                }
                label="Product"
                placeholder="Search for a product..."
                required={true}
                className="md:col-span-2"
              />

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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Cost (₹) <span className="text-red-500">*</span>
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
                    placeholder="0.00"
                    className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe the maintenance issue or reason"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[60px]"
                  required
                />
              </div>

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

                  <div className="space-y-1.5 flex items-center">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.warrantyClaim}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            warrantyClaim: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">
                        Warranty Claim
                      </span>
                    </label>
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

            {/* Dismantle Section - NEW */}
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

              {/* Dismantle Details View */}
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
