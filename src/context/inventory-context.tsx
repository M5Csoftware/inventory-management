'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: Record<string, number>;
  threshold: number;
  supplier: string;
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
  productId: string;
  productName: string;
  type: 'Stock In' | 'Stock Out';
  quantity: number;
  reasonOrLocation: string;
  notes?: string;
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
  taxId?: string;
  website?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  supplier: string;
  items: OrderItem[];
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  totalAmount: number;
  createdAt?: string;
}

export interface AssetAssignment {
  id: string;
  productId: string;
  productName: string;
  assignedTo: string;
  assignedDate: string;
  returnedDate?: string;
  status: 'Assigned' | 'Returned';
  quantity: number;
  notes?: string;
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
  addOrder: (order: Omit<Order, 'id' | 'createdAt'>) => Promise<void>;
  updateOrder: (id: string, orderData: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  addSupplier: (supplier: Supplier) => Promise<void>;
  recordTransaction: (
    productId: string,
    type: 'Stock In' | 'Stock Out',
    quantity: number,
    reasonOrLocation: string,
    notes?: string
  ) => Promise<boolean>;
  transferStock: (
    productId: string,
    quantity: number,
    toBranch: string,
    notes?: string
  ) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  updateCategory: (name: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  updateSupplier: (name: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (name: string) => Promise<void>;
  assignAsset: (asset: Omit<AssetAssignment, 'id' | 'assignedDate' | 'status' | 'returnedDate'>) => Promise<boolean>;
  returnAsset: (id: string) => Promise<boolean>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/inventory';
const DB_HEADER = { 'x-database': 'm5c-inventory', 'Content-Type': 'application/json' };
const NO_BODY_HEADER = { 'x-database': 'm5c-inventory' };

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [activeBranch, setActiveBranch] = useState('Delhi'); // Default branch
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [assets, setAssets] = useState<AssetAssignment[]>([]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const branchQuery = activeBranch !== 'All' ? `?branch=${activeBranch}` : '';
      const [prodRes, txRes, catRes, supRes, ordRes, astsRes] = await Promise.all([
        fetch(`${API_BASE}/products`, { headers: NO_BODY_HEADER }),
        fetch(`${API_BASE}/transactions${branchQuery}`, { headers: NO_BODY_HEADER }),
        fetch(`${API_BASE}/categories`, { headers: NO_BODY_HEADER }),
        fetch(`${API_BASE}/suppliers`, { headers: NO_BODY_HEADER }),
        fetch(`${API_BASE}/orders${branchQuery}`, { headers: NO_BODY_HEADER }),
        fetch(`${API_BASE}/assets${branchQuery}`, { headers: NO_BODY_HEADER }),
      ]);

      const [prods, txs, cats, sups, ords, asts] = await Promise.all([
        prodRes.json(),
        txRes.json(),
        catRes.json(),
        supRes.json(),
        ordRes.json(),
        astsRes.json(),
      ]);

      if (prods.success) setProducts(prods.data);
      if (txs.success) setTransactions(txs.data);
      if (cats.success) setCategories(cats.data);
      if (sups.success) setSuppliers(sups.data);
      if (ords.success) setOrders(ords.data);
      if (asts.success) setAssets(asts.data);
    } catch (error) {
      console.error('Failed to load inventory data from backend:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeBranch]);

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: DB_HEADER,
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast.success('Product added successfully!');
      } else {
        toast.error(data.message || 'Failed to add product.');
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Network error while adding product.');
    }
  };

  const addCategory = async (category: Category) => {
    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: DB_HEADER,
        body: JSON.stringify(category),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => [...prev, data.data]);
        toast.success('Category added successfully!');
      } else {
        toast.error(data.message || 'Failed to add category.');
      }
    } catch (error) {
      console.error('Failed to add category:', error);
      toast.error('Network error while adding category.');
    }
  };

