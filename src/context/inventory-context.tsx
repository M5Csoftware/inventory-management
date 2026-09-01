"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./auth-context";

export interface ProductSupplierEntry {
  supplierName: string;
  rate: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: Record<string, number>;
  threshold: number;
  supplier: string;
  suppliersList?: ProductSupplierEntry[];
  sku?: string;
  description?: string;
  status?: string;
  uomValue?: number;
  uom?: string;
  packaging?: string;
  weight?: number;
  dimensions?: string;
}

export interface Transaction {
  id: string;
  date: string;
  purchaseDate?: string; // Added: Purchase date from the Stock In form
  productId: string;
  productName: string;
  type: "Stock In" | "Stock Out";
  quantity: number;
  reasonOrLocation: string;
  notes?: string;
  amount?: number; // Added: Amount/Price from the Stock In form
  supplier?: string; // Added: Supplier from the Stock In form
  invoiceNumber?: string; // Added: Invoice number from the Stock In form
  model?: string; // Added: Model from the Stock In form
  serialNumber?: string; // Added: Serial number from the Stock In form
}

export interface Category {
  name: string;
  description: string;
  isAsset?: boolean;
  parentCategory?: string;
  categoryCode?: string;
}

export interface Supplier {
  name: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
  branch?: string;
  taxId?: string;
  website?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  receivedQuantity?: number;
}

export interface Order {
  id: string;
  supplier: string;
  items: OrderItem[];
  status: "Pending" | "Processing" | "Completed" | "Cancelled" | "Partial";
  totalAmount: number;
  branch?: string;
  createdAt?: string;
}

export const BRANCHES = [
  "Ahmedabad",
  "Ludhiana",
  "Delhi",
  "Mumbai",
] as const;

export const ASSET_DEPARTMENTS = [
  "Operations",
  "Collections",
  "Customer support",
  "Sales",
  "Sales support",
  "MIS",
  "Accounts",
  "Billing",
  "HR",
  "Management",
] as const;

export const ASSET_APPROVED_BY = [
  "Dheeraj",
  "Chirag",
  "Neha",
  "Mandeep",
  "Sangeeta",
  "Rahul",
] as const;

export interface AssetAssignment {
  id: string;
  productId: string;
  productName: string;
  assignedTo: string;
  department?: string;
  approvedBy?: string;
  branch?: string;
  modelNumber?: string;
  serialNumber?: string;
  assignedDate: string;
  returnedDate?: string;
  status: "Assigned" | "Returned";
  quantity: number;
  notes?: string;
  warranty?: string;
}

export interface AssetSerialItem {
  id: string;
  productId: string;
  productName: string;
  serialNumber: string;
  model?: string;
  warranty?: string;
  purchaseDate?: string;
  invoiceNumber?: string;
  supplier?: string;
  branch: string;
  amount?: number;
  status: "In Stock" | "Assigned" | "Maintenance" | "Retired" | "Dismantled";
  notes?: string;
  assignedTo?: string;
  assignedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Add this interface after AssetAssignment
export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  type: "Repair" | "Replace" | "Retire";
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
  status: "Pending" | "In Progress" | "Completed" | "Cancelled";
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  attachments?: string[];
  notes?: string;
}

export interface PhysicalVerificationItem {
  productId: string;
  productName: string;
  category?: string;
  invoicedQuantity: number;
  physicalQuantity: number;
  variance: number; // physicalQuantity - invoicedQuantity
  status: 'Matched' | 'Shortage' | 'Excess';
  condition: 'Good Condition' | 'Damaged' | 'Packaging Defect' | 'Seal Broken' | 'Other';
  notes?: string;
}

export interface PhysicalVerificationRecord {
  id: string;
  invoiceNumber?: string;
  poNumber?: string;
  supplier?: string;
  branch: string;
  verifiedBy: string;
  verifiedAt: string;
  items: PhysicalVerificationItem[];
  overallStatus: 'Matched' | 'Discrepancy';
  generalNotes?: string;
  createdAt: string;
}

