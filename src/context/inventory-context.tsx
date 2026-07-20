'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  supplier: string;
  sku?: string;
  description?: string;
  status?: string;
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

interface InventoryContextType {
  products: Product[];
  transactions: Transaction[];
  categories: Category[];
  suppliers: Supplier[];
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
  deleteProduct: (id: string) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteCategory: (name: string) => Promise<void>;
  deleteSupplier: (name: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/inventory';
const DB_HEADER = { 'x-database': 'm5c-inventory', 'Content-Type': 'application/json' };

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [prodRes, txRes, catRes, supRes] = await Promise.all([
        fetch(`${API_BASE}/products`, { headers: DB_HEADER }),
        fetch(`${API_BASE}/transactions`, { headers: DB_HEADER }),
        fetch(`${API_BASE}/categories`, { headers: DB_HEADER }),
        fetch(`${API_BASE}/suppliers`, { headers: DB_HEADER }),
      ]);

      const [prods, txs, cats, sups] = await Promise.all([
        prodRes.json(),
        txRes.json(),
        catRes.json(),
        supRes.json(),
      ]);

      if (prods.success) setProducts(prods.data);
      if (txs.success) setTransactions(txs.data);
      if (cats.success) setCategories(cats.data);
      if (sups.success) setSuppliers(sups.data);
    } catch (error) {
      console.error('Failed to load inventory data from backend:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        headers: DB_HEADER,
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

  const deleteCategory = async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: DB_HEADER,
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

  const deleteSupplier = async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        headers: DB_HEADER,
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
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: DB_HEADER,
        body: JSON.stringify({ productId, type, quantity, reasonOrLocation, notes }),
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

  return (
    <InventoryContext.Provider
      value={{
        products,
        transactions,
        categories,
        suppliers,
        addProduct,
        addCategory,
        addSupplier,
        recordTransaction,
        deleteProduct,
        updateProduct,
        deleteCategory,
        deleteSupplier,
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
