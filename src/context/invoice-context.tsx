'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Invoice, AppConfig, BankDetails, TaxOption } from '@/types/invoice';
import { invoiceService } from '@/services/invoice-service';
import { useAuth } from '@/context/auth-context';
import { toast } from 'react-toastify';

interface InvoiceContextType {
  invoices: Invoice[];
  config: AppConfig;
  loading: boolean;
  refreshInvoices: () => Promise<void>;
  createInvoice: (data: {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableAmount: number;
    taxOption: TaxOption;
    taxAmount: number;
    amount: number;
    poNumber: string;
    bankLast4: string;
    description: string;
    invoiceImage: string | null;
  }) => Promise<boolean>;
  verifyInvoice: (id: string, notes?: string) => Promise<boolean>;
  approveInvoice: (id: string) => Promise<boolean>;
  rejectInvoice: (id: string, reason: string) => Promise<boolean>;
  payInvoice: (id: string) => Promise<boolean>;
  updateBankDetails: (id: string, bankDetails: BankDetails) => Promise<boolean>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [config, setConfig] = useState<AppConfig>({ threshold: 50000, currency: 'INR' });
  const [loading, setLoading] = useState(true);

  const refreshInvoices = async () => {
    setLoading(true);
    try {
      const [fetchedInvoices, fetchedConfig] = await Promise.all([
        invoiceService.getInvoices(),
        invoiceService.getConfig(),
      ]);
      setInvoices(fetchedInvoices);
      setConfig(fetchedConfig);
    } catch (err) {
      console.error('Failed to load invoice data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInvoices();
  }, []);

  const createInvoice = async (data: {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableAmount: number;
    taxOption: TaxOption;
    taxAmount: number;
    amount: number;
    poNumber: string;
    bankLast4: string;
    description: string;
    invoiceImage: string | null;
  }): Promise<boolean> => {
    const now = Date.now();
    const newId = `INV-${now.toString().slice(-6)}`;
    const actorName = user?.name || 'User';

    // Duplicate invoice # check
    const isDuplicate = invoices.some(
      (i) =>
        i.vendor.toLowerCase() === data.vendor.toLowerCase() &&
        i.invoiceNumber.toLowerCase() === data.invoiceNumber.toLowerCase()
    );

    const flags = [];
    if (isDuplicate) {
      flags.push({
        level: 'high' as const,
        text: `Duplicate invoice number ${data.invoiceNumber} for vendor ${data.vendor}`,
      });
    }

    if (data.amount >= config.threshold) {
      flags.push({
        level: 'medium' as const,
        text: `Amount ${data.amount.toLocaleString()} exceeds review threshold of ${config.threshold.toLocaleString()}`,
      });
    }

    const newInvoice: Invoice = {
      id: newId,
      ...data,
      enteredBy: actorName,
      enteredAt: now,
      status: 'pending_verification',
      approvals: [],
      history: [
        {
          at: now,
          actorId: user?.id || 'user',
          actorName: actorName,
          actorRole: user?.role || 'User',
          action: 'Check-In',
          note: 'Invoice inward registered',
        },
      ],
      flags,
      branch: user?.branch || 'Ahmedabad',
    };

    const saved = await invoiceService.addInvoice(newInvoice);
    if (saved) {
      toast.success(`Invoice ${data.invoiceNumber} registered successfully!`);
      await refreshInvoices();
      return true;
    }
    toast.error('Failed to register invoice.');
    return false;
  };

  const verifyInvoice = async (id: string, notes?: string): Promise<boolean> => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return false;

    const now = Date.now();
    const actorName = user?.name || 'Verifier';
    const requiresL2 = inv.amount >= config.threshold;
    const nextStatus = requiresL2 ? 'pending_approval' : 'approved';

    const updatedHistory = [
      ...inv.history,
      {
        at: now,
        actorId: user?.id || 'user',
        actorName,
        actorRole: user?.role || 'Verifier',
        action: 'Verified (L1)',
        note: notes ? `L1 Verification completed: ${notes}` : 'L1 Verification completed',
      },
    ];

    const updatedApprovals = [...inv.approvals, { by: actorName, at: now }];

    const updated = await invoiceService.updateInvoice(id, {
      status: nextStatus,
      verificationNotes: notes || inv.verificationNotes,
      history: updatedHistory,
      approvals: updatedApprovals,
    });

    if (updated) {
      toast.success(`Invoice ${inv.invoiceNumber} verified (L1) successfully!`);
      await refreshInvoices();
      return true;
    }
    return false;
  };

