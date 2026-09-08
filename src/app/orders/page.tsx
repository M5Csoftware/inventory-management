"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useInventory, Order } from "@/context/inventory-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PlusCircle,
  Search,
  ShoppingCart,
  Download,
  MoreVertical,
  Pencil,
  Trash,
  CheckCircle,
  FilePlus,
  X,
  Eye,
  FileText,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import { useAutoAnimate } from "@formkit/auto-animate/react";

import { ConfirmDeleteModal, ConfirmModal } from "@/components/confirm-modal";
import { M5C_LOGO_BASE64 } from "@/lib/company-logo";

// M5C Company details (Buyer)
const M5C_DETAILS = {
  name: "M5 CONTINENT LOGISTICS SOLUTION PRIVATE LIMITED",
  address:
    "Ground Floor Khasa No 91 Plot No. NJF PC 40 Bamnoli Village New Delhi New Delhi, Delhi- 110077 India",
  contact: "8448688766",
  gstin: "07AAQCM6359K1ZP",
  state: "07- Delhi",
};

export default function OrdersPage() {
  const router = useRouter();
  const [animationParent] = useAutoAnimate();
  const {
    orders,
    suppliers,
    updateOrder,
    deleteOrder,
    recordTransaction,
    activeBranch,
  } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "past">(
    "all",
  );
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToComplete, setOrderToComplete] = useState<Order | null>(null);
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(
    null,
  );
  const [pdfPreviewOrder, setPdfPreviewOrder] = useState<Order | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const completingRef = useRef<Set<string>>(new Set());

  const handleCompleteOrder = async (order: Order) => {
    if (
      order.status === "Completed" ||
      order.status === "Cancelled" ||
      completingRef.current.has(order.id)
    )
      return;

    completingRef.current.add(order.id);
    setCompletingOrderId(order.id);

    try {
      const updatedItems = order.items.map((item) => {
        const alreadyReceived = item.receivedQuantity || 0;
        const remainingToStock = Math.max(0, item.quantity - alreadyReceived);
        return {
          ...item,
          receivedQuantity: item.quantity,
          _stockInNow: remainingToStock,
        };
      });

      for (const item of updatedItems) {
        if (item.productId && item._stockInNow > 0) {
          await recordTransaction(
            item.productId,
            "Stock In",
            item._stockInNow,
            "Purchase Order Received",
            `Order ID: ${order.id} (Manual Completion)`,
            {
              branch:
                order.branch ||
                (activeBranch !== "All" ? activeBranch : "Delhi"),
              supplier: order.supplier,
            },
          );
        }
      }

      await updateOrder(order.id, {
        status: "Completed",
        items: updatedItems.map(({ _stockInNow, ...it }) => it),
      });
      toast.success("Order completed and stock updated!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete order and update stock.");
    } finally {
      completingRef.current.delete(order.id);
      setCompletingOrderId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesType = true;
    if (filterType === "active") {
      matchesType =
        o.status === "Pending" ||
        o.status === "Processing" ||
        o.status === "Partial";
    } else if (filterType === "past") {
      matchesType = o.status === "Completed" || o.status === "Cancelled";
    }

    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Completed":
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Partial":
        return "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30 font-semibold";
      case "Processing":
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      case "Cancelled":
        return "text-destructive bg-destructive/10 border-destructive/20";
      default:
        return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    }
  };

  const buildPDFDoc = (order: Order): jsPDF => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const printableWidth = pageWidth - margin * 2; // 182mm

    // Primary Red Theme Palette (#EA1B40 -> RGB [234, 27, 64])
    const PRIMARY_RED: [number, number, number] = [234, 27, 64];
    const LIGHT_BG: [number, number, number] = [252, 252, 252];
    const BORDER_COLOR: [number, number, number] = [220, 220, 220];

    // Get supplier details dynamically
    const supplierDetails = suppliers.find(
      (s) => s.name.toLowerCase() === order.supplier.toLowerCase(),
    );

    const VENDOR_DETAILS = {
      name: supplierDetails?.name || order.supplier || "Supplier",
      address: supplierDetails?.location || "Address not available",
      phone: supplierDetails?.phone || "",
      email: supplierDetails?.email || "",
      gstin: supplierDetails?.taxId || "N/A",
      state: supplierDetails?.state || "07- Delhi",
    };

    // --- 1. HEADER SECTION (Branding & PO Info) ---
    // Primary Red Top Stripe
    doc.setFillColor(...PRIMARY_RED);
    doc.rect(0, 0, pageWidth, 5, "F");

    // Header Right PO Box dimensions
    const headerBoxWidth = 66;
    const headerBoxX = pageWidth - margin - headerBoxWidth;
    const headerBoxY = 12;

    // Company Logo on Top Left
    const logoX = margin;
    const logoY = 10;
    const logoWidth = 18;
    const logoHeight = 20;

    try {
      doc.addImage(M5C_LOGO_BASE64, "PNG", logoX, logoY, logoWidth, logoHeight);
    } catch (e) {
      console.error("Failed to add logo to PDF:", e);
    }

    // Left Side: Company Name & Sub-details (Positioned strictly right of Logo and left of PO Box)
    const companyX = logoX + logoWidth + 4;
    const companyMaxLineWidth = headerBoxX - companyX - 4; // ~90mm
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(30, 30, 30);
    const titleLines = doc.splitTextToSize(M5C_DETAILS.name, companyMaxLineWidth);
    doc.text(titleLines, companyX, 15);

    let compY = 15 + titleLines.length * 4.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);

    const companyAddrLines = doc.splitTextToSize(
      M5C_DETAILS.address,
      companyMaxLineWidth,
    );
    doc.text(companyAddrLines, companyX, compY);
    compY += companyAddrLines.length * 3.3;

    doc.text(
      `GSTIN: ${M5C_DETAILS.gstin} | State: ${M5C_DETAILS.state} | Phone: ${M5C_DETAILS.contact}`,
      companyX,
      compY,
    );
    compY += 4;

    // Right Side: PO Box (Red Theme Border & Header)
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.roundedRect(headerBoxX, headerBoxY, headerBoxWidth, 26, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY_RED);
    doc.text("PURCHASE ORDER", headerBoxX + headerBoxWidth / 2, headerBoxY + 7, {
      align: "center",
    });

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text(`PO No: ${order.id}`, headerBoxX + 6, headerBoxY + 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    const orderDateFormatted = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
    doc.text(`Date: ${orderDateFormatted}`, headerBoxX + 6, headerBoxY + 18);
    doc.text(
      `Branch: ${order.branch || "Delhi"}`,
      headerBoxX + 6,
      headerBoxY + 22,
    );

    // --- 2. VENDOR & SHIP TO CARDS (Two-Column Dynamic Layout) ---
    let currentY = Math.max(compY + 4, headerBoxY + 30);

    const cardGap = 6;
    const cardWidth = (printableWidth - cardGap) / 2; // 88mm each
    const rightCardX = margin + cardWidth + cardGap;

    // Pre-calculate heights for Vendor Card (Card 1)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const vendorNameLines = doc.splitTextToSize(VENDOR_DETAILS.name, cardWidth - 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const vendorAddrLines = doc.splitTextToSize(VENDOR_DETAILS.address, cardWidth - 8);

    let vCalculatedHeight = 11 + vendorNameLines.length * 3.5 + vendorAddrLines.length * 3.2 + 8;
    if (VENDOR_DETAILS.phone || VENDOR_DETAILS.email) vCalculatedHeight += 3.5;

    // Pre-calculate heights for Ship To Card (Card 2)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    const shipNameLines = doc.splitTextToSize(M5C_DETAILS.name, cardWidth - 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const shipAddrLines = doc.splitTextToSize(M5C_DETAILS.address, cardWidth - 8);

    const sCalculatedHeight = 11 + shipNameLines.length * 3.5 + shipAddrLines.length * 3.2 + 11.5;

    // Dynamic Card Height (Max of content heights, min 38mm)
    const cardHeight = Math.max(vCalculatedHeight, sCalculatedHeight, 38);

    // --- DRAW CARD 1 (Vendor / Supplier) ---
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, "FD");

    // Header strip for Card 1
    doc.setFillColor(...PRIMARY_RED);
    doc.roundedRect(margin, currentY, cardWidth, 6, 2, 2, "F");
    doc.rect(margin, currentY + 4, cardWidth, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("VENDOR / SUPPLIER DETAILS", margin + 4, currentY + 4.5);

    // Card 1 Content (Name, Address, Contact, GSTIN)
    let card1Y = currentY + 11;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text(vendorNameLines, margin + 4, card1Y);
    card1Y += vendorNameLines.length * 3.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(vendorAddrLines, margin + 4, card1Y);
    card1Y += vendorAddrLines.length * 3.2 + 1.5;

    if (VENDOR_DETAILS.phone || VENDOR_DETAILS.email) {
      const contactInfo = [VENDOR_DETAILS.phone, VENDOR_DETAILS.email]
        .filter(Boolean)
        .join(" | ");
      doc.text(`Contact: ${contactInfo}`, margin + 4, card1Y);
      card1Y += 3.5;
    }
    doc.text(`GSTIN: ${VENDOR_DETAILS.gstin}`, margin + 4, card1Y);

    // --- DRAW CARD 2 (Ship To / Deliver To) ---
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(rightCardX, currentY, cardWidth, cardHeight, 2, 2, "FD");

    // Header strip for Card 2
    doc.setFillColor(...PRIMARY_RED);
    doc.roundedRect(rightCardX, currentY, cardWidth, 6, 2, 2, "F");
    doc.rect(rightCardX, currentY + 4, cardWidth, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("SHIP TO / DELIVER TO", rightCardX + 4, currentY + 4.5);

    // Card 2 Content (Name, Address, Contact, GSTIN)
    let card2Y = currentY + 11;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(30, 30, 30);
    doc.text(shipNameLines, rightCardX + 4, card2Y);
    card2Y += shipNameLines.length * 3.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(shipAddrLines, rightCardX + 4, card2Y);
    card2Y += shipAddrLines.length * 3.2 + 1.5;

    doc.text(`Contact: ${M5C_DETAILS.contact}`, rightCardX + 4, card2Y);
    card2Y += 3.5;
    doc.text(`GSTIN: ${M5C_DETAILS.gstin}`, rightCardX + 4, card2Y);

    currentY += cardHeight + 6;

    // --- 3. ITEMS TABLE ---
    const tableColumn = [
      "#",
      "Item Description",
      "HSN/SAC",
      "Qty",
      "Unit Price",
      "Taxable Amt",
      "GST",
      "Total Amount",
    ];

    const tableRows: any[] = [];

    order.items.forEach((item, index) => {
      const taxableAmount = item.quantity * item.price;
      const gst = taxableAmount * 0.18;
      const total = taxableAmount + gst;
      tableRows.push([
        index + 1,
        item.name,
        "3926",
        item.quantity,
        `Rs. ${item.price.toFixed(2)}`,
        `Rs. ${taxableAmount.toFixed(2)}`,
        `18%`,
        `Rs. ${total.toFixed(2)}`,
      ]);
    });

    autoTable(doc, {
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      margin: { left: margin, right: margin },
      theme: "grid",
      headStyles: {
        fillColor: PRIMARY_RED,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "center",
        cellPadding: 2.5,
      },
      styles: {
        font: "helvetica",
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [50, 50, 50],
        lineColor: BORDER_COLOR,
        lineWidth: 0.1,
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { halign: "center", cellWidth: 8 },
        1: { halign: "left", cellWidth: 48 },
        2: { halign: "center", cellWidth: 16 },
        3: { halign: "center", cellWidth: 12 },
        4: { halign: "right", cellWidth: 24 },
        5: { halign: "right", cellWidth: 25 },
        6: { halign: "center", cellWidth: 15 },
        7: { halign: "right", cellWidth: 34 },
      },
    });

    let finalY = (doc as any).lastAutoTable.finalY || currentY + 20;

    // Check if remaining elements will fit on current page; if not, add page
    if (finalY + 75 > pageHeight - 15) {
      doc.addPage();
      finalY = 15;
    }

    // --- 4. FINANCIAL SUMMARY & AMOUNT IN WORDS ---
    const subtotal = order.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0,
    );
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const grandTotal = subtotal + cgst + sgst;

    const totalsWidth = 84;
    const totalsX = pageWidth - margin - totalsWidth;
    const totalsY = finalY + 6;

    // Totals Box
    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(totalsX, totalsY, totalsWidth, 36, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    let tRowY = totalsY + 6;
    doc.text("Taxable Subtotal", totalsX + 5, tRowY);
    doc.text(`Rs. ${subtotal.toFixed(2)}`, totalsX + totalsWidth - 5, tRowY, {
      align: "right",
    });

    tRowY += 5.5;
    doc.text("CGST @ 9%", totalsX + 5, tRowY);
    doc.text(`Rs. ${cgst.toFixed(2)}`, totalsX + totalsWidth - 5, tRowY, {
      align: "right",
    });

    tRowY += 5.5;
    doc.text("SGST @ 9%", totalsX + 5, tRowY);
    doc.text(`Rs. ${sgst.toFixed(2)}`, totalsX + totalsWidth - 5, tRowY, {
      align: "right",
    });

    // Grand Total Banner inside Box (Red Theme)
    tRowY += 5;
    doc.setFillColor(...PRIMARY_RED);
    doc.roundedRect(totalsX + 2, tRowY, totalsWidth - 4, 10, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Grand Total", totalsX + 6, tRowY + 6.5);
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, totalsX + totalsWidth - 6, tRowY + 6.5, {
      align: "right",
    });

    // Amount in Words Box (Left of Totals Box)
    const wordsWidth = printableWidth - totalsWidth - 6;
    const wordsX = margin;
    const wordsY = totalsY;

    doc.setFillColor(...LIGHT_BG);
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(wordsX, wordsY, wordsWidth, 36, 2, 2, "FD");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_RED);
    doc.text("AMOUNT IN WORDS", wordsX + 4, wordsY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    const wordsText = `${numberToWords(grandTotal)} Rupees Only`;
    const wrappedWords = doc.splitTextToSize(wordsText, wordsWidth - 8);
    doc.text(wrappedWords, wordsX + 4, wordsY + 14);

    currentY = totalsY + 40;

    // --- 5. TERMS & CONDITIONS AND DESCRIPTION ---
    const colWidth = (printableWidth - cardGap) / 2;

    // Divider Line
    doc.setDrawColor(...BORDER_COLOR);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY - 2, pageWidth - margin, currentY - 2);

    // Terms Column
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_RED);
    doc.text("Terms & Conditions", margin, currentY + 3);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    let termsY = currentY + 7;
    if (order.termsAndConditions && order.termsAndConditions.trim()) {
      const terms = order.termsAndConditions.split("\n").filter((t) => t.trim());
      terms.forEach((term: string) => {
        const wrapped = doc.splitTextToSize(term.trim(), colWidth - 4);
        doc.text(wrapped, margin, termsY);
        termsY += wrapped.length * 3.2;
      });
    } else {
      const defaultTerms = [
        "1. Goods once sold will not be taken back.",
        "2. Payment terms: 15 days from invoice date.",
        "3. Delivery within 7 working days.",
        "4. All disputes subject to Delhi jurisdiction.",
      ];
      defaultTerms.forEach((term: string) => {
        const wrapped = doc.splitTextToSize(term, colWidth - 4);
        doc.text(wrapped, margin, termsY);
        termsY += wrapped.length * 3.2;
      });
    }

    // Description Column
    const descX = margin + colWidth + cardGap;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_RED);
    doc.text("Order Description / Notes", descX, currentY + 3);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    let descY = currentY + 7;
    if (order.description && order.description.trim()) {
      const descLines = doc.splitTextToSize(order.description, colWidth - 4);
      doc.text(descLines, descX, descY);
      descY += descLines.length * 3.2;
    } else {
      doc.text("No additional notes provided.", descX, descY);
      descY += 3.2;
    }

    // --- 6. AUTHORIZED SIGNATORY & FOOTER ---
    let signatureY = Math.max(termsY, descY) + 6;

    // Ensure signature block fits on page
    if (signatureY + 25 > pageHeight - 12) {
      doc.addPage();
      signatureY = 15;
    }

    // Signature Box Right Aligned
    const sigWidth = 65;
    const sigX = pageWidth - margin - sigWidth;
    doc.setDrawColor(...BORDER_COLOR);
    doc.roundedRect(sigX, signatureY, sigWidth, 20, 1.5, 1.5, "S");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(`For ${M5C_DETAILS.name}`, sigX + 3, signatureY + 5, {
      maxWidth: sigWidth - 6,
    });

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 140, 140);
    doc.text("Authorized Signatory", sigX + 3, signatureY + 16);

    // Global Footer on Every Page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...BORDER_COLOR);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFontSize(6.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(140, 140, 140);
      doc.text(
        "This is a system generated Purchase Order.",
        margin,
        pageHeight - 6,
      );
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        pageHeight - 6,
        { align: "right" },
      );
    }

    return doc;
  };

  const handlePreviewPDF = (order: Order) => {
    try {
      const doc = buildPDFDoc(order);
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setPdfPreviewOrder(order);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF preview.");
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfPreviewOrder) return;
    const doc = buildPDFDoc(pdfPreviewOrder);
    doc.save(`PO_${pdfPreviewOrder.id}.pdf`);
    toast.success(
      `Purchase Order PDF for ${pdfPreviewOrder.id} downloaded successfully!`,
    );
  };

  const closePreviewModal = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
    }
    setPdfPreviewUrl(null);
    setPdfPreviewOrder(null);
  };

  // Helper function to convert numbers to words
  function numberToWords(num: number): string {
    if (num === 0) return "Zero";

    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    function convertLessThanThousand(n: number): string {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        const t = Math.floor(n / 10);
        const o = n % 10;
        return tens[t] + (o ? " " + ones[o] : "");
      }
      const h = Math.floor(n / 100);
      const rest = n % 100;
      return (
        ones[h] +
        " Hundred" +
        (rest ? " and " + convertLessThanThousand(rest) : "")
      );
    }

    const rounded = Math.round(num);
    if (rounded >= 10000000) {
      const crores = Math.floor(rounded / 10000000);
      const rest = rounded % 10000000;
      return (
        convertLessThanThousand(crores) +
        " Crore" +
        (rest ? " " + numberToWords(rest) : "")
      );
    }
    if (rounded >= 100000) {
      const lakhs = Math.floor(rounded / 100000);
      const rest = rounded % 100000;
      return (
        convertLessThanThousand(lakhs) +
        " Lakh" +
        (rest ? " " + numberToWords(rest) : "")
      );
    }
    if (rounded >= 1000) {
      const thousands = Math.floor(rounded / 1000);
      const rest = rounded % 1000;
      return (
        convertLessThanThousand(thousands) +
        " Thousand" +
        (rest ? " " + convertLessThanThousand(rest) : "")
      );
    }
    return convertLessThanThousand(rounded);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Purchase Orders
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Manage and track your supplier orders.
          </p>
        </div>
        <Link href="/orders/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto gap-2">
            <PlusCircle className="h-4 w-4" />
            Generate Order
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                A list of all your active and past orders.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              <div className="flex bg-muted/50 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                <Button
                  variant={filterType === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className="h-8 text-xs px-3 flex-1 sm:flex-none whitespace-nowrap"
                >
                  All
                </Button>
                <Button
                  variant={filterType === "active" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterType("active")}
                  className="h-8 text-xs px-3 flex-1 sm:flex-none whitespace-nowrap"
                >
                  Active
                </Button>
                <Button
                  variant={filterType === "past" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilterType("past")}
                  className="h-8 text-xs px-3 flex-1 sm:flex-none whitespace-nowrap"
                >
                  Past
                </Button>
              </div>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search orders..."
                  className="pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 sm:px-6 py-4 font-medium">Order ID</th>
                  <th className="px-4 sm:px-6 py-4 font-medium">Supplier</th>
                  <th className="px-4 sm:px-6 py-4 font-medium">Items</th>
                  <th className="px-4 sm:px-6 py-4 font-medium">
                    Total Amount
                  </th>
                  <th className="px-4 sm:px-6 py-4 font-medium">Status</th>
                  <th className="px-4 sm:px-6 py-4 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                ref={animationParent}
                className="divide-y divide-border/50"
              >
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <p>No orders found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        {order.id}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {order.supplier}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          🏭 {order.branch || "Delhi"}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        {(() => {
                          const totalUnits = order.items.reduce(
                            (acc, it) => acc + it.quantity,
                            0,
                          );
                          const receivedUnits = order.items.reduce(
                            (acc, it) => acc + (it.receivedQuantity || 0),
                            0,
                          );
                          const remainingUnits = Math.max(
                            0,
                            totalUnits - receivedUnits,
                          );

                          return (
                            <div className="space-y-1">
                              <span className="text-xs text-muted-foreground whitespace-nowrap block">
                                {order.items.length} product(s) · {totalUnits}{" "}
                                units total
                              </span>
                              {receivedUnits > 0 && (
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 block whitespace-nowrap">
                                  Fulfilled: {receivedUnits}/{totalUnits} (
                                  {remainingUnits} left)
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 sm:px-6 py-4 font-medium text-emerald-500 whitespace-nowrap">
                        ₹{order.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(order.status)}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/50 transition-colors outline-none text-muted-foreground hover:text-foreground cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {order.status !== "Completed" &&
                              order.status !== "Cancelled" && (
                                <DropdownMenuItem
                                  onClick={() => setOrderToComplete(order)}
                                  className="text-emerald-600 focus:text-emerald-600 cursor-pointer font-medium"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4 text-emerald-600" />
                                  <span>
                                    {completingOrderId === order.id
                                      ? "Completing..."
                                      : "Complete & Stock"}
                                  </span>
                                </DropdownMenuItem>
                              )}
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/invoice/new?po=${encodeURIComponent(order.id)}`,
                                )
                              }
                              className="text-primary font-semibold focus:text-primary cursor-pointer"
                            >
                              <FilePlus className="mr-2 h-4 w-4 text-primary" />
                              <span>Create Invoice</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/orders/${order.id}/edit`)
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit Order</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handlePreviewPDF(order)}
                            >
                              <Download className="mr-2 h-4 w-4 text-[#EA1B40]" />
                              <span className="font-medium text-[#EA1B40]">PDF / Preview</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setOrderToDelete(order)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete Order</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={orderToComplete !== null}
        onClose={() => setOrderToComplete(null)}
        onConfirm={async () => {
          if (orderToComplete) {
            await handleCompleteOrder(orderToComplete);
            setOrderToComplete(null);
          }
        }}
        title="Complete Order & Stock In"
        description="Are you sure you want to mark this purchase order as Completed? All remaining quantities will be stocked into active inventory."
        variant="success"
        confirmText="Complete & Stock In"
        confirmLoadingText="Completing Order..."
        icon={<CheckCircle className="h-5 w-5" />}
        itemName={
          orderToComplete ? (
            <div className="space-y-1">
              <div className="font-bold text-foreground">
                Order #{orderToComplete.id} ({orderToComplete.supplier})
              </div>
              <div className="text-[11px] text-muted-foreground">
                {orderToComplete.items?.length || 0} product(s) · Total: ₹
                {orderToComplete.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>
          ) : undefined
        }
      />

      <ConfirmDeleteModal
        isOpen={orderToDelete !== null}
        onClose={() => setOrderToDelete(null)}
        onConfirm={async () => {
          if (orderToDelete) {
            await deleteOrder(orderToDelete.id);
          }
        }}
        title="Delete Purchase Order"
        description="Are you sure you want to delete this purchase order? This record will be permanently removed."
        itemName={
          orderToDelete
            ? `Order #${orderToDelete.id} (${orderToDelete.supplier})`
            : ""
        }
      />

      {/* PDF Preview Modal */}
      {pdfPreviewOrder && pdfPreviewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-background border border-border/80 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#EA1B40]/10 text-[#EA1B40]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    Purchase Order Preview
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EA1B40]/10 text-[#EA1B40] font-bold border border-[#EA1B40]/20">
                      PO #{pdfPreviewOrder.id}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Supplier: <span className="font-semibold text-foreground">{pdfPreviewOrder.supplier}</span> · Branch: <span className="font-semibold text-foreground">{pdfPreviewOrder.branch || "Delhi"}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePreviewModal}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body - PDF Iframe Preview */}
            <div className="flex-1 bg-muted/40 p-2 sm:p-4 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full rounded-xl border border-border/60 shadow-inner bg-white"
                title={`Preview of PO ${pdfPreviewOrder.id}`}
              />
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-border bg-background">
              <div className="text-xs text-muted-foreground hidden sm:block">
                Preview mode — verify details before downloading.
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePreviewModal}
                  className="w-1/2 sm:w-auto gap-1.5 cursor-pointer font-medium hover:bg-muted"
                >
                  <X className="h-4 w-4" /> Exit / Close
                </Button>
                <Button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="w-1/2 sm:w-auto bg-[#EA1B40] hover:bg-[#d01536] text-white shadow-md shadow-[#EA1B40]/20 gap-1.5 cursor-pointer font-semibold"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
