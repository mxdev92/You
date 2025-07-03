import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, List, Download, Printer, Settings, LogOut, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getOrders, updateOrderStatus, deleteOrder, Order } from '@/lib/api-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Order Card Component
function OrderCard({ order, onStatusChange, onPrintOrder, onViewInvoice }: any) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await onPrintOrder(order);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Card className="mb-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => onViewInvoice(order)}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
            <p className="text-sm text-gray-600">{order.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePrint();
              }}
              disabled={isPrinting}
              className="flex items-center gap-1"
            >
              <Printer className="h-4 w-4" />
              {isPrinting ? 'طباعة...' : 'طباعة'}
            </Button>
            <Badge variant={order.status === 'pending' ? 'destructive' : 'default'}>
              {order.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p><strong>Phone:</strong> {order.customerPhone}</p>
          <p><strong>Address:</strong> {order.address?.street}, {order.address?.neighborhood}</p>
          <p><strong>Total:</strong> IQD {order.totalAmount.toLocaleString()}</p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Select value={order.status} onValueChange={(newStatus) => onStatusChange(order.id, newStatus)}>
            <SelectTrigger className="w-40" onClick={(e) => e.stopPropagation()}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Admin Panel Component
export default function AdminPanel() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [autoPrintEnabled, setAutoPrintEnabled] = useState(
    localStorage.getItem('autoPrintEnabled') === 'true'
  );
  const [showPrintSettings, setShowPrintSettings] = useState(false);
  const [printedOrders, setPrintedOrders] = useState<Set<number>>(new Set());
  const [wsConnected, setWsConnected] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: getOrders,
    refetchInterval: 5000
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: number; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    window.location.reload();
  };

  const closeInvoice = () => {
    setShowInvoice(false);
    setSelectedOrder(null);
  };

  const printOrderInvoice = async (order: Order, isManual = false) => {
    try {
      console.log(isManual ? '📄 Manual printing invoice' : '🖨️ Auto-printing invoice', 'for order:', order.id);
      
      const response = await fetch('/api/generate-invoice-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData: order }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printFrame = document.createElement('iframe');
      printFrame.style.display = 'none';
      printFrame.src = pdfUrl;
      document.body.appendChild(printFrame);
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.error('❌ Print timeout');
          document.body.removeChild(printFrame);
          URL.revokeObjectURL(pdfUrl);
          reject(new Error('Print timeout'));
        }, 10000);
        
        printFrame.onload = () => {
          setTimeout(() => {
            try {
              printFrame.contentWindow?.print();
              console.log('✅ Invoice printed successfully');
              
              if (!isManual) {
                setPrintedOrders(prev => new Set(Array.from(prev).concat([order.id])));
              }
              
              clearTimeout(timeout);
              setTimeout(() => {
                if (document.body.contains(printFrame)) {
                  document.body.removeChild(printFrame);
                }
                URL.revokeObjectURL(pdfUrl);
                resolve();
              }, 1000);
            } catch (error) {
              console.error('❌ Print failed:', error);
              clearTimeout(timeout);
              if (document.body.contains(printFrame)) {
                document.body.removeChild(printFrame);
              }
              URL.revokeObjectURL(pdfUrl);
              reject(error);
            }
          }, 500);
        };
        
        printFrame.onerror = () => {
          console.error('❌ PDF load failed');
          clearTimeout(timeout);
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
          URL.revokeObjectURL(pdfUrl);
          reject(new Error('PDF load failed'));
        };
      });
    } catch (error) {
      console.error('❌ Print error:', error);
      throw error;
    }
  };

  const downloadInvoicePDF = async () => {
    if (!selectedOrder) return;
    
    try {
      console.log('Generating PDF for download...');
      
      const response = await fetch('/api/generate-invoice-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderData: selectedOrder })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoice-${selectedOrder.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter((order: Order) => order.status === statusFilter);

  // Auto-print WebSocket connection
  useEffect(() => {
    if (!autoPrintEnabled) return;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connectWebSocket = () => {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('🔄 WebSocket connected for auto-print');
        setWsConnected(true);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'new_order') {
            console.log('📨 New order received:', data.order);
            
            setNewOrderAlert(`طلبية جديدة من ${data.order.customerName}`);
            setTimeout(() => setNewOrderAlert(null), 3000);
            
            if (autoPrintEnabled) {
              printOrderInvoice(data.order, false).catch(console.error);
            }
            
            queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          }
        } catch (error) {
          console.error('❌ WebSocket message error:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setWsConnected(false);
        setTimeout(connectWebSocket, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };
    };
    
    connectWebSocket();
    
    return () => {
      wsRef.current?.close();
    };
  }, [autoPrintEnabled, queryClient]);

  // Save auto-print setting
  useEffect(() => {
    localStorage.setItem('autoPrintEnabled', autoPrintEnabled.toString());
  }, [autoPrintEnabled]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* New Order Alert */}
      {newOrderAlert && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="text-sm font-medium">{newOrderAlert}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <List className="h-5 w-5 text-gray-700" />
              <Badge variant="default" className="text-xs">Orders Dashboard</Badge>
            </div>
            
            {/* Auto-Print Status and Settings */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-xs text-gray-600">
                    {wsConnected ? 'متصل' : 'غير متصل'}
                  </span>
                </div>
                <Dialog open={showPrintSettings} onOpenChange={setShowPrintSettings}>
                  <DialogTrigger asChild>
                    <button
                      className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Print Settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>إعدادات الطباعة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-print">طباعة تلقائية للطلبيات الجديدة</Label>
                          <p className="text-sm text-gray-600">
                            طباعة الفاتورة تلقائياً عند وصول طلبية جديدة
                          </p>
                        </div>
                        <Switch
                          id="auto-print"
                          checked={autoPrintEnabled}
                          onCheckedChange={setAutoPrintEnabled}
                        />
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>حالة الاتصال:</span>
                          <Badge variant={wsConnected ? "default" : "destructive"}>
                            {wsConnected ? 'متصل' : 'غير متصل'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span>طلبيات مطبوعة:</span>
                          <span className="text-gray-600">{printedOrders.size}</span>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <p className="text-xs text-gray-500">
                          للحصول على أفضل النتائج، استخدم Chrome في وضع الكشك:
                          <br />
                          <code className="bg-gray-100 px-1 rounded text-xs">
                            chrome.exe --kiosk-printing --app=url
                          </code>
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600">Manage customer orders and deliveries</p>
        </div>
        
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">No orders available at the moment.</p>
            </div>
          ) : (
            filteredOrders.map((order: Order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onStatusChange={(orderId: number, status: string) => 
                  updateOrderMutation.mutate({ orderId, status })
                }
                onPrintOrder={(order: Order) => printOrderInvoice(order, true)}
                onViewInvoice={(order: Order) => {
                  setSelectedOrder(order);
                  setShowInvoice(true);
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Invoice Popup */}
      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" dir="rtl">
            <div className="p-6" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">فاتورة الطلب</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadInvoicePDF}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="حفظ الفاتورة"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={closeInvoice}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">معلومات العميل</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">الاسم:</span> {selectedOrder.customerName}</div>
                  <div><span className="font-medium">الهاتف:</span> {selectedOrder.customerPhone}</div>
                  <div className="text-xs">
                    <span className="font-medium">العنوان:</span><br />
                    {selectedOrder.address?.governorate} - {selectedOrder.address?.district}<br />
                    {selectedOrder.address?.neighborhood} - {selectedOrder.address?.street}<br />
                    منزل رقم {selectedOrder.address?.houseNumber}
                    {selectedOrder.address?.floorNumber && ` - الطابق ${selectedOrder.address.floorNumber}`}
                    {selectedOrder.address?.notes && <><br /><span className="text-gray-600">{selectedOrder.address.notes}</span></>}
                  </div>
                  <div><span className="font-medium">تاريخ الطلب:</span> {new Date(selectedOrder.orderDate).toLocaleDateString('en-US')}</div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">قائمة الطلبات</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-2 py-1 text-right font-semibold">الاسم</th>
                        <th className="border border-gray-300 px-2 py-1 text-right font-semibold">السعر</th>
                        <th className="border border-gray-300 px-2 py-1 text-right font-semibold">الكمية</th>
                        <th className="border border-gray-300 px-2 py-1 text-right font-semibold">المجموع</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, index: number) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-2 py-1">{item.productName || item.name}</td>
                          <td className="border border-gray-300 px-2 py-1">{item.price}</td>
                          <td className="border border-gray-300 px-2 py-1">
                            {item.quantity} {item.unit === 'kg' ? 'كيلو' : item.unit === 'bunch' ? 'حزمة' : item.unit}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 font-medium">
                            {(parseFloat(item.price) * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      )) : <tr><td colSpan={4} className="text-center">No items found</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي:</span>
                  <span>{selectedOrder.totalAmount.toFixed(2)} د.ع</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>رسوم التوصيل:</span>
                  <span>5.00 د.ع</span>
                </div>
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between font-bold text-lg">
                    <span>المجموع الكلي:</span>
                    <span className="text-green-600">{(selectedOrder.totalAmount + 5).toFixed(2)} د.ع</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}