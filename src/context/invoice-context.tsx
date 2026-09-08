'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  refreshInvoices: (forceRefresh?: boolean | unknown) => Promise<void>;
  saveConfig: (newConfig: AppConfig) => Promise<void>;
  createInvoice: (data: {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableAmount: number;
    taxSlab?: number;
    taxOption: TaxOption;
    taxAmount: number;
    amount: number;
    poNumber: string;
    bankLast4: string;
    description: string;
    invoiceImage: string | null;
    invoiceImages?: string[];
    branch?: string;
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
  updateInvoiceBranch: (id: string, branch: string) => Promise<boolean>;
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

  const currentSessionUser: TeamMember = useMemo(() => ({
    id: user?.id || 'mem_admin',
    name: user?.name || 'Admin',
    username: user?.email ? user.email.split('@')[0] : 'admin',
    password: '',
    role: user?.role === 'master' ? 'Master Admin' : user?.role === 'admin' ? 'Admin' : 'User',
  }), [user]);

  const refreshInvoices = useCallback(async (forceRefresh?: boolean | unknown) => {
    const isForce = typeof forceRefresh === 'boolean' ? forceRefresh : false;
    setLoading(true);
    try {
      const [fetchedInvoices, fetchedConfig] = await Promise.all([
        invoiceService.getInvoices(undefined, isForce),
        invoiceService.getConfig(isForce),
      ]);
      setInvoices(fetchedInvoices);
      setConfig(fetchedConfig);
      setTeam([currentSessionUser]);
    } catch (err) {
      console.error('Failed to load invoice data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentSessionUser]);

  useEffect(() => {
    refreshInvoices();
  }, [refreshInvoices]);

  const saveConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    await invoiceService.saveConfig(newConfig);
    toast.success('System settings saved successfully.');
  };

  // Exact Fraud-flag computation logic
  const computeFlags = (inv: Omit<Invoice, 'flags'>, allInvoices: Invoice[]): Flag[] => {
    const flags: Flag[] = [];
    const sameVendor = allInvoices.filter(
      (i) => i.vendor.trim().toLowerCase() === inv.vendor.trim().toLowerCase()
    );

    // Flag: Exact Duplicate Invoice Number from the same Vendor
    const exactDuplicate = sameVendor.some(
      (i) =>
        i.invoiceNumber.trim().toLowerCase() === inv.invoiceNumber.trim().toLowerCase() &&
        i.id !== inv.id
    );
    if (exactDuplicate) {
      flags.push({
        level: 'high',
        text: `Invoice number "${inv.invoiceNumber}" was previously submitted for vendor "${inv.vendor}".`,
      });
    }

    // Flag: Duplicate Amount within 7 days from same Vendor
    const invTime = new Date(inv.invoiceDate).getTime();
    if (!isNaN(invTime)) {
      const sameAmountRecent = sameVendor.some((i) => {
        if (i.id === inv.id) return false;
        if (Math.abs(i.amount - inv.amount) < 0.01) {
          const pastTime = new Date(i.invoiceDate).getTime();
          if (!isNaN(pastTime)) {
            const diffDays = Math.abs(invTime - pastTime) / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
          }
        }
        return false;
      });
      if (sameAmountRecent) {
        flags.push({
          level: 'medium',
          text: `Identical amount ₹${inv.amount.toLocaleString('en-IN')} billed by ${inv.vendor} within 7 days.`,
        });
      }
    }

    // Flag: High Value Threshold
    if (inv.amount > config.threshold) {
      flags.push({
        level: 'low',
        text: `Amount exceeds the ₹${config.threshold.toLocaleString('en-IN')} second-approval threshold.`,
      });
    }

    // Flag: New Bank Account
    if (inv.bankLast4) {
      const pastAccounts = new Set(
        sameVendor
          .map((i) => i.bankLast4)
          .filter((acc): acc is string => Boolean(acc) && acc.trim().length > 0)
      );

      if (pastAccounts.size > 0 && !pastAccounts.has(inv.bankLast4)) {
        flags.push({
          level: 'high',
          text: `Bank account ending in ${inv.bankLast4} is different from previously recorded account(s) for ${inv.vendor}.`,
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
      console.warn(`[Double-Click Prevention] Blocked duplicate action: ${key}`);
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
    taxSlab?: number;
    taxOption: TaxOption;
    taxAmount: number;
    amount: number;
    poNumber: string;
    bankLast4: string;
    description: string;
    invoiceImage: string | null;
    invoiceImages?: string[];
    branch?: string;
  }): Promise<boolean> => {
    const lockKey = `create-inv-${formData.vendor}-${formData.invoiceNumber}-${formData.amount}`;

    return withLock(
      lockKey,
      async () => {
        const id = uid('inv');
        const calculatedFlags = computeFlags(
          {
            id,
            vendor: formData.vendor,
            invoiceNumber: formData.invoiceNumber,
            invoiceDate: formData.invoiceDate,
            taxableAmount: formData.taxableAmount,
            taxSlab: formData.taxSlab,
            taxOption: formData.taxOption,
            taxAmount: formData.taxAmount,
            amount: formData.amount,
            status: 'pending_verification',
            poNumber: formData.poNumber,
            bankLast4: formData.bankLast4,
            description: formData.description,
            invoiceImage: formData.invoiceImage,
            invoiceImages: formData.invoiceImages || (formData.invoiceImage ? [formData.invoiceImage] : []),
            branch: formData.branch || 'Delhi',
            enteredAt: Date.now(),
            enteredBy: currentSessionUser.name,
            approvals: [],
            history: [],
          },
          invoices
        );

        let flagsNote = 'Invoice intake registered.';
        if (calculatedFlags.length > 0) {
          flagsNote = `Flags noted on check-in: ${calculatedFlags.map((f) => f.text).join('; ')}`;
        }

        const newInvoice: Invoice = {
          id,
          vendor: formData.vendor,
          invoiceNumber: formData.invoiceNumber,
          invoiceDate: formData.invoiceDate,
          taxableAmount: formData.taxableAmount,
          taxSlab: formData.taxSlab,
          taxOption: formData.taxOption,
          taxAmount: formData.taxAmount,
          amount: formData.amount,
          status: 'pending_verification',
          poNumber: formData.poNumber,
          bankLast4: formData.bankLast4,
          description: formData.description,
          invoiceImage: formData.invoiceImage,
          invoiceImages: formData.invoiceImages || (formData.invoiceImage ? [formData.invoiceImage] : []),
          branch: formData.branch || 'Delhi',
          enteredAt: Date.now(),
          enteredBy: currentSessionUser.name,
          approvals: [],
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
          await refreshInvoices(true);
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
          await refreshInvoices(true);
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
          await refreshInvoices(true);
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
          toast.warn(`Invoice rejected and status updated.`);
          await refreshInvoices(true);
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
          await refreshInvoices(true);
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
          await refreshInvoices(true);
          return true;
        }
        return false;
      },
      false,
    );
  };

  const updateInvoiceBranch = async (id: string, branch: string): Promise<boolean> => {
    return withLock(
      `update-branch-${id}`,
      async () => {
        const inv = invoices.find((i) => i.id === id);
        if (!inv) return false;

        const updatedHistory = [...(inv.history || [])];
        updatedHistory.push({
          at: Date.now(),
          actorId: currentSessionUser.id,
          actorName: currentSessionUser.name,
          actorRole: currentSessionUser.role,
          action: 'Branch updated',
          note: `Branch updated to ${branch}`,
        });

        const updated = await invoiceService.updateInvoice(id, {
          branch,
          history: updatedHistory,
        });

        if (updated) {
          toast.success(`Branch updated to ${branch}!`);
          await refreshInvoices(true);
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
    toast.success(`Team member ${name} added successfully!`);
  };

  const removeTeamMember = async (id: string) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
    toast.success('Team member removed.');
  };

  const editTeamMember = async (id: string, name: string, username: string, password: string, role: Role) => {
    setTeam((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name, username, password, role } : m))
    );
    toast.success(`Team member ${name} updated successfully!`);
  };

  const contextValue = useMemo(() => ({
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
    updateInvoiceBranch,
    addTeamMember,
    removeTeamMember,
    editTeamMember,
  }), [invoices, config, team, loading]);

  return (
    <InvoiceContext.Provider value={contextValue}>
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
