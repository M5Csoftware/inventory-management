'use client';

import React, { useState } from 'react';
import { TaxInvoiceData, TaxInvoiceItem, INITIAL_SAMPLE_TAX_INVOICE, BLANK_TAX_INVOICE } from '@/types/tax-invoice';
import { numberToIndianWords } from '@/lib/number-to-words';
import {
  Building2,
  User,
  FileText,
  Plane,
  Receipt,
  Landmark,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Calculator,
  ChevronDown,
  ChevronUp,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface TaxInvoiceFormProps {
  data: TaxInvoiceData;
  onChange: (updated: TaxInvoiceData) => void;
  onReset: () => void;
  onLoadSample: () => void;
}

export function TaxInvoiceForm({
  data,
  onChange,
  onReset,
  onLoadSample,
}: TaxInvoiceFormProps) {
  // Collapsible section states for a neat, uncluttered UI
  const [openSections, setOpenSections] = useState({
    recipient: true,
    invoiceMeta: true,
    logistics: true,
    items: true,
    bankTotals: true,
    companyTerms: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper updater
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const next = JSON.parse(JSON.stringify(data)) as TaxInvoiceData;
    let curr: any = next;
    for (let i = 0; i < keys.length - 1; i++) {
      curr = curr[keys[i]];
    }
    curr[keys[keys.length - 1]] = value;

    // If update impacts totals, recalculate summary & words
    if (
      path.startsWith('items') ||
      path === 'summary.advanceReceived' ||
      path === 'summary.roundOff'
    ) {
      const totalTaxable = next.items.reduce((s, it) => s + (Number(it.taxableValue) || 0), 0);
      const totalCgst = next.items.reduce((s, it) => s + (Number(it.cgstAmount) || 0), 0);
      const totalSgst = next.items.reduce((s, it) => s + (Number(it.sgstAmount) || 0), 0);
      const totalIgst = next.items.reduce((s, it) => s + (Number(it.igstAmount) || 0), 0);
      const totalInvoiceValue = next.items.reduce((s, it) => s + (Number(it.total) || 0), 0);
      const advance = Number(next.summary.advanceReceived) || 0;
      const roundOff = Number(next.summary.roundOff) || 0;
      const netPayable = totalInvoiceValue + roundOff - advance;

      // Auto-update amount in words if not manually detached
      if (!next.summary.amountInWords || next.summary.amountInWords.includes('Rupees')) {
        next.summary.amountInWords = numberToIndianWords(Math.round(netPayable));
      }
    }

    onChange(next);
  };

  // Line item handlers
  const handleItemChange = (index: number, field: keyof TaxInvoiceItem, value: any) => {
    const next = JSON.parse(JSON.stringify(data)) as TaxInvoiceData;
    const item = next.items[index];
    (item as any)[field] = value;

    // Auto-calculate item values
    if (field === 'amount' || field === 'nonGstExempt' || field === 'cgstPercent' || field === 'sgstPercent' || field === 'igstPercent') {
      const amt = Number(item.amount) || 0;
      const nonGst = Number(item.nonGstExempt) || 0;
      const taxable = Math.max(0, amt - nonGst);
      item.taxableValue = Number(taxable.toFixed(2));

      const cgstP = Number(item.cgstPercent) || 0;
      const sgstP = Number(item.sgstPercent) || 0;
      const igstP = Number(item.igstPercent) || 0;

      item.cgstAmount = Number(((taxable * cgstP) / 100).toFixed(2));
      item.sgstAmount = Number(((taxable * sgstP) / 100).toFixed(2));
      item.igstAmount = Number(((taxable * igstP) / 100).toFixed(2));
      item.total = Number((taxable + item.cgstAmount + item.sgstAmount + item.igstAmount).toFixed(2));
    }

    // Auto update Net Payable & Indian words
    const totalInvoiceValue = next.items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const advance = Number(next.summary.advanceReceived) || 0;
    const roundOff = Number(next.summary.roundOff) || 0;
    const netPayable = totalInvoiceValue + roundOff - advance;
    next.summary.amountInWords = numberToIndianWords(Math.round(netPayable));

    onChange(next);
  };

  const addItem = () => {
    const next = JSON.parse(JSON.stringify(data)) as TaxInvoiceData;
    const newItem: TaxInvoiceItem = {
      id: `item-${Date.now()}`,
      srNo: next.items.length + 1,
      description: '',
      sacHsn: '',
      rate: 0,
      amount: 0,
      nonGstExempt: 0,
      taxableValue: 0,
      cgstPercent: 9,
      cgstAmount: 0,
      sgstPercent: 9,
      sgstAmount: 0,
      igstPercent: 0,
      igstAmount: 0,
      total: 0,
    };
    next.items.push(newItem);
    onChange(next);
    toast.success('New charge row added');
  };

  const removeItem = (index: number) => {
    if (data.items.length <= 1) {
      toast.warn('At least one item line is required');
      return;
    }
    const next = JSON.parse(JSON.stringify(data)) as TaxInvoiceData;
    next.items.splice(index, 1);
    next.items.forEach((it, idx) => (it.srNo = idx + 1));
    onChange(next);
    toast.info('Item line removed');
  };

  const setAllTaxPreset = (mode: 'intra' | 'inter' | 'zero') => {
    const next = JSON.parse(JSON.stringify(data)) as TaxInvoiceData;
    next.items.forEach((item) => {
      if (mode === 'intra') {
        item.cgstPercent = 9;
        item.sgstPercent = 9;
        item.igstPercent = 0;
      } else if (mode === 'inter') {
        item.cgstPercent = 0;
        item.sgstPercent = 0;
        item.igstPercent = 18;
      } else {
        item.cgstPercent = 0;
        item.sgstPercent = 0;
        item.igstPercent = 0;
      }
      const taxable = Number(item.taxableValue) || 0;
      item.cgstAmount = Number(((taxable * item.cgstPercent) / 100).toFixed(2));
      item.sgstAmount = Number(((taxable * item.sgstPercent) / 100).toFixed(2));
      item.igstAmount = Number(((taxable * item.igstPercent) / 100).toFixed(2));
      item.total = Number((taxable + item.cgstAmount + item.sgstAmount + item.igstAmount).toFixed(2));
    });

    const totalInvoiceValue = next.items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const advance = Number(next.summary.advanceReceived) || 0;
    const roundOff = Number(next.summary.roundOff) || 0;
    const netPayable = totalInvoiceValue + roundOff - advance;
    next.summary.amountInWords = numberToIndianWords(Math.round(netPayable));

    onChange(next);
    toast.info(`Tax preset updated to ${mode === 'intra' ? 'CGST 9% + SGST 9%' : mode === 'inter' ? 'IGST 18%' : 'Nil/Zero Tax'}`);
  };

  const calculateAutoRoundOff = () => {
    const totalInvoiceValue = data.items.reduce((s, it) => s + (Number(it.total) || 0), 0);
    const rounded = Math.round(totalInvoiceValue);
    const diff = Number((rounded - totalInvoiceValue).toFixed(2));
    updateField('summary.roundOff', diff);
    toast.info(`Calculated round off: ${diff > 0 ? '+' : ''}${diff}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-muted/40 rounded-2xl border border-border/80">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Manual Tax Invoice Editor
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            All fields are manual and independent of the database. Instant live preview on the right.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSample}
            className="text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
            Load Sample PDF Data
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Clear Form
          </Button>
        </div>
      </div>

      {/* SECTION 1: Recipient & Client Details */}
      <div className="bg-card rounded-2xl border border-border/70 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('recipient')}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <User className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">1. Recipient (Client Details)</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              Bill To / Consignee
            </span>
          </div>
          {openSections.recipient ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.recipient && (
          <div className="p-5 space-y-4 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recipient / Company Name
                </label>
                <input
                  type="text"
                  value={data.recipient.name}
                  onChange={(e) => updateField('recipient.name', e.target.value)}
                  placeholder="e.g. SPREETRANS INTERNATIONAL"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-semibold focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  State / State Code
                </label>
                <input
                  type="text"
                  value={data.recipient.state}
                  onChange={(e) => updateField('recipient.state', e.target.value)}
                  placeholder="e.g. [07] or Delhi"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recipient Full Address
                </label>
                <textarea
                  rows={3}
                  value={data.recipient.address}
                  onChange={(e) => updateField('recipient.address', e.target.value)}
                  placeholder="Street address, complex, landmark, city, postal code..."
                  className="w-full rounded-lg border-2 border-border/80 bg-background p-2.5 text-xs font-mono leading-relaxed focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    PAN No
                  </label>
                  <input
                    type="text"
                    value={data.recipient.panNo}
                    onChange={(e) => updateField('recipient.panNo', e.target.value)}
                    placeholder="e.g. AFCPB2067D"
                    className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    GST No / GSTIN
                  </label>
                  <input
                    type="text"
                    value={data.recipient.gstNo}
                    onChange={(e) => updateField('recipient.gstNo', e.target.value)}
                    placeholder="e.g. 07AFCPB2067D2Z2"
                    className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none uppercase font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Invoice & Identification Details */}
      <div className="bg-card rounded-2xl border border-border/70 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('invoiceMeta')}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">2. Invoice Details &amp; Place of Supply</span>
          </div>
          {openSections.invoiceMeta ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.invoiceMeta && (
          <div className="p-5 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Invoice Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={data.invoice.invoiceNo}
                  onChange={(e) => updateField('invoice.invoiceNo', e.target.value)}
                  placeholder="e.g. INV/DEL/2627/0002"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-mono font-bold focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Invoice Date
                </label>
                <input
                  type="text"
                  value={data.invoice.invoiceDate}
                  onChange={(e) => updateField('invoice.invoiceDate', e.target.value)}
                  placeholder="e.g. 28-Oct-2026"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Due Date
                </label>
                <input
                  type="text"
                  value={data.invoice.dueDate}
                  onChange={(e) => updateField('invoice.dueDate', e.target.value)}
                  placeholder="e.g. 28-Oct-2026"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Place of Supply
                </label>
                <input
                  type="text"
                  value={data.invoice.placeOfSupply}
                  onChange={(e) => updateField('invoice.placeOfSupply', e.target.value)}
                  placeholder="e.g. [07] or Delhi"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm focus:border-primary focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Shipment Number
                </label>
                <input
                  type="text"
                  value={data.invoice.shipmentNo}
                  onChange={(e) => updateField('invoice.shipmentNo', e.target.value)}
                  placeholder="e.g. DEL/2397/2627"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Shipment Type
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    list="shipment-types-preset"
                    value={data.invoice.shipmentType}
                    onChange={(e) => updateField('invoice.shipmentType', e.target.value)}
                    placeholder="e.g. AIR_EXPORT"
                    className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm uppercase font-bold focus:border-primary focus:outline-none"
                  />
                  <datalist id="shipment-types-preset">
                    <option value="AIR_EXPORT" />
                    <option value="AIR_IMPORT" />
                    <option value="SEA_EXPORT" />
                    <option value="SEA_IMPORT" />
                    <option value="DOMESTIC_AIR" />
                    <option value="DOMESTIC_SURFACE" />
                  </datalist>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Logistics & Cargo Specifications */}
      <div className="bg-card rounded-2xl border border-border/70 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('logistics')}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Plane className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">3. Logistics, Waybills &amp; Port Specifications</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              MAWB, Flight, Ports, Weights
            </span>
          </div>
          {openSections.logistics ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.logistics && (
          <div className="p-5 space-y-5 border-t border-border/50">
            {/* Airway Bill, Shipping Bill, Cargo Specs */}
            <div>
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                Airway Bills &amp; Customs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">MAWB No.</label>
                  <input
                    type="text"
                    value={data.logistics.mawbNo}
                    onChange={(e) => updateField('logistics.mawbNo', e.target.value)}
                    placeholder="157-5145 2800"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono font-bold focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">MAWB Date</label>
                  <input
                    type="text"
                    value={data.logistics.mawbDate}
                    onChange={(e) => updateField('logistics.mawbDate', e.target.value)}
                    placeholder="25-Sep-2026"
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">HAWB No.</label>
                  <input
                    type="text"
                    value={data.logistics.hawbNo}
                    onChange={(e) => updateField('logistics.hawbNo', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">HAWB Date</label>
                  <input
                    type="text"
                    value={data.logistics.hawbDate}
                    onChange={(e) => updateField('logistics.hawbDate', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">SB No.</label>
                  <input
                    type="text"
                    value={data.logistics.sbNo}
                    onChange={(e) => updateField('logistics.sbNo', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">SB Date</label>
                  <input
                    type="text"
                    value={data.logistics.sbDate}
                    onChange={(e) => updateField('logistics.sbDate', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">BOE No.</label>
                  <input
                    type="text"
                    value={data.logistics.boeNo}
                    onChange={(e) => updateField('logistics.boeNo', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">BOE Date</label>
                  <input
                    type="text"
                    value={data.logistics.boeDate}
                    onChange={(e) => updateField('logistics.boeDate', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Exporter Inv No.</label>
                  <input
                    type="text"
                    value={data.logistics.exporterInvNo}
                    onChange={(e) => updateField('logistics.exporterInvNo', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Exporter Inv Date</label>
                  <input
                    type="text"
                    value={data.logistics.exporterInvDate}
                    onChange={(e) => updateField('logistics.exporterInvDate', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Cargo Type</label>
                  <input
                    type="text"
                    value={data.logistics.cargoType}
                    onChange={(e) => updateField('logistics.cargoType', e.target.value)}
                    placeholder="General / Dangerous / Perishable"
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Volume (CBM)</label>
                  <input
                    type="text"
                    value={data.logistics.volume}
                    onChange={(e) => updateField('logistics.volume', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Weights, Packages & Airline */}
            <div className="border-t border-border/50 pt-4">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                Packages, Weights &amp; Flight
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Packages</label>
                  <input
                    type="text"
                    value={data.logistics.packages}
                    onChange={(e) => updateField('logistics.packages', e.target.value)}
                    placeholder="70"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-bold focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Gross Weight</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={data.logistics.grossWeight}
                      onChange={(e) => updateField('logistics.grossWeight', e.target.value)}
                      placeholder="1699"
                      className="h-8 w-full rounded border border-border px-2 text-xs font-bold focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      value={data.logistics.grossWeightUnit}
                      onChange={(e) => updateField('logistics.grossWeightUnit', e.target.value)}
                      className="h-8 w-14 rounded border border-border px-1 text-center text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Chargeable Weight</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={data.logistics.chargeableWeight}
                      onChange={(e) => updateField('logistics.chargeableWeight', e.target.value)}
                      placeholder="1699"
                      className="h-8 w-full rounded border border-border px-2 text-xs font-bold focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      value={data.logistics.chargeableWeightUnit}
                      onChange={(e) => updateField('logistics.chargeableWeightUnit', e.target.value)}
                      className="h-8 w-14 rounded border border-border px-1 text-center text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Net Weight</label>
                  <input
                    type="text"
                    value={data.logistics.netWeight}
                    onChange={(e) => updateField('logistics.netWeight', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Flight No.</label>
                  <input
                    type="text"
                    value={data.logistics.flightNo}
                    onChange={(e) => updateField('logistics.flightNo', e.target.value)}
                    placeholder="QR"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono font-bold focus:border-primary focus:outline-none uppercase"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Flight Date</label>
                  <input
                    type="text"
                    value={data.logistics.flightDate}
                    onChange={(e) => updateField('logistics.flightDate', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Airline</label>
                  <input
                    type="text"
                    value={data.logistics.airline}
                    onChange={(e) => updateField('logistics.airline', e.target.value)}
                    placeholder="QATAR AIRWAYS"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-semibold focus:border-primary focus:outline-none uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Shipper, Consignee & Ports Routing */}
            <div className="border-t border-border/50 pt-4">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                Parties &amp; Ports Routing
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Shipper Ref.</label>
                  <input
                    type="text"
                    value={data.logistics.shipperRef}
                    onChange={(e) => updateField('logistics.shipperRef', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Inco Terms</label>
                  <input
                    type="text"
                    value={data.logistics.incoTerms}
                    onChange={(e) => updateField('logistics.incoTerms', e.target.value)}
                    placeholder="FOB / CIF / EXW"
                    className="h-8 w-full rounded border border-border px-2 text-xs uppercase focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Shipper</label>
                  <input
                    type="text"
                    value={data.logistics.shipper}
                    onChange={(e) => updateField('logistics.shipper', e.target.value)}
                    placeholder="SPREETRANS INTERNATIONAL"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-semibold focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Consignee</label>
                  <input
                    type="text"
                    value={data.logistics.consignee}
                    onChange={(e) => updateField('logistics.consignee', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Place of Receipt</label>
                  <input
                    type="text"
                    value={data.logistics.placeOfReceipt}
                    onChange={(e) => updateField('logistics.placeOfReceipt', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Place of Delivery</label>
                  <input
                    type="text"
                    value={data.logistics.placeOfDelivery}
                    onChange={(e) => updateField('logistics.placeOfDelivery', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Loading Port</label>
                  <input
                    type="text"
                    value={data.logistics.loadingPort}
                    onChange={(e) => updateField('logistics.loadingPort', e.target.value)}
                    placeholder="DEL"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-bold uppercase focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Discharge Port</label>
                  <input
                    type="text"
                    value={data.logistics.dischargePort}
                    onChange={(e) => updateField('logistics.dischargePort', e.target.value)}
                    placeholder="LHR"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-bold uppercase focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Destination Port</label>
                  <input
                    type="text"
                    value={data.logistics.destinationPort}
                    onChange={(e) => updateField('logistics.destinationPort', e.target.value)}
                    placeholder="LHR"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-bold uppercase focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Line Items & Charges Table */}
      <div className="bg-card rounded-2xl border border-border/70 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('items')}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">4. Charges / Items Table</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              {data.items.length} line(s)
            </span>
          </div>
          {openSections.items ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.items && (
          <div className="p-5 space-y-4 border-t border-border/50">
            {/* Quick tax presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-muted/30 rounded-xl border border-border/60 text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-primary" /> Apply GST Preset to all rows:
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllTaxPreset('intra')}
                  className="h-7 text-xs font-semibold hover:border-primary cursor-pointer"
                >
                  CGST (9%) + SGST (9%)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllTaxPreset('inter')}
                  className="h-7 text-xs font-semibold hover:border-primary cursor-pointer"
                >
                  IGST (18%)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllTaxPreset('zero')}
                  className="h-7 text-xs font-semibold hover:border-primary cursor-pointer"
                >
                  0% (Exempt)
                </Button>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-4">
              {data.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl border border-border bg-background shadow-xs space-y-3 relative group"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-2">
                    <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Row #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      title="Delete row"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs">
                    <div className="lg:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="e.g. AIR FREIGHT"
                        className="h-8 w-full rounded border border-border px-2 text-xs font-bold focus:border-primary focus:outline-none uppercase"
                      />
                    </div>

                    <div className="lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        SAC / HSN
                      </label>
                      <input
                        type="text"
                        value={item.sacHsn}
                        onChange={(e) => handleItemChange(idx, 'sacHsn', e.target.value)}
                        placeholder="52115120"
                        className="h-8 w-full rounded border border-border px-2 text-xs font-mono focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Rate (INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate || ''}
                        onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="280.00"
                        className="h-8 w-full rounded border border-border px-2 text-xs font-mono text-right focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Amount (INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount || ''}
                        onChange={(e) => handleItemChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="475720.00"
                        className="h-8 w-full rounded border border-border px-2 text-xs font-mono font-bold text-right focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="lg:col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">
                        Non GST Exempt
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.nonGstExempt ?? ''}
                        onChange={(e) => handleItemChange(idx, 'nonGstExempt', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-8 w-full rounded border border-border px-2 text-xs font-mono text-right focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Taxes breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/40 text-[11px] bg-muted/20 p-2 rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground font-semibold">Taxable:</span>
                      <div className="font-mono font-bold text-foreground">₹{Number(item.taxableValue || 0).toFixed(2)}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">CGST:</span>
                        <input
                          type="number"
                          value={item.cgstPercent}
                          onChange={(e) => handleItemChange(idx, 'cgstPercent', parseFloat(e.target.value) || 0)}
                          className="w-10 h-5 text-[10px] text-center border rounded font-mono"
                        />%
                      </div>
                      <div className="font-mono text-xs text-foreground">₹{Number(item.cgstAmount || 0).toFixed(2)}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">SGST:</span>
                        <input
                          type="number"
                          value={item.sgstPercent}
                          onChange={(e) => handleItemChange(idx, 'sgstPercent', parseFloat(e.target.value) || 0)}
                          className="w-10 h-5 text-[10px] text-center border rounded font-mono"
                        />%
                      </div>
                      <div className="font-mono text-xs text-foreground">₹{Number(item.sgstAmount || 0).toFixed(2)}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-semibold">IGST:</span>
                        <input
                          type="number"
                          value={item.igstPercent}
                          onChange={(e) => handleItemChange(idx, 'igstPercent', parseFloat(e.target.value) || 0)}
                          className="w-10 h-5 text-[10px] text-center border rounded font-mono"
                        />%
                      </div>
                      <div className="font-mono text-xs text-foreground">₹{Number(item.igstAmount || 0).toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <span className="text-xs font-bold text-foreground">
                      Row Total: <span className="text-primary font-mono text-sm">₹{Number(item.total || 0).toFixed(2)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="w-full border-dashed border-2 py-4 font-bold text-primary hover:bg-primary/5 cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add Charge / Service Item
            </Button>
          </div>
        )}
      </div>

      {/* SECTION 5: Bank Details & Financial Summary */}
      <div className="bg-card rounded-2xl border border-border/70 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('bankTotals')}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Landmark className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">5. Bank Details &amp; Summary Adjustments</span>
          </div>
          {openSections.bankTotals ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.bankTotals && (
          <div className="p-5 space-y-5 border-t border-border/50">
            {/* Bank details */}
            <div>
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                Bank Account Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Bank Name</label>
                  <input
                    type="text"
                    value={data.bank.bankName}
                    onChange={(e) => updateField('bank.bankName', e.target.value)}
                    placeholder="ICICI BANK"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-semibold focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Branch</label>
                  <input
                    type="text"
                    value={data.bank.branch}
                    onChange={(e) => updateField('bank.branch', e.target.value)}
                    placeholder="DWARKA SEC 10"
                    className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">A/C Number</label>
                  <input
                    type="text"
                    value={data.bank.accountNo}
                    onChange={(e) => updateField('bank.accountNo', e.target.value)}
                    placeholder="403605500215"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono font-bold focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Swift Code</label>
                  <input
                    type="text"
                    value={data.bank.swiftCode}
                    onChange={(e) => updateField('bank.swiftCode', e.target.value)}
                    placeholder="ICICINBBCTS"
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono uppercase focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">NEFT / RTGS</label>
                  <input
                    type="text"
                    value={data.bank.neftRtgs}
                    onChange={(e) => updateField('bank.neftRtgs', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">IRN</label>
                  <input
                    type="text"
                    value={data.bank.irn}
                    onChange={(e) => updateField('bank.irn', e.target.value)}
                    placeholder=""
                    className="h-8 w-full rounded border border-border px-2 text-xs font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Adjustments: Round Off, Advance, Reverse Charge */}
            <div className="border-t border-border/50 pt-4">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                Payment Adjustments &amp; Words
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Advance Received (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.summary.advanceReceived ?? ''}
                    onChange={(e) => updateField('summary.advanceReceived', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-mono text-right focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Round Off (INR)
                    </label>
                    <button
                      type="button"
                      onClick={calculateAutoRoundOff}
                      className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                    >
                      Auto Round
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={data.summary.roundOff ?? ''}
                    onChange={(e) => updateField('summary.roundOff', parseFloat(e.target.value) || 0)}
                    placeholder="0.40"
                    className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-mono text-right focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Tax on Reverse Charge (INR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.summary.taxPayableOnReverseCharge ?? ''}
                    onChange={(e) => updateField('summary.taxPayableOnReverseCharge', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-sm font-mono text-right focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Amount in words editable */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Amount in Words (INR)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const totalInvoiceValue = data.items.reduce((s, it) => s + (Number(it.total) || 0), 0);
                      const advance = Number(data.summary.advanceReceived) || 0;
                      const roundOff = Number(data.summary.roundOff) || 0;
                      const netPayable = totalInvoiceValue + roundOff - advance;
                      updateField('summary.amountInWords', numberToIndianWords(Math.round(netPayable)));
                      toast.success('Amount in words regenerated');
                    }}
                    className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Re-generate
                  </button>
                </div>
                <input
                  type="text"
                  value={data.summary.amountInWords}
                  onChange={(e) => updateField('summary.amountInWords', e.target.value)}
                  placeholder="e.g. Five Lakh Sixty One Thousand Eight Hundred Twenty Two Rupees Only"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-xs font-semibold focus:border-primary focus:outline-none"
                />
              </div>

              {/* Remark */}
              <div className="mt-4 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Remark / Special Notes
                </label>
                <input
                  type="text"
                  value={data.summary.remark}
                  onChange={(e) => updateField('summary.remark', e.target.value)}
                  placeholder="Enter any additional remark or leave blank"
                  className="h-9 w-full rounded-lg border-2 border-border/80 bg-background px-3 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: Company Header & Terms & Conditions (Collapsible) */}
      <div className="bg-card rounded-2xl border border-border/70 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('companyTerms')}
          className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">6. Company Details &amp; Terms &amp; Conditions</span>
            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
              Letterhead info
            </span>
          </div>
          {openSections.companyTerms ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.companyTerms && (
          <div className="p-5 space-y-4 border-t border-border/50 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Company Name</label>
                <input
                  type="text"
                  value={data.company.name}
                  onChange={(e) => updateField('company.name', e.target.value)}
                  className="h-8 w-full rounded border border-border px-2 text-xs font-bold uppercase focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">GST No.</label>
                <input
                  type="text"
                  value={data.company.gstNo}
                  onChange={(e) => updateField('company.gstNo', e.target.value)}
                  className="h-8 w-full rounded border border-border px-2 text-xs font-mono uppercase focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">PAN No.</label>
                <input
                  type="text"
                  value={data.company.panNo}
                  onChange={(e) => updateField('company.panNo', e.target.value)}
                  className="h-8 w-full rounded border border-border px-2 text-xs font-mono uppercase focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">CIN No.</label>
                <input
                  type="text"
                  value={data.company.cinNo}
                  onChange={(e) => updateField('company.cinNo', e.target.value)}
                  className="h-8 w-full rounded border border-border px-2 text-xs font-mono uppercase focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Email</label>
                <input
                  type="text"
                  value={data.company.email}
                  onChange={(e) => updateField('company.email', e.target.value)}
                  className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone</label>
                <input
                  type="text"
                  value={data.company.tel}
                  onChange={(e) => updateField('company.tel', e.target.value)}
                  className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Address Line 1</label>
                <input
                  type="text"
                  value={data.company.addressLine1}
                  onChange={(e) => updateField('company.addressLine1', e.target.value)}
                  className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Address Line 2</label>
                <input
                  type="text"
                  value={data.company.addressLine2}
                  onChange={(e) => updateField('company.addressLine2', e.target.value)}
                  className="h-8 w-full rounded border border-border px-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Terms lines */}
            <div className="pt-3 border-t border-border/50 space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Terms &amp; Conditions (One per line)
              </label>
              <textarea
                rows={5}
                value={data.summary.termsAndConditions.join('\n')}
                onChange={(e) => updateField('summary.termsAndConditions', e.target.value.split('\n'))}
                className="w-full rounded border border-border p-2 text-xs font-mono leading-relaxed focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