interface InventoryContextType {
  activeBranch: string;
  setActiveBranch: (branch: string) => void;
  products: Product[];
  transactions: Transaction[];
  categories: Category[];
  suppliers: Supplier[];
  orders: Order[];
  assets: AssetAssignment[];
  physicalVerifications: PhysicalVerificationRecord[];
  addPhysicalVerification: (record: Omit<PhysicalVerificationRecord, 'id' | 'createdAt'>) => Promise<void>;
  deletePhysicalVerification: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, "id" | "createdAt">) => Promise<void>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  recordTransaction: (
    productId: string,
    type: "Stock In" | "Stock Out",
    quantity: number,
    reasonOrLocation: string,
    notes?: string,
    additionalData?: {
      purchaseDate?: string;
      amount?: number;
      supplier?: string;
      invoiceNumber?: string;
      model?: string;
      serialNumber?: string;
      branch?: string;
    },
  ) => Promise<boolean>;
  transferStock: (
    productId: string,
    quantity: number,
    toBranch: string,
    notes?: string,
  ) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  updateCategory: (name: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  updateSupplier: (name: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (name: string) => Promise<void>;
  assignAsset: (
    asset: Omit<
      AssetAssignment,
      "id" | "assignedDate" | "status" | "returnedDate"
    >,
  ) => Promise<boolean>;
  returnAsset: (id: string) => Promise<boolean>;
  updateAssetAssignment: (id: string, updates: Partial<AssetAssignment>) => Promise<boolean>;
  deleteAssetAssignment: (id: string) => Promise<boolean>;
  assetSerials: AssetSerialItem[];
  fetchAssetSerials: () => Promise<void>;
  addAssetSerial: (item: Omit<AssetSerialItem, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateAssetSerial: (id: string, updates: Partial<AssetSerialItem>) => Promise<boolean>;
  deleteAssetSerial: (id: string) => Promise<boolean>;
  revertAuditLog: (id: string, reason?: string, password?: string) => Promise<boolean>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined,
);

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/inventory";
const getDbHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "x-database": "m5c-inventory",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const getNoBodyHeader = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "x-database": "m5c-inventory",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const DB_HEADER = new Proxy({}, {
  get(_, prop) {
    return (getDbHeader() as any)[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getDbHeader());
  },
  getOwnPropertyDescriptor(_, prop) {
    return Reflect.getOwnPropertyDescriptor(getDbHeader(), prop);
  },
}) as Record<string, string>;

const NO_BODY_HEADER = new Proxy({}, {
  get(_, prop) {
    return (getNoBodyHeader() as any)[prop];
  },
  ownKeys() {
    return Reflect.ownKeys(getNoBodyHeader());
  },
  getOwnPropertyDescriptor(_, prop) {
    return Reflect.getOwnPropertyDescriptor(getNoBodyHeader(), prop);
  },
}) as Record<string, string>;

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [activeBranch, setActiveBranchState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("activeBranch");
      if (saved) return saved;
    }
    return "Ahmedabad";
  });

  const setActiveBranch = (branch: string) => {
    setActiveBranchState(branch);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeBranch", branch);
    }
  };

  // Synchronize activeBranch with user's assigned branch or saved preference on mount/change
  useEffect(() => {
    if (!user) return;

    const isRestrictedUser =
      user.branch &&
      user.branch !== "All" &&
      user.role !== "admin" &&
      user.role !== "master" &&
      user.id !== "master";

    if (isRestrictedUser) {
      setActiveBranchState(user.branch);
      if (typeof window !== "undefined") {
        localStorage.setItem("activeBranch", user.branch);
      }
    } else {
      const savedBranch =
        typeof window !== "undefined" ? localStorage.getItem("activeBranch") : null;
      if (savedBranch) {
        setActiveBranchState(savedBranch);
      } else if (user.branch) {
        setActiveBranchState(user.branch);
        if (typeof window !== "undefined") {
          localStorage.setItem("activeBranch", user.branch);
        }
      }
    }
  }, [user]);

  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [assets, setAssets] = useState<AssetAssignment[]>([]);
  const [assetSerials, setAssetSerials] = useState<AssetSerialItem[]>([]);
  const [physicalVerifications, setPhysicalVerifications] = useState<PhysicalVerificationRecord[]>([]);

  // Load physical verifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("physical_verifications_data");
        if (stored) {
          setPhysicalVerifications(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load physical verifications:", e);
      }
    }
  }, []);

  // Fetch initial data
  const fetchData = async () => {
    if (!user) return; // Don't fetch until user is loaded

    try {
      const branchQuery =
        activeBranch !== "All" ? `?branch=${activeBranch}` : "";

      const safeFetchJson = async (url: string, options?: RequestInit) => {
        try {
          const res = await fetch(url, options);
          if (!res.ok) return { success: false, data: [] };
          return await res.json();
        } catch {
          return { success: false, data: [] };
        }
      };

      const [prods, txs, cats, sups, ords, asts, serials] = await Promise.all([
        safeFetchJson(`${API_BASE}/products${branchQuery}`, {
          headers: NO_BODY_HEADER,
        }),
        safeFetchJson(`${API_BASE}/transactions${branchQuery}`, {
          headers: NO_BODY_HEADER,
        }),
        safeFetchJson(`${API_BASE}/categories`, { headers: NO_BODY_HEADER }),
        safeFetchJson(`${API_BASE}/suppliers`, { headers: NO_BODY_HEADER }),
        safeFetchJson(`${API_BASE}/orders${branchQuery}`, {
          headers: NO_BODY_HEADER,
        }),
        safeFetchJson(`${API_BASE}/assets${branchQuery}`, {
          headers: NO_BODY_HEADER,
        }),
        safeFetchJson(`${API_BASE}/asset-serials${branchQuery}`, {
          headers: NO_BODY_HEADER,
        }),
      ]);

      if (prods?.success) setProducts(prods.data);
      if (txs?.success) {
        const sortedTxs = [...txs.data].sort((a, b) => {
          const timeA = new Date(a.date || (a as any).createdAt || 0).getTime();
          const timeB = new Date(b.date || (b as any).createdAt || 0).getTime();
          return timeB - timeA;
        });
        setTransactions(sortedTxs);
      }
      if (cats?.success) setCategories(cats.data);
      if (sups?.success) setSuppliers(sups.data);
      if (ords?.success) {
        const sortedOrds = [...ords.data].sort((a, b) => {
          const timeA = new Date(a.createdAt || 0).getTime();
          const timeB = new Date(b.createdAt || 0).getTime();
          return timeB - timeA;
        });
        setOrders(sortedOrds);
      }
      if (asts?.success) {
        const sortedAsts = [...asts.data].sort((a, b) => {
          const timeA = new Date(a.assignedDate || (a as any).createdAt || 0).getTime();
          const timeB = new Date(b.assignedDate || (b as any).createdAt || 0).getTime();
          return timeB - timeA;
        });
        setAssets(sortedAsts);
      }
      if (serials?.success) {
        const sortedSerials = [...serials.data].sort((a, b) => {
          const timeA = new Date(a.createdAt || a.purchaseDate || 0).getTime();
          const timeB = new Date(b.createdAt || b.purchaseDate || 0).getTime();
          return timeB - timeA;
        });
        setAssetSerials(sortedSerials);
      }
    } catch (error) {
      console.error("Failed to load inventory data from backend:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranch, user]);

  const inFlightLocks = useRef(new Set<string>());

  const withLock = async <T,>(
    key: string,
    fn: () => Promise<T>,
    fallback: T,
  ): Promise<T> => {
    if (inFlightLocks.current.has(key)) {
      console.warn(
        `[Double-Click Prevention] Blocked duplicate action: ${key}`,
      );
      return fallback;
    }
    inFlightLocks.current.add(key);
    try {
      return await fn();
    } finally {
      setTimeout(() => {
        inFlightLocks.current.delete(key);
      }, 1000);
    }
  };

  const addProduct = async (newProduct: Omit<Product, "id">) => {
    return withLock(
      `add-prod-${newProduct.name}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/products`, {
            method: "POST",
            headers: DB_HEADER,
            body: JSON.stringify({
              ...newProduct,
              branch:
                (newProduct as any).branch ||
                (activeBranch !== "All" ? activeBranch : "Ahmedabad"),
            }),
          });
          const data = await res.json();
          if (data.success) {
            await fetchData();
            toast.success("Product added successfully!");
          } else {
            toast.error(data.message || "Failed to add product.");
          }
        } catch (error) {
          console.error("Failed to add product:", error);
          toast.error("Network error while adding product.");
        }
      },
      undefined,
    );
  };

  const addCategory = async (category: Category) => {
    return withLock(
      `add-cat-${category.name}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/categories`, {
            method: "POST",
            headers: DB_HEADER,
            body: JSON.stringify(category),
          });
          const data = await res.json();
          if (data.success) {
            setCategories((prev) => [...prev, data.data]);
            toast.success("Category added successfully!");
          } else {
            toast.error(data.message || "Failed to add category.");
          }
        } catch (error) {
          console.error("Failed to add category:", error);
          toast.error("Network error while adding category.");
        }
      },
      undefined,
    );
  };

  const addSupplier = async (supplier: Supplier) => {
    return withLock(
      `add-sup-${supplier.name}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/suppliers`, {
            method: "POST",
            headers: DB_HEADER,
            body: JSON.stringify(supplier),
          });
          const data = await res.json();
          if (data.success) {
            setSuppliers((prev) => [...prev, data.data]);
            toast.success("Supplier added successfully!");
          } else {
            toast.error(data.message || "Failed to add supplier.");
          }
        } catch (error) {
          console.error("Failed to add supplier:", error);
          toast.error("Network error while adding supplier.");
        }
      },
      undefined,
    );
  };

  const deleteProduct = async (id: string) => {
    return withLock(
      `del-prod-${id}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/products/${id}`, {
            method: "DELETE",
            headers: NO_BODY_HEADER,
          });
          const data = await res.json();
          if (data.success) {
            setProducts((prev) => prev.filter((p) => p.id !== id));
            toast.success("Product deleted successfully!");
          } else {
            toast.error(data.message || "Failed to delete product.");
          }
        } catch (error) {
          console.error("Failed to delete product:", error);
          toast.error("Network error while deleting product.");
        }
      },
      undefined,
    );
  };

  const updateCategory = async (
    name: string,
    updatedCategory: Partial<Category>,
  ) => {
    return withLock(
      `upd-cat-${name}`,
      async () => {
        try {
          const res = await fetch(
            `${API_BASE}/categories/${encodeURIComponent(name)}`,
            {
              method: "PUT",
              headers: DB_HEADER,
              body: JSON.stringify(updatedCategory),
            },
          );
          const data = await res.json();
          if (data.success) {
            setCategories((prev) =>
              prev.map((c) => (c.name === name ? data.data : c)),
            );
            toast.success("Category updated successfully!");
          } else {
            toast.error(data.message || "Failed to update category.");
          }
        } catch (error) {
          console.error("Failed to update category:", error);
          toast.error("Network error while updating category.");
        }
      },
      undefined,
    );
  };

  const deleteCategory = async (name: string) => {
    return withLock(
      `del-cat-${name}`,
      async () => {
        try {
          const res = await fetch(
            `${API_BASE}/categories/${encodeURIComponent(name)}`,
            {
              method: "DELETE",
              headers: NO_BODY_HEADER,
            },
          );
          const data = await res.json();
          if (data.success) {
            setCategories((prev) => prev.filter((c) => c.name !== name));
            toast.success("Category deleted successfully!");
          } else {
            toast.error(data.message || "Failed to delete category.");
          }
        } catch (error) {
          console.error("Failed to delete category:", error);
          toast.error("Network error while deleting category.");
        }
      },
      undefined,
    );
  };

  const updateSupplier = async (
    name: string,
    updatedSupplier: Partial<Supplier>,
  ) => {
    return withLock(
      `upd-sup-${name}`,
      async () => {
        try {
          const res = await fetch(
            `${API_BASE}/suppliers/${encodeURIComponent(name)}`,
            {
              method: "PUT",
              headers: DB_HEADER,
              body: JSON.stringify(updatedSupplier),
            },
          );
          const data = await res.json();
          if (data.success) {
            setSuppliers((prev) =>
              prev.map((s) => (s.name === name ? data.data : s)),
            );
            toast.success("Supplier updated successfully!");
          } else {
            toast.error(data.message || "Failed to update supplier.");
          }
        } catch (error) {
          console.error("Failed to update supplier:", error);
          toast.error("Network error while updating supplier.");
        }
      },
      undefined,
    );
  };

  const deleteSupplier = async (name: string) => {
    return withLock(
      `del-sup-${name}`,
      async () => {
        try {
          const res = await fetch(
            `${API_BASE}/suppliers/${encodeURIComponent(name)}`,
            {
              method: "DELETE",
              headers: NO_BODY_HEADER,
            },
          );
          const data = await res.json();
          if (data.success) {
            setSuppliers((prev) => prev.filter((s) => s.name !== name));
            toast.success("Supplier deleted successfully!");
          } else {
            toast.error(data.message || "Failed to delete supplier.");
          }
        } catch (error) {
          console.error("Failed to delete supplier:", error);
          toast.error("Network error while deleting supplier.");
        }
      },
      undefined,
    );
  };

  const recordTransaction = async (
    productId: string,
    type: "Stock In" | "Stock Out",
    quantity: number,
    reasonOrLocation: string,
    notes?: string,
    additionalData?: {
      purchaseDate?: string;
      amount?: number;
      supplier?: string;
      invoiceNumber?: string;
      model?: string;
      serialNumber?: string;
      branch?: string;
    },
  ): Promise<boolean> => {
    const selectedBranch =
      additionalData?.branch ||
      (activeBranch === "All" ? "Ahmedabad" : activeBranch);

    const lockKey = `tx-${productId}-${type}-${quantity}-${selectedBranch}-${additionalData?.invoiceNumber || ""}-${additionalData?.model || ""}-${additionalData?.serialNumber || ""}`;

    return withLock(
      lockKey,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/transactions`, {
            method: "POST",
            headers: DB_HEADER,
            body: JSON.stringify({
              productId,
              type,
              quantity: Number(quantity) || 1,
              reasonOrLocation: reasonOrLocation || "",
              notes: notes || "",
              branch: selectedBranch,
              purchaseDate: additionalData?.purchaseDate,
              amount:
                additionalData?.amount !== undefined &&
                !isNaN(Number(additionalData.amount))
                  ? Number(additionalData.amount)
                  : undefined,
              supplier: additionalData?.supplier,
              invoiceNumber: additionalData?.invoiceNumber,
              model: additionalData?.model,
              serialNumber: additionalData?.serialNumber,
            }),
          });
          const data = await res.json();
          if (data.success) {
            await fetchData();
            toast.success(`${type} recorded successfully!`);
            return true;
          } else {
            toast.error(data.message || `Failed to record ${type}.`);
          }
        } catch (error) {
          console.error("Failed to record stock transaction:", error);
          toast.error("Network error while recording transaction.");
        }
        return false;
      },
      false,
    );
  };

  const updateProduct = async (
    id: string,
    updatedProduct: Partial<Product>,
  ) => {
    return withLock(
      `upd-prod-${id}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/products/${id}`, {
            method: "PUT",
            headers: DB_HEADER,
            body: JSON.stringify(updatedProduct),
          });
          const data = await res.json();
          if (data.success) {
            setProducts((prev) =>
              prev.map((p) => (p.id === id ? data.data : p)),
            );
            toast.success("Product updated successfully!");
          } else {
            toast.error(data.message || "Failed to update product.");
          }
        } catch (error) {
          console.error("Failed to update product:", error);
          toast.error("Network error while updating product.");
        }
      },
      undefined,
    );
  };

  const transferStock = async (
    productId: string,
    quantity: number,
    toBranch: string,
    notes?: string,
  ): Promise<boolean> => {
    if (activeBranch === toBranch) {
      toast.error("Cannot transfer to the same branch.");
      return false;
    }

    return withLock(
      `transfer-${productId}-${activeBranch}-${toBranch}-${quantity}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/transactions/transfer`, {
            method: "POST",
            headers: DB_HEADER,
            body: JSON.stringify({
              productId,
              quantity,
              fromBranch: activeBranch,
              toBranch,
              notes,
            }),
          });
          const data = await res.json();
          if (data.success) {
            await fetchData();
            toast.success("Stock transferred successfully!");
            return true;
          } else {
            toast.error(data.message || "Failed to transfer stock.");
            return false;
          }
        } catch (error) {
          console.error("Failed to transfer stock:", error);
          toast.error("Network error while transferring stock.");
          return false;
        }
      },
      false,
    );
  };

  const addOrder = async (order: Omit<Order, "id" | "createdAt">) => {
    return withLock(
      `add-order-${order.supplier}-${order.totalAmount}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/orders`, {
            method: "POST",
            headers: DB_HEADER,
            body: JSON.stringify({
              branch: activeBranch !== "All" ? activeBranch : "Delhi",
              ...order,
            }),
          });
          const data = await res.json();
          if (data.success) {
            await fetchData();
            toast.success("Order created successfully!");
          } else {
            toast.error(data.message || "Failed to create order.");
          }
        } catch (error) {
          console.error("Failed to create order:", error);
          toast.error("Network error while creating order.");
        }
      },
      undefined,
    );
  };

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    return withLock(
      `upd-order-${id}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/orders/${id}`, {
            method: "PUT",
            headers: DB_HEADER,
            body: JSON.stringify(orderData),
          });
          const data = await res.json();
          if (data.success) {
            await fetchData();
            toast.success("Order updated successfully!");
          } else {
            toast.error(data.message || "Failed to update order.");
          }
        } catch (error) {
          console.error("Failed to update order:", error);
          toast.error("Network error while updating order.");
        }
      },
      undefined,
    );
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    return withLock(
      `upd-order-status-${id}-${status}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/orders/${id}`, {
            method: "PUT",
            headers: DB_HEADER,
            body: JSON.stringify({ status }),
          });
          const data = await res.json();
          if (data.success) {
            await fetchData();
            toast.success("Order status updated!");
          } else {
            toast.error(data.message || "Failed to update order.");
          }
        } catch (error) {
          console.error("Failed to update order:", error);
          toast.error("Network error while updating order.");
        }
      },
      undefined,
    );
  };

  const deleteOrder = async (id: string) => {
    return withLock(
      `del-order-${id}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/orders/${id}`, {
            method: "DELETE",
            headers: NO_BODY_HEADER,
          });
          if (res.ok) {
            await fetchData();
            toast.success("Order deleted successfully!");
          } else {
            toast.error("Failed to delete order.");
          }
        } catch (error) {
          console.error("Failed to delete order:", error);
          toast.error("Network error while deleting order.");
        }
      },
      undefined,
    );
  };

  const assignAsset = async (
    asset: Omit<
      AssetAssignment,
      "id" | "assignedDate" | "status" | "returnedDate"
    >,
  ) => {
    const branchToUse =
      (asset as any).branch ||
      (activeBranch === "All" ? "Ahmedabad" : activeBranch);

    return withLock(
      `assign-asset-${asset.productId}-${asset.assignedTo}-${asset.serialNumber || ""}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/assets`, {
            method: "POST",
            headers: DB_HEADER,
            body: JSON.stringify({ ...asset, branch: branchToUse }),
          });
          const data = await res.json();
          if (data.success) {
            await fetchData();
            toast.success("Asset assigned successfully!");
            return true;
          } else {
            toast.error(data.message || "Failed to assign asset");
            return false;
          }
        } catch (error) {
          toast.error("An error occurred");
          return false;
        }
      },
      false,
    );
  };

  const returnAsset = async (id: string) => {
    return withLock(
      `return-asset-${id}`,
      async () => {
        try {
          const res = await fetch(`${API_BASE}/assets/${id}/return`, {
            method: "PUT",
            headers: NO_BODY_HEADER,
          });
          const data = await res.json();
          if (data.success) {
            await fetchData();
            toast.success("Asset returned successfully!");
            return true;
          } else {
            toast.error(data.message || "Failed to return asset");
            return false;
          }
        } catch (error) {
          toast.error("An error occurred");
          return false;
        }
      },
      false,
    );
  };

  const addPhysicalVerification = async (
    record: Omit<PhysicalVerificationRecord, "id" | "createdAt">
  ) => {
    const newRecord: PhysicalVerificationRecord = {
      ...record,
      id: `PV-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...physicalVerifications];
    setPhysicalVerifications(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("physical_verifications_data", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save physical verification to storage:", e);
      }
    }
    toast.success(`Physical verification recorded (${newRecord.id})! Note: Inventory stock is unchanged.`);
  };

  const deletePhysicalVerification = async (id: string) => {
    const updated = physicalVerifications.filter((r) => r.id !== id);
    setPhysicalVerifications(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("physical_verifications_data", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update physical verification storage:", e);
      }
    }
    toast.success("Physical verification record removed.");
  };

  const updateAssetAssignment = async (id: string, updates: Partial<AssetAssignment>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/assets/${id}`, {
        method: "PUT",
        headers: getDbHeader(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Asset assignment updated successfully!");
        await fetchData();
        return true;
      } else {
        toast.error(data.message || "Failed to update asset assignment");
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating asset assignment");
      return false;
    }
  };

  const deleteAssetAssignment = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/assets/${id}`, {
        method: "DELETE",
        headers: getDbHeader(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Asset assignment deleted successfully!");
        await fetchData();
        return true;
      } else {
        toast.error(data.message || "Failed to delete asset assignment");
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Error deleting asset assignment");
      return false;
    }
  };

  const fetchAssetSerials = async () => {
    try {
      const branchQuery = activeBranch !== "All" ? `?branch=${activeBranch}` : "";
      const res = await fetch(`${API_BASE}/asset-serials${branchQuery}`, {
        headers: getDbHeader(),
      });
      const data = await res.json();
      if (data.success) {
        setAssetSerials(data.data || []);
      }
    } catch (error) {
      console.warn("Could not fetch asset serials:", error);
    }
  };

  const addAssetSerial = async (
    item: Omit<AssetSerialItem, "id" | "createdAt" | "updatedAt">
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/asset-serials`, {
        method: "POST",
        headers: getDbHeader(),
        body: JSON.stringify(item),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Asset unit/serial registered successfully!");
        await fetchData();
        return true;
      } else {
        toast.error(data.message || "Failed to register asset serial");
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Error adding asset serial");
      return false;
    }
  };

  const updateAssetSerial = async (
    id: string,
    updates: Partial<AssetSerialItem>
  ): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/asset-serials/${id}`, {
        method: "PUT",
        headers: getDbHeader(),
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Asset unit/serial updated successfully!");
        await fetchData();
        return true;
      } else {
        toast.error(data.message || "Failed to update asset serial");
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating asset serial");
      return false;
    }
  };

  const deleteAssetSerial = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/asset-serials/${id}`, {
        method: "DELETE",
        headers: getDbHeader(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Asset unit/serial deleted successfully!");
        await fetchData();
        return true;
      } else {
        toast.error(data.message || "Failed to delete asset serial");
        return false;
      }
    } catch (error: any) {
      toast.error(error.message || "Error deleting asset serial");
      return false;
    }
  };

  const revertAuditLog = async (id: string, reason?: string, password?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/audit-logs/${id}/revert`, {
        method: "POST",
        headers: getDbHeader(),
        body: JSON.stringify({ reason, password }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Action successfully rolled back!");
        await fetchData();
        return true;
      } else {
        toast.error(data.message || "Failed to rollback action.");
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || "Error rolling back action.");
      return false;
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        activeBranch,
        setActiveBranch,
        products,
        transactions,
        categories,
        suppliers,
        orders,
        physicalVerifications,
        addPhysicalVerification,
        deletePhysicalVerification,
        addProduct,
        addCategory,
        addSupplier,
        addOrder,
        recordTransaction,
        transferStock,
        deleteProduct,
        updateProduct,
        updateCategory,
        deleteCategory,
        updateSupplier,
        deleteSupplier,
        updateOrder,
        updateOrderStatus,
        deleteOrder,
        assets,
        assignAsset,
        returnAsset,
        updateAssetAssignment,
        deleteAssetAssignment,
        assetSerials,
        fetchAssetSerials,
        addAssetSerial,
        updateAssetSerial,
        deleteAssetSerial,
        revertAuditLog,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
}
