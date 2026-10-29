'use client';

import React from 'react';
import { MawbData } from '@/types/mawb';

interface MawbSheetProps {
  data: MawbData;
  scale?: number;
  activePage?: 'face' | 'conditions' | 'both';
}

/**
 * Diagonal slash line for empty AWB accounting boxes
 */
function DiagonalSlash() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <line x1="0" y1="100" x2="100" y2="0" stroke="#000000" strokeWidth="0.8" />
    </svg>
  );
}

export function MawbSheet({ data, scale = 1, activePage = 'both' }: MawbSheetProps) {
  // Format numbers to 2 decimal places if valid numeric
  const fmt = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '') return '';
    const clean = String(val).replace(/,/g, '');
    const num = Number(clean);
    if (!isNaN(num) && clean.trim() !== '') {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return String(val);
  };

  const totalPieces = data.items.reduce((sum, it) => sum + (Number(it.pieces) || 0), 0);
  const totalGrossWeight = data.items.reduce((sum, it) => {
    const clean = String(it.grossWeight).replace(/,/g, '');
    return sum + (Number(clean) || 0);
  }, 0);

  const fullAwbNo = `${data.awbPrefix}-${data.awbSerial}`;

  const showPage1 = activePage === 'both' || activePage === 'face';
  const showPage2 = activePage === 'both' || activePage === 'conditions';

  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
      className="mawb-scale-wrapper transition-transform duration-200 print:transform-none flex flex-col items-center gap-8 print:gap-0"
    >
      {/* ================= PAGE 1: MAWB FACE ================= */}
      {showPage1 && (
        <div
          id="mawb-page-1"
          className="mawb-page-sheet bg-white text-black font-sans mx-auto shadow-2xl print:shadow-none print:m-0 print:p-0 flex flex-col justify-between"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '7mm 8mm 6mm 8mm',
            boxSizing: 'border-box',
            fontSize: '9px',
            lineHeight: '1.2',
            color: '#000000',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            {/* Top Bar: 3-Box Prefix/Airport/Serial on Left, Full AWB No on Right */}
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <div className="flex items-stretch border border-black font-bold text-[13px] tracking-wide">
                <div className="px-2.5 py-0.5 border-r border-black min-w-[36px] text-center">
                  {data.awbPrefix || '077'}
                </div>
                <div className="px-2.5 py-0.5 border-r border-black min-w-[42px] text-center">
                  {data.departureAirportCode || 'DEL'}
                </div>
                <div className="px-3 py-0.5 min-w-[85px] text-center">
                  {data.awbSerial || '5906 6545'}
                </div>
              </div>

              <div className="font-bold text-[16px] tracking-wider text-right">
                {fullAwbNo}
              </div>
            </div>

            {/* MAIN OUTER FRAME */}
            <div className="border border-black flex flex-col">
              {/* ROW 1: Shipper (Left) & Carrier / Air Waybill Notice (Right) */}
              <div className="flex border-b border-black">
                {/* Left: Shipper */}
                <div className="w-[48%] border-r border-black flex flex-col justify-between p-1.5 min-h-[92px]">
                  <div className="flex justify-between items-start text-[7px] text-neutral-800 leading-none">
                    <span>Shipper&apos;s Name and Address</span>
                    <span>Shipper&apos;s Account Number</span>
                  </div>
                  <div className="font-bold text-[8.5px] uppercase whitespace-pre-line leading-[1.3] mt-1 pl-1">
                    {data.shipper.nameAndAddress}
                  </div>
                  {data.shipper.accountNumber && (
                    <div className="text-[8px] font-mono text-right pr-1">
                      {data.shipper.accountNumber}
                    </div>
                  )}
                </div>

                {/* Right: Air Waybill Title & Notice */}
                <div className="w-[52%] flex flex-col justify-between">
                  {/* Top sub-box: Not negotiable AIR WAYBILL issued by + Airline */}
                  <div className="p-1.5 border-b border-black flex justify-between items-start">
                    <div>
                      <div className="text-[7.5px] leading-tight">Not negotiable</div>
                      <div className="font-bold text-[11px] tracking-wider leading-tight">
                        AIR WAYBILL
                      </div>
                      <div className="text-[7.5px] leading-tight">issued by</div>
                    </div>
                    <div className="font-bold text-[13px] tracking-wide uppercase pr-2 pt-0.5">
                      {data.carrierName || 'EGYPT AIR'}
                    </div>
                  </div>

                  {/* Middle sub-box: Copies validity notice */}
                  <div className="px-1.5 py-1 text-[6.5px] border-b border-black text-neutral-800 leading-tight">
                    {data.copiesNotice ||
                      'Copies 1,2 and 3 of this House Air Waybill are originals and have the same validity'}
                  </div>

                  {/* Bottom sub-box: Contract condition agreement text */}
                  <div className="p-1.5 text-[6px] text-neutral-900 leading-[1.18] text-justify">
                    {data.contractNotice ||
                      'It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. All goods may be carried by any other means including road or any other carrier unless specific contrary instructions are given herein by the shipper and shipper agrees that the shipment may be carried via intermediate stopping places which the carrier deems appropriate.'}
                  </div>
                </div>
              </div>

              {/* ROW 2: Consignee (Left) */}
              <div className="flex border-b border-black">
                <div className="w-[48%] border-r border-black flex flex-col justify-between p-1.5 min-h-[92px]">
                  <div className="flex justify-between items-start text-[7px] text-neutral-800 leading-none">
                    <span>Consignee&apos;s Name and Address</span>
                    <span>Consignee&apos;s Account Number</span>
                  </div>
                  <div className="font-bold text-[8.5px] uppercase whitespace-pre-line leading-[1.3] mt-1 pl-1">
                    {data.consignee.nameAndAddress}
                  </div>
                  {data.consignee.accountNumber && (
                    <div className="text-[8px] font-mono text-right pr-1">
                      {data.consignee.accountNumber}
                    </div>
                  )}
                </div>

                {/* Right: Accounting Information (Extended space or Freight Prepaid) */}
                <div className="w-[52%] flex flex-col justify-start p-2">
                  <div className="font-bold text-[10px] tracking-wider uppercase text-neutral-900 pl-1 pt-1">
                    {data.accountingInfo || 'FREIGHT PREPAID'}
                  </div>
                </div>
              </div>

              {/* ROW 3: Issuing Carrier's Agent (Left) */}
              <div className="flex border-b border-black">
                <div className="w-[48%] border-r border-black p-1.5 min-h-[44px]">
                  <div className="text-[7px] text-neutral-800 leading-none">
                    Issuing Carrier&apos;s Agent Name and City
                  </div>
                  <div className="font-bold text-[8.5px] uppercase whitespace-pre-line leading-tight mt-1 pl-1">
                    {data.issuingAgent.nameAndCity}
                  </div>
                </div>
                <div className="w-[52%] p-1.5">
                  {/* Empty right box for accounting/reference */}
                </div>
              </div>

              {/* ROW 4: Agent's IATA Code & Account No */}
              <div className="flex border-b border-black">
                <div className="w-[48%] border-r border-black flex">
                  <div className="w-1/2 border-r border-black p-1.5">
                    <div className="text-[7px] text-neutral-800 leading-none">
                      Agent&apos;s IATA Code
                    </div>
                    <div className="font-bold text-[8.5px] tracking-wider mt-1 pl-1">
                      {data.issuingAgent.iataCode || '14-0-26840004'}
                    </div>
                  </div>
                  <div className="w-1/2 p-1.5">
                    <div className="text-[7px] text-neutral-800 leading-none">Account No.</div>
                    <div className="font-bold text-[8.5px] tracking-wider mt-1 pl-1">
                      {data.issuingAgent.accountNo}
                    </div>
                  </div>
                </div>
                <div className="w-[52%] p-1.5"></div>
              </div>

              {/* ROW 5: Airport of Departure */}
              <div className="flex border-b border-black">
                <div className="w-[48%] border-r border-black p-1.5">
                  <div className="text-[7px] text-neutral-800 leading-none">
                    Airport of Departure (Addr. Of First Carrier) and requested Routing
                  </div>
                  <div className="font-bold text-[9px] uppercase tracking-wide mt-1 pl-1">
                    {data.routing.departureAirport || 'DELHI'}
                  </div>
                </div>
                <div className="w-[52%] p-1.5"></div>
              </div>

              {/* ROW 6: Routing & Destination / Currency / Valuation / Charges Matrix */}
              <div className="flex border-b border-black text-[7px] leading-tight min-h-[34px]">
                {/* To */}
                <div className="w-[4.5%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">To</span>
                  <span className="font-bold text-[9px] uppercase">{data.routing.to1}</span>
                </div>

                {/* By First Carrier / Routing and Destination */}
                <div className="w-[20%] border-r border-black p-1 flex flex-col justify-between">
                  <div className="flex justify-between text-[6.5px] text-neutral-700">
                    <span>By First Carrier</span>
                    <span className="font-semibold">Routing and Destination</span>
                  </div>
                  <span className="font-bold text-[9px] uppercase">
                    {data.routing.byFirstCarrier}
                  </span>
                </div>

                {/* To */}
                <div className="w-[4.5%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">To</span>
                  <span className="font-bold text-[8.5px] uppercase">{data.routing.to2}</span>
                </div>

                {/* by */}
                <div className="w-[4%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">by</span>
                  <span className="font-bold text-[8.5px] uppercase">{data.routing.by2}</span>
                </div>

                {/* To */}
                <div className="w-[4.5%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">To</span>
                  <span className="font-bold text-[8.5px] uppercase">{data.routing.to3}</span>
                </div>

                {/* by */}
                <div className="w-[4%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">by</span>
                  <span className="font-bold text-[8.5px] uppercase">{data.routing.by3}</span>
                </div>

                {/* Currency */}
                <div className="w-[6.5%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700">Currency</span>
                  <span className="font-bold text-[8.5px] uppercase">
                    {data.routing.currency || 'INR'}
                  </span>
                </div>

                {/* CHGS Code */}
                <div className="w-[5%] border-r border-black p-1 flex flex-col justify-between text-center">
                  <div className="text-[6px] text-neutral-700 leading-none">
                    CHGS
                    <br />
                    Code
                  </div>
                  <span className="font-bold text-[8px] uppercase">{data.routing.chgsCode}</span>
                </div>

                {/* WT/VAL */}
                <div className="w-[8.5%] border-r border-black flex flex-col">
                  <div className="text-center text-[6.5px] border-b border-black py-0.5 text-neutral-700">
                    WT/VAL
                  </div>
                  <div className="flex flex-1">
                    <div className="w-1/2 border-r border-black text-center text-[5.5px] p-0.5 flex flex-col justify-between">
                      <span>PPD</span>
                      <span className="font-bold text-[7.5px]">{data.routing.wtValPpd}</span>
                    </div>
                    <div className="w-1/2 text-center text-[5.5px] p-0.5 flex flex-col justify-between">
                      <span>COLL</span>
                      <span className="font-bold text-[7.5px]">{data.routing.wtValColl}</span>
                    </div>
                  </div>
                </div>

                {/* Other */}
                <div className="w-[8.5%] border-r border-black flex flex-col">
                  <div className="text-center text-[6.5px] border-b border-black py-0.5 text-neutral-700">
                    Other
                  </div>
                  <div className="flex flex-1">
                    <div className="w-1/2 border-r border-black text-center text-[5.5px] p-0.5 flex flex-col justify-between">
                      <span>PPD</span>
                      <span className="font-bold text-[7.5px]">{data.routing.otherPpd}</span>
                    </div>
                    <div className="w-1/2 text-center text-[5.5px] p-0.5 flex flex-col justify-between">
                      <span>COLL</span>
                      <span className="font-bold text-[7.5px]">{data.routing.otherColl}</span>
                    </div>
                  </div>
                </div>

                {/* Declared Value for Carriage */}
                <div className="w-[15%] border-r border-black p-1 flex flex-col justify-between">
                  <div className="text-[6.5px] text-neutral-700 leading-none">
                    Declared Value for
                    <br />
                    Carriage
                  </div>
                  <span className="font-bold text-[8px] uppercase text-center">
                    {data.routing.declaredValueCarriage}
                  </span>
                </div>

                {/* Declared Value for Customs */}
                <div className="w-[15%] p-1 flex flex-col justify-between">
                  <div className="text-[6.5px] text-neutral-700 leading-none">
                    Declared Value for
                    <br />
                    Customs
                  </div>
                  <span className="font-bold text-[8px] uppercase text-center">
                    {data.routing.declaredValueCustoms}
                  </span>
                </div>
              </div>

              {/* ROW 7: Airport of Destination, Flight details, Insurance */}
              <div className="flex border-b border-black text-[7px] leading-tight min-h-[34px]">
                {/* Destination */}
                <div className="w-[22%] border-r border-black p-1.5 flex flex-col justify-between">
                  <span className="text-neutral-700">Airport of Destination</span>
                  <span className="font-bold text-[9px] uppercase">
                    {data.routing.destinationAirport || 'LONDON'}
                  </span>
                </div>

                {/* Requested Flight No/Date */}
                <div className="w-[28%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-neutral-700 text-[6.5px]">Requested Flight No/Date</span>
                  <div className="font-bold text-[8.5px] flex flex-col gap-0.5 pl-1">
                    {data.routing.flights?.map((f, i) => (
                      <div key={i} className="flex justify-between pr-4">
                        <span>{f.flightNo}</span>
                        <span>{f.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amount of Insurance */}
                <div className="w-[12%] border-r border-black p-1 flex flex-col justify-between">
                  <span className="text-[6.5px] text-neutral-700 leading-none">
                    Amount of Insurance
                  </span>
                  <span className="font-bold text-[8px] uppercase text-center">
                    {data.routing.amountOfInsurance}
                  </span>
                </div>

                {/* Insurance Notice */}
                <div className="w-[38%] p-1 text-[5.8px] leading-[1.15] text-neutral-800 flex items-center">
                  {data.routing.insuranceNotice ||
                    'INSURANCE- - if carrier offers insurance and such insurance is requested in accordance with conditions on reverse hereof indicate amount to be insured in figures in box marked Amount of Insurance.'}
                </div>
              </div>

              {/* ROW 8: Handling Information & SCI */}
              <div className="flex border-b border-black min-h-[28px]">
                <div className="w-[92%] border-r border-black p-1.5 flex flex-col justify-between">
                  <div className="text-[7px] text-neutral-800 leading-none">
                    Handling Information
                  </div>
                  <div className="font-bold text-[8px] uppercase leading-tight mt-1 pl-1">
                    {data.routing.handlingInfo}
                  </div>
                </div>

                <div className="w-[8%] p-1 flex flex-col justify-between text-center">
                  <div className="text-[7px] text-neutral-800">SCI</div>
                  <div className="font-bold text-[8px]">{data.routing.sci}</div>
                </div>
              </div>

              {/* ROW 9: RATING / GOODS TABLE */}
              <div className="flex flex-col border-b border-black">
                {/* Table Column Headers */}
                <div className="flex border-b border-black text-[6.5px] font-semibold text-center leading-tight py-1 bg-neutral-50/50">
                  <div className="w-[7%] border-r border-black px-0.5">
                    No.of
                    <br />
                    Pieces
                    <br />
                    RCP
                  </div>
                  <div className="w-[10%] border-r border-black px-0.5">
                    Gross
                    <br />
                    Weight
                  </div>
                  <div className="w-[3.5%] border-r border-black px-0.5">
                    kg
                    <br />
                    lb
                  </div>
                  <div className="w-[9.5%] border-r border-black px-0.5">
                    Rate Class
                    <br />
                    <span className="text-[5.5px] font-normal">Commodity Item No</span>
                  </div>
                  <div className="w-[11%] border-r border-black px-0.5">
                    Chargeable
                    <br />
                    Weight
                  </div>
                  <div className="w-[10.5%] border-r border-black px-0.5">
                    Rate
                    <br />
                    Class
                  </div>
                  <div className="w-[18.5%] border-r border-black px-0.5">Total</div>
                  <div className="w-[30%] px-1 text-left">
                    Nature and Quantity of Goods
                    <br />
                    <span className="text-[5.5px] font-normal">(incl. Dimensions or Volume)</span>
                  </div>
                </div>

                {/* Rating Rows Body */}
                <div className="flex flex-col min-h-[175px] relative">
                  {data.items.map((item, idx) => (
                    <div key={item.id || idx} className="flex text-[8px] py-1">
                      {/* Pieces */}
                      <div className="w-[7%] border-r border-black px-1 text-center font-bold">
                        {item.pieces}
                      </div>

                      {/* Gross Weight */}
                      <div className="w-[10%] border-r border-black px-1 text-right font-bold">
                        {fmt(item.grossWeight)}
                      </div>

                      {/* kg/lb */}
                      <div className="w-[3.5%] border-r border-black px-0.5 text-center font-bold">
                        {item.weightUnit || 'K'}
                      </div>

                      {/* Rate Class */}
                      <div className="w-[9.5%] border-r border-black px-1 text-center font-bold">
                        {item.rateClass}
                      </div>

                      {/* Chargeable Weight */}
                      <div className="w-[11%] border-r border-black px-1 text-right font-bold">
                        {fmt(item.chargeableWeight)}
                      </div>

                      {/* Rate */}
                      <div className="w-[10.5%] border-r border-black px-1 text-right font-bold">
                        {fmt(item.rate)}
                      </div>

                      {/* Total */}
                      <div className="w-[18.5%] border-r border-black px-2 text-right font-bold">
                        {fmt(item.total)}
                      </div>

                      {/* Nature & Quantity of Goods */}
                      <div className="w-[30%] px-2 text-[7px] font-bold leading-[1.28] whitespace-pre-line uppercase">
                        {item.natureAndQuantity}
                      </div>
                    </div>
                  ))}

                  {/* Empty spacer to push totals row to bottom if items are short */}
                  <div className="flex-1 min-h-[20px]" />

                  {/* Bottom Totals Row inside Goods Table */}
                  <div className="flex border-t border-black text-[8px] font-bold py-1 bg-white">
                    <div className="w-[7%] border-r border-black px-1 text-center">
                      {totalPieces || ''}
                    </div>
                    <div className="w-[10%] border-r border-black px-1 text-right">
                      {totalGrossWeight ? fmt(totalGrossWeight) : ''}
                    </div>
                    <div className="w-[3.5%] border-r border-black" />
                    <div className="w-[9.5%] border-r border-black" />
                    <div className="w-[11%] border-r border-black" />
                    <div className="w-[10.5%] border-r border-black" />
                    <div className="w-[18.5%] border-r border-black px-2 text-right">
                      {data.charges.prepaidWeightCharge
                        ? fmt(data.charges.prepaidWeightCharge)
                        : ''}
                    </div>
                    <div className="w-[30%]" />
                  </div>
                </div>
              </div>

              {/* ROW 10: CHARGES / CERTIFICATION / EXECUTION */}
              <div className="flex">
                {/* LEFT COLUMN: Charges Grid (~38% width) */}
                <div className="w-[38%] border-r border-black flex flex-col text-[7px]">
                  {/* Weight Charge */}
                  <div className="flex border-b border-black min-h-[24px]">
                    <div className="w-1/2 border-r border-black p-1 flex flex-col justify-between">
                      <span className="text-neutral-700 text-[6.5px]">Prepaid</span>
                      <span className="font-bold text-[8.5px] text-right">
                        {fmt(data.charges.prepaidWeightCharge)}
                      </span>
                    </div>
                    <div className="w-1/2 p-1 flex flex-col justify-between">
                      <div className="flex justify-between text-[6.5px] text-neutral-700">
                        <span>Weight Charge</span>
                        <span>Collect</span>
                      </div>
                      <span className="font-bold text-[8.5px] text-right">
                        {fmt(data.charges.collectWeightCharge)}
                      </span>
                    </div>
                  </div>

                  {/* Valuation Charge */}
                  <div className="flex border-b border-black min-h-[22px] relative">
                    <div className="w-1/2 border-r border-black p-1 flex flex-col justify-between relative">
                      <span className="text-neutral-700 text-[6.5px]">Valuation Charge</span>
                      <span className="font-bold text-[8px] text-right">
                        {fmt(data.charges.valuationChargePrepaid)}
                      </span>
                      {!data.charges.valuationChargePrepaid && <DiagonalSlash />}
                    </div>
                    <div className="w-1/2 p-1 flex flex-col justify-end relative">
                      <span className="font-bold text-[8px] text-right">
                        {fmt(data.charges.valuationChargeCollect)}
                      </span>
                      {!data.charges.valuationChargeCollect && <DiagonalSlash />}
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="flex border-b border-black min-h-[22px] relative">
                    <div className="w-1/2 border-r border-black p-1 flex flex-col justify-between relative">
                      <span className="text-neutral-700 text-[6.5px]">Tax</span>
                      <span className="font-bold text-[8px] text-right">
                        {fmt(data.charges.taxPrepaid)}
                      </span>
                      {!data.charges.taxPrepaid && <DiagonalSlash />}
                    </div>
                    <div className="w-1/2 p-1 flex flex-col justify-end relative">
                      <span className="font-bold text-[8px] text-right">
                        {fmt(data.charges.taxCollect)}
                      </span>
                      {!data.charges.taxCollect && <DiagonalSlash />}
                    </div>
                  </div>

                  {/* Total other Charges Due Agent */}
                  <div className="flex border-b border-black min-h-[22px] relative">
                    <div className="w-1/2 border-r border-black p-1 flex flex-col justify-between relative">
                      <span className="text-neutral-700 text-[6px] leading-tight">
                        Total other Charges Due Agent
                      </span>
                      <span className="font-bold text-[8px] text-right">
                        {fmt(data.charges.agentChargesPrepaid)}
                      </span>
                      {!data.charges.agentChargesPrepaid && <DiagonalSlash />}
                    </div>
                    <div className="w-1/2 p-1 flex flex-col justify-end relative">
                      <span className="font-bold text-[8px] text-right">
                        {fmt(data.charges.agentChargesCollect)}
                      </span>
                      {!data.charges.agentChargesCollect && <DiagonalSlash />}
                    </div>
                  </div>

                  {/* Total other Charges Due Carrier */}
                  <div className="flex border-b border-black min-h-[24px]">
                    <div className="w-1/2 border-r border-black p-1 flex flex-col justify-between relative">
                      <span className="text-neutral-700 text-[6px] leading-tight">
                        Total other Charges Due Carrier
                      </span>
                      <span className="font-bold text-[8.5px] text-right">
                        {fmt(data.charges.carrierChargesPrepaid)}
                      </span>
                    </div>
                    <div className="w-1/2 p-1 flex flex-col justify-end relative">
                      <span className="font-bold text-[8px] text-right">
                        {fmt(data.charges.carrierChargesCollect)}
                      </span>
                      {!data.charges.carrierChargesCollect && <DiagonalSlash />}
                    </div>
                  </div>

                  {/* Blank crossed slot */}
                  <div className="flex border-b border-black min-h-[16px] relative">
                    <div className="w-1/2 border-r border-black relative">
                      <DiagonalSlash />
                    </div>
                    <div className="w-1/2 relative">
                      <DiagonalSlash />
                    </div>
                  </div>

                  {/* Total Prepaid & Total Collect */}
                  <div className="flex min-h-[24px]">
                    <div className="w-1/2 border-r border-black p-1 flex flex-col justify-between">
                      <span className="text-neutral-700 text-[6.5px]">Total prepaid</span>
                      <span className="font-bold text-[9px] text-right">
                        {fmt(data.charges.totalPrepaid)}
                      </span>
                    </div>
                    <div className="w-1/2 p-1 flex flex-col justify-between">
                      <span className="text-neutral-700 text-[6.5px]">Total collect</span>
                      <span className="font-bold text-[9px] text-right">
                        {fmt(data.charges.totalCollect)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Other Charges, Shipper Cert, Execution (~62% width) */}
                <div className="w-[62%] flex flex-col justify-between">
                  {/* Other Charges Box */}
                  <div className="border-b border-black p-1.5 min-h-[34px]">
                    <div className="text-[7px] text-neutral-800 leading-none">Other Charges</div>
                    <div className="font-bold text-[8px] tracking-wide mt-1 pl-1">
                      {data.charges.otherChargesBreakdown}
                    </div>
                  </div>

                  {/* Shipper Certification Box */}
                  <div className="p-1.5 flex flex-col justify-between min-h-[64px]">
                    <p className="text-[5.8px] leading-[1.16] text-neutral-900 text-justify">
                      Shipper certifies that the particulars on the face hereof are correct and
                      that insofar as any part of the consignment contains dangerous goods such part
                      is properly described by name and is in proper condition for carriage by air
                      according to the applicable Dangerous Goods Regulations
                    </p>

                    <div className="mt-2 text-center">
                      <div className="font-bold text-[8.5px] uppercase tracking-wide">
                        {data.execution.shipperCertSignatory ||
                          'M5 CONTINENT LOGISTICS SOLUTION PVT LTD'}
                      </div>
                      <div className="w-4/5 mx-auto border-b border-dotted border-black mt-1" />
                      <div className="text-[6.5px] text-neutral-800 mt-0.5">
                        Signature of Shipper or his Agent
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 11: DESTINATION & CARRIER EXECUTION */}
              <div className="flex border-t border-black">
                {/* Left: Destination Charges Box (~38% width) */}
                <div className="w-[38%] border-r border-black flex flex-col text-[6.5px]">
                  <div className="flex border-b border-black min-h-[18px]">
                    <div className="w-1/2 border-r border-black p-0.5 relative">
                      <span>Currency Conversion Rates</span>
                      <DiagonalSlash />
                    </div>
                    <div className="w-1/2 p-0.5 relative">
                      <span>cc charges in Dest.Currency</span>
                      <DiagonalSlash />
                    </div>
                  </div>

                  <div className="flex min-h-[22px]">
                    <div className="w-2/5 border-r border-black p-0.5 text-[5.5px] leading-tight flex items-center">
                      For Carrier&apos;s use only at Destination
                    </div>
                    <div className="w-3/5 flex flex-col">
                      <div className="border-b border-black p-0.5 relative flex-1">
                        <span>Charges at Destination</span>
                        <DiagonalSlash />
                      </div>
                      <div className="p-0.5 relative flex-1">
                        <span>Total collect Charges</span>
                        <DiagonalSlash />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Executed Date, Place, Carrier Signature, AWB number (~62% width) */}
                <div className="w-[62%] p-1.5 flex flex-col justify-between">
                  <div className="flex items-start justify-between text-[7px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-700">Executed on</span>
                      <span className="font-bold text-[8px]">{data.execution.executedDate}</span>
                      <span className="text-[6.5px] text-neutral-500">(Date)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-neutral-700">at</span>
                      <span className="font-bold text-[8px] uppercase">
                        {data.execution.executedPlace}
                      </span>
                      <span className="text-[6.5px] text-neutral-500">(Place)</span>
                    </div>

                    <div className="text-right">
                      <div className="text-[6.5px] text-neutral-700">
                        Signature of issuing carrier or Agent
                      </div>
                      <div className="font-bold text-[8px] uppercase whitespace-pre-line leading-tight mt-0.5">
                        {data.execution.carrierAgentSignature}
                      </div>
                      <div className="border-b border-dotted border-black mt-1 w-32 ml-auto" />
                    </div>
                  </div>

                  <div className="font-bold text-[12px] tracking-wider text-right mt-1 pr-1">
                    {fullAwbNo}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PAGE 1 FOOTER: Copy Designation */}
          <div className="mt-2 text-right pr-2">
            <span className="font-bold text-[8px] tracking-wider uppercase">
              {data.execution.copyDesignation || 'ORIGINAL 1 (FOR ISSUING CARRIER)'}
            </span>
          </div>
        </div>
      )}

      {/* ================= PAGE 2: CONDITIONS OF CONTRACT ================= */}
      {showPage2 && (
        <div
          id="mawb-page-2"
          className="mawb-page-sheet bg-white text-black font-sans mx-auto shadow-2xl print:shadow-none print:m-0 print:p-0 flex flex-col justify-between"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '12mm 12mm 10mm 12mm',
            boxSizing: 'border-box',
            fontSize: '6.5px',
            lineHeight: '1.25',
            color: '#000000',
            backgroundColor: '#ffffff',
          }}
        >
          <div>
            {/* Limitation of Liability Heading */}
            <div className="text-center font-bold text-[9.5px] tracking-wide mb-1 uppercase">
              NOTICE CONCERNING CARRIERS&apos; LIMITATION OF LIABILITY
            </div>

            <p className="text-justify leading-[1.28] mb-3 text-[6.5px] text-neutral-900">
              If the carriage involves an ultimate destination or stop in a country other than the
              country of departure, the Montreal Convention or the Warsaw Convention may be
              applicable to the liability of the Carrier in respect of loss of, damage or delay to
              cargo. Carrier&apos;s limitation of liability in accordance with those Conventions
              shall be as set forth in subparagraph 4 unless a higher value is declared.
            </p>

            {/* Conditions of Contract Subheading */}
            <div className="text-center font-bold text-[9px] tracking-wide mb-2 uppercase">
              CONDITIONS OF CONTRACT
            </div>

            {/* 2-Column Standard IATA Conditions Text */}
            <div className="grid grid-cols-2 gap-4 text-justify text-[6px] leading-[1.28]">
              {/* Column 1: Clauses 1 to 5.2 */}
              <div className="space-y-1.5">
                <div>
                  <span className="font-bold">1. In this contract and the Notices appearing hereon:</span>
                  <p className="mt-0.5">
                    <span className="font-bold">CARRIER</span> includes the air carrier issuing this
                    air waybill and all carriers that carry or undertake to carry the cargo or perform
                    any other services related to such carriage.
                  </p>
                  <p className="mt-0.5">
                    <span className="font-bold">SPECIAL DRAWING RIGHT (SDR)</span> is a Special
                    Drawing Right as defined by the International Monetary Fund.
                  </p>
                  <p className="mt-0.5">
                    <span className="font-bold">WARSAW CONVENTION</span> means whichever of the
                    following instruments is applicable to the contract of carriage:
                  </p>
                  <p className="pl-1">
                    the Convention for the Unification of Certain Rules Relating to International
                    Carriage by Air, signed at Warsaw, 12 October 1929;
                  </p>
                  <p className="pl-1">
                    that Convention as amended at The Hague on 28 September 1955;
                  </p>
                  <p className="pl-1">
                    that Convention as amended at The Hague 1955 and by Montreal Protocol No.1, 2, or 4
                    (1975) as the case may be.
                  </p>
                  <p className="mt-0.5">
                    <span className="font-bold">MONTREAL CONVENTION</span> means the Convention for the
                    Unification of Certain Rules for International Carriage by Air, done at Montreal
                    on 28 May 1999.
                  </p>
                </div>

                <div>
                  <span className="font-bold">2./2.1</span> Carriage is subject to the rules relating
                  to liability established by the Warsaw Convention or the Montreal Convention unless
                  such carriage is not &quot;international carriage&quot; as defined by the applicable
                  Conventions.
                </div>

                <div>
                  <span className="font-bold">2.2</span> To the extent not in conflict with the
                  foregoing, carriage and other related services performed by each Carrier are subject
                  to:
                  <p className="pl-1 mt-0.5">2.2.1 applicable laws and government regulations;</p>
                  <p className="pl-1 mt-0.5">
                    2.2.2 provisions contained in the air waybill, Carrier&apos;s conditions of
                    carriage and related rules, regulations, and timetables (but not the times of
                    departure and arrival stated therein) and applicable tariffs of such Carrier, which
                    are made part hereof, and which may be inspected at any airports or other cargo
                    sales offices from which it operates regular services. When carriage is to/from the
                    USA, the shipper and the consignee are entitled, upon request, to receive a free
                    copy of the Carrier&apos;s conditions of carriage. The Carrier&apos;s conditions of
                    carriage include, but are not limited to:
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.1 limits on the Carrier&apos;s liability for loss, damage or delay of goods,
                    including fragile or perishable goods;
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.2 claims restrictions, including time periods within which shippers or
                    consignees must file a claim or bring an action against the Carrier for its acts or
                    omissions, or those of its agents;
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.3 rights, if any, of the Carrier to change the terms of the contract;
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.4 rules about Carrier&apos;s right to refuse to carry;
                  </p>
                  <p className="pl-2 mt-0.5">
                    2.2.2.5 Rights of the Carrier and limitations concerning delay or failure to
                    perform service, including schedule changes, substitution of alternate Carrier or
                    aircraft and rerouting.
                  </p>
                </div>

                <div>
                  <span className="font-bold">3.</span> The agreed stopping places (which may be
                  altered by Carrier in case of necessity) are those places, except the place of
                  departure and place of destination, set forth on the face hereof or shown in
                  Carrier&apos;s timetables as scheduled stopping places for the route. Carriage to be
                  performed hereunder by several successive Carriers is regarded as a single
                  operation.
                </div>

                <div>
                  <span className="font-bold">4.</span> For carriage to which the Montreal Convention
                  does not apply, Carrier&apos;s liability limitation for cargo lost, damaged or
                  delayed shall be 26 SDRs per kilogram unless a greater per kilogram monetary limit is
                  provided in any applicable Convention or in Carrier&apos;s tariffs or general
                  conditions of carriage.
                </div>

                <div>
                  <span className="font-bold">5./5.1</span> Except when the Carrier has extended
                  credit to the consignee without the written consent of the shipper, the shipper
                  guarantees payment of all charges for the carriage due in accordance with
                  Carrier&apos;s tariff, conditions of carriage and related regulations, applicable
                  laws (including national laws implementing the Warsaw Convention and the Montreal
                  Convention), government regulations, orders and requirements.
                </div>

                <div>
                  <span className="font-bold">5.2</span> When no part of the consignment is delivered,
                  a claim with respect to such consignment will be considered even though
                  transportation charges thereon are unpaid.
                </div>
              </div>

              {/* Column 2: Clauses 6 to 12 */}
              <div className="space-y-1.5">
                <div>
                  <span className="font-bold">6./6.1</span> For cargo accepted for carriage, the
                  Warsaw Convention and the Montreal Convention permit shipper to increase the
                  limitation of liability by declaring a higher value for carriage and paying a
                  supplemental charge if required.
                </div>

                <div>
                  <span className="font-bold">6.2</span> In carriage to which neither the Warsaw
                  Convention nor the Montreal Convention applies Carrier shall, in accordance with the
                  procedures set forth in its general condition of carriage and applicable tariffs,
                  permit shipper to increase the limitation of liability by declaring a higher value
                  for carriage and paying a supplemental charge if so required.
                </div>

                <div>
                  <span className="font-bold">7/7.1</span> In cases of loss of, damage or delay to part
                  of the cargo, the weight to be taken in account in determining Carrier&apos;s limit of
                  liability shall be only the weight of the package or packages concerned.
                </div>

                <div>
                  <span className="font-bold">7.2</span> Notwithstanding any other provisions, for
                  &quot;foreign air transportation&quot; as defined by the U.S. Transportation Code:
                  <p className="pl-1 mt-0.5">
                    7.2.1 in the case of loss of, damage or delay to a shipment, the weight to be used
                    in determining Carrier&apos;s limit of liability shall be the weight which is used to
                    determine the charge for carriage of such shipment; and
                  </p>
                  <p className="pl-1 mt-0.5">
                    7.2.2 in the case of loss of, damage or delay to a part of a shipment, the shipment
                    weight in 7.2.1 shall be prorated to the packages covered by the same air waybill
                    whose value is affected by the loss, damage or delay. The weight applicable in the
                    case of loss or damage to one or more articles in a package shall be the weight of
                    the entire package.
                  </p>
                </div>

                <div>
                  <span className="font-bold">8.</span> Any exclusion or limitation of liability
                  applicable to Carrier shall apply to Carrier&apos;s agents, employees, and
                  representatives and to any person whose aircraft or equipment used by Carrier for
                  carriage and such person&apos;s agents, employees and representatives.
                </div>

                <div>
                  <span className="font-bold">9.</span> Carrier undertakes to complete the carriage with
                  reasonable dispatch. Where permitted by applicable laws, tariffs and government
                  regulations, Carrier may use alternative carriers, aircraft or modes of transport
                  without notice but with due regard to the interests of the shipper. Carrier is
                  authorized by the shipper to select the routing and all intermediate stopping places
                  that it deems appropriate or to change or deviate from the routing shown on the face
                  hereof.
                </div>

                <div>
                  <span className="font-bold">10.</span> Receipt by the person entitled to delivery of
                  the cargo without complaint shall be prima facie evidence that the cargo has been
                  delivered in good condition and in accordance with the contract of carriage.
                  <p className="pl-1 mt-0.5">
                    10.1 In the case of loss of, damage or delay to cargo a written complaint must be
                    made to Carrier by the person entitled to delivery. Such complaint must be made:
                  </p>
                  <p className="pl-2 mt-0.5">
                    10.1.1 in the case of damage to the cargo, immediately after discovery of the
                    damage and at the latest within 14 days from the date of receipt of the cargo;
                  </p>
                  <p className="pl-2 mt-0.5">
                    10.1.2 in the case of delay, within 21 days from the date on which the cargo was
                    placed at the disposal of the person entitled to delivery.
                  </p>
                  <p className="pl-2 mt-0.5">
                    10.1.3 in the case of non-delivery of the cargo, within 120 days from the date of
                    issue of the air waybill, or if an air waybill has not been issued, within 120 days
                    from the date of receipt of the cargo for transportation by the Carrier.
                  </p>
                  <p className="pl-1 mt-0.5">
                    10.2 Such complaint may be made to the Carrier whose air waybill was used, or to the
                    first Carrier or to the last Carrier or to the Carrier, which performed the carriage
                    during which the loss, damage or delay took place.
                  </p>
                  <p className="pl-1 mt-0.5">
                    10.3 Unless a written complaint is made within the time limits specified in 10.1 no
                    action may be brought against Carrier.
                  </p>
                  <p className="pl-1 mt-0.5">
                    10.4 Any rights to damages against Carrier shall be extinguished unless an action
                    is brought within two years from the date of arrival at the destination, or from the
                    date on which the aircraft ought to have arrived, or from the date on which the
                    carriage stopped.
                  </p>
                </div>

                <div>
                  <span className="font-bold">11.</span> Shipper shall comply with all applicable
                  laws and government regulations of any country to or from which the cargo may be
                  carried, including those relating to the packing, carriage or delivery of the cargo,
                  and shall furnish such information and attach such documents to the air waybill as
                  may be necessary to comply with such laws and regulations. Carrier is not liable to
                  shipper and shipper shall indemnify Carrier for loss or expense due to shipper&apos;s
                  failure to comply with this provision.
                </div>

                <div>
                  <span className="font-bold">12.</span> No agent, employee or representative of
                  Carrier has authority to alter, modify or waive any provisions of this contract.
                </div>
              </div>
            </div>
          </div>

          {/* Page 2 Bottom Note */}
          <div className="mt-4 pt-2 border-t border-neutral-300 flex justify-between text-[6px] text-neutral-500">
            <span>IATA MASTER AIR WAYBILL CONDITIONS OF CONTRACT</span>
            <span>PAGE 2 OF 2</span>
          </div>
        </div>
      )}
    </div>
  );
}

