'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  useInventory,
  AssetSerialItem,
  BRANCHES,
  Product,
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
  AlertTriangle,
  Sparkles,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/confirm-modal';
import { toast } from 'react-toastify';

export default function AllAssetsPage() {
  const {
    products,
    categories,
    assetSerials,
    updateAssetSerial,
    deleteAssetSerial,
    addAssetSerial,
    fetchAssetSerials,
    activeBranch,
  } = useInventory();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState(() =>
    activeBranch !== 'All' ? activeBranch : 'All',
  );

  // Modals state
  const [selectedViewSerial, setSelectedViewSerial] = useState<AssetSerialItem | null>(null);

  // Unregistered Stock Reconciliation Modal State
  const [registeringStock, setRegisteringStock] = useState<{
    product: Product;
    branch: string;
    stockCount: number;
    missingCount: number;
  } | null>(null);
  const [registerSerialForm, setRegisterSerialForm] = useState({
    serialNumber: '',
    model: '',
    amount: '0',
    branch: 'Delhi',
    status: 'In Stock' as AssetSerialItem['status'],
    supplier: '',
    invoiceNumber: '',
    notes: '',
  });
  const [isRegistering, setIsRegistering] = useState(false);

  // Quick New Asset Registration Modal State
  const [quickRegisterOpen, setQuickRegisterOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    productId: '',
    serialNumber: '',
    model: '',
    amount: '0',
    branch: activeBranch !== 'All' ? activeBranch : 'Delhi',
    status: 'In Stock' as AssetSerialItem['status'],
    supplier: '',
    invoiceNumber: '',
    notes: '',
  });
  const [isQuickRegistering, setIsQuickRegistering] = useState(false);

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

  // Detect products with inventory stock in branches that have fewer registered serials
  const unregisteredAssetStock = useMemo(() => {
    const list: Array<{
      product: Product;
      branch: string;
      stockCount: number;
      registeredCount: number;
      missingCount: number;
    }> = [];

    (products || []).forEach((prod) => {
      const cat = (categories || []).find(
        (c) => (c.name || '').trim().toLowerCase() === (prod.category || '').trim().toLowerCase(),
      );
      const isAsset =
        cat?.isAsset === true ||
        (prod.category || '').toLowerCase().includes('asset') ||
        (prod.name || '').toLowerCase().includes('asset') ||
        (prod.category || '').toLowerCase().includes('machine') ||
        (prod.category || '').toLowerCase().includes('equipment') ||
        (prod.category || '').toLowerCase().includes('hardware') ||
        (prod.category || '').toLowerCase().includes('device');

      if (!isAsset) return;

      if (prod.stock && typeof prod.stock === 'object') {
        Object.entries(prod.stock as Record<string, number>).forEach(([bName, count]) => {
          const numCount = Number(count) || 0;
          if (numCount > 0) {
            const registered = assetSerials.filter(
              (s) =>
                (s.productId === prod.id || s.productName?.toLowerCase() === prod.name.toLowerCase()) &&
                s.branch === bName,
            ).length;

            if (registered < numCount) {
              list.push({
                product: prod,
                branch: bName,
                stockCount: numCount,
                registeredCount: registered,
                missingCount: numCount - registered,
              });
            }
          }
        });
      }
    });

    return list;
  }, [products, categories, assetSerials]);

  // Open modal to assign asset serial tag to existing inventory stock
  const handleOpenRegisterModal = (product: Product, branch: string) => {
    const cleanPrefix = (product.name || 'AST')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'AST';
    const branchCode = (branch || 'DEL').slice(0, 3).toUpperCase();
    const autoSerial = `${cleanPrefix}-${branchCode}-${Date.now().toString().slice(-4)}1`;

    setRegisterSerialForm({
      serialNumber: autoSerial,
      model: 'Standard',
      amount: (product.price || 0).toString(),
      branch,
      status: 'In Stock',
      supplier: product.supplier || '',
      invoiceNumber: '',
      notes: `Registered from existing inventory stock in ${branch}`,
    });

    const missing = unregisteredAssetStock.find(
      (u) => u.product.id === product.id && u.branch === branch,
    );

    setRegisteringStock({
      product,
      branch,
      stockCount: missing ? missing.stockCount : 1,
      missingCount: missing ? missing.missingCount : 1,
    });
  };

  const handleGenerateRegistrationTag = () => {
    if (!registeringStock) return;
    const cleanPrefix = (registeringStock.product.name || 'AST')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase() || 'AST';
    const branchCode = (registerSerialForm.branch || 'DEL').slice(0, 3).toUpperCase();
    const autoSerial = `${cleanPrefix}-${branchCode}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    setRegisterSerialForm((p) => ({ ...p, serialNumber: autoSerial }));
  };

  const handleExecuteStockRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringStock || isRegistering) return;
    if (!registerSerialForm.serialNumber.trim()) {
      toast.error('Serial Number / Asset Tag is required');
      return;
    }

    setIsRegistering(true);
    try {
      const success = await addAssetSerial({
        productId: registeringStock.product.id,
        productName: registeringStock.product.name,
        serialNumber: registerSerialForm.serialNumber.trim(),
        model: registerSerialForm.model.trim() || undefined,
        amount: parseFloat(registerSerialForm.amount) || 0,
        branch: registerSerialForm.branch,
        status: registerSerialForm.status,
        supplier: registerSerialForm.supplier.trim() || undefined,
        invoiceNumber: registerSerialForm.invoiceNumber.trim() || undefined,
        notes: registerSerialForm.notes.trim() || undefined,
        purchaseDate: new Date().toISOString().slice(0, 10),
      });

      if (success) {
        toast.success(`Registered asset tag ${registerSerialForm.serialNumber} for ${registeringStock.branch} branch!`);
        setRegisteringStock(null);
        await fetchAssetSerials(true);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  // Filtered Asset Serials (Authority: branchFilter on this page)
  const filteredSerials = useMemo(() => {
    return assetSerials.filter((s) => {
      // Branch filter on page
      if (branchFilter !== 'All' && s.branch !== branchFilter) return false;
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
  }, [assetSerials, branchFilter, statusFilter, searchTerm]);

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
          <Button
            size="sm"
            variant="outline"
            onClick={() => setQuickRegisterOpen(true)}
            className="text-xs font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" /> Quick Register
          </Button>
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

      {/* Unregistered Asset Stock Alert Banner */}
      {unregisteredAssetStock.length > 0 && (
        <Card className="border-2 border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-background shadow-md overflow-hidden animate-in fade-in slide-in-from-top-2">
          <CardHeader className="p-4 sm:p-5 border-b border-amber-500/20 bg-amber-500/10 flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500 text-white shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  Inventory Stock Pending Serial Registration
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
                    {unregisteredAssetStock.reduce((acc, u) => acc + u.missingCount, 0)} Units Awaiting Tags
                  </span>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The following physical asset units exist in inventory stock across branches (e.g. Delhi) but do not yet have individual serial numbers registered in the registry.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unregisteredAssetStock.map((item, idx) => (
                <div
                  key={`${item.product.id}-${item.branch}-${idx}`}
                  className="p-3.5 rounded-xl border border-border/80 bg-background/80 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-foreground truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                        🏢 {item.branch}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Category: <span className="font-medium text-foreground">{item.product.category || 'Asset'}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs pt-1">
                      <span className="text-muted-foreground">
                        Total Stock: <strong className="text-foreground">{item.stockCount}</strong>
                      </span>
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        Unregistered: <strong>{item.missingCount} unit{item.missingCount > 1 ? 's' : ''}</strong>
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenRegisterModal(item.product, item.branch)}
                    className="w-full text-xs font-bold gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-xs cursor-pointer h-8"
                  >
                    <Tag className="h-3.5 w-3.5" />
                    Register Serial / Asset Tag
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
      {/* REGISTRATION MODAL: ASSIGN SERIAL TO EXISTING INVENTORY STOCK */}
      {/* ========================================================================= */}
      {registeringStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Register Asset Tag for {registeringStock.product.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Assigning serial to existing unit in <strong>🏢 {registeringStock.branch} Branch</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRegisteringStock(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteStockRegistration} className="p-5 space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-foreground">
                      Serial Number / Asset Tag <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRegistrationTag}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-Generate Tag
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={registerSerialForm.serialNumber}
                    onChange={(e) => setRegisterSerialForm((p) => ({ ...p, serialNumber: e.target.value }))}
                    placeholder="e.g. XRAY-DEL-001 or PF49A001"
                    className="h-10 w-full rounded-xl border-2 border-border bg-background px-3 text-xs font-mono font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Model / Specification
                    </label>
                    <input
                      type="text"
                      value={registerSerialForm.model}
                      onChange={(e) => setRegisterSerialForm((p) => ({ ...p, model: e.target.value }))}
                      placeholder="e.g. Standard Model"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Unit Valuation (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={registerSerialForm.amount}
                      onChange={(e) => setRegisterSerialForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="0"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-mono focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Branch Warehouse
                    </label>
                    <select
                      value={registerSerialForm.branch}
                      onChange={(e) => setRegisterSerialForm((p) => ({ ...p, branch: e.target.value }))}
                      className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-bold focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      {BRANCHES.map((b) => (
                        <option key={b} value={b}>
                          🏢 {b} Branch
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Status
                    </label>
                    <select
                      value={registerSerialForm.status}
                      onChange={(e) => setRegisterSerialForm((p) => ({ ...p, status: e.target.value as any }))}
                      className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-semibold focus:ring-1 focus:ring-primary cursor-pointer"
                    >
                      <option value="In Stock">In Stock (Available)</option>
                      <option value="Assigned">Assigned (In Use)</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={registerSerialForm.notes}
                    onChange={(e) => setRegisterSerialForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="e.g. Registered into Delhi branch equipment registry"
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRegisteringStock(null)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isRegistering}
                  className="text-xs font-bold gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className={`h-3.5 w-3.5 ${isRegistering ? 'animate-spin' : ''}`} />
                  {isRegistering ? 'Registering...' : 'Register Asset Tag'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK REGISTER MODAL: REGISTER NEW ASSET WITH BRANCH */}
      {/* ========================================================================= */}
      {quickRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Quick Register Asset Unit
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Directly register a device or serial into a chosen branch
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickRegisterOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!quickForm.productId || !quickForm.serialNumber.trim()) {
                  toast.error("Please select a product and provide a serial number / tag");
                  return;
                }
                setIsQuickRegistering(true);
                try {
                  const selProd = products.find((p) => p.id === quickForm.productId);
                  const success = await addAssetSerial({
                    productId: quickForm.productId,
                    productName: selProd?.name || "Asset Item",
                    serialNumber: quickForm.serialNumber.trim(),
                    model: quickForm.model.trim() || undefined,
                    amount: parseFloat(quickForm.amount) || 0,
                    branch: quickForm.branch,
                    status: quickForm.status,
                    supplier: quickForm.supplier.trim() || undefined,
                    invoiceNumber: quickForm.invoiceNumber.trim() || undefined,
                    notes: quickForm.notes.trim() || undefined,
                    purchaseDate: new Date().toISOString().slice(0, 10),
                  });
                  if (success) {
                    toast.success(`Asset registered in ${quickForm.branch} branch!`);
                    setQuickRegisterOpen(false);
                    setQuickForm({
                      productId: '',
                      serialNumber: '',
                      model: '',
                      amount: '0',
                      branch: 'Delhi',
                      status: 'In Stock',
                      supplier: '',
                      invoiceNumber: '',
                      notes: '',
                    });
                    await fetchAssetSerials(true);
                  }
                } finally {
                  setIsQuickRegistering(false);
                }
              }}
              className="p-5 space-y-4"
            >
              <div className="space-y-3">
                {/* Product Select */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Select Product Item <span className="text-destructive">*</span>
                  </label>
                  <select
                    required
                    value={quickForm.productId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const p = products.find((x) => x.id === pId);
                      const cleanPrefix = (p?.name || 'AST')
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .slice(0, 4)
                        .toUpperCase() || 'AST';
                      const branchCode = (quickForm.branch || 'DEL').slice(0, 3).toUpperCase();
                      setQuickForm((prev) => ({
                        ...prev,
                        productId: pId,
                        amount: (p?.price || 0).toString(),
                        supplier: p?.supplier || '',
                        serialNumber: prev.serialNumber || `${cleanPrefix}-${branchCode}-${Date.now().toString().slice(-4)}`,
                      }));
                    }}
                    className="h-10 w-full rounded-xl border-2 border-border bg-background px-3 text-xs font-medium focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Branch */}
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Target Branch <span className="text-destructive">*</span>
                  </label>
                  <select
                    value={quickForm.branch}
                    onChange={(e) => {
                      const newBranch = e.target.value;
                      setQuickForm((prev) => ({ ...prev, branch: newBranch }));
                    }}
                    className="h-10 w-full rounded-xl border-2 border-primary/40 bg-background px-3 text-xs font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        🏢 {b} Branch
                      </option>
                    ))}
                  </select>
                </div>

                {/* Serial Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-foreground">
                      Serial Number / Asset Tag <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const selProd = products.find((p) => p.id === quickForm.productId);
                        const cleanPrefix = (selProd?.name || 'AST')
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .slice(0, 4)
                          .toUpperCase() || 'AST';
                        const branchCode = (quickForm.branch || 'DEL').slice(0, 3).toUpperCase();
                        const genSerial = `${cleanPrefix}-${branchCode}-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
                        setQuickForm((p) => ({ ...p, serialNumber: genSerial }));
                      }}
                      className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" /> Auto-Generate Tag
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={quickForm.serialNumber}
                    onChange={(e) => setQuickForm((p) => ({ ...p, serialNumber: e.target.value }))}
                    placeholder="e.g. XRAY-DEL-001 or PF49A001"
                    className="h-10 w-full rounded-xl border-2 border-border bg-background px-3 text-xs font-mono font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Model / Specs
                    </label>
                    <input
                      type="text"
                      value={quickForm.model}
                      onChange={(e) => setQuickForm((p) => ({ ...p, model: e.target.value }))}
                      placeholder="e.g. Standard Model"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">
                      Unit Value (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={quickForm.amount}
                      onChange={(e) => setQuickForm((p) => ({ ...p, amount: e.target.value }))}
                      placeholder="0"
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs font-mono focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={quickForm.notes}
                    onChange={(e) => setQuickForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="e.g. Added directly to registry"
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-xs focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickRegisterOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isQuickRegistering}
                  className="text-xs font-bold gap-1.5 shadow-md cursor-pointer"
                >
                  <Check className={`h-3.5 w-3.5 ${isQuickRegistering ? 'animate-spin' : ''}`} />
                  {isQuickRegistering ? 'Registering...' : 'Register Asset in Registry'}
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
