"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInventory, Quotation } from "@/context/inventory-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  PlusCircle,
  FileText,
  Eye,
  Pencil,
  Trash2,
  GitCompare,
  Download,
  X,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { M5C_LOGO_BASE64 } from "@/lib/company-logo";
import { ConfirmDeleteModal } from "@/components/confirm-modal";

const M5C_BRANCH_DETAILS: Record<
  string,
  { name: string; address: string; contact: string; gstin: string }
> = {
  Delhi: {
    name: "M5 CONTINENT LOGISTICS SOLUTION PRIVATE LIMITED",
    address:
      "Ground Floor Khasa No 91 Plot No. NJF PC 40 Bamnoli Village New Delhi, Delhi- 110077",
    contact: "8448688766",
    gstin: "07AAQCM6359K1ZP",
  },
  Ahmedabad: {
    name: "M5 CONTINENT LOGISTICS SOLUTION PRIVATE LIMITED",
    address:
      "Ground Floor, Block F shop no 1, Sumel Business Park 6, Dudheshwar, Ahmedabad, Gujarat, 380004",
    contact: "8448688766",
    gstin: "24AAQCM6359K1ZT",
  },
  Ludhiana: {
    name: "M5 CONTINENT LOGISTICS SOLUTION PRIVATE LIMITED",
    address:
      "Plot no 354 Bhagwati Tower Road, Industrial Area A, Ludhiana, Punjab, 141003",
    contact: "8448688766",
    gstin: "03AAQCM6359K1ZX",
  },
};

