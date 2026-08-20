'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Invoice, AppConfig, BankDetails, TaxOption, TeamMember, Flag, Role } from '@/types/invoice';
import { invoiceService } from '@/services/invoice-service';
import { useAuth } from '@/context/auth-context';
import { toast } from 'react-toastify';

const uid = (prefix: string) => {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
};

interface InvoiceContextType {
  invoices: Invoice[];
  config: AppConfig;
  team: TeamMember[];
  loading: boolean;
  refreshInvoices: () => Promise<void>;
  saveConfig: (newConfig: AppConfig) => Promise<void>;
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
  updateBankDetails: (id: string, bankData: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
  }) => Promise<boolean>;
  addTeamMember: (name: string, username: string, password: string, role: Role) => Promise<void>;
  removeTeamMember: (id: string) => Promise<void>;
  editTeamMember: (id: string, name: string, username: string, password: string, role: Role) => Promise<void>;
}

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [config, setConfig] = useState<AppConfig>({ threshold: 50000, currency: 'INR' });
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const currentSessionUser: TeamMember = {
    id: user?.id || 'mem_admin',
    name: user?.name || 'Admin',
    username: user?.email ? user.email.split('@')[0] : 'admin',
    password: '',
    role: user?.role === 'master' ? 'Master Admin' : user?.role === 'admin' ? 'Admin' : 'User',
  };

  const refreshInvoices = async () => {
    setLoading(true);
    try {
      const [fetchedInvoices, fetchedConfig] = await Promise.all([
        invoiceService.getInvoices(),
        invoiceService.getConfig(),
      ]);
      setInvoices(fetchedInvoices);
      setConfig(fetchedConfig);
      setTeam([currentSessionUser]);
    } catch (err) {
      console.error('Failed to load invoice data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshInvoices();
  }, []);

  const saveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await invoiceService.saveConfig(newConfig);
  };

  // Exact Fraud-flag computation logic from App.tsx
  const computeFlags = (inv: Omit<Invoice, 'flags'>, allInvoices: Invoice[]): Flag[] => {
    const flags: Flag[] = [];
    const sameVendor = allInvoices.filter(
      (i) => i.vendor.trim().toLowerCase() === inv.vendor.trim().toLowerCase()
    );

    const exactDup = sameVendor.find(
      (i) => i.invoiceNumber.trim().toLowerCase() === inv.invoiceNumber.trim().toLowerCase()
    );
    if (exactDup) {
      flags.push({
        level: 'high',
        text: 'Same invoice number already exists for this vendor — possible resubmission',
      });
    }

    if (!exactDup) {
      const closeDup = sameVendor.find((i) => {
        return (
          Math.abs(i.amount - inv.amount) < 0.01 &&
          Math.abs(new Date(i.invoiceDate).getTime() - new Date(inv.invoiceDate).getTime()) < 3 * 86400000
        );
      });
      if (closeDup) {
        flags.push({
          level: 'medium',
          text: 'Same vendor billed the same amount within 3 days — check for duplicate payment',
        });
      }
    }

    if (config.threshold > 0 && inv.amount < config.threshold && inv.amount >= config.threshold * 0.9) {
      flags.push({
        level: 'medium',
        text: 'Amount sits just under the second-approval threshold — verify it is not split to dodge review',
      });
    }

    if (inv.amount > 0 && inv.amount % 1000 === 0) {
      flags.push({
        level: 'low',
        text: 'Round-number amount — flagged for awareness only',
      });
    }

    if (sameVendor.length === 0) {
      flags.push({
        level: 'low',
        text: 'First invoice on record from this vendor — confirm vendor details before paying',
      });
    }

    if (inv.bankLast4) {
      const priorWithBank = sameVendor
        .filter((i) => i.bankLast4)
        .sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())[0];
      if (priorWithBank && priorWithBank.bankLast4 !== inv.bankLast4) {
        flags.push({
          level: 'high',
          text: "Bank account details differ from this vendor's last invoice — verify directly with the vendor before paying",
        });
      }
    }

    return flags;
  };

  const inFlightLocks = useRef(new Set<string>());

  const withLock = async <T,>(
    key: string,
    fn: () => Promise<T>,
    fallback: T,
  ): Promise<T> => {
    if (inFlightLocks.current.has(key)) {
      console.warn(`[Invoice Lock] Blocked duplicate concurrent action: ${key}`);
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

  const createInvoice = async (formData: {
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
    const lockKey = `create-inv-${formData.vendor}-${formData.invoiceNumber}`;
    return withLock(
      lockKey,
      async () => {
        const partialInv = {
          id: uid('inv'),
          vendor: formData.vendor.trim(),
          invoiceNumber: formData.invoiceNumber.trim(),
          invoiceDate: formData.invoiceDate,
          taxableAmount: formData.taxableAmount,
          taxOption: formData.taxOption,
          taxAmount: formData.taxAmount,
          amount: formData.amount,
          poNumber: formData.poNumber.trim(),
          bankLast4: formData.bankLast4.trim(),
          description: formData.description.trim(),
          invoiceImage: formData.invoiceImage,
          enteredBy: currentSessionUser.id,
          enteredAt: Date.now(),
          status: 'pending_verification' as const,
          approvals: [],
          history: [],
          branch: user?.branch || 'Ahmedabad',
        };

        const calculatedFlags = computeFlags(partialInv as Omit<Invoice, 'flags'>, invoices);
        const flagsNote = calculatedFlags.length
          ? `Flags at entry: ${calculatedFlags.map((f) => f.text).join('; ')}`
          : '';

        const newInvoice: Invoice = {
          ...partialInv,
          flags: calculatedFlags,
          history: [
            {
              at: Date.now(),
              actorId: currentSessionUser.id,
              actorName: currentSessionUser.name,
              actorRole: currentSessionUser.role,
              action: 'Checked in',
              note: flagsNote,
            },
          ],
        };

        const saved = await invoiceService.addInvoice(newInvoice);
        if (saved) {
          toast.success(`Invoice ${formData.invoiceNumber} checked in successfully!`);
          await refreshInvoices();
          return true;
        }
        toast.error('Failed to check in invoice.');
        return false;
      },
      false,
    );
  };

  const verifyInvoice = async (id: string, notes?: string): Promise<boolean> => {
    return withLock(
      `verify-inv-${id}`,
      async () => {
        const inv = invoices.find((i) => i.id === id);
        if (!inv || inv.status !== 'pending_verification') return false;

        const updatedHistory = [...(inv.history || [])];
        updatedHistory.push({
          at: Date.now(),
          actorId: currentSessionUser.id,
          actorName: currentSessionUser.name,
          actorRole: currentSessionUser.role,
          action: 'Verified',
          note: notes || 'Verified with vendor — no issues found.',
        });

        const updated = await invoiceService.updateInvoice(id, {
          status: 'pending_approval',
          verificationNotes: notes,
          history: updatedHistory,
        });

        if (updated) {
          toast.success(`Invoice verified successfully!`);
          await refreshInvoices();
          return true;
        }
        return false;
      },
      false,
    );
  };

  const approveInvoice = async (id: string): Promise<boolean> => {
    return withLock(
      `approve-inv-${id}`,
      async () => {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return false;

        const updatedApprovals = [...(inv.approvals || [])];
        const updatedHistory = [...(inv.history || [])];

        updatedApprovals.push({ by: currentSessionUser.id, at: Date.now() });

        updatedHistory.push({
          at: Date.now(),
          actorId: currentSessionUser.id,
          actorName: currentSessionUser.name,
          actorRole: currentSessionUser.role,
          action: 'Approved',
          note: 'L2 administrative approval sign-off granted.',
        });

        const updated = await invoiceService.updateInvoice(id, {
          status: 'approved',
          approvals: updatedApprovals,
          history: updatedHistory,
        });

        if (updated) {
          toast.success(`Invoice approved!`);
          await refreshInvoices();
          return true;
        }
        return false;
      },
      false,
    );
  };

  const rejectInvoice = async (id: string, reason: string): Promise<boolean> => {
    return withLock(
      `reject-inv-${id}`,
      async () => {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return false;

        const updatedHistory = [...(inv.history || [])];
        updatedHistory.push({
          at: Date.now(),
          actorId: currentSessionUser.id,
          actorName: currentSessionUser.name,
          actorRole: currentSessionUser.role,
          action: 'Rejected',
          note: reason,
        });

        const updated = await invoiceService.updateInvoice(id, {
          status: 'rejected',
          history: updatedHistory,
        });

        if (updated) {
          toast.error(`Invoice rejected.`);
          await refreshInvoices();
          return true;
        }
        return false;
      },
      false,
    );
  };

  const payInvoice = async (id: string): Promise<boolean> => {
    return withLock(
      `pay-inv-${id}`,
      async () => {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return false;

        const updatedHistory = [...(inv.history || [])];
        updatedHistory.push({
          at: Date.now(),
          actorId: currentSessionUser.id,
          actorName: currentSessionUser.name,
          actorRole: currentSessionUser.role,
          action: 'Marked as paid',
          note: 'Final payout completed and marked as paid.',
        });

        const updated = await invoiceService.updateInvoice(id, {
          status: 'paid',
          history: updatedHistory,
        });

        if (updated) {
          toast.success(`Invoice marked as paid!`);
          await refreshInvoices();
          return true;
        }
        return false;
      },
      false,
    );
  };

  const updateBankDetails = async (
    id: string,
    bankData: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      ifscCode: string;
    }
  ): Promise<boolean> => {
    return withLock(
      `bank-inv-${id}`,
      async () => {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return false;

        const bankLast4 = bankData.accountNumber.slice(-4);
        const bankDetails: BankDetails = {
          bankName: bankData.bankName.trim(),
          accountName: bankData.accountName.trim(),
          accountNumber: bankData.accountNumber.trim(),
          ifscCode: bankData.ifscCode.trim(),
          addedAt: Date.now(),
          addedBy: currentSessionUser.id,
        };

        const updatedHistory = [...(inv.history || [])];
        updatedHistory.push({
          at: Date.now(),
          actorId: currentSessionUser.id,
          actorName: currentSessionUser.name,
          actorRole: currentSessionUser.role,
          action: 'Bank details updated',
          note: `Bank updated to ${bankData.bankName.trim()} (ending in ${bankLast4})`,
        });

        const updated = await invoiceService.updateInvoice(id, {
          bankLast4,
          bankDetails,
          history: updatedHistory,
        });

        if (updated) {
          toast.success(`Bank details updated!`);
          await refreshInvoices();
          return true;
        }
        return false;
      },
      false,
    );
  };

  const addTeamMember = async (name: string, username: string, password: string, role: Role) => {
    const newMember = {
      id: uid('mem'),
      name,
      username,
      password,
      role,
    };
    setTeam((prev) => [...prev, newMember]);
  };

  const removeTeamMember = async (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const editTeamMember = async (id: string, name: string, username: string, password: string, role: Role) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name, username, password, role } : m))
    );
  };

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        config,
        team,
        loading,
        refreshInvoices,
        saveConfig,
        createInvoice,
        verifyInvoice,
        approveInvoice,
        rejectInvoice,
        payInvoice,
        updateBankDetails,
        addTeamMember,
        removeTeamMember,
        editTeamMember,
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
