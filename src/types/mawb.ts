export interface MawbFlight {
  flightNo: string;
  date: string;
}

export interface MawbRatingItem {
  id: string;
  pieces: number | string;
  grossWeight: number | string;
  weightUnit: 'K' | 'L';
  rateClass: string;
  commodityItemNo: string;
  chargeableWeight: number | string;
  rate: number | string;
  total: number | string;
  natureAndQuantity: string;
}

export interface MawbOtherCharge {
  code: string;
  amount: number | string;
  description?: string;
}

export interface MawbData {
  // AWB Header identification
  awbPrefix: string;             // e.g. "077"
  departureAirportCode: string;  // e.g. "DEL"
  awbSerial: string;             // e.g. "5906 6545"
  
  // Carrier & Notices
  carrierName: string;           // e.g. "EGYPT AIR"
  carrierHeader: string;         // "Not negotiable AIR WAYBILL issued by"
  copiesNotice: string;          // "Copies 1,2 and 3 of this House Air Waybill are originals and have the same validity"
  contractNotice: string;        // "It is agreed that the goods described herein are accepted in apparent good order and condition..."
  
  // Parties
  shipper: {
    nameAndAddress: string;
    accountNumber: string;
  };
  consignee: {
    nameAndAddress: string;
    accountNumber: string;
  };
  issuingAgent: {
    nameAndCity: string;
    iataCode: string;
    accountNo: string;
  };
  accountingInfo: string;        // e.g. "FREIGHT PREPAID"

  // Routing and Flight Info
  routing: {
    departureAirport: string;    // e.g. "DELHI"
    to1: string;                 // e.g. "LHR"
    byFirstCarrier: string;      // e.g. "MS"
    to2: string;
    by2: string;
    to3: string;
    by3: string;
    currency: string;            // e.g. "INR"
    chgsCode: string;            // e.g. "PP" or ""
    wtValPpd: string;            // "P" or ""
    wtValColl: string;           // ""
    otherPpd: string;            // "P" or ""
    otherColl: string;           // ""
    declaredValueCarriage: string; // e.g. "NVD" or ""
    declaredValueCustoms: string;  // e.g. "NCV" or ""
    destinationAirport: string;  // e.g. "LONDON"
    flights: MawbFlight[];       // [{ flightNo: "MS5518", date: "28/10/2026" }, { flightNo: "MS777", date: "30/10/2026" }]
    amountOfInsurance: string;   // e.g. "XXX" or ""
    insuranceNotice: string;
    handlingInfo: string;        // e.g. "PLEASE INFORM CONSIGNEE IMMEDIATELY ON ARRIVAL OF CARGO MARKS AND NOS ACC3 Number (DE/ACC3/EGCAI-MS)"
    sci: string;                 // e.g. ""
  };

  // Goods Grid
  items: MawbRatingItem[];

  // Charges
  charges: {
    prepaidWeightCharge: number | string;
    collectWeightCharge: number | string;
    valuationChargePrepaid: number | string;
    valuationChargeCollect: number | string;
    taxPrepaid: number | string;
    taxCollect: number | string;
    agentChargesPrepaid: number | string;
    agentChargesCollect: number | string;
    carrierChargesPrepaid: number | string;
    carrierChargesCollect: number | string;
    otherChargesBreakdown: string; // e.g. "UEC-1308.00, MMC-980.00, SSC-19620.00"
    totalPrepaid: number | string;
    totalCollect: number | string;
    currencyConversionRates: string;
    ccChargesDest: string;
    chargesAtDest: string;
    totalCollectCharges: string;
  };

  // Signatures & Execution
  execution: {
    shipperCertSignatory: string;
    executedDate: string;
    executedPlace: string;
    carrierAgentSignature: string;
    copyDesignation: string; // e.g. "ORIGINAL 1 (FOR ISSUING CARRIER)"
  };
}

