'use client';

import React, { useState } from 'react';
import { useInvoice, InvoiceProvider } from '@/context/invoice-context';
import { useAuth } from '@/context/auth-context';
import { Invoice, AppConfig, TeamMember, Flag, BankDetails, Role } from '@/types/invoice';
import { DashboardView } from '@/components/invoice/DashboardView';
import { CheckInView } from '@/components/invoice/CheckInView';
import { InvoiceTable } from '@/components/invoice/InvoiceTable';
import { ApprovalsView } from '@/components/invoice/ApprovalsView';
import { AuditView } from '@/components/invoice/AuditView';
import { TeamSettingsView } from '@/components/invoice/TeamSettingsView';
import { Modal } from '@/components/invoice/Modal';
import { InvoiceDetailModal } from '@/components/invoice/InvoiceDetailModal';
import { BankDetailsModal } from '@/components/invoice/BankDetailsModal';
import { ApproveConfirmationModal } from '@/components/invoice/ApproveConfirmationModal';
import { VerifyConfirmationModal } from '@/components/invoice/VerifyConfirmationModal';
import { exportInvoicesToCSV } from '@/utils/export-invoice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  LayoutDashboard,
  FilePlus,
  Receipt,
  ClipboardCheck,
  History,
  Settings,
  Download,
  RefreshCw,
  CheckCircle2,
  Plus,
} from 'lucide-react';

