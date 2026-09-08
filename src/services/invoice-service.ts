import { Invoice, AppConfig } from '@/types/invoice';
import { getCachedAsync, invalidateCache } from '@/lib/cache';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace('/inventory', '/invoice-registration')
    : 'http://localhost:5000/api/invoice-registration';

export const invoiceService = {
  // Config
  getConfig: async (forceRefresh = false): Promise<AppConfig> => {
    const url = `${API_BASE}/config`;
    if (forceRefresh) invalidateCache(url);
    try {
      return await getCachedAsync(
        url,
        async () => {
          const res = await fetch(url);
          if (!res.ok) return { threshold: 50000, currency: 'INR' };
          const { data } = await res.json();
          return data || { threshold: 50000, currency: 'INR' };
        },
        60000
      );
    } catch {
      return { threshold: 50000, currency: 'INR' };
    }
  },

  saveConfig: async (config: AppConfig): Promise<void> => {
    invalidateCache(`${API_BASE}/config`);
    await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },

  // Invoices
  getInvoices: async (branch?: string, forceRefresh = false): Promise<Invoice[]> => {
    const query = branch && branch !== 'All' ? `?branch=${encodeURIComponent(branch)}` : '';
    const url = `${API_BASE}/invoices${query}`;
    if (forceRefresh) invalidateCache(url);

    try {
      return await getCachedAsync(
        url,
        async () => {
          const res = await fetch(url);
          if (!res.ok) return [];
          const { data } = await res.json();
          return data || [];
        },
        45000
      );
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      return [];
    }
  },

  addInvoice: async (invoice: Invoice): Promise<Invoice | null> => {
    try {
      invalidateCache(API_BASE);
      const res = await fetch(`${API_BASE}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoice),
      });
      const { data } = await res.json();
      return data;
    } catch (err) {
      console.error('Failed to add invoice:', err);
      return null;
    }
  },

  updateInvoice: async (id: string, updates: Partial<Invoice>): Promise<Invoice | null> => {
    try {
      invalidateCache(API_BASE);
      const res = await fetch(`${API_BASE}/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const { data } = await res.json();
      return data;
    } catch (err) {
      console.error('Failed to update invoice:', err);
      return null;
    }
  },
};
