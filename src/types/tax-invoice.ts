export interface TaxInvoiceItem {
  id: string;
  srNo: number;
  description: string;
  sacHsn: string;
  rate: number;
  amount: number;
  nonGstExempt: number;
  taxableValue: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  igstPercent: number;
  igstAmount: number;
  total: number;
}

export interface TaxInvoiceData {
  company: {
    name: string;
    addressLine1: string;
    addressLine2: string;
    email: string;
    tel: string;
    gstNo: string;
    panNo: string;
    cinNo: string;
    logoUrl: string;
  };
  recipient: {
    name: string;
    address: string;
    panNo: string;
    gstNo: string;
    state: string;
  };
  invoice: {
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    placeOfSupply: string;
    shipmentNo: string;
    shipmentType: string;
  };
  logistics: {
    mawbNo: string;
    mawbDate: string;
    hawbNo: string;
    hawbDate: string;
    sbNo: string;
    sbDate: string;
    boeNo: string;
    boeDate: string;
    exporterInvNo: string;
    exporterInvDate: string;
    cargoType: string;
    volume: string;
    packages: string;
    grossWeight: string;
    grossWeightUnit: string;
    chargeableWeight: string;
    chargeableWeightUnit: string;
    netWeight: string;
    flightNo: string;
    flightDate: string;
    airline: string;
    shipperRef: string;
    incoTerms: string;
    shipper: string;
    consignee: string;
    placeOfReceipt: string;
    loadingPort: string;
    dischargePort: string;
    placeOfDelivery: string;
    destinationPort: string;
  };
  items: TaxInvoiceItem[];
  bank: {
    bankName: string;
    branch: string;
    accountNo: string;
    neftRtgs: string;
    swiftCode: string;
    irn: string;
  };
  summary: {
    advanceReceived: number;
    roundOff: number;
    taxPayableOnReverseCharge: number;
    amountInWords: string;
    remark: string;
    termsAndConditions: string[];
  };
}

export const INITIAL_SAMPLE_TAX_INVOICE: TaxInvoiceData = {
  company: {
    name: "M5 CONTINENT LOGISTICS SOLUTION PRIVATE LIMITED",
    addressLine1: "Ground Floor, Khasra No. 91, Bamnoli Village",
    addressLine2: "Plot No. NJF PC 40, Bamnoli Village, New Delhi, Delhi - 110077",
    email: "info@m5clogs.com",
    tel: "+91 88000 14492",
    gstNo: "07AAQCM6359K2ZO",
    panNo: "AAQCM6359K",
    cinNo: "51201DL2023PTC410991",
    logoUrl: "/m5c-logo.png",
  },
  recipient: {
    name: "SPREETRANS INTERNATIONAL",
    address: "G/F, KH NO-737, NORTH WING.PT.JAGAN NATH ,\nCOMPLEX, MAHIPALPUR, NEAR - VISHAL MEGA MART,\nNEW DELHI, New Delhi, Delhi, 110037",
    panNo: "AFCPB2067D",
    gstNo: "07AFCPB2067D2Z2",
    state: "[07]",
  },
  invoice: {
    invoiceNo: "INV/DEL/2627/0002",
    invoiceDate: "28-Oct-2026",
    dueDate: "28-Oct-2026",
    placeOfSupply: "[07]",
    shipmentNo: "DEL/2397/2627",
    shipmentType: "AIR_EXPORT",
  },
  logistics: {
    mawbNo: "157-5145 2800",
    mawbDate: "25-Sep-2026",
    hawbNo: "",
    hawbDate: "",
    sbNo: "",
    sbDate: "",
    boeNo: "",
    boeDate: "",
    exporterInvNo: "",
    exporterInvDate: "",
    cargoType: "",
    volume: "",
    packages: "70",
    grossWeight: "1699",
    grossWeightUnit: "Kgs",
    chargeableWeight: "1699",
    chargeableWeightUnit: "Kgs",
    netWeight: "",
    flightNo: "QR",
    flightDate: "",
    airline: "QATAR AIRWAYS",
    shipperRef: "",
    incoTerms: "",
    shipper: "SPREETRANS INTERNATIONAL",
    consignee: "",
    placeOfReceipt: "",
    loadingPort: "DEL",
    dischargePort: "LHR",
    placeOfDelivery: "",
    destinationPort: "LHR",
  },
  items: [
    {
      id: "item-1",
      srNo: 1,
      description: "AIR FREIGHT",
      sacHsn: "52115120",
      rate: 280.00,
      amount: 475720.00,
      nonGstExempt: 0.00,
      taxableValue: 475720.00,
      cgstPercent: 9,
      cgstAmount: 42814.80,
      sgstPercent: 9,
      sgstAmount: 42814.80,
      igstPercent: 0,
      igstAmount: 0.00,
      total: 561349.60,
    },
    {
      id: "item-2",
      srNo: 2,
      description: "MAWB CHARGES",
      sacHsn: "0000001",
      rate: 400.00,
      amount: 400.00,
      nonGstExempt: 0.00,
      taxableValue: 400.00,
      cgstPercent: 9,
      cgstAmount: 36.00,
      sgstPercent: 9,
      sgstAmount: 36.00,
      igstPercent: 0,
      igstAmount: 0.00,
      total: 472.00,
    },
  ],
  bank: {
    bankName: "ICICI BANK",
    branch: "DWARKA SEC 10",
    accountNo: "403605500215",
    neftRtgs: "",
    swiftCode: "ICICINBBCTS",
    irn: "",
  },
  summary: {
    advanceReceived: 0.00,
    roundOff: 0.40,
    taxPayableOnReverseCharge: 0.00,
    amountInWords: "Five Lakh Sixty One Thousand Eight Hundred Twenty Two Rupees Only",
    remark: "",
    termsAndConditions: [
      "1. On receipt of the invoice the payment should be remitted within 24 hours, Otherwise interest @18% p.a. shall be applicable.",
      "2. Company liability is restricted as per the stipulations specified in airway bill.",
      "3. Cheque/DD should be in Favour of M 5 CONTINENT LOGISTICS SOLUTION PVT. LTD.",
      "4. All disputes are subject to Delhi Court only.",
      "5. This is a computer generated invoice and it does not require signature.",
    ],
  },
};

