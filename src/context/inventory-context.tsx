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
  addProduct: (product: Omit<Product, 'id'>) => void;
  addCategory: (category: Category) => void;
  addSupplier: (supplier: Supplier) => void;
  recordTransaction: (
    productId: string,
    type: 'Stock In' | 'Stock Out',
    quantity: number,
    reasonOrLocation: string,
    notes?: string
  ) => boolean;
  deleteProduct: (id: string) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const initialProducts: Product[] = [
  { id: 'PROD-001', name: 'Premium Wireless Headphones', category: 'Electronics', price: 9999, stock: 45, threshold: 10, supplier: 'AudioTech Ltd.' },
  { id: 'PROD-002', name: 'Ergonomic Office Chair', category: 'Furniture', price: 18500, stock: 12, threshold: 15, supplier: 'ComfortSeats Co.' },
  { id: 'PROD-003', name: 'Stainless Steel Water Bottle', category: 'Lifestyle', price: 1899, stock: 150, threshold: 20, supplier: 'EcoWare Solutions' },
  { id: 'PROD-004', name: 'USB-C Fast Charger', category: 'Electronics', price: 1499, stock: 8, threshold: 15, supplier: 'AudioTech Ltd.' },
];

const initialTransactions: Transaction[] = [
  { id: 'TX-101', date: '2026-07-20 10:30', productId: 'PROD-001', productName: 'Premium Wireless Headphones', type: 'Stock In', quantity: 20, reasonOrLocation: 'Warehouse A', notes: 'Restocked' },
  { id: 'TX-102', date: '2026-07-20 09:15', productId: 'PROD-004', productName: 'USB-C Fast Charger', type: 'Stock Out', quantity: 5, reasonOrLocation: 'Customer Order', notes: 'Customer Order' },
];

const initialCategories: Category[] = [
  { name: 'Electronics', description: 'Smartphones, audio, computing accessories and chargers' },
  { name: 'Furniture', description: 'Office chairs, standing desks, cabinets and lounge furniture' },
  { name: 'Lifestyle', description: 'Eco-friendly bottles, gear bags, water bottles, and gym apparel' },
  { name: 'Office Supplies', description: 'Paper, journals, pens, organizers, and stationery supplies' },
];

const initialSuppliers: Supplier[] = [
  { name: 'AudioTech Ltd.', contact: 'Sarah Jenkins', email: 'sjenkins@audiotech.com', phone: '+1 (555) 123-4567', location: 'San Francisco, CA' },
  { name: 'ComfortSeats Co.', contact: 'Michael Chang', email: 'mchang@comfortseats.co', phone: '+1 (555) 987-6543', location: 'Chicago, IL' },
  { name: 'EcoWare Solutions', contact: 'Emma Stone', email: 'estones@ecoware.org', phone: '+1 (555) 456-7890', location: 'Portland, OR' },
];

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedProducts = localStorage.getItem('m5c_products');
    const savedTransactions = localStorage.getItem('m5c_transactions');
    const savedCategories = localStorage.getItem('m5c_categories');
    const savedSuppliers = localStorage.getItem('m5c_suppliers');

    setProducts(savedProducts ? JSON.parse(savedProducts) : initialProducts);
    setTransactions(savedTransactions ? JSON.parse(savedTransactions) : initialTransactions);
    setCategories(savedCategories ? JSON.parse(savedCategories) : initialCategories);
    setSuppliers(savedSuppliers ? JSON.parse(savedSuppliers) : initialSuppliers);
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('m5c_products', JSON.stringify(products));
    localStorage.setItem('m5c_transactions', JSON.stringify(transactions));
    localStorage.setItem('m5c_categories', JSON.stringify(categories));
    localStorage.setItem('m5c_suppliers', JSON.stringify(suppliers));
  }, [products, transactions, categories, suppliers, isLoaded]);

  const addProduct = (newProduct: Omit<Product, 'id'>) => {
    setProducts((prev) => {
      const nextId = `PROD-${String(prev.length + 1).padStart(3, '0')}`;
      return [...prev, { ...newProduct, id: nextId }];
    });
  };

  const addCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
  };

  const addSupplier = (supplier: Supplier) => {
    setSuppliers((prev) => [...prev, supplier]);
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const recordTransaction = (
    productId: string,
    type: 'Stock In' | 'Stock Out',
    quantity: number,
    reasonOrLocation: string,
    notes?: string
  ): boolean => {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    if (type === 'Stock Out' && product.stock < quantity) {
      return false; // Insufficient stock
    }

    // Update product stock
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const newStock = type === 'Stock In' ? p.stock + quantity : p.stock - quantity;
          return { ...p, stock: newStock };
        }
        return p;
      })
    );

    // Record Transaction log
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTransactions((prev) => {
      const nextTxId = `TX-${101 + prev.length}`;
      return [
        {
          id: nextTxId,
          date: dateStr,
          productId,
          productName: product.name,
          type,
          quantity,
          reasonOrLocation,
          notes,
        },
        ...prev,
      ];
    });

    return true;
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
