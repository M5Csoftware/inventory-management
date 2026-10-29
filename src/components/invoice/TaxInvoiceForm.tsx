'use client';

import React, { useState } from 'react';
import { TaxInvoiceData, TaxInvoiceItem } from '@/types/tax-invoice';
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
  Scale,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import { DatePickerInput } from '@/components/ui/date-picker-input';

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
  // Collapsible section states
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

  const chargeableWeight = parseFloat(data.logistics.chargeableWeight) || 0;

  // Helper updater
  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const next = JSON.parse(JSON.stringify(data)) as TaxInvoiceData;
    let curr: any = next;
    for (let i = 0; i < keys.length - 1; i++) {
      curr = curr[keys[i]];
    }
    curr[keys[keys.length - 1]] = value;

    // If chargeable weight changes in logistics, automatically recalculate all items based on weight!
    if (path === 'logistics.chargeableWeight') {
      const newWeight = parseFloat(value) || 0;
      next.items.forEach((item) => {
        if (item.calculationBasis !== 'flat') {
          item.amount = Number((newWeight * (Number(item.rate) || 0)).toFixed(2));
          const nonGst = Number(item.nonGstExempt) || 0;
          const taxable = Math.max(0, item.amount - nonGst);
          item.taxableValue = Number(taxable.toFixed(2));
          item.cgstAmount = Number(((taxable * (Number(item.cgstPercent) || 0)) / 100).toFixed(2));
          item.sgstAmount = Number(((taxable * (Number(item.sgstPercent) || 0)) / 100).toFixed(2));
          item.igstAmount = Number(((taxable * (Number(item.igstPercent) || 0)) / 100).toFixed(2));
          item.total = Number((taxable + item.cgstAmount + item.sgstAmount + item.igstAmount).toFixed(2));
        }
      });
    }

    // If update impacts totals, recalculate summary & words
    if (
      path.startsWith('items') ||
      path === 'logistics.chargeableWeight' ||
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

    const chWeight = parseFloat(next.logistics.chargeableWeight) || 0;
    const basis = item.calculationBasis || 'weight';

    // Auto-calculate amount by multiplying chargeable weight and rate
    if (field === 'rate' || field === 'calculationBasis') {
      const multiplier = basis === 'flat' ? 1 : chWeight;
      item.amount = Number(((Number(item.rate) || 0) * multiplier).toFixed(2));
    }

    // Auto-calculate item values & taxes
    if (
      field === 'rate' ||
      field === 'calculationBasis' ||
      field === 'amount' ||
      field === 'nonGstExempt' ||
      field === 'cgstPercent' ||
      field === 'sgstPercent' ||
      field === 'igstPercent'
    ) {
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
      calculationBasis: 'weight',
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
    <div className="space-y-6 pb-12 w-full">
      {/* Top Banner with Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-card rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Manual Tax Invoice Editor
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chargeable Weight auto-multiplies with Rate to calculate Amount. All fields are manual and symmetrical.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSample}
            className="h-9 px-3.5 text-xs font-semibold hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
            Load Sample PDF Data
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 px-3.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Clear Form
          </Button>
        </div>
      </div>

      {/* SECTION 1: Recipient (Client Details) - Balanced 4-Column Grid */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('recipient')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">1. Recipient (Client Details)</span>
              <span className="text-[11px] text-muted-foreground">Bill To, GSTIN, PAN, and address</span>
            </div>
          </div>
          {openSections.recipient ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.recipient && (
          <div className="p-6 space-y-5 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Row 1: Name (3 cols) + State (1 col) = 4 cols */}
              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recipient / Company Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={data.recipient.name}
                  onChange={(e) => updateField('recipient.name', e.target.value)}
                  placeholder="e.g. SPREETRANS INTERNATIONAL"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-semibold focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="lg:col-span-1 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  State / State Code
                </label>
                <input
                  type="text"
                  value={data.recipient.state}
                  onChange={(e) => updateField('recipient.state', e.target.value)}
                  placeholder="e.g. [07] or Delhi"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono focus:border-primary focus:outline-none transition-all"
                />
              </div>

              {/* Row 2: GSTIN (2 cols) + PAN (2 cols) = 4 cols */}
              <div className="lg:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  GST No / GSTIN
                </label>
                <input
                  type="text"
                  value={data.recipient.gstNo}
                  onChange={(e) => updateField('recipient.gstNo', e.target.value)}
                  placeholder="e.g. 07AFCPB2067D2Z2"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono uppercase font-bold focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="lg:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  PAN No
                </label>
                <input
                  type="text"
                  value={data.recipient.panNo}
                  onChange={(e) => updateField('recipient.panNo', e.target.value)}
                  placeholder="e.g. AFCPB2067D"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono uppercase focus:border-primary focus:outline-none transition-all"
                />
              </div>

              {/* Row 3: Full Address (4 cols) = 4 cols */}
              <div className="lg:col-span-4 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Recipient Full Address
                </label>
                <textarea
                  rows={3}
                  value={data.recipient.address}
                  onChange={(e) => updateField('recipient.address', e.target.value)}
                  placeholder="Street address, complex, landmark, city, postal code..."
                  className="w-full rounded-xl border-2 border-border/80 bg-background p-3 text-xs font-mono leading-relaxed focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Invoice Details & Place of Supply - Balanced 3-Column Grid */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('invoiceMeta')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">2. Invoice Identification &amp; Shipment Info</span>
              <span className="text-[11px] text-muted-foreground">Invoice number, dates, place of supply, and shipment classification</span>
            </div>
          </div>
          {openSections.invoiceMeta ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.invoiceMeta && (
          <div className="p-6 border-t border-border/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Row 1 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Invoice Number <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={data.invoice.invoiceNo}
                  onChange={(e) => updateField('invoice.invoiceNo', e.target.value)}
                  placeholder="e.g. INV/DEL/2627/0002"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono font-bold focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Invoice Date
                </label>
                <DatePickerInput
                  value={data.invoice.invoiceDate}
                  onChange={(val) => updateField('invoice.invoiceDate', val)}
                  placeholder="Select invoice date"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Due Date
                </label>
                <DatePickerInput
                  value={data.invoice.dueDate}
                  onChange={(val) => updateField('invoice.dueDate', val)}
                  placeholder="Select due date"
                />
              </div>

              {/* Row 2 */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Place of Supply
                </label>
                <input
                  type="text"
                  value={data.invoice.placeOfSupply}
                  onChange={(e) => updateField('invoice.placeOfSupply', e.target.value)}
                  placeholder="e.g. [07] or Delhi"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono focus:border-primary focus:outline-none transition-all"
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
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono focus:border-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Shipment Type
                </label>
                <input
                  type="text"
                  list="shipment-types-preset"
                  value={data.invoice.shipmentType}
                  onChange={(e) => updateField('invoice.shipmentType', e.target.value)}
                  placeholder="e.g. AIR_EXPORT"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm uppercase font-bold focus:border-primary focus:outline-none transition-all"
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
        )}
      </div>

      {/* SECTION 3: Logistics, Waybills & Port Specifications - Highly Symmetrical */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('logistics')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Plane className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">3. Logistics, Waybills &amp; Port Specifications</span>
              <span className="text-[11px] text-muted-foreground">Waybills, weights, flight details, and port routing</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-lg">
              Chargeable Wt: {chargeableWeight} {data.logistics.chargeableWeightUnit || 'Kgs'}
            </span>
            {openSections.logistics ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {openSections.logistics && (
          <div className="p-6 space-y-6 border-t border-border/50">
            {/* Part A: 6 Symmetrical Twin Cards for Documents (Number + Date) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  Customs &amp; Waybill Documents
                </h3>
                <span className="text-[11px] text-muted-foreground">Number &amp; Issue Date pairs</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. MAWB */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">MAWB (Master Air Waybill)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={data.logistics.mawbNo}
                      onChange={(e) => updateField('logistics.mawbNo', e.target.value)}
                      placeholder="MAWB No."
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs font-mono font-bold focus:border-primary focus:outline-none"
                    />
                    <DatePickerInput
                      size="sm"
                      value={data.logistics.mawbDate}
                      onChange={(val) => updateField('logistics.mawbDate', val)}
                      placeholder="MAWB Date"
                    />
                  </div>
                </div>

                {/* 2. HAWB */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">HAWB (House Air Waybill)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={data.logistics.hawbNo}
                      onChange={(e) => updateField('logistics.hawbNo', e.target.value)}
                      placeholder="HAWB No."
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs font-mono focus:border-primary focus:outline-none"
                    />
                    <DatePickerInput
                      size="sm"
                      value={data.logistics.hawbDate}
                      onChange={(val) => updateField('logistics.hawbDate', val)}
                      placeholder="HAWB Date"
                    />
                  </div>
                </div>

                {/* 3. SB */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">SB (Shipping Bill)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={data.logistics.sbNo}
                      onChange={(e) => updateField('logistics.sbNo', e.target.value)}
                      placeholder="SB No."
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs font-mono focus:border-primary focus:outline-none"
                    />
                    <DatePickerInput
                      size="sm"
                      value={data.logistics.sbDate}
                      onChange={(val) => updateField('logistics.sbDate', val)}
                      placeholder="SB Date"
                    />
                  </div>
                </div>

                {/* 4. BOE */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">BOE (Bill of Entry)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={data.logistics.boeNo}
                      onChange={(e) => updateField('logistics.boeNo', e.target.value)}
                      placeholder="BOE No."
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs font-mono focus:border-primary focus:outline-none"
                    />
                    <DatePickerInput
                      size="sm"
                      value={data.logistics.boeDate}
                      onChange={(val) => updateField('logistics.boeDate', val)}
                      placeholder="BOE Date"
                    />
                  </div>
                </div>

                {/* 5. Exporter Invoice */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">Exporter Invoice</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={data.logistics.exporterInvNo}
                      onChange={(e) => updateField('logistics.exporterInvNo', e.target.value)}
                      placeholder="Exporter Inv No."
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs font-mono focus:border-primary focus:outline-none"
                    />
                    <DatePickerInput
                      size="sm"
                      value={data.logistics.exporterInvDate}
                      onChange={(val) => updateField('logistics.exporterInvDate', val)}
                      placeholder="Date"
                    />
                  </div>
                </div>

                {/* 6. Cargo Type & Volume */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-background/50 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">Cargo Classification</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={data.logistics.cargoType}
                      onChange={(e) => updateField('logistics.cargoType', e.target.value)}
                      placeholder="Cargo Type"
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs focus:border-primary focus:outline-none"
                    />
                    <input
                      type="text"
                      value={data.logistics.volume}
                      onChange={(e) => updateField('logistics.volume', e.target.value)}
                      placeholder="Volume (CBM)"
                      className="h-9 w-full rounded-lg border border-border px-2.5 text-xs focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Part B: Packages, Weights & Flight - Balanced 4-Column Grid */}
            <div className="border-t border-border/50 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Scale className="h-3.5 w-3.5 text-primary" />
                  Weights, Packages &amp; Flight
                </h3>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded">
                  ⚡ Changing Chargeable Weight auto-updates all line item amounts
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Packages
                  </label>
                  <input
                    type="text"
                    value={data.logistics.packages}
                    onChange={(e) => updateField('logistics.packages', e.target.value)}
                    placeholder="e.g. 70"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-bold focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Gross Weight
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={data.logistics.grossWeight}
                      onChange={(e) => updateField('logistics.grossWeight', e.target.value)}
                      placeholder="e.g. 1699"
                      className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-bold focus:border-primary focus:outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={data.logistics.grossWeightUnit}
                      onChange={(e) => updateField('logistics.grossWeightUnit', e.target.value)}
                      className="h-10 w-16 rounded-xl border-2 border-border/80 bg-background px-2 text-center text-xs font-semibold focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    Chargeable Weight <span className="text-[9px] bg-primary/10 px-1 rounded">Primary</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={data.logistics.chargeableWeight}
                      onChange={(e) => updateField('logistics.chargeableWeight', e.target.value)}
                      placeholder="e.g. 1699"
                      className="h-10 w-full rounded-xl border-2 border-primary/60 bg-primary/5 px-3.5 text-sm font-black text-primary focus:border-primary focus:outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={data.logistics.chargeableWeightUnit}
                      onChange={(e) => updateField('logistics.chargeableWeightUnit', e.target.value)}
                      className="h-10 w-16 rounded-xl border-2 border-primary/60 bg-primary/5 px-2 text-center text-xs font-black text-primary focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Net Weight
                  </label>
                  <input
                    type="text"
                    value={data.logistics.netWeight}
                    onChange={(e) => updateField('logistics.netWeight', e.target.value)}
                    placeholder="e.g. 1650"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm focus:border-primary focus:outline-none transition-all"
                  />
                </div>

                {/* Flight & Airline Row */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Flight No.
                  </label>
                  <input
                    type="text"
                    value={data.logistics.flightNo}
                    onChange={(e) => updateField('logistics.flightNo', e.target.value)}
                    placeholder="e.g. QR"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono font-bold focus:border-primary focus:outline-none uppercase transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Flight Date
                  </label>
                  <DatePickerInput
                    value={data.logistics.flightDate}
                    onChange={(val) => updateField('logistics.flightDate', val)}
                    placeholder="Select flight date"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Airline
                  </label>
                  <input
                    type="text"
                    value={data.logistics.airline}
                    onChange={(e) => updateField('logistics.airline', e.target.value)}
                    placeholder="e.g. QATAR AIRWAYS"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-semibold uppercase focus:border-primary focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Part C: Routing, Shipper & Ports - Balanced 3x3 Grid */}
            <div className="border-t border-border/50 pt-5">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Parties &amp; Routing Ports (Symmetrical 3&times;3)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Row 1: Shipper, Shipper Ref, Inco Terms */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Shipper
                  </label>
                  <input
                    type="text"
                    value={data.logistics.shipper}
                    onChange={(e) => updateField('logistics.shipper', e.target.value)}
                    placeholder="e.g. SPREETRANS INTERNATIONAL"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-semibold focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Shipper Ref.
                  </label>
                  <input
                    type="text"
                    value={data.logistics.shipperRef}
                    onChange={(e) => updateField('logistics.shipperRef', e.target.value)}
                    placeholder=""
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Inco Terms
                  </label>
                  <input
                    type="text"
                    value={data.logistics.incoTerms}
                    onChange={(e) => updateField('logistics.incoTerms', e.target.value)}
                    placeholder="e.g. FOB / CIF / EXW"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm uppercase focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Row 2: Consignee, Place of Receipt, Place of Delivery */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Consignee
                  </label>
                  <input
                    type="text"
                    value={data.logistics.consignee}
                    onChange={(e) => updateField('logistics.consignee', e.target.value)}
                    placeholder=""
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Place of Receipt
                  </label>
                  <input
                    type="text"
                    value={data.logistics.placeOfReceipt}
                    onChange={(e) => updateField('logistics.placeOfReceipt', e.target.value)}
                    placeholder=""
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Place of Delivery
                  </label>
                  <input
                    type="text"
                    value={data.logistics.placeOfDelivery}
                    onChange={(e) => updateField('logistics.placeOfDelivery', e.target.value)}
                    placeholder=""
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                {/* Row 3: Loading Port, Discharge Port, Destination Port */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Loading Port
                  </label>
                  <input
                    type="text"
                    value={data.logistics.loadingPort}
                    onChange={(e) => updateField('logistics.loadingPort', e.target.value)}
                    placeholder="e.g. DEL"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-bold uppercase focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Discharge Port
                  </label>
                  <input
                    type="text"
                    value={data.logistics.dischargePort}
                    onChange={(e) => updateField('logistics.dischargePort', e.target.value)}
                    placeholder="e.g. LHR"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-bold uppercase focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Destination Port
                  </label>
                  <input
                    type="text"
                    value={data.logistics.destinationPort}
                    onChange={(e) => updateField('logistics.destinationPort', e.target.value)}
                    placeholder="e.g. LHR"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-bold uppercase focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Line Items & Charges Table - Beautifully Structured Cards */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('items')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">4. Charges / Items Table</span>
              <span className="text-[11px] text-muted-foreground">Automatic Rate &times; Chargeable Weight calculation and GST tax breakups</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-lg">
              {data.items.length} charge line(s)
            </span>
            {openSections.items ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {openSections.items && (
          <div className="p-6 space-y-6 border-t border-border/50">
            {/* Quick Tax Preset Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-muted/30 rounded-xl border border-border/70 text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" /> Apply GST Preset to all items:
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllTaxPreset('intra')}
                  className="h-8 px-3 text-xs font-semibold hover:border-primary hover:text-primary cursor-pointer"
                >
                  CGST (9%) + SGST (9%)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllTaxPreset('inter')}
                  className="h-8 px-3 text-xs font-semibold hover:border-primary hover:text-primary cursor-pointer"
                >
                  IGST (18%)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAllTaxPreset('zero')}
                  className="h-8 px-3 text-xs font-semibold hover:border-primary hover:text-primary cursor-pointer"
                >
                  0% (Exempt)
                </Button>
              </div>
            </div>

            {/* Symmetrical Charge Item Cards */}
            <div className="space-y-5">
              {data.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-5 rounded-2xl border-2 border-border/80 bg-background shadow-xs space-y-4 hover:border-primary/40 transition-colors"
                >
                  {/* Item Header */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs text-primary bg-primary/10 px-3 py-1 rounded-lg">
                        Charge Line #{idx + 1}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                        Basis: <strong className="text-foreground">{item.calculationBasis === 'flat' ? 'Flat Rate (1×)' : `Chargeable Wt (${chargeableWeight} Kgs) × Rate`}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors p-1.5 rounded-lg flex items-center gap-1 text-xs font-medium cursor-pointer"
                      title="Delete charge line"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>

                  {/* Grid Row 1: Description (6 cols), SAC/HSN (3 cols), Basis (3 cols) = 12 cols */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-6 space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Description / Charge Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                        placeholder="e.g. AIR FREIGHT"
                        className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-bold uppercase focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        SAC / HSN Code
                      </label>
                      <input
                        type="text"
                        value={item.sacHsn}
                        onChange={(e) => handleItemChange(idx, 'sacHsn', e.target.value)}
                        placeholder="e.g. 52115120"
                        className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-3 space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Calculation Basis
                      </label>
                      <select
                        value={item.calculationBasis || 'weight'}
                        onChange={(e) => handleItemChange(idx, 'calculationBasis', e.target.value)}
                        className="h-10 w-full rounded-xl border-2 border-border/80 px-3 text-xs font-semibold bg-background focus:border-primary focus:outline-none cursor-pointer"
                      >
                        <option value="weight">&times; Wt ({chargeableWeight} Kgs)</option>
                        <option value="flat">Flat Rate (1&times;)</option>
                      </select>
                    </div>
                  </div>

                  {/* Grid Row 2: Rate (3 cols), Amount [Display Only] (3 cols), Non-GST Exempt (3 cols), Taxable Value (3 cols) = 12 cols */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Rate (INR) <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.rate || ''}
                        onChange={(e) => handleItemChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="280.00"
                        className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono text-right focus:border-primary focus:outline-none font-bold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          Amount (INR)
                          <span className="text-[9px] bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono font-bold">
                            Display Only
                          </span>
                        </label>
                        <span className="text-[10px] text-muted-foreground font-mono truncate" title={item.calculationBasis === 'flat' ? 'Flat rate' : `${chargeableWeight} × ₹${item.rate || 0}`}>
                          {item.calculationBasis === 'flat' ? 'Flat' : `${chargeableWeight} × ₹${item.rate || 0}`}
                        </span>
                      </div>
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={item.amount !== undefined ? Number(item.amount).toFixed(2) : '0.00'}
                        className="h-10 w-full rounded-xl border-2 border-emerald-500/40 bg-emerald-500/10 px-3.5 text-sm font-mono font-black text-right text-emerald-700 dark:text-emerald-300 cursor-not-allowed select-all"
                        title="Display input only: Automatically calculated from Chargeable Weight × Rate"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Non GST Exempt (INR)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.nonGstExempt ?? ''}
                        onChange={(e) => handleItemChange(idx, 'nonGstExempt', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono text-right focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Taxable Value (INR)
                      </label>
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={Number(item.taxableValue || 0).toFixed(2)}
                        className="h-10 w-full rounded-xl border-2 border-border/80 bg-muted/40 px-3.5 text-sm font-mono font-bold text-right text-foreground cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Grid Row 3: Symmetrical 4-Box Taxes Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border/50">
                    {/* CGST */}
                    <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>CGST</span>
                        <div className="flex items-center gap-1 font-mono">
                          <input
                            type="number"
                            value={item.cgstPercent}
                            onChange={(e) => handleItemChange(idx, 'cgstPercent', parseFloat(e.target.value) || 0)}
                            className="w-12 h-6 text-center border rounded font-mono text-xs bg-background"
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-bold text-foreground text-right pt-0.5">
                        ₹{Number(item.cgstAmount || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* SGST */}
                    <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>SGST</span>
                        <div className="flex items-center gap-1 font-mono">
                          <input
                            type="number"
                            value={item.sgstPercent}
                            onChange={(e) => handleItemChange(idx, 'sgstPercent', parseFloat(e.target.value) || 0)}
                            className="w-12 h-6 text-center border rounded font-mono text-xs bg-background"
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-bold text-foreground text-right pt-0.5">
                        ₹{Number(item.sgstAmount || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* IGST */}
                    <div className="p-3 rounded-xl border border-border/80 bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>IGST</span>
                        <div className="flex items-center gap-1 font-mono">
                          <input
                            type="number"
                            value={item.igstPercent}
                            onChange={(e) => handleItemChange(idx, 'igstPercent', parseFloat(e.target.value) || 0)}
                            className="w-12 h-6 text-center border rounded font-mono text-xs bg-background"
                          />
                          <span>%</span>
                        </div>
                      </div>
                      <div className="font-mono text-sm font-bold text-foreground text-right pt-0.5">
                        ₹{Number(item.igstAmount || 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="p-3 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-1 flex flex-col justify-between">
                      <div className="text-xs font-bold text-primary uppercase">
                        Line Total (INR)
                      </div>
                      <div className="font-mono text-base font-black text-primary text-right">
                        ₹{Number(item.total || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={addItem}
              className="w-full border-dashed border-2 py-6 font-bold text-primary hover:bg-primary/5 cursor-pointer rounded-2xl transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Another Charge Line
            </Button>
          </div>
        )}
      </div>

      {/* SECTION 5: Bank Details & Summary Adjustments - Balanced Symmetrical Layout */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('bankTotals')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">5. Bank Details &amp; Summary Adjustments</span>
              <span className="text-[11px] text-muted-foreground">Bank account details, advance received, round off, and words</span>
            </div>
          </div>
          {openSections.bankTotals ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.bankTotals && (
          <div className="p-6 space-y-6 border-t border-border/50">
            {/* Bank Details: 3x2 Symmetrical Grid */}
            <div>
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                Bank Account Information (Symmetrical 3&times;2)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bank Name</label>
                  <input
                    type="text"
                    value={data.bank.bankName}
                    onChange={(e) => updateField('bank.bankName', e.target.value)}
                    placeholder="e.g. ICICI BANK"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-semibold focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Branch</label>
                  <input
                    type="text"
                    value={data.bank.branch}
                    onChange={(e) => updateField('bank.branch', e.target.value)}
                    placeholder="e.g. DWARKA SEC 10"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">A/C Number</label>
                  <input
                    type="text"
                    value={data.bank.accountNo}
                    onChange={(e) => updateField('bank.accountNo', e.target.value)}
                    placeholder="e.g. 403605500215"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono font-bold focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Swift Code</label>
                  <input
                    type="text"
                    value={data.bank.swiftCode}
                    onChange={(e) => updateField('bank.swiftCode', e.target.value)}
                    placeholder="e.g. ICICINBBCTS"
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono uppercase focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">NEFT / RTGS</label>
                  <input
                    type="text"
                    value={data.bank.neftRtgs}
                    onChange={(e) => updateField('bank.neftRtgs', e.target.value)}
                    placeholder=""
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">IRN</label>
                  <input
                    type="text"
                    value={data.bank.irn}
                    onChange={(e) => updateField('bank.irn', e.target.value)}
                    placeholder=""
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Adjustments: 3 Equal Columns */}
            <div className="border-t border-border/50 pt-5">
              <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                Payment Adjustments
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono text-right focus:border-primary focus:outline-none"
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
                      className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
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
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono text-right focus:border-primary focus:outline-none"
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
                    className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-sm font-mono text-right focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Amount in words */}
              <div className="mt-5 space-y-1.5">
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
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Re-generate
                  </button>
                </div>
                <input
                  type="text"
                  value={data.summary.amountInWords}
                  onChange={(e) => updateField('summary.amountInWords', e.target.value)}
                  placeholder="e.g. Five Lakh Sixty One Thousand Eight Hundred Twenty Two Rupees Only"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-xs font-semibold focus:border-primary focus:outline-none"
                />
              </div>

              {/* Remark */}
              <div className="mt-5 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Remark / Special Notes
                </label>
                <input
                  type="text"
                  value={data.summary.remark}
                  onChange={(e) => updateField('summary.remark', e.target.value)}
                  placeholder="Enter any additional remark or leave blank"
                  className="h-10 w-full rounded-xl border-2 border-border/80 bg-background px-3.5 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: Company Header & Terms (Collapsible) */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs">
        <button
          type="button"
          onClick={() => toggleSection('companyTerms')}
          className="w-full flex items-center justify-between p-4 sm:p-5 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-foreground block">6. Company Letterhead Details &amp; Terms &amp; Conditions</span>
              <span className="text-[11px] text-muted-foreground">M5 Continent Logistics header information and legal terms</span>
            </div>
          </div>
          {openSections.companyTerms ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {openSections.companyTerms && (
          <div className="p-6 space-y-5 border-t border-border/50 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Company Name</label>
                <input
                  type="text"
                  value={data.company.name}
                  onChange={(e) => updateField('company.name', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-xs font-bold uppercase focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">GST No.</label>
                <input
                  type="text"
                  value={data.company.gstNo}
                  onChange={(e) => updateField('company.gstNo', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-xs font-mono uppercase focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">PAN No.</label>
                <input
                  type="text"
                  value={data.company.panNo}
                  onChange={(e) => updateField('company.panNo', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-xs font-mono uppercase focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">CIN No.</label>
                <input
                  type="text"
                  value={data.company.cinNo}
                  onChange={(e) => updateField('company.cinNo', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-xs font-mono uppercase focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                <input
                  type="text"
                  value={data.company.email}
                  onChange={(e) => updateField('company.email', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone</label>
                <input
                  type="text"
                  value={data.company.tel}
                  onChange={(e) => updateField('company.tel', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="lg:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Address Line 1</label>
                <input
                  type="text"
                  value={data.company.addressLine1}
                  onChange={(e) => updateField('company.addressLine1', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="lg:col-span-3 space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Address Line 2</label>
                <input
                  type="text"
                  value={data.company.addressLine2}
                  onChange={(e) => updateField('company.addressLine2', e.target.value)}
                  className="h-10 w-full rounded-xl border border-border px-3 text-xs focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Terms Lines */}
            <div className="pt-4 border-t border-border/50 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Terms &amp; Conditions (One per line)
              </label>
              <textarea
                rows={5}
                value={data.summary.termsAndConditions.join('\n')}
                onChange={(e) => updateField('summary.termsAndConditions', e.target.value.split('\n'))}
                className="w-full rounded-xl border border-border p-3 text-xs font-mono leading-relaxed focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