  const approveInvoice = async (id: string): Promise<boolean> => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return false;

    const now = Date.now();
    const actorName = user?.name || 'Admin';

    const updatedHistory = [
      ...inv.history,
      {
        at: now,
        actorId: user?.id || 'admin',
        actorName,
        actorRole: user?.role || 'Admin',
        action: 'Approved (L2)',
        note: 'L2 Sign-off approved',
      },
    ];

    const updatedApprovals = [...inv.approvals, { by: actorName, at: now }];

    const updated = await invoiceService.updateInvoice(id, {
      status: 'approved',
      history: updatedHistory,
      approvals: updatedApprovals,
    });

    if (updated) {
      toast.success(`Invoice ${inv.invoiceNumber} approved (L2)!`);
      await refreshInvoices();
      return true;
    }
    return false;
  };

  const rejectInvoice = async (id: string, reason: string): Promise<boolean> => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return false;

    const now = Date.now();
    const actorName = user?.name || 'User';

    const updatedHistory = [
      ...inv.history,
      {
        at: now,
        actorId: user?.id || 'user',
        actorName,
        actorRole: user?.role || 'User',
        action: 'Rejected',
        note: `Reason: ${reason}`,
      },
    ];

    const updated = await invoiceService.updateInvoice(id, {
      status: 'rejected',
      history: updatedHistory,
    });

    if (updated) {
      toast.warning(`Invoice ${inv.invoiceNumber} rejected.`);
      await refreshInvoices();
      return true;
    }
    return false;
  };

  const payInvoice = async (id: string): Promise<boolean> => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return false;

    const now = Date.now();
    const actorName = user?.name || 'Admin';

    const updatedHistory = [
      ...inv.history,
      {
        at: now,
        actorId: user?.id || 'admin',
        actorName,
        actorRole: user?.role || 'Admin',
        action: 'Paid',
        note: 'Payment processed',
      },
    ];

    const updated = await invoiceService.updateInvoice(id, {
      status: 'paid',
      history: updatedHistory,
    });

    if (updated) {
      toast.success(`Invoice ${inv.invoiceNumber} marked as paid!`);
      await refreshInvoices();
      return true;
    }
    return false;
  };

  const updateBankDetails = async (id: string, bankDetails: BankDetails): Promise<boolean> => {
    const inv = invoices.find((i) => i.id === id);
    if (!inv) return false;

    const now = Date.now();
    const actorName = user?.name || 'User';

    const updatedHistory = [
      ...inv.history,
      {
        at: now,
        actorId: user?.id || 'user',
        actorName,
        actorRole: user?.role || 'User',
        action: 'Bank Details Updated',
        note: `Updated bank details: ${bankDetails.bankName} (${bankDetails.accountNumber.slice(-4)})`,
      },
    ];

    const updated = await invoiceService.updateInvoice(id, {
      bankDetails,
      bankLast4: bankDetails.accountNumber.slice(-4),
      history: updatedHistory,
    });

    if (updated) {
      toast.success(`Bank details updated for Invoice ${inv.invoiceNumber}`);
      await refreshInvoices();
      return true;
    }
    return false;
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        config,
        loading,
        refreshInvoices,
        createInvoice,
        verifyInvoice,
        approveInvoice,
        rejectInvoice,
        payInvoice,
        updateBankDetails,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
}
