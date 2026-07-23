'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useInventory, Order } from '@/context/inventory-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, Search, MoreHorizontal, ShoppingCart, Download, MoreVertical, Pencil, Trash, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'react-toastify';
import { useAutoAnimate } from '@formkit/auto-animate/react';

import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';

export default function OrdersPage() {
  const router = useRouter();
  const [animationParent] = useAutoAnimate();
  const { orders, updateOrderStatus, deleteOrder, recordTransaction } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'past'>('all');
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const handleCompleteOrder = async (order: Order) => {
    if (order.status === 'Completed' || order.status === 'Cancelled') return;
    try {
      for (const item of order.items) {
        if (item.productId) {
          await recordTransaction(item.productId, 'Stock In', item.quantity, 'Purchase Order Received', `Order ID: ${order.id}`);
        }
      }
      await updateOrderStatus(order.id, 'Completed');
      toast.success('Order completed and stock updated!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to complete order and update stock.');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesType = true;
    if (filterType === 'active') {
      matchesType = o.status === 'Pending' || o.status === 'Processing';
    } else if (filterType === 'past') {
      matchesType = o.status === 'Completed' || o.status === 'Cancelled';
    }
    
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Processing': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Cancelled': return 'text-destructive bg-destructive/10 border-destructive/20';
      default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20'; // Pending
    }
  };

  const generatePDF = (order: Order) => {
    const doc = new jsPDF();
    
    // Theme Colors
    const brandPrimary = [153, 0, 0]; // Darker red (#990000)
    const textDark = [30, 41, 59]; // Slate 800
    const textMuted = [100, 116, 139]; // Slate 500
    
    // Header banner
    doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.rect(0, 0, 210, 40, 'F'); // Top banner full width
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text('M5C Logistics', 14, 24);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 220, 220);
    doc.text('PURCHASE ORDER', 14, 32);
    
    // Order Info Rounded Box
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(14, 50, 182, 32, 3, 3, 'FD'); // Fill & Stroke
    
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('Order Details', 20, 60);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`Order ID: ${order.id}`, 20, 68);
    doc.text(`Supplier: ${order.supplier}`, 20, 75);
    
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`, 110, 68);
    doc.text(`Ordered By: Admin`, 110, 75);
    
    // Table
    const tableColumn = ["Product Name", "Qty", "Unit Price (Rs)", "Subtotal (Rs)"];
    const tableRows: any[] = [];
    
    order.items.forEach(item => {
      tableRows.push([
        item.name,
        item.quantity,
        item.price.toFixed(2),
        (item.quantity * item.price).toFixed(2)
      ]);
    });
    
    autoTable(doc, {
      startY: 90,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: brandPrimary as [number, number, number], textColor: 255, fontStyle: 'bold' },
      styles: { font: "helvetica", fontSize: 10, cellPadding: 6, textColor: textDark as [number, number, number], lineColor: [220, 220, 220], lineWidth: 0.1 },
      alternateRowStyles: { fillColor: [252, 252, 252] }
    });
    
    // Totals Rounded Box
    const finalY = (doc as any).lastAutoTable.finalY || 90;
    const subtotal = order.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const gst = subtotal * 0.18;
    const total = subtotal + gst;
    
    doc.setDrawColor(220, 220, 220);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(120, finalY + 10, 76, 35, 3, 3, 'FD');
    
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFontSize(10);
    doc.text(`Subtotal:`, 125, finalY + 20);
    doc.text(`Rs ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, finalY + 20, { align: 'right' });
    
    doc.text(`GST (18%):`, 125, finalY + 27);
    doc.text(`Rs ${gst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, finalY + 27, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
    doc.text(`Grand Total:`, 125, finalY + 37);
    doc.text(`Rs ${total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, finalY + 37, { align: 'right' });
    
    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business.', 105, 280, { align: 'center' });
    
    doc.save(`PO_${order.id}.pdf`);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track your supplier orders.</p>
        </div>
        <Link href="/orders/new">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Generate Order
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>A list of all your active and past orders.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="flex bg-muted/50 p-1 rounded-lg">
                <Button 
                  variant={filterType === 'all' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setFilterType('all')}
                  className="h-8 text-xs px-3"
                >All</Button>
                <Button 
                  variant={filterType === 'active' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setFilterType('active')}
                  className="h-8 text-xs px-3"
                >Active</Button>
                <Button 
                  variant={filterType === 'past' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setFilterType('past')}
                  className="h-8 text-xs px-3"
                >Past</Button>
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
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Supplier</th>
                  <th className="px-6 py-4 font-medium">Items</th>
                  <th className="px-6 py-4 font-medium">Total Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-center">Fulfillment</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody ref={animationParent} className="divide-y divide-border/50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <p>No orders found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{order.id}</td>
                      <td className="px-6 py-4">{order.supplier}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                          {order.items.length} product(s) - {order.items.reduce((acc, it) => acc + it.quantity, 0)} units total
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-emerald-500">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {order.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <CheckCircle className="h-3 w-3" />
                            Added to Stock
                          </span>
                        ) : order.status === 'Cancelled' ? (
                          <span className="text-xs text-muted-foreground">-</span>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCompleteOrder(order)} 
                            className="h-8 text-xs gap-2 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-700"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Complete & Stock
                          </Button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted/50 transition-colors outline-none text-muted-foreground hover:text-foreground cursor-pointer">
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/orders/${order.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Edit Order</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => generatePDF(order)}>
                              <Download className="mr-2 h-4 w-4" />
                              <span>PDF</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setOrderToDelete(order)}>
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
        itemName={orderToDelete ? `Order #${orderToDelete.id} (${orderToDelete.supplier})` : ''}
      />
    </div>
  );
}
