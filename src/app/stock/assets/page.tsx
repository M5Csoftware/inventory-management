'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useInventory, AssetAssignment, BRANCHES, ASSET_DEPARTMENTS } from '@/context/inventory-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Laptop,
  PlusCircle,
  Search,
  Undo2,
  ArrowUpRight,
  Eye,
  Building2,
  Tag,
  History,
  Download,
  CheckCircle2,
  X,
  Users,
  Check,
  Copy,
  LayoutGrid,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ConfirmModal } from '@/components/confirm-modal';
import { toast } from 'react-toastify';

export default function AssignedAssetsPage() {
  const { assets, returnAsset, activeBranch } = useInventory();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals state
  const [selectedViewAssignment, setSelectedViewAssignment] = useState<AssetAssignment | null>(null);
  const [assetToReturn, setAssetToReturn] = useState<AssetAssignment | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);

  // Copied serial indicator
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  const handleCopySerial = (serial: string) => {
    if (!serial) return;
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    toast.info(`Copied serial ${serial} to clipboard!`);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  // Filtered Asset Assignments
  const filteredAssignments = useMemo(() => {
    return assets.filter((a) => {
      if (branchFilter !== 'All' && a.branch !== branchFilter) return false;
      if (activeBranch !== 'All' && a.branch !== activeBranch) return false;
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (departmentFilter !== 'All' && a.department !== departmentFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const inProduct = (a.productName || '').toLowerCase().includes(q);
        const inAssignee = (a.assignedTo || '').toLowerCase().includes(q);
        const inDept = (a.department || '').toLowerCase().includes(q);
        const inApprover = (a.approvedBy || '').toLowerCase().includes(q);
        const inSerial = (a.serialNumber || '').toLowerCase().includes(q);
        const inModel = (a.modelNumber || '').toLowerCase().includes(q);
        const inId = (a.id || '').toLowerCase().includes(q);
        if (!inProduct && !inAssignee && !inDept && !inApprover && !inSerial && !inModel && !inId) {
          return false;
        }
      }
      return true;
    });
  }, [assets, branchFilter, activeBranch, statusFilter, departmentFilter, searchTerm]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalAssignments = assets.length;
    const activeAssigned = assets.filter((a) => a.status === 'Assigned').length;
    const returned = assets.filter((a) => a.status === 'Returned').length;
    const uniqueStaff = new Set(assets.map((a) => a.assignedTo)).size;
    return { totalAssignments, activeAssigned, returned, uniqueStaff };
  }, [assets]);

  // Execute Return Asset
  const handleReturn = async (asset: AssetAssignment) => {
    setReturningId(asset.id);
    try {
      await returnAsset(asset.id);
      setAssetToReturn(null);
    } finally {
      setReturningId(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Assignment ID',
      'Product Name',
      'Serial Number',
      'Model Number',
      'Assigned To',
      'Department',
      'Branch',
      'Approved By',
      'Assigned Date',
      'Returned Date',
      'Status',
      'Warranty',
      'Notes',
    ];

    const rows = filteredAssignments.map((a) => [
      a.id,
      `"${a.productName || ''}"`,
      `"${a.serialNumber || ''}"`,
      `"${a.modelNumber || ''}"`,
      `"${a.assignedTo || ''}"`,
      `"${a.department || ''}"`,
      a.branch || 'Ahmedabad',
      `"${a.approvedBy || ''}"`,
      a.assignedDate ? new Date(a.assignedDate).toLocaleDateString('en-IN') : '',
      a.returnedDate ? new Date(a.returnedDate).toLocaleDateString('en-IN') : '',
      a.status,
      `"${a.warranty || ''}"`,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assigned_assets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Assigned assets exported to CSV!');
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
              Assets (Assigned)
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
              <Tag className="h-3.5 w-3.5" /> Staff Allocations
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            View where all devices and equipment are currently assigned across staff, departments, and branches.
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
          <Link href="/stock/assets/all">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 cursor-pointer">
              <Laptop className="h-3.5 w-3.5 text-primary" /> All Assets (Manage)
            </Button>
          </Link>
          <Link href="/stock/assets/audit">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 cursor-pointer">
              <History className="h-3.5 w-3.5 text-primary" /> Assets Log
            </Button>
          </Link>
          <Link href="/stock/assets/in">
            <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer">
              <ArrowUpRight className="h-3.5 w-3.5" /> Stock In Assets
            </Button>
          </Link>
          <Link href="/stock/assets/new">
            <Button size="sm" className="text-xs font-bold gap-1.5 shadow-md hover:shadow-lg cursor-pointer">
              <PlusCircle className="h-3.5 w-3.5" /> Assign Asset
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="bg-card/70 border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Currently Assigned</span>
              <Tag className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {stats.activeAssigned}
            </div>
            <p className="text-[11px] text-muted-foreground">Active in-use devices</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Returned Units</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {stats.returned}
            </div>
            <p className="text-[11px] text-muted-foreground">Checked back into stock</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Assigned Employees</span>
              <Users className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">
              {stats.uniqueStaff}
            </div>
            <p className="text-[11px] text-muted-foreground">Unique staff holders</p>
          </CardContent>
        </Card>

        <Card className="bg-card/70 border-border/60 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Assignments</span>
              <LayoutGrid className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground font-mono">
              {stats.totalAssignments}
            </div>
            <p className="text-[11px] text-muted-foreground">Cumulative records</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/60 shadow-sm bg-card overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/50 bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base font-bold text-foreground">
                Staff &amp; Department Assignments Registry ({filteredAssignments.length})
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

              {/* Department Filter */}
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="All">All Departments</option>
                {ASSET_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
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
                <option value="Assigned">Assigned</option>
                <option value="Returned">Returned</option>
              </select>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search staff, serial, device, approver..."
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
                  <th className="px-5 py-3.5 font-semibold">ID</th>
                  <th className="px-5 py-3.5 font-semibold">Product Name</th>
                  <th className="px-5 py-3.5 font-semibold">Serial Number</th>
                  <th className="px-5 py-3.5 font-semibold">Model</th>
                  <th className="px-5 py-3.5 font-semibold">Assigned To</th>
                  <th className="px-4 py-3.5 font-semibold">Department</th>
                  <th className="px-4 py-3.5 font-semibold">Branch</th>
                  <th className="px-4 py-3.5 font-semibold">Approved By</th>
                  <th className="px-4 py-3.5 font-semibold">Assigned Date</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Tag className="h-8 w-8 text-muted-foreground/30" />
                        <p className="font-semibold text-foreground">No asset assignments found.</p>
                        <p className="text-xs max-w-sm">
                          Assign equipment to staff members using{' '}
                          <Link href="/stock/assets/new" className="text-primary underline font-medium">
                            Assign Asset
                          </Link>
                          .
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map((asset) => (
                    <tr key={asset.id} className="hover:bg-muted/30 transition-colors">
                      {/* ID */}
                      <td className="px-5 py-3.5 font-mono font-bold text-primary">{asset.id}</td>

                      {/* Product Name */}
                      <td className="px-5 py-3.5 font-bold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <Laptop className="h-3.5 w-3.5 text-primary shrink-0" />
                          {asset.productName}
                        </div>
                      </td>

                      {/* Serial Number with Copy Button */}
                      <td className="px-5 py-3.5">
                        {asset.serialNumber ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                              {asset.serialNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopySerial(asset.serialNumber || '')}
                              title="Copy Serial Number"
                              className="text-muted-foreground hover:text-primary transition-colors p-1 cursor-pointer"
                            >
                              {copiedSerial === asset.serialNumber ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </td>

                      {/* Model Number */}
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {asset.modelNumber ? (
                          <span className="text-foreground font-medium">{asset.modelNumber}</span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Assigned To */}
                      <td className="px-5 py-3.5 font-bold text-foreground">
                        👤 {asset.assignedTo}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-400 border border-purple-500/20">
                          {asset.department || 'General'}
                        </span>
                      </td>

                      {/* Branch */}
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" /> {asset.branch || 'Ahmedabad'}
                        </span>
                      </td>

                      {/* Approved By */}
                      <td className="px-4 py-3.5">
                        {asset.approvedBy ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✓ {asset.approvedBy}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Assigned Date */}
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString('en-IN') : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        {asset.status === 'Assigned' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Tag className="h-2.5 w-2.5" /> Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Returned
                          </span>
                        )}
                      </td>

                      {/* Actions: View and Return only (No Edit, No Delete) */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedViewAssignment(asset)}
                            title="View Assignment Details"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>

                          {/* Return Asset */}
                          {asset.status === 'Assigned' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAssetToReturn(asset)}
                              disabled={returningId === asset.id}
                              className="h-7 px-2 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/50 cursor-pointer"
                            >
                              <Undo2 className="h-3 w-3 mr-1" />
                              Return
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* MODAL: VIEW ASSIGNMENT DETAILS */}
      {/* ========================================================================= */}
      {selectedViewAssignment && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Tag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Asset Assignment Details</h3>
                  <p className="text-xs text-muted-foreground font-mono">{selectedViewAssignment.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedViewAssignment(null)}
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Assigned Employee:</span>
                  <span className="font-bold text-sm text-foreground">{selectedViewAssignment.assignedTo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Department:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{selectedViewAssignment.department}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Approved By:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">✓ {selectedViewAssignment.approvedBy}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Branch:</span>
                  <span className="font-medium text-foreground">🏢 {selectedViewAssignment.branch || 'Ahmedabad'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Product Name:</span>
                  <span className="font-bold text-foreground">{selectedViewAssignment.productName}</span>
                </div>
                {selectedViewAssignment.serialNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Serial Number:</span>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {selectedViewAssignment.serialNumber}
                    </span>
                  </div>
                )}
                {selectedViewAssignment.modelNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Model Number:</span>
                    <span className="font-medium text-foreground">{selectedViewAssignment.modelNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Assigned Date:</span>
                  <span className="text-foreground">
                    {selectedViewAssignment.assignedDate
                      ? new Date(selectedViewAssignment.assignedDate).toLocaleString('en-IN')
                      : '—'}
                  </span>
                </div>
                {selectedViewAssignment.returnedDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-semibold">Returned Date:</span>
                    <span className="text-emerald-600 font-medium">
                      {new Date(selectedViewAssignment.returnedDate).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-semibold">Status:</span>
                  <span className="font-bold text-foreground">
                    {selectedViewAssignment.status}
                  </span>
                </div>
              </div>

              {selectedViewAssignment.notes && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-foreground italic">
                  Notes: {selectedViewAssignment.notes}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-border/50 bg-muted/20 flex items-center justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedViewAssignment(null)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRMATION MODAL: RETURN ASSET */}
      {/* ========================================================================= */}
      <ConfirmModal
        isOpen={assetToReturn !== null}
        onClose={() => setAssetToReturn(null)}
        onConfirm={async () => {
          if (assetToReturn) {
            await handleReturn(assetToReturn);
          }
        }}
        title="Confirm Asset Return"
        description="Are you sure you want to mark this asset as returned? The physical device will be checked back into active inventory."
        variant="warning"
        confirmText="Confirm Return"
        confirmLoadingText="Returning..."
        icon={<Undo2 className="h-5 w-5" />}
        itemName={
          assetToReturn ? (
            <div className="space-y-1 text-xs">
              <div className="font-bold text-foreground">
                {assetToReturn.productName} ({assetToReturn.id})
              </div>
              <div className="text-muted-foreground">
                Assigned to: <span className="font-semibold text-foreground">{assetToReturn.assignedTo}</span> ({assetToReturn.department || 'General'})
                {assetToReturn.serialNumber && ` · Serial: ${assetToReturn.serialNumber}`}
              </div>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
