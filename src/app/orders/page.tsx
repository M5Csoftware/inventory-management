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

  const generatePDF = (order: Order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Get supplier details dynamically
    const supplierDetails = suppliers.find(
      (s) => s.name.toLowerCase() === order.supplier.toLowerCase(),
    );

    // Supplier company details (Seller)
    const COMPANY_DETAILS = {
      name: supplierDetails?.name || order.supplier || "Supplier",
      address: supplierDetails?.location || "Address not available",
      phone: supplierDetails?.phone || "",
      email: supplierDetails?.email || "",
      gstin: supplierDetails?.taxId || "N/A",
      state: supplierDetails?.state || "07- Delhi",
    };

    // --- HEADER SECTION ---
    // Clean dark header
    doc.setFillColor(139, 0, 0);
    doc.rect(0, 0, pageWidth, 38, "F");

    // Company Name - White, bold
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY_DETAILS.name, 14, 18);

    // Company Address - Light gray
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(230, 230, 230);
    const addressLines = doc.splitTextToSize(
      COMPANY_DETAILS.address,
      pageWidth - 28,
    );
    doc.text(addressLines, 14, 26);

    // Contact & GST - Light gray
    let contactY = 26 + addressLines.length * 4;
    let contactLine = "";
    if (COMPANY_DETAILS.phone) contactLine += `Phone: ${COMPANY_DETAILS.phone}`;
    if (COMPANY_DETAILS.email) {
      if (contactLine) contactLine += ` | `;
      contactLine += `Email: ${COMPANY_DETAILS.email}`;
    }
    if (contactLine) {
      doc.text(contactLine, 14, contactY + 2);
      contactY += 5;
    }

    const gstLine = `GSTIN: ${COMPANY_DETAILS.gstin} | State: ${COMPANY_DETAILS.state}`;
    doc.text(gstLine, 14, contactY + 2);

    // --- PURCHASE ORDER TITLE ---
    let currentY = contactY + 12;

    // Decorative line above title
    doc.setDrawColor(139, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 6;

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 0, 0);
    doc.text("PURCHASE ORDER", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

    // Decorative line below title
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, currentY, pageWidth - 14, currentY);
    currentY += 10;

    // --- BILL TO SECTION (Left) ---
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Purchase Order For", 14, currentY);
    currentY += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    doc.text(M5C_DETAILS.name, 14, currentY);
    currentY += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    const m5cAddressLines = doc.splitTextToSize(
      M5C_DETAILS.address,
      pageWidth - 28,
    );
    doc.text(m5cAddressLines, 14, currentY);
    currentY += m5cAddressLines.length * 4.5;

    doc.text(`Contact No.: ${M5C_DETAILS.contact}`, 14, currentY);
    currentY += 4.5;
    doc.text(
      `GSTIN: ${M5C_DETAILS.gstin} | State: ${M5C_DETAILS.state}`,
      14,
      currentY,
    );
    currentY += 12;

    // --- ORDER INFO LINE (Supplier & Branch) ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Supplier: ${order.supplier}`, 14, currentY);
    doc.text(`Branch: ${order.branch || "Delhi"}`, pageWidth - 14, currentY, {
      align: "right",
    });
    currentY += 6;

    doc.text(`Order ID: ${order.id}`, 14, currentY);
    doc.text(
      `Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`,
      pageWidth - 14,
      currentY,
      { align: "right" },
    );
    currentY += 8;

    // --- ITEMS TABLE ---
    const tableColumn = [
      "#",
      "Item Name",
      "HSN/SAC",
      "Qty",
      "Unit Price",
      "Taxable Amount",
      "GST",
      "Amount",
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
        `₹${item.price.toFixed(2)}`,
        `₹${taxableAmount.toFixed(2)}`,
        `${gst.toFixed(2)} (18%)`,
        `₹${total.toFixed(2)}`,
      ]);
    });

    autoTable(doc, {
      startY: currentY,
      head: [tableColumn],
      body: tableRows,
      theme: "grid",
      headStyles: {
        fillColor: [139, 0, 0],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
        halign: "center",
      },
      styles: {
        font: "helvetica",
        fontSize: 7,
        cellPadding: 2.5,
        textColor: [50, 50, 50],
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { halign: "center", cellWidth: 10 },
        1: { halign: "left", cellWidth: 50 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "center", cellWidth: 12 },
        4: { halign: "right", cellWidth: 22 },
        5: { halign: "right", cellWidth: 28 },
        6: { halign: "center", cellWidth: 28 },
        7: { halign: "right", cellWidth: 28 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY || currentY + 20;

    // --- TOTALS SECTION ---
    const subtotal = order.items.reduce(
      (acc, item) => acc + item.quantity * item.price,
      0,
    );
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const total = subtotal + cgst + sgst;

    // Totals box on the right
    const totalsX = pageWidth - 95;
    const totalsWidth = 85;
    const totalsRightX = totalsX + totalsWidth - 5;
    const totalsY = finalY + 6;

    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(180, 180, 180);
    doc.roundedRect(totalsX, totalsY, totalsWidth, 42, 3, 3, "FD");

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const totalLines = [
      [`Sub Total`, `₹${subtotal.toFixed(2)}`],
      [`CGST @ 9%`, `₹${cgst.toFixed(2)}`],
      [`SGST @ 9%`, `₹${sgst.toFixed(2)}`],
    ];

    let totalY = totalsY + 7;
    totalLines.forEach(([label, value]) => {
      doc.text(label, totalsX + 5, totalY);
      doc.text(value, totalsRightX, totalY, { align: "right" });
      totalY += 7;
    });

    doc.setFont("helvetica", "bold");
    doc.setTextColor(139, 0, 0);
    doc.setFontSize(9);
    doc.text("Total", totalsX + 5, totalY + 2);
    doc.text(`₹${total.toFixed(2)}`, totalsRightX, totalY + 2, {
      align: "right",
    });

    // --- AMOUNT IN WORDS ---
    const amountInWords = `Amount In Words: ${numberToWords(total)} Rupees only`;
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text(amountInWords, 14, finalY + 45);

    // --- TERMS & CONDITIONS AND DESCRIPTION (Dynamic) ---
    const tAndCY = finalY + 55;
    const colWidth = (pageWidth - 28) / 2 - 5;

    // Divider line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, tAndCY - 4, pageWidth - 14, tAndCY - 4);

    // Left Column: Terms & Conditions (Dynamic from order)
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Terms and Conditions", 14, tAndCY);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    // Use dynamic terms from order or fallback to defaults
    let termsY = tAndCY + 6;
    if (order.termsAndConditions && order.termsAndConditions.trim()) {
      const terms = order.termsAndConditions
        .split("\n")
        .filter((t) => t.trim());
      if (terms.length > 0) {
        terms.forEach((term: string) => {
          const wrapped = doc.splitTextToSize(term.trim(), colWidth - 5);
          doc.text(wrapped, 14, termsY);
          termsY += wrapped.length * 4;
        });
      } else {
        doc.text("No terms and conditions specified.", 14, termsY);
        termsY += 4;
      }
    } else {
      // Default fallback terms
      const defaultTerms = [
        "1. Goods once sold will not be taken back.",
        "2. Payment terms: 15 days from invoice date.",
        "3. Delivery within 7 working days.",
        "4. All disputes subject to Delhi jurisdiction.",
      ];
      defaultTerms.forEach((term: string) => {
        const wrapped = doc.splitTextToSize(term, colWidth - 5);
        doc.text(wrapped, 14, termsY);
        termsY += wrapped.length * 4;
      });
    }

    // Right Column: Description (Dynamic from order)
    const descX = pageWidth - colWidth - 14;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 60, 60);
    doc.text("Description", descX, tAndCY);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    let descY = tAndCY + 6;
    if (order.description && order.description.trim()) {
      const descLines = doc.splitTextToSize(order.description, colWidth - 5);
      descLines.forEach((line: string) => {
        doc.text(line, descX, descY);
        descY += 4;
      });
    } else {
      doc.text("No additional description provided.", descX, descY);
      descY += 4;
    }

    // --- FOOTER ---
    const footerY = Math.max(termsY, descY) + 15;

    // Signatory section with box
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(14, footerY, 80, 20, "S");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50, 50, 50);
    doc.text(`For : ${COMPANY_DETAILS.name}`, 20, footerY + 7);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Authorized Signatory", 20, footerY + 15);

    // Footer text - System Generated
    doc.setFontSize(6);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(180, 180, 180);
    doc.text(
      "This is a system generated purchase order.",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    );

    // Save PDF
    doc.save(`PO_${order.id}.pdf`);
    toast.success(
      `Purchase order PDF for ${order.id} downloaded successfully!`,
    );
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
                              onClick={() => generatePDF(order)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              <span>PDF</span>
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
    </div>
  );
}
