'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  threshold: number;
  supplier: string;
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
}

export interface Supplier {
  name: string;
  contact: string;
  email: string;
  phone: string;
  location: string;
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
        setProducts((prev) => [data.data, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add product:', error);
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
      }
    } catch (error) {
      console.error('Failed to add category:', error);
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
      }
    } catch (error) {
      console.error('Failed to add supplier:', error);
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
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
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
        // Refetch all to keep products stock and transaction list in sync
        await fetchData();
        return true;
      }
    } catch (error) {
      console.error('Failed to record stock transaction:', error);
    }
    return false;
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