  const addSupplier = async (supplier: Supplier) => {
    try {
      const res = await fetch(`${API_BASE}/suppliers`, {
        method: 'POST',
        headers: DB_HEADER,
        body: JSON.stringify(supplier),
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers((prev) => [...prev, data.data]);
        toast.success('Supplier added successfully!');
      } else {
        toast.error(data.message || 'Failed to add supplier.');
      }
    } catch (error) {
      console.error('Failed to add supplier:', error);
      toast.error('Network error while adding supplier.');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: NO_BODY_HEADER,
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success('Product deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete product.');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Network error while deleting product.');
    }
  };

  const updateCategory = async (name: string, updatedCategory: Partial<Category>) => {
    try {
      const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: DB_HEADER,
        body: JSON.stringify(updatedCategory),
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.map((c) => c.name === name ? data.data : c));
        toast.success('Category updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update category.');
      }
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error('Network error while updating category.');
    }
  };

  const deleteCategory = async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: NO_BODY_HEADER,
      });
      const data = await res.json();
      if (data.success) {
        setCategories((prev) => prev.filter((c) => c.name !== name));
        toast.success('Category deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete category.');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast.error('Network error while deleting category.');
    }
  };

  const updateSupplier = async (name: string, updatedSupplier: Partial<Supplier>) => {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${encodeURIComponent(name)}`, {
        method: 'PUT',
        headers: DB_HEADER,
        body: JSON.stringify(updatedSupplier),
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers((prev) => prev.map((s) => s.name === name ? data.data : s));
        toast.success('Supplier updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update supplier.');
      }
    } catch (error) {
      console.error('Failed to update supplier:', error);
      toast.error('Network error while updating supplier.');
    }
  };

  const deleteSupplier = async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: NO_BODY_HEADER,
      });
      const data = await res.json();
      if (data.success) {
        setSuppliers((prev) => prev.filter((s) => s.name !== name));
        toast.success('Supplier deleted successfully!');
      } else {
        toast.error(data.message || 'Failed to delete supplier.');
      }
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      toast.error('Network error while deleting supplier.');
    }
  };

  const recordTransaction = async (
    productId: string,
    type: 'Stock In' | 'Stock Out',
    quantity: number,
    reasonOrLocation: string,
    notes?: string
  ): Promise<boolean> => {
    if (activeBranch === 'All') {
      toast.error('Please select a specific branch to record transactions.');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: DB_HEADER,
        body: JSON.stringify({
          productId,
          type,
          quantity,
          reasonOrLocation,
          notes,
          branch: activeBranch
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
      console.error('Failed to record stock transaction:', error);
      toast.error('Network error while recording transaction.');
    }
    return false;
  };

  const updateProduct = async (id: string, updatedProduct: Partial<Product>) => {
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: DB_HEADER,
        body: JSON.stringify(updatedProduct),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.map((p) => p.id === id ? data.data : p));
        toast.success('Product updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update product.');
      }
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Network error while updating product.');
    }
  };

  const transferStock = async (
    productId: string,
    quantity: number,
    toBranch: string,
    notes?: string
  ): Promise<boolean> => {
    if (activeBranch === 'All') {
      toast.error('Please select a source branch for the transfer.');
      return false;
    }
    if (activeBranch === toBranch) {
      toast.error('Cannot transfer to the same branch.');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/transactions/transfer`, {
        method: 'POST',
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
        toast.success('Stock transferred successfully!');
        return true;
      } else {
        toast.error(data.message || 'Failed to transfer stock.');
        return false;
      }
    } catch (error) {
      console.error('Failed to transfer stock:', error);
      toast.error('Network error while transferring stock.');
      return false;
    }
  };

  const addOrder = async (order: Omit<Order, 'id' | 'createdAt'>) => {
    if (activeBranch === 'All') {
      toast.error('Please select a specific branch to create orders.');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: DB_HEADER,
        body: JSON.stringify({ ...order, branch: activeBranch }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast.success('Order created successfully!');
      } else {
        toast.error(data.message || 'Failed to create order.');
      }
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error('Network error while creating order.');
    }
  };

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'PUT',
        headers: DB_HEADER,
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast.success('Order updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update order.');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Network error while updating order.');
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'PUT',
        headers: DB_HEADER,
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast.success('Order status updated!');
      } else {
        toast.error(data.message || 'Failed to update order.');
      }
    } catch (error) {
      console.error('Failed to update order:', error);
      toast.error('Network error while updating order.');
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'DELETE',
        headers: NO_BODY_HEADER,
      });
      if (res.ok) {
        await fetchData();
        toast.success('Order deleted successfully!');
      } else {
        toast.error('Failed to delete order.');
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      toast.error('Network error while deleting order.');
    }
  };

  const assignAsset = async (asset: Omit<AssetAssignment, 'id' | 'assignedDate' | 'status' | 'returnedDate'>) => {
    if (activeBranch === 'All') {
      toast.error('Please select a specific branch to assign assets.');
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/assets`, {
        method: 'POST',
        headers: DB_HEADER,
        body: JSON.stringify({ ...asset, branch: activeBranch }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast.success('Asset assigned successfully!');
        return true;
      } else {
        toast.error(data.message || 'Failed to assign asset');
        return false;
      }
    } catch (error) {
      toast.error('An error occurred');
      return false;
    }
  };

  const returnAsset = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/assets/${id}/return`, {
        method: 'PUT',
        headers: NO_BODY_HEADER,
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        toast.success('Asset returned successfully!');
        return true;
      } else {
        toast.error(data.message || 'Failed to return asset');
        return false;
      }
    } catch (error) {
      toast.error('An error occurred');
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
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