export default function AllQuotationsPage() {
  const router = useRouter();
  const {
    quotations,
    deleteQuotation,
    activeBranch,
  } = useInventory();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null,
  );
  const [quotationToDelete, setQuotationToDelete] = useState<Quotation | null>(
    null,
  );

  // Filtering
  const filteredQuotations = quotations.filter((q) => {
    const matchesBranch =
      activeBranch === "All" ||
      !q.branch ||
      q.branch.toLowerCase() === activeBranch.toLowerCase();

    const matchesSearch =
      q.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.items.some((it) =>
        it.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );

    return matchesBranch && matchesSearch;
  });

  const handleDelete = async () => {
    if (!quotationToDelete) return;
    try {
      await deleteQuotation(quotationToDelete.id);
      setQuotationToDelete(null);
      if (selectedQuotation?.id === quotationToDelete.id) {
        setSelectedQuotation(null);
      }
    } catch (e) {
      toast.error("Failed to delete quotation");
    }
  };

  const generatePDF = (q: Quotation) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;

      doc.setFillColor(234, 27, 64);
      doc.rect(0, 0, pageWidth, 5, "F");

      try {
        doc.addImage(M5C_LOGO_BASE64, "PNG", margin, 10, 18, 20);
      } catch (e) {}

      const branchInfo =
        M5C_BRANCH_DETAILS[q.branch] || M5C_BRANCH_DETAILS["Delhi"];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);
      doc.text(branchInfo.name, margin + 22, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      const addrLines = doc.splitTextToSize(branchInfo.address, 100);
      doc.text(addrLines, margin + 22, 20);
      doc.text(
        `GSTIN: ${branchInfo.gstin} | Phone: ${branchInfo.contact}`,
        margin + 22,
        20 + addrLines.length * 3.5,
      );

      const rightX = pageWidth - margin - 60;
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(rightX, 10, 60, 26, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(234, 27, 64);
      doc.text("QUOTATION", rightX + 30, 16, { align: "center" });

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      doc.text(`Quote #: ${q.quotationNumber}`, rightX + 4, 22);
      doc.text(`Date: ${q.date}`, rightX + 4, 27);

      let currentY = 42;
      const cardWidth = (pageWidth - margin * 2 - 6) / 2;

      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margin, currentY, cardWidth, 24, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(234, 27, 64);
      doc.text("SUPPLIER / VENDOR", margin + 4, currentY + 6);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text(q.supplier, margin + 4, currentY + 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      doc.text(`Branch: ${q.branch || "Delhi"}`, margin + 4, currentY + 17);

      const rightCardX = margin + cardWidth + 6;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(rightCardX, currentY, cardWidth, 24, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(234, 27, 64);
      doc.text("SUMMARY", rightCardX + 4, currentY + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50);
      doc.text(
        `Total Items: ${q.items.length}`,
        rightCardX + 4,
        currentY + 12,
      );

      currentY += 28;

      const tableData = q.items.map((it, idx) => [
        idx + 1,
        it.name,
        it.quantity,
        `₹${it.unitPrice.toLocaleString("en-IN")}`,
        `${it.taxRate || 0}%`,
        `${it.discount || 0}%`,
        `₹${it.totalPrice.toLocaleString("en-IN")}`,
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [
          ["#", "Item Description", "Qty", "Unit Price", "Tax", "Disc", "Total"],
        ],
        body: tableData,
        theme: "grid",
        headStyles: { fillColor: [234, 27, 64], textColor: 255, fontSize: 8 },
        bodyStyles: { fontSize: 7.5, textColor: 50 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 70 },
          2: { cellWidth: 15, halign: "center" },
          3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 15, halign: "center" },
          5: { cellWidth: 15, halign: "center" },
          6: { cellWidth: 32, halign: "right" },
        },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Subtotal: ₹${q.subtotal.toLocaleString("en-IN")}`,
        pageWidth - margin - 60,
        finalY,
      );
      doc.text(
        `GST Tax: ₹${q.taxAmount.toLocaleString("en-IN")}`,
        pageWidth - margin - 60,
        finalY + 5,
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(234, 27, 64);
      doc.text(
        `Grand Total: ₹${q.totalAmount.toLocaleString("en-IN")}`,
        pageWidth - margin - 60,
        finalY + 12,
      );

      doc.save(`Quotation_${q.quotationNumber}.pdf`);
      toast.success(`Quotation ${q.quotationNumber} PDF downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Quotations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            View, edit, and manage vendor quotations.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link href="/quotations/compare" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <GitCompare className="h-4 w-4" />
              Compare Quotes
            </Button>
          </Link>
          <Link href="/quotations/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Quotation
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>All Quotations</CardTitle>
              <CardDescription>
                A list of all your supplier quotations for viewing and editing.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search quotations..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[720px]">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-4 sm:px-6 py-4 font-medium">Quotation Number</th>
                  <th className="px-4 sm:px-6 py-4 font-medium">Supplier</th>
                  <th className="px-4 sm:px-6 py-4 font-medium">Items</th>
                  <th className="px-4 sm:px-6 py-4 font-medium">Total Amount</th>
                  <th className="px-4 sm:px-6 py-4 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <p>No quotations found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q, idx) => (
                    <tr
                      key={`${q.id}-${idx}`}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 font-medium text-foreground whitespace-nowrap">
                        <div>{q.quotationNumber}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Date: {q.date}
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-foreground">
                          {q.supplier}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          🏭 {q.branch || "Delhi"}
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <div className="text-xs text-foreground max-w-xs truncate font-medium">
                          {q.items.map((i) => i.name).join(", ")}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {q.items.length} item(s)
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-foreground">
                        ₹{q.totalAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedQuotation(q)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/quotations/${q.id}/edit`)}
                            title="Edit Quotation"
                          >
                            <Pencil className="h-4 w-4 text-amber-500" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/50 transition-colors outline-none text-muted-foreground hover:text-foreground cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/quotations/${q.id}/edit`)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Quotation
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => generatePDF(q)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setQuotationToDelete(q)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* View Details Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border-border">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Quotation #{selectedQuotation.quotationNumber}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Supplier: {selectedQuotation.supplier} • Branch: {selectedQuotation.branch || "Delhi"}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setSelectedQuotation(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block">Quotation Date</span>
                  <span className="font-medium text-foreground">{selectedQuotation.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Branch</span>
                  <span className="font-medium text-foreground">{selectedQuotation.branch || "Delhi"}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                  Line Items ({selectedQuotation.items.length})
                </h4>
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b border-border/50 text-muted-foreground">
                      <tr>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-center">Tax</th>
                        <th className="p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selectedQuotation.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-3 font-medium text-foreground">{it.name}</td>
                          <td className="p-3 text-center">{it.quantity}</td>
                          <td className="p-3 text-right font-mono">₹{it.unitPrice.toLocaleString("en-IN")}</td>
                          <td className="p-3 text-center">{it.taxRate || 0}%</td>
                          <td className="p-3 text-right font-medium font-mono">₹{it.totalPrice.toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-end pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  {selectedQuotation.notes && (
                    <p><strong className="text-foreground">Notes:</strong> {selectedQuotation.notes}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Subtotal: ₹{selectedQuotation.subtotal.toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Tax: ₹{selectedQuotation.taxAmount.toLocaleString("en-IN")}
                  </div>
                  <div className="text-sm font-bold text-foreground pt-1">
                    Total: ₹{selectedQuotation.totalAmount.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                <Button variant="outline" size="sm" onClick={() => generatePDF(selectedQuotation)}>
                  <Download className="h-4 w-4 mr-2" /> PDF
                </Button>
                <Button size="sm" onClick={() => {
                  const qId = selectedQuotation.id;
                  setSelectedQuotation(null);
                  router.push(`/quotations/${qId}/edit`);
                }}>
                  <Pencil className="h-4 w-4 mr-2" /> Edit Quotation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!quotationToDelete}
        onClose={() => setQuotationToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Quotation"
        description={`Are you sure you want to delete quotation #${quotationToDelete?.quotationNumber}? This action cannot be undone.`}
      />
    </div>
  );
}
