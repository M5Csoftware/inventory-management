import { Invoice, AppConfig } from '@/types/invoice';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace('/inventory', '/invoice-registration')
    : 'http://localhost:5000/api/invoice-registration';

export const invoiceService = {
  // Config
  getConfig: async (): Promise<AppConfig> => {
    try {
      const res = await fetch(`${API_BASE}/config`);
      if (!res.ok) return { threshold: 50000, currency: 'INR' };
      const { data } = await res.json();
      return data || { threshold: 50000, currency: 'INR' };
    } catch {
      return { threshold: 50000, currency: 'INR' };
    }
  },

  saveConfig: async (config: AppConfig): Promise<void> => {
    await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },

  // Invoices
  getInvoices: async (): Promise<Invoice[]> => {
    try {
      const res = await fetch(`${API_BASE}/invoices`);
      if (!res.ok) return [];
      const { data } = await res.json();
      return data || [];
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
      return [];
    }
  },

  addInvoice: async (invoice: Invoice): Promise<Invoice | null> => {
    try {
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
