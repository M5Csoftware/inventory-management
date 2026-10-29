'use client';

import React from 'react';
import { TaxInvoiceData } from '@/types/tax-invoice';
import { DEFAULT_M5C_LOGO_BASE64 } from '@/lib/logo-data';

interface TaxInvoiceSheetProps {
  data: TaxInvoiceData;
  scale?: number;
}

export function TaxInvoiceSheet({ data, scale = 1 }: TaxInvoiceSheetProps) {
  // Calculations
  const totalNonGstExempt = data.items.reduce((sum, item) => sum + (Number(item.nonGstExempt) || 0), 0);
  const totalTaxable = data.items.reduce((sum, item) => sum + (Number(item.taxableValue) || 0), 0);
  const totalCgst = data.items.reduce((sum, item) => sum + (Number(item.cgstAmount) || 0), 0);
  const totalSgst = data.items.reduce((sum, item) => sum + (Number(item.sgstAmount) || 0), 0);
  const totalIgst = data.items.reduce((sum, item) => sum + (Number(item.igstAmount) || 0), 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const itemsTotal = data.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  const totalBeforeTax = totalTaxable;
  const totalInvoiceValue = itemsTotal;
  const roundOff = Number(data.summary.roundOff) || 0;
  const advance = Number(data.summary.advanceReceived) || 0;
  const netPayable = totalInvoiceValue + roundOff - advance;

  // Determine dynamic CGST/SGST/IGST header percentages from first row or common rate
  const sampleItem = data.items[0];
  const cgstHeader = sampleItem?.cgstPercent ? `CGST (${sampleItem.cgstPercent}%)` : 'CGST (9%)';
  const sgstHeader = sampleItem?.sgstPercent ? `SGST (${sampleItem.sgstPercent}%)` : 'SGST (9%)';
  const igstHeader = sampleItem?.igstPercent ? `IGST (${sampleItem.igstPercent}%)` : 'IGST (18%)';

  const fmt = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return num.toFixed(2);
  };

  const emptyRowHeight = Math.max(30, (5 - data.items.length) * 35 + 25);

  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
      className="tax-invoice-scale-wrapper transition-transform duration-200 print:transform-none"
    >
      <div
        id="tax-invoice-printable-sheet"
        className="bg-white text-black font-sans mx-auto shadow-2xl print:shadow-none print:m-0 print:p-0 flex flex-col"
        style={{
          width: '210mm',
          minHeight: '275mm',
          padding: '8mm 10mm 6mm 10mm',
          boxSizing: 'border-box',
          fontSize: '10px',
          lineHeight: '1.25',
          color: '#000000',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Document Title Header */}
        <div className="text-center font-bold text-sm tracking-widest mb-1.5 uppercase shrink-0">
          TAX INVOICE
        </div>

        {/* Outer Document Border Enclosure - One solid continuous column */}
        <div className="border-[1.5px] border-black flex flex-col">
          {/* Header Row: Logo & Company Information */}
          <div className="border-b border-black p-2 flex items-center gap-3">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1">
              <img
                src={
                  data.company.logoUrl && data.company.logoUrl !== '/m5c-logo.png'
                    ? data.company.logoUrl
                    : DEFAULT_M5C_LOGO_BASE64
                }
                alt="Company Logo"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="flex-1 text-center pr-12">
              <h1 className="font-bold text-[12px] uppercase tracking-wide leading-tight">
                {data.company.name}
              </h1>
              <p className="text-[9px] text-black leading-tight mt-0.5">
                {data.company.addressLine1}
              </p>
              <p className="text-[9px] text-black leading-tight">
                {data.company.addressLine2}
              </p>
              <p className="text-[9px] text-black leading-tight">
                Email:{data.company.email} | Tel: {data.company.tel}
              </p>
              <div className="text-[9px] font-bold mt-0.5 flex items-center justify-center gap-4">
                <span>GST No.:{data.company.gstNo}</span>
                <span>PAN No. {data.company.panNo}</span>
              </div>
              <p className="text-[9px] text-black leading-tight">
                CIN No.: {data.company.cinNo}
              </p>
            </div>
          </div>

          {/* Section 2: Recipient Details (Left) and Invoice Meta (Right) */}
          <div className="grid grid-cols-12 border-b border-black text-[9px]">
            {/* Recipient Details */}
            <div className="col-span-7 border-r border-black p-1.5 space-y-0.5 flex flex-col justify-between">
              <div>
                <div className="font-bold">Recipient:</div>
                <div className="font-bold uppercase text-[9.5px]">{data.recipient.name}</div>
                <div className="whitespace-pre-line text-[8.5px] leading-tight text-neutral-900 mt-0.5">
                  {data.recipient.address}
                </div>
              </div>
              <div className="pt-1 text-[8.5px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold">PAN No:</span>
                  <span>{data.recipient.panNo}</span>
                </div>
                <div className="flex items-center justify-between pr-4 mt-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">GST No:</span>
                    <span>{data.recipient.gstNo}</span>
                  </div>
                  <div>
                    <span className="font-bold">State:</span> {data.recipient.state}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="col-span-5 p-1.5 space-y-1 text-[8.5px]">
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold">Invoice No.</span>
                <span className="col-span-1">:</span>
                <span className="col-span-6 font-bold">{data.invoice.invoiceNo}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold">Invoice Date</span>
                <span className="col-span-1">:</span>
                <span className="col-span-6">{data.invoice.invoiceDate}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold">Due Date</span>
                <span className="col-span-1">:</span>
                <span className="col-span-6">{data.invoice.dueDate}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold">Place of Supply</span>
                <span className="col-span-1">:</span>
                <span className="col-span-6">{data.invoice.placeOfSupply}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold">Shipment No.</span>
                <span className="col-span-1">:</span>
                <span className="col-span-6">{data.invoice.shipmentNo}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-bold">Shipment Type</span>
                <span className="col-span-1">:</span>
                <span className="col-span-6 uppercase font-bold">{data.invoice.shipmentType}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Detailed Logistics & Operational Specifications */}
          <div className="grid grid-cols-12 border-b border-black text-[8.5px] leading-[1.3]">
            {/* Left Operational Details */}
            <div className="col-span-6 border-r border-black p-1.5 space-y-0.5">
              <div className="flex justify-between">
                <div><span className="font-bold">MAWB No</span> : {data.logistics.mawbNo}</div>
                <div className="w-28"><span className="font-bold">Date</span> : {data.logistics.mawbDate}</div>
              </div>
              <div className="flex justify-between">
                <div><span className="font-bold">HAWB No.</span> : {data.logistics.hawbNo}</div>
                <div className="w-28"><span className="font-bold">Date</span> : {data.logistics.hawbDate}</div>
              </div>
              <div className="flex justify-between">
                <div><span className="font-bold">SB No.</span> : {data.logistics.sbNo}</div>
                <div className="w-28"><span className="font-bold">Date</span> : {data.logistics.sbDate}</div>
              </div>
              <div className="flex justify-between">
                <div><span className="font-bold">BOE No.</span> : {data.logistics.boeNo}</div>
                <div className="w-28"><span className="font-bold">Date</span> : {data.logistics.boeDate}</div>
              </div>
              <div className="flex justify-between">
                <div><span className="font-bold">Exporter Inv No.</span> : {data.logistics.exporterInvNo}</div>
                <div className="w-28"><span className="font-bold">Date</span> : {data.logistics.exporterInvDate}</div>
              </div>
              <div className="flex justify-between">
                <div><span className="font-bold">Cargo Type</span> : {data.logistics.cargoType}</div>
                <div className="w-28"><span className="font-bold">Volume</span> : {data.logistics.volume}</div>
              </div>
              <div className="flex justify-between">
                <div><span className="font-bold">Packages</span> : {data.logistics.packages}</div>
                <div className="w-28">
                  <span className="font-bold">Gross Wt</span> : {data.logistics.grossWeight} {data.logistics.grossWeight ? data.logistics.grossWeightUnit || 'Kgs' : ''}
                </div>
              </div>
              <div className="flex justify-between">
                <div>
                  <span className="font-bold">Chargeable Wt</span> : {data.logistics.chargeableWeight} {data.logistics.chargeableWeight ? data.logistics.chargeableWeightUnit || 'Kgs' : ''}
                </div>
                <div className="w-28"></div>
              </div>
              <div className="flex justify-between">
                <div><span className="font-bold">Net Weight</span> : {data.logistics.netWeight}</div>
                <div className="w-28"></div>
              </div>
              <div className="flex justify-between">
                <div><span className="font-bold">Flight No.</span> : {data.logistics.flightNo}</div>
                <div className="w-28"><span className="font-bold">Date</span> : {data.logistics.flightDate}</div>
              </div>
              <div>
                <span className="font-bold">Airline</span> : {data.logistics.airline}
              </div>
            </div>

            {/* Right Shipper & Port Details */}
            <div className="col-span-6 p-1.5 space-y-0.5">
              <div><span className="font-bold">Shipper Ref.</span> : {data.logistics.shipperRef}</div>
              <div><span className="font-bold">Inco Terms</span> : {data.logistics.incoTerms}</div>
              <div><span className="font-bold">Shipper</span> : {data.logistics.shipper}</div>
              <div><span className="font-bold">Consignee</span> : {data.logistics.consignee}</div>
              <div><span className="font-bold">Place of Receipt</span> : {data.logistics.placeOfReceipt}</div>
              <div><span className="font-bold">Loading Port</span> : {data.logistics.loadingPort}</div>
              <div><span className="font-bold">Discharge Port</span> : {data.logistics.dischargePort}</div>
              <div><span className="font-bold">Place of Delivery</span> : {data.logistics.placeOfDelivery}</div>
              <div><span className="font-bold">Destination Port</span> : {data.logistics.destinationPort}</div>
            </div>
          </div>

          {/* Section 4: Items & Charges Table */}
          <div className="w-full">
            <table className="w-full border-collapse text-[8px] leading-tight">
              <thead>
                <tr className="border-b border-black text-center font-bold bg-white">
                  <th className="border-r border-black py-1 px-1 w-[3%]">Sr<br/>No</th>
                  <th className="border-r border-black py-1 px-1.5 text-left w-[24%]">Description</th>
                  <th className="border-r border-black py-1 px-1 w-[9%]">SAC/HSN</th>
                  <th className="border-r border-black py-1 px-1 text-right w-[7%]">Rate</th>
                  <th className="border-r border-black py-1 px-1 text-right w-[9%]">Amount<br/>(INR)</th>
                  <th className="border-r border-black py-1 px-1 text-right w-[9%]">Non GST<br/>Exempt<br/>value (INR)</th>
                  <th className="border-r border-black py-1 px-1 text-right w-[10%]">Taxable<br/>Value (INR)</th>
                  <th className="border-r border-black py-1 px-1 text-right w-[7%]">{cgstHeader}</th>
                  <th className="border-r border-black py-1 px-1 text-right w-[7%]">{sgstHeader}</th>
                  <th className="border-r border-black py-1 px-1 text-right w-[6%]">{igstHeader}</th>
                  <th className="py-1 px-1 text-right w-[11%]">Total (INR)</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={item.id || idx} className="border-b border-black/30 font-medium">
                    <td className="border-r border-black py-1.5 px-1 text-center align-top">{idx + 1}</td>
                    <td className="border-r border-black py-1.5 px-1.5 text-left align-top font-bold uppercase">{item.description}</td>
                    <td className="border-r border-black py-1.5 px-1 text-center align-top">{item.sacHsn}</td>
                    <td className="border-r border-black py-1.5 px-1 text-right align-top">{fmt(item.rate)}</td>
                    <td className="border-r border-black py-1.5 px-1 text-right align-top">{fmt(item.amount)}</td>
                    <td className="border-r border-black py-1.5 px-1 text-right align-top">{fmt(item.nonGstExempt)}</td>
                    <td className="border-r border-black py-1.5 px-1 text-right align-top">{fmt(item.taxableValue)}</td>
                    <td className="border-r border-black py-1.5 px-1 text-right align-top">{fmt(item.cgstAmount)}</td>
                    <td className="border-r border-black py-1.5 px-1 text-right align-top">{fmt(item.sgstAmount)}</td>
                    <td className="border-r border-black py-1.5 px-1 text-right align-top">{fmt(item.igstAmount)}</td>
                    <td className="py-1.5 px-1 text-right align-top">{fmt(item.total)}</td>
                  </tr>
                ))}

                {/* Empty rows filler to ensure clean height proportion like the original PDF */}
                {data.items.length < 5 && (
                  <tr style={{ height: `${emptyRowHeight}px` }}>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                )}

                {/* SubTotal Row */}
                <tr className="border-t border-b border-black font-bold bg-white text-[8.5px]">
                  <td colSpan={5} className="border-r border-black py-1 px-2 text-left">
                    SubTotal
                  </td>
                  <td className="border-r border-black py-1 px-1 text-right">{fmt(totalNonGstExempt)}</td>
                  <td className="border-r border-black py-1 px-1 text-right">{fmt(totalTaxable)}</td>
                  <td className="border-r border-black py-1 px-1 text-right">{fmt(totalCgst)}</td>
                  <td className="border-r border-black py-1 px-1 text-right">{fmt(totalSgst)}</td>
                  <td className="border-r border-black py-1 px-1 text-right">{fmt(totalIgst)}</td>
                  <td className="py-1 px-1 text-right">{fmt(itemsTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 5: Bank Details (Left) and Financial Totals (Right) - Connects directly with zero gap */}
          <div className="grid grid-cols-12 border-b border-black text-[8.5px]">
            {/* Bank Details */}
            <div className="col-span-6 border-r border-black p-1.5 space-y-1">
              <div className="font-bold underline uppercase tracking-wider text-[9px]">
                BANK DETAILS
              </div>
              <div className="space-y-0.5 pt-0.5">
                <div>
                  <span className="font-bold">Bank Name:</span> {data.bank.bankName} &nbsp;&nbsp;&nbsp;
                  <span className="font-bold">Branch:</span> {data.bank.branch}
                </div>
                <div>
                  <span className="font-bold">A/C No.:</span> {data.bank.accountNo}
                </div>
                <div>
                  <span className="font-bold">NEFT/RTGS:</span> {data.bank.neftRtgs}
                </div>
                <div>
                  <span className="font-bold">Swift Code:</span> {data.bank.swiftCode}
                </div>
                <div>
                  <span className="font-bold">IRN:</span> {data.bank.irn}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="col-span-6 p-1.5 space-y-0.5">
              <div className="flex justify-between items-center py-0.5">
                <span className="font-bold">Total Amount Before Tax</span>
                <span>:</span>
                <span className="w-28 text-right">{fmt(totalBeforeTax)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="font-bold">Add:GST</span>
                <span>:</span>
                <span className="w-28 text-right">{fmt(totalGst)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="font-bold">Total Invoice Value</span>
                <span>:</span>
                <span className="w-28 text-right">{fmt(totalInvoiceValue)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="font-bold">Less:Advance Received</span>
                <span>:</span>
                <span className="w-28 text-right">{fmt(advance)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="font-bold">Round Off</span>
                <span>:</span>
                <span className="w-28 text-right">{fmt(roundOff)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 font-bold text-[9px]">
                <span>Net Payable</span>
                <span>:</span>
                <span className="w-28 text-right">{fmt(netPayable)}</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="font-bold">Tax Payable on Reverse Charge</span>
                <span>:</span>
                <span className="w-28 text-right">{fmt(data.summary.taxPayableOnReverseCharge)}</span>
              </div>
            </div>
          </div>

          {/* Section 6: Amount in Words */}
          <div className="border-b border-black p-1.5 text-[8.5px]">
            <span className="font-bold">Amount in Words (INR):</span>{' '}
            <span className="font-semibold">{data.summary.amountInWords}</span>
          </div>

          {/* Section 7: Remark */}
          <div className="border-b border-black p-1.5 text-[8.5px] min-h-[22px]">
            <span className="font-bold">Remark:</span>{' '}
            <span>{data.summary.remark}</span>
          </div>

          {/* Section 8: Terms & Conditions and Signature */}
          <div className="p-2 space-y-2">
            <div className="flex justify-between items-start">
              <div className="font-bold text-[8.5px]">E.&amp; O.E</div>
              <div className="font-bold text-[8.5px] uppercase">
                For {data.company.name}
              </div>
            </div>

            <div className="flex justify-between items-end pt-1">
              {/* Terms and Conditions */}
              <div className="max-w-[70%] space-y-0.5 text-[7.5px] leading-tight text-neutral-800">
                <div className="font-bold text-[8px] text-black">TERMS &amp; CONDITION:</div>
                {data.summary.termsAndConditions.map((term, i) => (
                  <p key={i}>{term}</p>
                ))}
              </div>

              {/* Authorized Signatory */}
              <div className="text-right pb-1 pr-2">
                <div className="h-10"></div>
                <div className="font-bold text-[8.5px] border-t border-black/40 pt-1">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Footer */}
        <div className="text-right text-[8px] mt-1 pr-1 text-neutral-600 shrink-0">
          Page 1 of 1
        </div>
      </div>
    </div>
  );
}
