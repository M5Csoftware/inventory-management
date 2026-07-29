'use client';

import React, { useState, useEffect } from 'react';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { useAuth } from '@/context/auth-context';
import { Invoice, AppConfig, TeamMember, Flag, BankDetails } from '@/types/invoice';
import { DashboardView } from '@/components/invoice/DashboardView';
import { CheckInView } from '@/components/invoice/CheckInView';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { ApprovalsView } from '@/components/invoice/ApprovalsView';
import { AuditView } from '@/components/invoice/AuditView';
import { TeamSettingsView } from '@/components/invoice/TeamSettingsView';
import { InvoiceDetailModal } from '@/components/invoice/InvoiceDetailModal';
import { BankDetailsModal } from '@/components/invoice/BankDetailsModal';
import { exportInvoicesToCSV } from '@/utils/export-invoice';
import {
  LayoutDashboard,
  FilePlus,
  Receipt,
  ClipboardCheck,
  History,
  Settings,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';

function MasterInvoiceContent() {
  const { user } = useAuth();
  const {
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
  } = useInvoice();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [bankModalInvoice, setBankModalInvoice] = useState<Invoice | null>(null);

  // Synthesize current user as TeamMember type
  const currentUser: TeamMember = {
    id: user?.id || 'user_1',
    name: user?.name || 'Admin',
    username: user?.email ? user.email.split('@')[0] : 'admin',
    password: '',
    role: user?.role === 'admin' || user?.role === 'master' ? 'Master Admin' : 'User',
  };

  const team: TeamMember[] = [currentUser];

  const handleCheckinSubmit = async (formData: {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableAmount: number;
    taxOption: import('@/types/invoice').TaxOption;
    taxAmount: number;
    amount: number;
    poNumber: string;
    bankLast4: string;
    description: string;
    invoiceImage: string | null;
  }) => {
    const success = await createInvoice(formData);
    if (success) {
      setActiveTab('register');
    }
  };

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'checkin', label: 'Check In Invoice', icon: FilePlus },
    { id: 'register', label: 'Inward Register', icon: Receipt },
    { id: 'approvals', label: 'Approvals Queue', icon: ClipboardCheck },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'team', label: 'Policy & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm font-bold">
              <Receipt size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Inward Invoice Registration
              </h1>
              <p className="text-xs text-muted-foreground">
                M5 Invoice Registration System &bull; L1 Verification &bull; L2 Dual Approvals &bull; Audit Trail
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshInvoices}
            className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground border border-border/80 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Top Tab Bar (Nav Tabs) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-2">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Views */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground border border-border/80 rounded-2xl bg-card">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
          Loading Invoice System...
        </div>
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <DashboardView
              invoices={invoices}
              team={team}
              config={config}
              onInvoiceClick={(inv) => setSelectedInvoice(inv)}
            />
          )}

          {activeTab === 'checkin' && (
            <CheckInView
              currentUser={currentUser}
              config={config}
              onSubmit={handleCheckinSubmit}
            />
          )}

          {activeTab === 'register' && (
            <div className="w-full space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">
                  Inward Invoice Register
                </h2>
                <button
                  onClick={() => exportInvoicesToCSV(invoices, 'Invoices_Export')}
                  className="flex items-center gap-1.5 bg-card hover:bg-muted border border-border/80 text-foreground px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Download size={14} /> Export All to CSV
                </button>
              </div>
              <InvoiceTable
                invoices={invoices}
                currentUser={currentUser}
                team={team}
                config={config}
                lastActionId={null}
                showActions={true}
                onVerify={(id: string) => verifyInvoice(id)}
                onApprove={(id: string) => approveInvoice(id)}
                onRejectClick={(id: string) => {
                  const reason = prompt('Enter rejection reason:');
                  if (reason) rejectInvoice(id, reason);
                }}
                onPay={(id: string) => payInvoice(id)}
                onInvoiceClick={(inv: Invoice) => setSelectedInvoice(inv)}
                onAddBankDetails={(inv: Invoice) => setBankModalInvoice(inv)}
              />
            </div>
          )}

          {activeTab === 'approvals' && (
            <ApprovalsView
              invoices={invoices}
              currentUser={currentUser}
              team={team}
              config={config}
              lastActionId={null}
              onVerify={(id: string) => verifyInvoice(id)}
              onApprove={(id: string) => approveInvoice(id)}
              onRejectClick={(id: string) => {
                const reason = prompt('Enter rejection reason:');
                if (reason) rejectInvoice(id, reason);
              }}
              onPay={(id: string) => payInvoice(id)}
              onInvoiceClick={(inv: Invoice) => setSelectedInvoice(inv)}
              onAddBankDetails={(inv: Invoice) => setBankModalInvoice(inv)}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView invoices={invoices} config={config} />
          )}

          {activeTab === 'team' && (
            <TeamSettingsView
              team={team}
              config={config}
              onAddMember={() => {}}
              onRemoveMember={() => {}}
              onEditMember={() => {}}
              onSaveSettings={(currency, threshold) => {
                toast.success('Settings updated');
              }}
              currentUserId={currentUser.id}
              isMasterAdmin={true}
            />
          )}
        </>
      )}

      {/* Modals */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          currentUser={currentUser}
          team={team}
          config={config}
          onApprove={(id: string) => approveInvoice(id)}
          onRejectClick={(id: string) => {
            const reason = prompt('Enter rejection reason:');
            if (reason) rejectInvoice(id, reason);
          }}
          onPay={(id: string) => payInvoice(id)}
          onAddBankDetails={(inv: Invoice) => setBankModalInvoice(inv)}
        />
      )}

      {bankModalInvoice && (
        <BankDetailsModal
          invoice={bankModalInvoice}
          onClose={() => setBankModalInvoice(null)}
          onSave={(bankDetails) => {
            updateBankDetails(bankModalInvoice.id, bankDetails);
            setBankModalInvoice(null);
          }}
        />
      )}
    </div>
  );
}

export default function InvoiceMasterPage() {
  return (
    <InvoiceProvider>
      <MasterInvoiceContent />
    </InvoiceProvider>
  );
}