export const AWB_COPY_DESIGNATIONS = [
  'ORIGINAL 1 (FOR ISSUING CARRIER)',
  'ORIGINAL 2 (FOR CONSIGNEE)',
  'ORIGINAL 3 (FOR SHIPPER)',
  'COPY 4 (DELIVERY RECEIPT)',
  'COPY 5 (FOR AIRPORT OF DESTINATION)',
  'COPY 6 (FOR THIRD CARRIER)',
  'COPY 7 (FOR SECOND CARRIER)',
  'COPY 8 (FOR FIRST CARRIER)',
  'COPY 9 (FOR AGENT)',
  'COPY 10 (EXTRA COPY)',
  'COPY 11 (EXTRA COPY)',
  'COPY 12 (EXTRA COPY)',
];

export const INITIAL_SAMPLE_MAWB: MawbData = {
  awbPrefix: '077',
  departureAirportCode: 'DEL',
  awbSerial: '5906 6545',
  carrierName: 'EGYPT AIR',
  carrierHeader: 'Not negotiable\nAIR WAYBILL\nissued by',
  copiesNotice: 'Copies 1,2 and 3 of this House Air Waybill are originals and have the same validity',
  contractNotice:
    'It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. All goods may be carried by any other means including road or any other carrier unless specific contrary instructions are given herein by the shipper and shipper agrees that the shipment may be carried via intermediate stopping places which the carrier deems appropriate.',
  
  shipper: {
    nameAndAddress: `HOLISTIC ENTERPRISES
GROUND FLOOR, 39, SHOP DDA JANTA FLAT
GROUP-II POCKET-C, HASTAL ROAD, UTTAM NAGAR
NEW DELHI, SOUTH WEST DELHI, DELHI, 110059
EMAIL - HOLISTICS@GMAIL.COM`,
    accountNumber: '',
  },

  consignee: {
    nameAndAddress: `A.J WORLDWIDE SERVICES LTD
UNIT 2 HORTON INDUSTRIAL PARK
GB UB7 8JD HORTON ROAD WEST DRAYTON
EORI : GB745115840000
TEL.:+44275665502000
UK`,
    accountNumber: '',
  },

  issuingAgent: {
    nameAndCity: `M5 CONTINENT LOGISTICS SOLUTION PVT LTD
DELHI`,
    iataCode: '14-0-26840004',
    accountNo: '',
  },

  accountingInfo: 'FREIGHT PREPAID',

  routing: {
    departureAirport: 'DELHI',
    to1: 'LHR',
    byFirstCarrier: 'MS',
    to2: '',
    by2: '',
    to3: '',
    by3: '',
    currency: 'INR',
    chgsCode: '',
    wtValPpd: '',
    wtValColl: '',
    otherPpd: '',
    otherColl: '',
    declaredValueCarriage: '',
    declaredValueCustoms: '',
    destinationAirport: 'LONDON',
    flights: [
      { flightNo: 'MS5518', date: '28/10/2026' },
      { flightNo: 'MS777', date: '30/10/2026' },
    ],
    amountOfInsurance: '',
    insuranceNotice:
      'INSURANCE- - if carrier offers insurance and such insurance is requested in accordance with conditions on reverse hereof indicate amount to be insured in figures in box marked Amount of Insurance.',
    handlingInfo:
      'PLEASE INFORM CONSIGNEE IMMEDIATELY ON ARRIVAL OF CARGO MARKS AND NOS ACC3 Number (DE/ACC3/EGCAI-MS)',
    sci: '',
  },

  items: [
    {
      id: '1',
      pieces: 57,
      grossWeight: '1308.00',
      weightUnit: 'K',
      rateClass: 'Q',
      commodityItemNo: '',
      chargeableWeight: '1308.00',
      rate: '300.00',
      total: '392,400.00',
      natureAndQuantity: `SAID TO CONTAIN
ARTIFICIAL JEWELLERY, BAG, CERAMIC
UTENSILS, COSMETIC,COTTON
UNDERGARMENTS, COTTON PANT HS
CODE: 71171100, 63053300, 69111029,
61071100, 62034290
INVOICE NO - HL077/26-27 DT. 27/10/2026
DIM:45X40X40/10 , 40X35X40/10 ,
44X40X40/10
60X55X50/10, 57X40X38/10, 57X40X38/7 CMT
VOL WT: 851 KGS`,
    },
  ],

  charges: {
    prepaidWeightCharge: '392,400.00',
    collectWeightCharge: '',
    valuationChargePrepaid: '',
    valuationChargeCollect: '',
    taxPrepaid: '',
    taxCollect: '',
    agentChargesPrepaid: '',
    agentChargesCollect: '',
    carrierChargesPrepaid: '21,908.00',
    carrierChargesCollect: '',
    otherChargesBreakdown: 'UEC-1308.00, MMC-980.00, SSC-19620.00',
    totalPrepaid: '414,308.00',
    totalCollect: '',
    currencyConversionRates: '',
    ccChargesDest: '',
    chargesAtDest: '',
    totalCollectCharges: '',
  },

  execution: {
    shipperCertSignatory: 'M5 CONTINENT LOGISTICS SOLUTION PVT LTD',
    executedDate: '27 Oct 2026',
    executedPlace: 'DELHI',
    carrierAgentSignature: `M5 CONTINENT LOGISTICS
SOLUTION PVT LTD`,
    copyDesignation: 'ORIGINAL 1 (FOR ISSUING CARRIER)',
  },
};

