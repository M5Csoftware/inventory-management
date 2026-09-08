'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  X,
  PackagePlus,
  FileCheck,
  Building2,
  Receipt,
  Calendar,
  IndianRupee,
  ShoppingCart,
  Plus,
  Trash2,
  Boxes,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { Order, useInventory, BRANCHES } from '@/context/inventory-context';

export interface StockInItemEntry {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  branch: string;
  poOrderedQty?: number;
  poReceivedQty?: number;
  poRemainingQty?: number;
}

interface InvoiceStockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceSummary: {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    totalAmount: number;
    poNumber: string;
    branch?: string;
    linkedOrder?: Order | null;
  };
  onSubmitInvoiceOnly: () => Promise<void>;
  onSubmitWithStockIn: (items: StockInItemEntry[]) => Promise<void>;
  isSubmitting: boolean;
}

export const InvoiceStockInModal: React.FC<InvoiceStockInModalProps> = ({
  isOpen,
  onClose,
  invoiceSummary,
  onSubmitInvoiceOnly,
  onSubmitWithStockIn,
  isSubmitting,
}) => {
  const [mounted, setMounted] = useState(false);
  const { products, activeBranch } = useInventory();
  const submittingRef = useRef(false);

  const defaultBranch =
    invoiceSummary.branch ||
    (invoiceSummary.linkedOrder?.branch && invoiceSummary.linkedOrder.branch !== 'All'
      ? invoiceSummary.linkedOrder.branch
      : activeBranch === 'All'
      ? 'Delhi'
      : activeBranch);
  const [stockItems, setStockItems] = useState<StockInItemEntry[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize stock items when modal opens or linked order changes
  useEffect(() => {
    if (!isOpen) return;

    if (invoiceSummary.linkedOrder && invoiceSummary.linkedOrder.items?.length > 0) {
      // Map PO items to Stock In items with PO metadata
      const initialItems: StockInItemEntry[] = invoiceSummary.linkedOrder.items.map((it) => {
        // Try to match productId with existing products
        const matchedProduct = products.find(
          (p) =>
            p.id === it.productId ||
            p.name.trim().toLowerCase() === it.name.trim().toLowerCase()
        );
        const poOrdered = it.quantity || 1;
        const poReceived = it.receivedQuantity || 0;
        const poRemaining = Math.max(0, poOrdered - poReceived);

        return {
          productId: matchedProduct ? matchedProduct.id : it.productId || it.name,
          productName: it.name,
          // Default Stock In quantity to the leftover/remaining quantity from PO
          quantity: poRemaining > 0 ? poRemaining : poOrdered,
          price: it.price || 0,
          branch: defaultBranch,
          poOrderedQty: poOrdered,
          poReceivedQty: poReceived,
          poRemainingQty: poRemaining,
        };
      });
      setStockItems(initialItems);
    } else if (products.length > 0) {
      // Default to 1 empty item if no PO
      setStockItems([
        {
          productId: products[0].id,
          productName: products[0].name,
          quantity: 1,
          price: products[0].price || 0,
          branch: defaultBranch,
        },
      ]);
    } else {
      setStockItems([]);
    }
  }, [isOpen, invoiceSummary.linkedOrder, products, defaultBranch]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, isSubmitting]);

  if (!isOpen || !mounted) return null;

  const handleAddItem = () => {
    if (products.length === 0) return;
    setStockItems((prev) => [
      ...prev,
      {
        productId: products[0].id,
        productName: products[0].name,
        quantity: 1,
        price: products[0].price || 0,
        branch: defaultBranch,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setStockItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const matched = products.find((p) => p.id === productId);
    if (!matched) return;
    setStockItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              productId: matched.id,
              productName: matched.name,
              price: matched.price || item.price,
            }
          : item
      )
    );
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const validQty = Math.max(1, qty || 1);
    setStockItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: validQty } : item))
    );
  };

  const handleBranchChange = (index: number, branch: string) => {
    setStockItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, branch } : item))
    );
  };

  const handleInvoiceOnlyClick = () => {
    if (isSubmitting || submittingRef.current) return;
    submittingRef.current = true;
    onSubmitInvoiceOnly().finally(() => {
      submittingRef.current = false;
    });
  };

  const handleStockInClick = () => {
    if (isSubmitting || submittingRef.current || stockItems.length === 0) return;
    submittingRef.current = true;
    onSubmitWithStockIn(stockItems).finally(() => {
      submittingRef.current = false;
    });
  };

  // Overall PO completion metrics
  let totalPoOrdered = 0;
  let totalPoReceivedBefore = 0;
  let totalStockingInNow = 0;

  if (invoiceSummary.linkedOrder && invoiceSummary.linkedOrder.items) {
    invoiceSummary.linkedOrder.items.forEach((it) => {
      totalPoOrdered += it.quantity || 0;
      totalPoReceivedBefore += it.receivedQuantity || 0;
    });
    totalStockingInNow = stockItems.reduce((acc, it) => acc + (it.quantity || 0), 0);
  }

  const totalFulfillAfter = totalPoReceivedBefore + totalStockingInNow;
  const isOverallCompleted =
    invoiceSummary.linkedOrder &&
    totalPoOrdered > 0 &&
    stockItems.every((it) => {
      if (it.poOrderedQty !== undefined) {
        return (it.poReceivedQty || 0) + it.quantity >= it.poOrderedQty;
      }
      return true;
    });

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                Submit Invoice &amp; Stock In Option
              </h3>
              <p className="text-xs text-muted-foreground">
                Review PO fulfillment status, specify received quantities, and stock in goods.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Invoice Summary Box */}
          <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="uppercase tracking-wider">Invoice Summary</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Ready for Inward Register
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-background border border-border/40">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 block">
                  <Building2 className="h-3 w-3 text-primary" /> Vendor
                </span>
                <span className="font-bold text-foreground truncate block mt-0.5" title={invoiceSummary.vendor}>
                  {invoiceSummary.vendor}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-background border border-border/40">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 block">
                  <Receipt className="h-3 w-3 text-primary" /> Invoice No.
                </span>
                <span className="font-mono font-bold text-foreground block mt-0.5">
                  {invoiceSummary.invoiceNumber}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-background border border-border/40">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 block">
                  <Calendar className="h-3 w-3 text-primary" /> Invoice Date
                </span>
                <span className="font-medium text-foreground block mt-0.5">
                  {invoiceSummary.invoiceDate}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-background border border-border/40">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 block">
                  <IndianRupee className="h-3 w-3 text-primary" /> Total Payable
                </span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  ₹{invoiceSummary.totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {invoiceSummary.poNumber && (
              <div className="flex items-center gap-2 text-xs text-primary font-medium bg-primary/5 p-2 rounded-lg border border-primary/15">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>Linked Purchase Order: <strong className="font-mono">{invoiceSummary.poNumber}</strong></span>
                {invoiceSummary.linkedOrder && (
                  <span className="text-[10px] text-muted-foreground ml-auto font-normal">
                    ({invoiceSummary.linkedOrder.items?.length || 0} line items · Status: {invoiceSummary.linkedOrder.status})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Linked PO Status / Fulfillment Impact Banner */}
          {invoiceSummary.linkedOrder && totalPoOrdered > 0 && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all ${
                isOverallCompleted
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isOverallCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div>
                  <p className="font-bold text-foreground">
                    PO {invoiceSummary.poNumber} Fulfillment Impact:
                  </p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {isOverallCompleted
                      ? `All ${totalPoOrdered} units will be fulfilled. Order status will be updated to "Completed".`
                      : `Partially fulfilling ${totalStockingInNow} units (${totalFulfillAfter}/${totalPoOrdered} total). PO will remain OPEN with status "Partial" (${Math.max(0, totalPoOrdered - totalFulfillAfter)} units remaining).`}
                  </p>
                </div>
              </div>
              <span
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto shrink-0 shadow-xs ${
                  isOverallCompleted
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                    : 'bg-amber-600 text-white dark:bg-amber-500'
                }`}
              >
                {isOverallCompleted ? '✓ Will Mark: Completed' : '⏳ Will Mark: Partial'}
              </span>
            </div>
          )}

          {/* Stock In Configuration List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Boxes className="h-4 w-4 text-primary" />
                Line Items to Stock In {stockItems.length > 0 && `(${stockItems.length})`}
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="h-7 text-xs px-2.5 gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 text-primary" /> Add Extra Item
              </Button>
            </div>

            {stockItems.length > 0 ? (
              <div className="space-y-3">
                {stockItems.map((item, idx) => {
                  const poOrdered = item.poOrderedQty;
                  const poReceived = item.poReceivedQty || 0;
                  const poRemaining = item.poRemainingQty !== undefined ? item.poRemainingQty : (poOrdered ? Math.max(0, poOrdered - poReceived) : undefined);
                  const totalFulfilledAfter = poReceived + item.quantity;
                  const isItemCompleted = poOrdered !== undefined && totalFulfilledAfter >= poOrdered;
                  const isExtra = poOrdered !== undefined && totalFulfilledAfter > poOrdered;

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-border/80 bg-background shadow-xs space-y-3 transition-all hover:border-primary/40"
                    >
                      {/* Product Header & Delete */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            Product #{idx + 1}
                          </label>
                          {products.length > 0 ? (
                            <select
                              value={item.productId}
                              onChange={(e) => handleProductChange(idx, e.target.value)}
                              className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.category})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={item.productName}
                              readOnly
                              className="h-9 w-full rounded-lg border border-border bg-muted/40 px-2.5 text-xs font-semibold"
                            />
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer shrink-0 mt-4"
                          title="Remove line item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Non-Editable PO Details Box (Shown when linked to PO) */}
                      {poOrdered !== undefined && (
                        <div className="p-2.5 rounded-lg bg-muted/40 border border-border/50 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground mb-1.5">
                            <span className="flex items-center gap-1 text-primary">
                              <ShoppingCart className="h-3 w-3" /> PO Reference Information (Non-Editable)
                            </span>
                            <span className="font-mono text-foreground font-bold">
                              PO: {invoiceSummary.poNumber}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center pt-1">
                            <div className="p-1.5 rounded bg-background border border-border/40">
                              <span className="text-[10px] text-muted-foreground block">PO Ordered Qty</span>
                              <span className="font-mono font-bold text-foreground text-xs">{poOrdered} units</span>
                            </div>
                            <div className="p-1.5 rounded bg-background border border-border/40">
                              <span className="text-[10px] text-muted-foreground block">Already Received</span>
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{poReceived} units</span>
                            </div>
                            <div className="p-1.5 rounded bg-background border border-border/40">
                              <span className="text-[10px] text-muted-foreground block">Leftover / Remaining</span>
                              <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">{poRemaining} units</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Editable Stock In Quantity & Target Branch */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">
                              Stock In Quantity (Received) <span className="text-destructive">*</span>
                            </label>
                            {poRemaining !== undefined && (
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(idx, poRemaining > 0 ? poRemaining : poOrdered || 1)}
                                className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                              >
                                Set to Remaining ({poRemaining})
                              </button>
                            )}
                          </div>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                            className="h-9 w-full rounded-lg border-2 border-gray-300 dark:border-gray-700 bg-background px-3 text-sm font-black font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                            placeholder="Enter received quantity"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-primary" /> Target Branch <span className="text-destructive">*</span>
                          </label>
                          <select
                            value={item.branch}
                            onChange={(e) => handleBranchChange(idx, e.target.value)}
                            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
                          >
                            {BRANCHES.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Live Dynamic Item Status Badge */}
                      {poOrdered !== undefined && (
                        <div className="pt-0.5">
                          {isItemCompleted ? (
                            <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                {isExtra
                                  ? `✓ Completes PO for this item with +${totalFulfilledAfter - poOrdered} extra unit(s) received (${totalFulfilledAfter}/${poOrdered} units).`
                                  : `✓ 100% Fully Completes PO for this item (${totalFulfilledAfter}/${poOrdered} units).`}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                ⏳ Partial Fulfillment: {item.quantity} units stocking in now ({totalFulfilledAfter}/{poOrdered} total). Leaves{' '}
                                <strong>{poOrdered - totalFulfilledAfter} units</strong> remaining in PO.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-xl border-2 border-dashed border-border text-center text-xs text-muted-foreground bg-muted/10">
                No items configured for Stock In. Click &quot;Add Item&quot; or proceed with Invoice Only.
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border/50 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleInvoiceOnlyClick}
            disabled={isSubmitting}
            className="w-full sm:w-auto text-xs font-semibold h-9 shadow-xs hover:bg-muted cursor-pointer"
          >
            <FileCheck className="h-4 w-4 mr-1.5 text-muted-foreground" />
            Submit Invoice Only (No Stock In)
          </Button>

          <Button
            type="button"
            onClick={handleStockInClick}
            disabled={isSubmitting || stockItems.length === 0}
            className="w-full sm:w-auto text-xs font-bold h-10 px-5 shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer bg-primary text-primary-foreground"
          >
            <PackagePlus className="h-4 w-4 mr-1.5" />
            {isSubmitting
              ? 'Processing...'
              : `Confirm & Stock In (${stockItems.reduce((a, b) => a + b.quantity, 0)} Units)`}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};