export const BLANK_TAX_INVOICE: TaxInvoiceData = {
  company: {
    name: "M5 CONTINENT LOGISTICS SOLUTION PRIVATE LIMITED",
    addressLine1: "Ground Floor, Khasra No. 91, Bamnoli Village",
    addressLine2: "Plot No. NJF PC 40, Bamnoli Village, New Delhi, Delhi - 110077",
    email: "info@m5clogs.com",
    tel: "+91 88000 14492",
    gstNo: "07AAQCM6359K2ZO",
    panNo: "AAQCM6359K",
    cinNo: "51201DL2023PTC410991",
    logoUrl: "/m5c-logo.png",
  },
  recipient: {
    name: "",
    address: "",
    panNo: "",
    gstNo: "",
    state: "",
  },
  invoice: {
    invoiceNo: "",
    invoiceDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
    dueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
    placeOfSupply: "",
    shipmentNo: "",
    shipmentType: "AIR_EXPORT",
  },
  logistics: {
    mawbNo: "",
    mawbDate: "",
    hawbNo: "",
    hawbDate: "",
    sbNo: "",
    sbDate: "",
    boeNo: "",
    boeDate: "",
    exporterInvNo: "",
    exporterInvDate: "",
    cargoType: "",
    volume: "",
    packages: "",
    grossWeight: "",
    grossWeightUnit: "Kgs",
    chargeableWeight: "",
    chargeableWeightUnit: "Kgs",
    netWeight: "",
    flightNo: "",
    flightDate: "",
    airline: "",
    shipperRef: "",
    incoTerms: "",
    shipper: "",
    consignee: "",
    placeOfReceipt: "",
    loadingPort: "",
    dischargePort: "",
    placeOfDelivery: "",
    destinationPort: "",
  },
  items: [
    {
      id: "item-1",
      srNo: 1,
      description: "",
      sacHsn: "",
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
    },
  ],
  bank: {
    bankName: "ICICI BANK",
    branch: "DWARKA SEC 10",
    accountNo: "403605500215",
    neftRtgs: "",
    swiftCode: "ICICINBBCTS",
    irn: "",
  },
  summary: {
    advanceReceived: 0,
    roundOff: 0,
    taxPayableOnReverseCharge: 0,
    amountInWords: "Zero Rupees Only",
    remark: "",
    termsAndConditions: [
      "1. On receipt of the invoice the payment should be remitted within 24 hours, Otherwise interest @18% p.a. shall be applicable.",
      "2. Company liability is restricted as per the stipulations specified in airway bill.",
      "3. Cheque/DD should be in Favour of M 5 CONTINENT LOGISTICS SOLUTION PVT. LTD.",
      "4. All disputes are subject to Delhi Court only.",
      "5. This is a computer generated invoice and it does not require signature.",
    ],
  },
};
