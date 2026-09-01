'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  useInventory,
  AssetSerialItem,
  BRANCHES,
} from '@/context/inventory-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Laptop,
  PlusCircle,
  Search,
  ArrowUpRight,
  Eye,
  Edit,
  Trash2,
  Copy,
  Check,
  Building2,
  Tag,
  Wrench,
  History,
  Download,
  CheckCircle2,
  X,
  IndianRupee,
  List,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/confirm-modal';
import { toast } from 'react-toastify';

export default function AllAssetsPage() {
  const {
    assetSerials,
    updateAssetSerial,
    deleteAssetSerial,
    activeBranch,
  } = useInventory();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');

  // Modals state
  const [selectedViewSerial, setSelectedViewSerial] = useState<AssetSerialItem | null>(null);

  // Edit Serial Modal State
  const [editingSerial, setEditingSerial] = useState<AssetSerialItem | null>(null);
  const [editSerialForm, setEditSerialForm] = useState({
    serialNumber: '',
    model: '',
    status: 'In Stock' as AssetSerialItem['status'],
    branch: 'Ahmedabad',
    supplier: '',
    invoiceNumber: '',
    purchaseDate: '',
    amount: '0',
    warranty: '',
    assignedTo: '',
    notes: '',
  });
  const [isSavingSerial, setIsSavingSerial] = useState(false);

  // Delete Modal State
  const [serialToDelete, setSerialToDelete] = useState<AssetSerialItem | null>(null);

  // Copied serial indicator
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  const handleCopySerial = (serial: string) => {
    if (!serial) return;
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    toast.info(`Copied serial ${serial} to clipboard!`);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  // Filtered Asset Serials
  const filteredSerials = useMemo(() => {
    return assetSerials.filter((s) => {
      // Branch filter
      if (branchFilter !== 'All' && s.branch !== branchFilter) return false;
      // Active global branch from context
      if (activeBranch !== 'All' && s.branch !== activeBranch) return false;
      // Status filter
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const inSerial = (s.serialNumber || '').toLowerCase().includes(q);
        const inModel = (s.model || '').toLowerCase().includes(q);
        const inProduct = (s.productName || '').toLowerCase().includes(q);
        const inSupplier = (s.supplier || '').toLowerCase().includes(q);
        const inInvoice = (s.invoiceNumber || '').toLowerCase().includes(q);
        const inAssignee = (s.assignedTo || '').toLowerCase().includes(q);
        const inNotes = (s.notes || '').toLowerCase().includes(q);
        const inId = (s.id || '').toLowerCase().includes(q);
        if (!inSerial && !inModel && !inProduct && !inSupplier && !inInvoice && !inAssignee && !inNotes && !inId) {
          return false;
        }
      }
      return true;
    });
  }, [assetSerials, branchFilter, activeBranch, statusFilter, searchTerm]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalUnits = assetSerials.length;
    const inStock = assetSerials.filter((s) => s.status === 'In Stock').length;
    const assigned = assetSerials.filter((s) => s.status === 'Assigned').length;
    const maintenance = assetSerials.filter((s) => s.status === 'Maintenance').length;
    const totalValue = assetSerials.reduce((sum, s) => sum + (s.amount || 0), 0);
    return { totalUnits, inStock, assigned, maintenance, totalValue };
  }, [assetSerials]);

  // Open Edit Serial Modal
  const handleOpenEditSerial = (serial: AssetSerialItem) => {
    setEditingSerial(serial);
    setEditSerialForm({
      serialNumber: serial.serialNumber || '',
      model: serial.model || '',
      status: serial.status || 'In Stock',
      branch: serial.branch || 'Ahmedabad',
      supplier: serial.supplier || '',
      invoiceNumber: serial.invoiceNumber || '',
      purchaseDate: serial.purchaseDate || '',
      amount: (serial.amount || 0).toString(),
      warranty: serial.warranty || '',
      assignedTo: serial.assignedTo || '',
      notes: serial.notes || '',
    });
  };

  // Save Edited Serial
  const handleSaveSerial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSerial || isSavingSerial) return;

    if (!editSerialForm.serialNumber.trim()) {
      toast.error('Serial Number is required');
      return;
    }

    setIsSavingSerial(true);
    try {
      const success = await updateAssetSerial(editingSerial.id, {
        serialNumber: editSerialForm.serialNumber.trim(),
        model: editSerialForm.model.trim(),
        status: editSerialForm.status,
        branch: editSerialForm.branch,
        supplier: editSerialForm.supplier.trim(),
        invoiceNumber: editSerialForm.invoiceNumber.trim(),
        purchaseDate: editSerialForm.purchaseDate,
        amount: parseFloat(editSerialForm.amount) || 0,
        warranty: editSerialForm.warranty.trim(),
        assignedTo: editSerialForm.assignedTo.trim(),
        notes: editSerialForm.notes.trim(),
      });
      if (success) {
        setEditingSerial(null);
      }
    } finally {
      setIsSavingSerial(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Unit ID',
      'Product Name',
      'Model',
      'Serial Number',
      'Status',
      'Branch',
      'Supplier',
      'Invoice Number',
      'Purchase Date',
      'Amount (INR)',
      'Assigned To',
      'Warranty',
      'Notes',
    ];

    const rows = filteredSerials.map((s) => [
      s.id,
      `"${s.productName || ''}"`,
      `"${s.model || ''}"`,
      `"${s.serialNumber || ''}"`,
      s.status,
      s.branch,
      `"${s.supplier || ''}"`,
      `"${s.invoiceNumber || ''}"`,
      s.purchaseDate || '',
      s.amount || 0,
      `"${s.assignedTo || ''}"`,
      `"${s.warranty || ''}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `all_assets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('All assets exported to CSV!');
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
              All Assets &amp; Devices
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
              <Laptop className="h-3.5 w-3.5" /> Registry
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Complete inventory of all physical devices, laptops, serial numbers, specifications, and life-cycle statuses.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-semibold gap-1.5 cursor-pointer hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Link href="/stock/assets">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 cursor-pointer">
              <List className="h-3.5 w-3.5 text-primary" /> Assets (Assigned)
            </Button>
          </Link>
          <Link href="/stock/assets/audit">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 cursor-pointer">
              <History className="h-3.5 w-3.5 text-primary" /> Assets Log
            </Button>
          </Link>
          <Link href="/stock/assets/maintenance">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 cursor-pointer">
              <Wrench className="h-3.5 w-3.5 text-amber-500" /> Maintenance
            </Button>
          </Link>
          <Link href="/stock/assets/in">
            <Button size="sm" className="text-xs font-bold gap-1.5 shadow-md hover:shadow-lg cursor-pointer">
              <PlusCircle className="h-3.5 w-3.5" /> Stock In Assets
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <Card className="bg-card/70 border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Assets</span>
              <Laptop className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">{stats.totalUnits}</div>
            <p className="text-[11px] text-muted-foreground">Total registered units</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">In Stock</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.inStock}
            </div>
            <p className="text-[11px] text-muted-foreground">Available for assignment</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Assigned</span>
              <Tag className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {stats.assigned}
            </div>
            <p className="text-[11px] text-muted-foreground">In active employee use</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Maintenance</span>
              <Wrench className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {stats.maintenance}
            </div>
            <p className="text-[11px] text-muted-foreground">Under service / repair</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60 shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Asset Value</span>
              <IndianRupee className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground font-mono">
              ₹{stats.totalValue.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground">Combined purchase value</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-bold text-foreground">
                All Asset Units &amp; Serial Registry ({filteredSerials.length})
              </CardTitle>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="All">🌐 All Branches</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    🏢 {b}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Retired">Retired</option>
                <option value="Dismantled">Dismantled</option>
              </select>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search serial, model, device, vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-8 text-xs bg-background"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-muted-foreground uppercase bg-muted/30 border-b border-border/40">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Serial Number</th>
                  <th className="px-5 py-3.5 font-semibold">Device &amp; Model</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Branch</th>
                  <th className="px-4 py-3.5 font-semibold">Supplier / Invoice</th>
                  <th className="px-4 py-3.5 font-semibold">Purchase / Warranty</th>
                  <th className="px-4 py-3.5 font-semibold">Value (₹)</th>
                  <th className="px-4 py-3.5 font-semibold">Assigned Holder</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredSerials.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Laptop className="h-8 w-8 text-muted-foreground/30" />
                        <p className="font-semibold text-foreground">No assets found in registry.</p>
                        <p className="text-xs max-w-sm">
                          Add devices with models &amp; serial numbers using{' '}
                          <Link href="/stock/assets/in" className="text-primary underline font-medium">
                            Stock In Assets
                          </Link>
                          .
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSerials.map((serial) => {
                    const isAssigned = serial.status === 'Assigned';
                    const isInStock = serial.status === 'In Stock';
                    const isMaintenance = serial.status === 'Maintenance';

                    return (
                      <tr key={serial.id} className="hover:bg-muted/30 transition-colors">
                        {/* Serial Number with Copy */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                              {serial.serialNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopySerial(serial.serialNumber)}
                              title="Copy Serial Number"
                              className="text-muted-foreground hover:text-primary transition-colors p-1 cursor-pointer"
                            >
                              {copiedSerial === serial.serialNumber ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                            {serial.id}
                          </span>
                        </td>

                        {/* Device & Model */}
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <Laptop className="h-3.5 w-3.5 text-primary shrink-0" />
                            {serial.productName}
                          </div>
                          {serial.model && (
                            <div className="text-[11px] text-muted-foreground font-medium mt-0.5">
                              Model: <span className="text-foreground">{serial.model}</span>
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          {isInStock && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-2.5 w-2.5" /> In Stock
                            </span>
                          )}
                          {isAssigned && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              <Tag className="h-2.5 w-2.5" /> Assigned
                            </span>
                          )}
                          {isMaintenance && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Wrench className="h-2.5 w-2.5" /> Maintenance
                            </span>
                          )}
                          {!isInStock && !isAssigned && !isMaintenance && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground">
                              {serial.status}
                            </span>
                          )}
                        </td>

                        {/* Branch */}
                        <td className="px-4 py-3.5 font-medium text-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-muted-foreground" /> {serial.branch}
                          </span>
                        </td>

                        {/* Supplier / Invoice */}
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-foreground">{serial.supplier || '—'}</div>
                          {serial.invoiceNumber && (
                            <div className="text-[10px] text-muted-foreground font-mono">
                              Inv: #{serial.invoiceNumber}
                            </div>
                          )}
                        </td>

                        {/* Purchase Date & Warranty */}
                        <td className="px-4 py-3.5">
                          <div className="text-foreground font-medium">
                            {serial.purchaseDate ? new Date(serial.purchaseDate).toLocaleDateString('en-IN') : '—'}
                          </div>
                          {serial.warranty && (
                            <span className="text-[10px] text-muted-foreground block mt-0.5">
                              🛡️ {serial.warranty}
                            </span>
                          )}
                        </td>

                        {/* Value */}
                        <td className="px-4 py-3.5 font-mono font-semibold text-foreground">
                          ₹{(serial.amount || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Assigned Holder */}
                        <td className="px-4 py-3.5">
                          {serial.assignedTo ? (
                            <span className="font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                              👤 {serial.assignedTo}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Unassigned</span>
                          )}
                        </td>

                        {/* Actions: View, Edit, Delete */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Details */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedViewSerial(serial)}
                              title="View Complete Device Details"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>

                            {/* Edit Laptop / Serial */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditSerial(serial)}
                              title="Edit Laptop Specs & Serial Number"
                              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>

                            {/* Delete */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSerialToDelete(serial)}
                              title="Delete Asset Unit"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW FULL ASSET SERIAL DETAILS */}
      {/* ========================================================================= */}
      {selectedViewSerial && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl max-h-[85vh] bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Laptop className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Asset Unit Specification</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    ID: {selectedViewSerial.id} · Serial: {selectedViewSerial.serialNumber}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedViewSerial(null)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto text-xs">
              {/* Primary Header Card */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/50 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Product / Item:</span>
                  <span className="font-bold text-sm text-foreground">{selectedViewSerial.productName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Device Model:</span>
                  <span className="font-bold text-foreground">{selectedViewSerial.model || 'Standard Unit'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Serial Number:</span>
                  <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {selectedViewSerial.serialNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Lifecycle Status:</span>
                  <span className="font-bold text-foreground px-2 py-0.5 rounded-full bg-card border border-border text-[11px]">
                    {selectedViewSerial.status}
                  </span>
                </div>
              </div>

              {/* Financial & Purchase Info */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-card border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Facility Branch</span>
                  <span className="font-bold text-foreground">🏢 {selectedViewSerial.branch}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Cost / Amount</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{(selectedViewSerial.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Supplier Vendor</span>
                  <span className="font-medium text-foreground">{selectedViewSerial.supplier || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Invoice Reference</span>
                  <span className="font-mono text-foreground font-medium">{selectedViewSerial.invoiceNumber || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Purchase Date</span>
                  <span className="text-foreground">{selectedViewSerial.purchaseDate || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Warranty Period</span>
                  <span className="text-foreground">🛡️ {selectedViewSerial.warranty || 'Standard'}</span>
                </div>
              </div>

              {/* Current Assignment */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block mb-1">
                  Current Assignment Status
                </span>
                {selectedViewSerial.assignedTo ? (
                  <p className="text-xs text-foreground font-medium">
                    Assigned to <span className="font-bold text-primary">{selectedViewSerial.assignedTo}</span>
                    {selectedViewSerial.assignedDate ? ` on ${selectedViewSerial.assignedDate}` : ''}.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Unit is currently In Stock and available for allocation.
                  </p>
                )}
              </div>

              {/* Notes */}
              {selectedViewSerial.notes && (
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground block mb-1">Internal Notes:</span>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-foreground italic">
                    {selectedViewSerial.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedViewSerial(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const serial = selectedViewSerial;
                  setSelectedViewSerial(null);
                  handleOpenEditSerial(serial);
                }}
                className="text-xs font-bold gap-1.5 cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Unit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT ASSET SERIAL & LAPTOP DETAILS */}
      {/* ========================================================================= */}
      {editingSerial && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Edit className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Edit Asset Unit &amp; Serial</h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    Product: {editingSerial.productName} ({editingSerial.id})
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingSerial(null)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveSerial} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Serial Number */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Serial Number <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editSerialForm.serialNumber}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, serialNumber: e.target.value }))}
                      placeholder="e.g. SN-89247192"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Model */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Device Model (Laptop / Specs)
                    </label>
                    <input
                      type="text"
                      value={editSerialForm.model}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, model: e.target.value }))}
                      placeholder="e.g. Lenovo ThinkPad T14 Gen 3 / i7 16GB"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Current Status <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={editSerialForm.status}
                      onChange={(e) =>
                        setEditSerialForm((p) => ({ ...p, status: e.target.value as AssetSerialItem['status'] }))
                      }
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      <option value="In Stock">In Stock (Available)</option>
                      <option value="Assigned">Assigned (In Use)</option>
                      <option value="Maintenance">Maintenance / Service</option>
                      <option value="Retired">Retired / Decommissioned</option>
                      <option value="Dismantled">Dismantled for Parts</option>
                    </select>
                  </div>

                  {/* Branch */}
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">
                      Facility Branch <span className="text-destructive">*</span>
                    </label>
                    <select
                      value={editSerialForm.branch}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, branch: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20 cursor-pointer"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>
                          🏢 {b} Branch
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Supplier / Vendor
                    </label>
                    <input
                      type="text"
                      value={editSerialForm.supplier}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, supplier: e.target.value }))}
                      placeholder="e.g. Dell India / Ingram Micro"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={editSerialForm.invoiceNumber}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, invoiceNumber: e.target.value }))}
                      placeholder="e.g. INV-2024-884"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Purchase Date
                    </label>
                    <input
                      type="date"
                      value={editSerialForm.purchaseDate}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, purchaseDate: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Cost / Price (₹)
                    </label>
                    <input
                      type="number"
                      value={editSerialForm.amount}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="0.00"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 font-mono text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Warranty */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Warranty
                    </label>
                    <input
                      type="text"
                      value={editSerialForm.warranty}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, warranty: e.target.value }))}
                      placeholder="e.g. 3 Years Onsite / Expiry Date"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Assigned To (Employee)
                    </label>
                    <input
                      type="text"
                      value={editSerialForm.assignedTo}
                      onChange={(e) => setEditSerialForm((p) => ({ ...p, assignedTo: e.target.value }))}
                      placeholder="e.g. Rahul Sharma"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Notes &amp; Hardware Details
                  </label>
                  <textarea
                    rows={2}
                    value={editSerialForm.notes}
                    onChange={(e) => setEditSerialForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="e.g. Includes original 65W USB-C charger, bag, and mouse"
                    className="w-full rounded-lg border border-border bg-background p-2.5 text-xs focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSerial(null)}
                  disabled={isSavingSerial}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSavingSerial}
                  size="sm"
                  className="text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                >
                  <Check className={`h-3.5 w-3.5 ${isSavingSerial ? 'animate-spin' : ''}`} />
                  {isSavingSerial ? 'Saving...' : 'Save Asset Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL: DELETE ASSET SERIAL */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={serialToDelete !== null}
        onClose={() => setSerialToDelete(null)}
        onConfirm={async () => {
          if (serialToDelete) {
            await deleteAssetSerial(serialToDelete.id);
            setSerialToDelete(null);
          }
        }}
        title="Delete Asset Device / Serial"
        description="Are you sure you want to remove this asset unit from the registry? This action will be recorded in the audit log."
        variant="danger"
        confirmText="Delete Asset Unit"
        confirmLoadingText="Deleting..."
        icon={<Trash2 className="h-5 w-5" />}
        itemName={
          serialToDelete ? (
            <div className="space-y-1 text-xs">
              <div className="font-bold text-foreground">
                {serialToDelete.productName} {serialToDelete.model ? `(${serialToDelete.model})` : ''}
              </div>
              <div className="text-muted-foreground font-mono">
                Serial Number: <span className="font-bold text-foreground">{serialToDelete.serialNumber}</span>
              </div>
              <div className="text-muted-foreground">
                Branch: <span className="font-semibold text-foreground">{serialToDelete.branch}</span> · Status: {serialToDelete.status}
              </div>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