export const BLANK_MAWB: MawbData = {
  awbPrefix: '',
  departureAirportCode: '',
  awbSerial: '',
  carrierName: '',
  carrierHeader: 'Not negotiable\nAIR WAYBILL\nissued by',
  copiesNotice: 'Copies 1,2 and 3 of this Air Waybill are originals and have the same validity',
  contractNotice:
    'It is agreed that the goods described herein are accepted in apparent good order and condition (except as noted) for carriage SUBJECT TO THE CONDITIONS OF CONTRACT ON THE REVERSE HEREOF. All goods may be carried by any other means including road or any other carrier unless specific contrary instructions are given herein by the shipper and shipper agrees that the shipment may be carried via intermediate stopping places which the carrier deems appropriate.',
  
  shipper: {
    nameAndAddress: '',
    accountNumber: '',
  },

  consignee: {
    nameAndAddress: '',
    accountNumber: '',
  },

  issuingAgent: {
    nameAndCity: 'M5 CONTINENT LOGISTICS SOLUTION PVT LTD\nDELHI',
    iataCode: '14-0-26840004',
    accountNo: '',
  },

  accountingInfo: 'FREIGHT PREPAID',

  routing: {
    departureAirport: '',
    to1: '',
    byFirstCarrier: '',
    to2: '',
    by2: '',
    to3: '',
    by3: '',
    currency: 'INR',
    chgsCode: '',
    wtValPpd: '',
    wtValColl: '',
    otherPpd: '',
    otherColl: '',
    declaredValueCarriage: 'NVD',
    declaredValueCustoms: 'NCV',
    destinationAirport: '',
    flights: [
      { flightNo: '', date: '' },
      { flightNo: '', date: '' },
    ],
    amountOfInsurance: '',
    insuranceNotice:
      'INSURANCE- - if carrier offers insurance and such insurance is requested in accordance with conditions on reverse hereof indicate amount to be insured in figures in box marked Amount of Insurance.',
    handlingInfo: '',
    sci: '',
  },

  items: [
    {
      id: '1',
      pieces: '',
      grossWeight: '',
      weightUnit: 'K',
      rateClass: 'Q',
      commodityItemNo: '',
      chargeableWeight: '',
      rate: '',
      total: '',
      natureAndQuantity: '',
    },
  ],

  charges: {
    prepaidWeightCharge: '',
    collectWeightCharge: '',
    valuationChargePrepaid: '',
    valuationChargeCollect: '',
    taxPrepaid: '',
    taxCollect: '',
    agentChargesPrepaid: '',
    agentChargesCollect: '',
    carrierChargesPrepaid: '',
    carrierChargesCollect: '',
    otherChargesBreakdown: '',
    totalPrepaid: '',
    totalCollect: '',
    currencyConversionRates: '',
    ccChargesDest: '',
    chargesAtDest: '',
    totalCollectCharges: '',
  },

  execution: {
    shipperCertSignatory: 'M5 CONTINENT LOGISTICS SOLUTION PVT LTD',
    executedDate: '',
    executedPlace: 'DELHI',
    carrierAgentSignature: 'M5 CONTINENT LOGISTICS SOLUTION PVT LTD',
    copyDesignation: 'ORIGINAL 1 (FOR ISSUING CARRIER)',
  },
};

