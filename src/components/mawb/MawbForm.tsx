'use client';

import React, { useState } from 'react';
import {
  MawbData,
  MawbRatingItem,
  MawbFlight,
  AWB_COPY_DESIGNATIONS,
} from '@/types/mawb';
import {
  Plane,
  Building2,
  User,
  MapPin,
  Calendar,
  Package,
  Receipt,
  FileCheck2,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  Calculator,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface MawbFormProps {
  data: MawbData;
  onChange: (updated: MawbData) => void;
  onReset: () => void;
  onLoadSample: () => void;
}

export function MawbForm({ data, onChange, onReset, onLoadSample }: MawbFormProps) {
  const [openSections, setOpenSections] = useState({
    header: true,
    parties: true,
    routing: true,
    goods: true,
    charges: true,
    execution: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper updater for top-level fields
  const updateField = <K extends keyof MawbData>(key: K, value: MawbData[K]) => {
    onChange({ ...data, [key]: value });
  };

  // Update nested objects
  const updateNested = <K extends 'shipper' | 'consignee' | 'issuingAgent' | 'routing' | 'charges' | 'execution'>(
    section: K,
    subKey: keyof MawbData[K],
    value: any
  ) => {
    onChange({
      ...data,
      [section]: {
        ...data[section],
        [subKey]: value,
      },
    });
  };

  // Handle rating item change
  const updateItem = (index: number, key: keyof MawbRatingItem, value: any) => {
    const updatedItems = [...data.items];
    const current = { ...updatedItems[index], [key]: value };

    // Auto-calculate total if chargeableWeight or rate changed
    if (key === 'chargeableWeight' || key === 'rate') {
      const cw = parseFloat(String(key === 'chargeableWeight' ? value : current.chargeableWeight).replace(/,/g, '')) || 0;
      const r = parseFloat(String(key === 'rate' ? value : current.rate).replace(/,/g, '')) || 0;
      if (cw > 0 && r > 0) {
        current.total = (cw * r).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    }

    updatedItems[index] = current;
    
    // Auto-update weight charge & total prepaid
    const newWeightCharge = updatedItems.reduce((sum, it) => {
      const clean = String(it.total).replace(/,/g, '');
      return sum + (Number(clean) || 0);
    }, 0);

    const carrierCharges = parseFloat(String(data.charges.carrierChargesPrepaid).replace(/,/g, '')) || 0;
    const totalPrepaid = newWeightCharge + carrierCharges;

    onChange({
      ...data,
      items: updatedItems,
      charges: {
        ...data.charges,
        prepaidWeightCharge: newWeightCharge > 0 ? newWeightCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : data.charges.prepaidWeightCharge,
        totalPrepaid: totalPrepaid > 0 ? totalPrepaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : data.charges.totalPrepaid,
      },
    });
  };

  // Add new item
  const addItem = () => {
    const newItem: MawbRatingItem = {
      id: Date.now().toString(),
      pieces: '',
      grossWeight: '',
      weightUnit: 'K',
      rateClass: 'Q',
      commodityItemNo: '',
      chargeableWeight: '',
      rate: '',
      total: '',
      natureAndQuantity: '',
    };
    onChange({
      ...data,
      items: [...data.items, newItem],
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    if (data.items.length <= 1) {
      toast.warn('At least one goods row is required');
      return;
    }
    const updated = data.items.filter((_, i) => i !== index);
    onChange({ ...data, items: updated });
  };

  // Flight helpers
  const updateFlight = (index: number, key: keyof MawbFlight, val: string) => {
    const updated = [...(data.routing.flights || [])];
    updated[index] = { ...updated[index], [key]: val };
    updateNested('routing', 'flights', updated);
  };

  const addFlight = () => {
    const updated = [...(data.routing.flights || []), { flightNo: '', date: '' }];
    updateNested('routing', 'flights', updated);
  };

  const removeFlight = (index: number) => {
    const updated = (data.routing.flights || []).filter((_, i) => i !== index);
    updateNested('routing', 'flights', updated);
  };

  // Quick helper to insert template text into Goods Description
  const appendGoodsTemplate = (index: number, template: string) => {
    const cur = data.items[index].natureAndQuantity || '';
    const newText = cur ? `${cur}\n${template}` : template;
    updateItem(index, 'natureAndQuantity', newText);
  };

  // Recalculate totals helper
  const handleRecalculateTotals = () => {
    const weightCharge = data.items.reduce((sum, it) => {
      const clean = String(it.total).replace(/,/g, '');
      return sum + (Number(clean) || 0);
    }, 0);

    const carrierCharges = parseFloat(String(data.charges.carrierChargesPrepaid).replace(/,/g, '')) || 0;
    const totalPpd = weightCharge + carrierCharges;

    onChange({
      ...data,
      charges: {
        ...data.charges,
        prepaidWeightCharge: weightCharge > 0 ? weightCharge.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : data.charges.prepaidWeightCharge,
        totalPrepaid: totalPpd > 0 ? totalPpd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : data.charges.totalPrepaid,
      },
    });
    toast.success('Totals recalculated');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border/80 shadow-xs flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-base text-foreground flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            Master Air Waybill (MAWB) Editor
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full manual entry with instant live A4 print synchronization
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRecalculateTotals}
            className="text-xs cursor-pointer shadow-xs"
            title="Auto-calculate charges from weights & rates"
          >
            <Calculator className="h-3.5 w-3.5 mr-1.5 text-primary" />
            Auto-Calculate
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSample}
            className="text-xs border-primary/30 text-primary hover:bg-primary/5 cursor-pointer shadow-xs font-semibold"
            title="Load sample MAWB (077-5906 6545)"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Load Sample MAWB
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-destructive cursor-pointer"
            title="Clear all fields"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Clear Form
          </Button>
        </div>
      </div>

      {/* SECTION 1: AWB Number & Carrier Header */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('header')}
          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Tag className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">
              AWB Identification & Carrier Header
            </span>
            <span className="text-xs font-mono font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
              {data.awbPrefix}-{data.awbSerial || '...'}
            </span>
          </div>
          {openSections.header ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.header && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Airline Prefix (3 Digits)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={data.awbPrefix}
                  onChange={(e) => updateField('awbPrefix', e.target.value)}
                  placeholder="077"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold font-mono focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Departure Airport Code (3 Letters)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={data.departureAirportCode}
                  onChange={(e) => updateField('departureAirportCode', e.target.value.toUpperCase())}
                  placeholder="DEL"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold font-mono uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  AWB Serial Number (8 Digits)
                </label>
                <input
                  type="text"
                  value={data.awbSerial}
                  onChange={(e) => updateField('awbSerial', e.target.value)}
                  placeholder="5906 6545"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold font-mono focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Carrier / Airline Name
                </label>
                <input
                  type="text"
                  value={data.carrierName}
                  onChange={(e) => updateField('carrierName', e.target.value.toUpperCase())}
                  placeholder="EGYPT AIR"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Copy Designation (Printed at Bottom Footer)
                </label>
                <select
                  value={data.execution.copyDesignation}
                  onChange={(e) => updateNested('execution', 'copyDesignation', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold focus:border-primary focus:outline-hidden"
                >
                  {AWB_COPY_DESIGNATIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Shipper & Consignee */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('parties')}
          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">
              Shipper & Consignee Details
            </span>
          </div>
          {openSections.parties ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.parties && (
          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipper */}
            <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-primary tracking-wide">
                  Shipper Information
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Shipper Name & Address (Multi-line)
                </label>
                <textarea
                  rows={5}
                  value={data.shipper.nameAndAddress}
                  onChange={(e) => updateNested('shipper', 'nameAndAddress', e.target.value)}
                  placeholder="HOLISTIC ENTERPRISES&#10;GROUND FLOOR, 39, SHOP DDA JANTA FLAT...&#10;EMAIL - HOLISTICS@GMAIL.COM"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs font-mono font-semibold uppercase leading-relaxed focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Shipper Account Number (Optional)
                </label>
                <input
                  type="text"
                  value={data.shipper.accountNumber}
                  onChange={(e) => updateNested('shipper', 'accountNumber', e.target.value)}
                  placeholder="e.g. ACC-10928"
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-mono focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Consignee */}
            <div className="space-y-3 p-4 rounded-xl border border-border/60 bg-muted/10">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-primary tracking-wide">
                  Consignee Information
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Consignee Name & Address (Multi-line)
                </label>
                <textarea
                  rows={5}
                  value={data.consignee.nameAndAddress}
                  onChange={(e) => updateNested('consignee', 'nameAndAddress', e.target.value)}
                  placeholder="A.J WORLDWIDE SERVICES LTD&#10;UNIT 2 HORTON INDUSTRIAL PARK...&#10;EORI : GB745115840000&#10;UK"
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs font-mono font-semibold uppercase leading-relaxed focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Consignee Account Number (Optional)
                </label>
                <input
                  type="text"
                  value={data.consignee.accountNumber}
                  onChange={(e) => updateNested('consignee', 'accountNumber', e.target.value)}
                  placeholder="e.g. ACC-UK992"
                  className="w-full rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-mono focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: Agent, Accounting & Routing */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('routing')}
          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">
              Issuing Agent, Flights & Routing
            </span>
          </div>
          {openSections.routing ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.routing && (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Issuing Agent & Accounting */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Issuing Carrier&apos;s Agent & City
                </label>
                <textarea
                  rows={2}
                  value={data.issuingAgent.nameAndCity}
                  onChange={(e) => updateNested('issuingAgent', 'nameAndCity', e.target.value.toUpperCase())}
                  placeholder="M5 CONTINENT LOGISTICS SOLUTION PVT LTD&#10;DELHI"
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Agent&apos;s IATA Code
                </label>
                <input
                  type="text"
                  value={data.issuingAgent.iataCode}
                  onChange={(e) => updateNested('issuingAgent', 'iataCode', e.target.value)}
                  placeholder="14-0-26840004"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-mono font-bold focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Accounting Information
                </label>
                <input
                  type="text"
                  value={data.accountingInfo}
                  onChange={(e) => updateField('accountingInfo', e.target.value.toUpperCase())}
                  placeholder="FREIGHT PREPAID"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Departure, Destination, Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 border-t border-border/60">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Airport of Departure
                </label>
                <input
                  type="text"
                  value={data.routing.departureAirport}
                  onChange={(e) => updateNested('routing', 'departureAirport', e.target.value.toUpperCase())}
                  placeholder="DELHI"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Airport of Destination
                </label>
                <input
                  type="text"
                  value={data.routing.destinationAirport}
                  onChange={(e) => updateNested('routing', 'destinationAirport', e.target.value.toUpperCase())}
                  placeholder="LONDON"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  To (1st Transfer / Dest)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={data.routing.to1}
                  onChange={(e) => updateNested('routing', 'to1', e.target.value.toUpperCase())}
                  placeholder="LHR"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  By First Carrier (Code)
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={data.routing.byFirstCarrier}
                  onChange={(e) => updateNested('routing', 'byFirstCarrier', e.target.value.toUpperCase())}
                  placeholder="MS"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Currency & Valuation */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  maxLength={3}
                  value={data.routing.currency}
                  onChange={(e) => updateNested('routing', 'currency', e.target.value.toUpperCase())}
                  placeholder="INR"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Declared Value for Carriage
                </label>
                <input
                  type="text"
                  value={data.routing.declaredValueCarriage}
                  onChange={(e) => updateNested('routing', 'declaredValueCarriage', e.target.value.toUpperCase())}
                  placeholder="NVD"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Declared Value for Customs
                </label>
                <input
                  type="text"
                  value={data.routing.declaredValueCustoms}
                  onChange={(e) => updateNested('routing', 'declaredValueCustoms', e.target.value.toUpperCase())}
                  placeholder="NCV"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Amount of Insurance
                </label>
                <input
                  type="text"
                  value={data.routing.amountOfInsurance}
                  onChange={(e) => updateNested('routing', 'amountOfInsurance', e.target.value)}
                  placeholder="XXX"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Flights Section */}
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-foreground">
                  Requested Flight No / Dates
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFlight}
                  className="h-7 text-xs cursor-pointer"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Flight
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.routing.flights?.map((flight, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-background p-2.5 rounded-lg border border-border"
                  >
                    <input
                      type="text"
                      value={flight.flightNo}
                      onChange={(e) => updateFlight(idx, 'flightNo', e.target.value.toUpperCase())}
                      placeholder="e.g. MS5518"
                      className="w-1/2 rounded border border-input px-2 py-1 text-xs font-bold uppercase"
                    />
                    <input
                      type="text"
                      value={flight.date}
                      onChange={(e) => updateFlight(idx, 'date', e.target.value)}
                      placeholder="e.g. 28/10/2026"
                      className="w-1/2 rounded border border-input px-2 py-1 text-xs font-bold font-mono"
                    />
                    {data.routing.flights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFlight(idx)}
                        className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
                        title="Remove flight"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Handling Information & SCI */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-10">
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Handling Information
                </label>
                <input
                  type="text"
                  value={data.routing.handlingInfo}
                  onChange={(e) => updateNested('routing', 'handlingInfo', e.target.value.toUpperCase())}
                  placeholder="PLEASE INFORM CONSIGNEE IMMEDIATELY ON ARRIVAL OF CARGO..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1">SCI</label>
                <input
                  type="text"
                  value={data.routing.sci}
                  onChange={(e) => updateNested('routing', 'sci', e.target.value.toUpperCase())}
                  placeholder=""
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: Cargo & Rating Table */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('goods')}
          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">
              Goods & Rating Specification
            </span>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-mono">
              {data.items.length} line(s)
            </span>
          </div>
          {openSections.goods ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.goods && (
          <div className="p-4 sm:p-6 space-y-6">
            {data.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-xl border border-border/70 bg-muted/10 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase text-primary tracking-wide">
                    Rating Item #{idx + 1}
                  </span>
                  {data.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(idx)}
                      className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove Line
                    </Button>
                  )}
                </div>

                {/* Rating Numerical Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Pieces
                    </label>
                    <input
                      type="number"
                      value={item.pieces}
                      onChange={(e) => updateItem(idx, 'pieces', e.target.value)}
                      placeholder="57"
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-bold font-mono focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Gross Wt
                    </label>
                    <input
                      type="text"
                      value={item.grossWeight}
                      onChange={(e) => updateItem(idx, 'grossWeight', e.target.value)}
                      placeholder="1308.00"
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-bold font-mono focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Unit
                    </label>
                    <select
                      value={item.weightUnit}
                      onChange={(e) => updateItem(idx, 'weightUnit', e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-bold focus:border-primary focus:outline-hidden"
                    >
                      <option value="K">K (Kgs)</option>
                      <option value="L">L (Lbs)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Rate Class
                    </label>
                    <input
                      type="text"
                      value={item.rateClass}
                      onChange={(e) => updateItem(idx, 'rateClass', e.target.value.toUpperCase())}
                      placeholder="Q"
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Chargeable Wt
                    </label>
                    <input
                      type="text"
                      value={item.chargeableWeight}
                      onChange={(e) => updateItem(idx, 'chargeableWeight', e.target.value)}
                      placeholder="1308.00"
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-bold font-mono focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Rate / Charge
                    </label>
                    <input
                      type="text"
                      value={item.rate}
                      onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                      placeholder="300.00"
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-bold font-mono focus:border-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Total
                    </label>
                    <input
                      type="text"
                      value={item.total}
                      onChange={(e) => updateItem(idx, 'total', e.target.value)}
                      placeholder="392,400.00"
                      className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-xs font-bold font-mono text-primary focus:border-primary focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Nature and Quantity of Goods */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                    <label className="text-xs font-semibold text-foreground">
                      Nature and Quantity of Goods (incl. Dimensions or Volume)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => appendGoodsTemplate(idx, 'SAID TO CONTAIN\n')}
                        className="text-[10px] bg-muted hover:bg-muted/80 px-2 py-0.5 rounded text-foreground cursor-pointer"
                      >
                        + &quot;SAID TO CONTAIN&quot;
                      </button>
                      <button
                        type="button"
                        onClick={() => appendGoodsTemplate(idx, 'INVOICE NO - ')}
                        className="text-[10px] bg-muted hover:bg-muted/80 px-2 py-0.5 rounded text-foreground cursor-pointer"
                      >
                        + Invoice No
                      </button>
                      <button
                        type="button"
                        onClick={() => appendGoodsTemplate(idx, 'DIM:45X40X40/10 CMT\nVOL WT: 851 KGS')}
                        className="text-[10px] bg-muted hover:bg-muted/80 px-2 py-0.5 rounded text-foreground cursor-pointer"
                      >
                        + Dimensions & Vol
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={6}
                    value={item.natureAndQuantity}
                    onChange={(e) => updateItem(idx, 'natureAndQuantity', e.target.value.toUpperCase())}
                    placeholder="SAID TO CONTAIN&#10;ARTIFICIAL JEWELLERY, BAG...&#10;HS CODE: 71171100, 63053300...&#10;DIM:45X40X40/10 CMT&#10;VOL WT: 851 KGS"
                    className="w-full rounded-lg border border-input bg-background p-2.5 text-xs font-mono font-semibold uppercase leading-relaxed focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="w-full text-xs border-dashed border-2 hover:border-primary/50 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Add Another Rating Line
            </Button>
          </div>
        )}
      </div>

      {/* SECTION 5: Charges & Other Charges Breakdown */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('charges')}
          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Receipt className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">
              Charges & Other Charges Breakdown
            </span>
            <span className="text-xs font-mono font-bold text-primary">
              Total: {data.charges.totalPrepaid || '0.00'}
            </span>
          </div>
          {openSections.charges ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.charges && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Prepaid Weight Charge
                </label>
                <input
                  type="text"
                  value={data.charges.prepaidWeightCharge}
                  onChange={(e) => updateNested('charges', 'prepaidWeightCharge', e.target.value)}
                  placeholder="392,400.00"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold font-mono focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Total Other Charges Due Carrier (Prepaid)
                </label>
                <input
                  type="text"
                  value={data.charges.carrierChargesPrepaid}
                  onChange={(e) => updateNested('charges', 'carrierChargesPrepaid', e.target.value)}
                  placeholder="21,908.00"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold font-mono focus:border-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Grand Total Prepaid
                </label>
                <input
                  type="text"
                  value={data.charges.totalPrepaid}
                  onChange={(e) => updateNested('charges', 'totalPrepaid', e.target.value)}
                  placeholder="414,308.00"
                  className="w-full rounded-lg border border-primary/50 bg-primary/5 px-3 py-2 text-xs font-bold font-mono text-primary focus:border-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Other charges text string */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">
                  Other Charges String (e.g. UEC, MMC, SSC)
                </label>
                <div className="flex items-center gap-1">
                  {['UEC-1308.00', 'MMC-980.00', 'SSC-19620.00', 'FSC-0.00', 'MYC-0.00'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        const cur = data.charges.otherChargesBreakdown || '';
                        const next = cur ? `${cur}, ${chip}` : chip;
                        updateNested('charges', 'otherChargesBreakdown', next);
                      }}
                      className="text-[10px] bg-muted hover:bg-muted/80 px-2 py-0.5 rounded cursor-pointer"
                    >
                      + {chip.split('-')[0]}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={data.charges.otherChargesBreakdown}
                onChange={(e) => updateNested('charges', 'otherChargesBreakdown', e.target.value.toUpperCase())}
                placeholder="UEC-1308.00, MMC-980.00, SSC-19620.00"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold font-mono uppercase focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 6: Execution & Signatures */}
      <div className="bg-card rounded-2xl border border-border/80 shadow-xs overflow-hidden">
        <button
          type="button"
          onClick={() => toggleSection('execution')}
          className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">
              Signatures & Execution
            </span>
          </div>
          {openSections.execution ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {openSections.execution && (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Shipper Certification Signatory Name
              </label>
              <input
                type="text"
                value={data.execution.shipperCertSignatory}
                onChange={(e) => updateNested('execution', 'shipperCertSignatory', e.target.value.toUpperCase())}
                placeholder="M5 CONTINENT LOGISTICS SOLUTION PVT LTD"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Signature of Issuing Carrier or Agent
              </label>
              <textarea
                rows={2}
                value={data.execution.carrierAgentSignature}
                onChange={(e) => updateNested('execution', 'carrierAgentSignature', e.target.value.toUpperCase())}
                placeholder="M5 CONTINENT LOGISTICS SOLUTION PVT LTD"
                className="w-full rounded-lg border border-input bg-background p-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Executed on (Date)
              </label>
              <input
                type="text"
                value={data.execution.executedDate}
                onChange={(e) => updateNested('execution', 'executedDate', e.target.value)}
                placeholder="27 Oct 2026"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                at (Place)
              </label>
              <input
                type="text"
                value={data.execution.executedPlace}
                onChange={(e) => updateNested('execution', 'executedPlace', e.target.value.toUpperCase())}
                placeholder="DELHI"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs font-bold uppercase focus:border-primary focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