function MasterInvoiceContent() {
  const { user } = useAuth();
  const {
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
  } = useInvoice();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [confirmInvoice, setConfirmInvoice] = useState<Invoice | null>(null);
  const [rejectInvoiceId, setRejectInvoiceId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [bankModalInvoice, setBankModalInvoice] = useState<Invoice | null>(null);
  const [approveModalInvoice, setApproveModalInvoice] = useState<Invoice | null>(null);
  const [verifyModalInvoice, setVerifyModalInvoice] = useState<Invoice | null>(null);

  const currentUser: TeamMember = {
    id: user?.id || 'mem_admin',
    name: user?.name || 'Admin',
    username: user?.email ? user.email.split('@')[0] : 'admin',
    password: '',
    role: (user?.role === 'master' ? 'Master Admin' : user?.role === 'admin' ? 'Admin' : user?.role?.toLowerCase().includes('invoice') ? 'Invoice' : 'User') as Role,
  };

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
    invoiceImages?: string[];
  }) => {
    const success = await createInvoice(formData);
    if (success) {
      const latest = invoices[invoices.length - 1];
      if (latest) setConfirmInvoice(latest);
      setActiveTab('register');
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectInvoiceId) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError('Please give a reason.');
      return;
    }

    const success = await rejectInvoice(rejectInvoiceId, reason);
    if (success) {
      setRejectInvoiceId(null);
      setRejectReason('');
      setRejectError('');
    }
  };

  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'checkin', label: 'New Invoice', icon: FilePlus },
    { id: 'register', label: 'Register', icon: Receipt },
    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck },
    { id: 'audit', label: 'Invoice Audit', icon: History },
    { id: 'team', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-6 sm:p-8 pb-20 sm:pb-28 space-y-8 animate-in fade-in duration-300 min-h-screen bg-background">
      {/* Top Header Matching Stock & Products Management Pages */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Receipt className="h-8 w-8 text-primary" />
            Invoice System
          </h1>
          <p className="text-muted-foreground mt-1">
            Inward check-in, automated risk flags, verification, dual-approval workflow, and audit ledger.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={refreshInvoices}
            className="shadow-sm"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button
            onClick={() => setActiveTab('checkin')}
            className="shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tab Bar matching Inventory Management pills */}
      <div className="inline-flex p-1.5 bg-muted/60 backdrop-blur-sm rounded-2xl border border-border/40 flex-wrap gap-1">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-background text-foreground shadow-sm font-bold border border-border/50'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-primary' : ''} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* View Content */}
      {loading ? (
        <Card className="p-12 text-center text-muted-foreground border border-border/50 bg-background/60 backdrop-blur-sm">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
          Loading Invoice Data...
        </Card>
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
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    Inward Register
                  </h2>
                  <p className="text-xs text-muted-foreground">Search and manage all recorded inward invoices</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportInvoicesToCSV(invoices, 'Invoices_Export')}
                  className="gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Export CSV
                </Button>
              </div>
              <InvoiceTable
                invoices={invoices}
                currentUser={currentUser}
                team={team}
                config={config}
                lastActionId={null}
                showActions={true}
                onVerify={(id) => {
                  const target = invoices.find((i) => i.id === id);
                  if (target) setVerifyModalInvoice(target);
                }}
                onApprove={(id) => {
                  const target = invoices.find((i) => i.id === id);
                  if (target) setApproveModalInvoice(target);
                }}
                onRejectClick={(id) => setRejectInvoiceId(id)}
                onPay={(id) => payInvoice(id)}
                onInvoiceClick={(inv) => setSelectedInvoice(inv)}
                onAddBankDetails={(inv) => setBankModalInvoice(inv)}
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
              showActions={true}
              onVerify={(id) => {
                const target = invoices.find((i) => i.id === id);
                if (target) setVerifyModalInvoice(target);
              }}
              onApprove={(id) => {
                const target = invoices.find((i) => i.id === id);
                if (target) setApproveModalInvoice(target);
              }}
              onRejectClick={(id) => setRejectInvoiceId(id)}
              onPay={(id) => payInvoice(id)}
              onInvoiceClick={(inv) => setSelectedInvoice(inv)}
              onAddBankDetails={(inv) => setBankModalInvoice(inv)}
            />
          )}

          {activeTab === 'audit' && (
            <AuditView invoices={invoices} config={config} />
          )}

          {activeTab === 'team' && (
            <TeamSettingsView
              team={team}
              config={config}
              onAddMember={addTeamMember}
              onRemoveMember={removeTeamMember}
              onEditMember={editTeamMember}
              onSaveSettings={(currency, threshold) => saveConfig({ currency, threshold })}
              currentUserId={currentUser.id}
              isMasterAdmin={true}
            />
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmInvoice}
        onClose={() => setConfirmInvoice(null)}
        title="Check-In Confirmation"
      >
        {confirmInvoice && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 text-xs font-bold">
              <CheckCircle2 size={20} />
              <span>Invoice {confirmInvoice.invoiceNumber} registered successfully!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Vendor: <strong className="text-foreground">{confirmInvoice.vendor}</strong> &bull; Total: <strong className="text-foreground">₹{confirmInvoice.amount.toLocaleString()}</strong>
            </p>
            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setConfirmInvoice(null)}
                size="sm"
              >
                Close &amp; View Register
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={!!rejectInvoiceId}
        onClose={() => {
          setRejectInvoiceId(null);
          setRejectReason('');
          setRejectError('');
        }}
        title="Reject Invoice"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Please state the reason for rejecting this invoice (required for audit log).
          </p>
          {rejectError && (
            <p className="text-xs font-bold text-destructive">{rejectError}</p>
          )}
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => {
              setRejectReason(e.target.value);
              setRejectError('');
            }}
            placeholder="e.g. Incorrect tax calculation or missing PO..."
            className="w-full bg-background border-2 border-gray-300 dark:border-gray-600 rounded-xl p-3 text-xs focus:outline-none focus:border-primary text-foreground"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRejectInvoiceId(null);
                setRejectReason('');
                setRejectError('');
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRejectConfirm}
            >
              Reject Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          currentUser={currentUser}
          team={team}
          config={config}
          onVerify={(id) => {
            const target = invoices.find((i) => i.id === id);
            if (target) setVerifyModalInvoice(target);
          }}
          onApprove={(id) => {
            const target = invoices.find((i) => i.id === id);
            if (target) setApproveModalInvoice(target);
          }}
          onRejectClick={(id) => setRejectInvoiceId(id)}
          onPay={(id) => payInvoice(id)}
          onAddBankDetails={(inv) => setBankModalInvoice(inv)}
        />
      )}

      {/* Verify Confirmation Modal */}
      {verifyModalInvoice && (
        <VerifyConfirmationModal
          invoice={verifyModalInvoice}
          isOpen={!!verifyModalInvoice}
          onClose={() => setVerifyModalInvoice(null)}
          onConfirm={async (id, notes) => {
            await verifyInvoice(id, notes);
            setVerifyModalInvoice(null);
          }}
          onReject={(id) => setRejectInvoiceId(id)}
        />
      )}

      {/* Approval Confirmation Modal */}
      {approveModalInvoice && (
        <ApproveConfirmationModal
          invoice={approveModalInvoice}
          isOpen={!!approveModalInvoice}
          onClose={() => setApproveModalInvoice(null)}
          onConfirm={async (id) => {
            await approveInvoice(id);
            setApproveModalInvoice(null);
          }}
          onReject={(id) => setRejectInvoiceId(id)}
        />
      )}

      {/* Bank Details Modal */}
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
