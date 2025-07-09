import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Wallet, Package, Settings, LogIn, LogOut, ArrowLeft, Plus, Trash2, Edit, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { getUserAddresses, deleteUserAddress, type UserAddress } from "@/lib/firebase-user-data";

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { user, signOut } = useFirebaseAuth();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<'menu' | 'addresses' | 'orders'>('menu');
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize with empty state immediately
  useEffect(() => {
    if (!user || !isOpen) {
      setAddresses([]);
      setOrders([]);
      setLoading(false);
    }
  }, [user, isOpen]);

  // Load data only when addresses section is actively viewed
  useEffect(() => {
    if (user && activeSection === 'addresses') {
      // Show empty state immediately, then try to load
      setAddresses([]);
      setLoading(false);
      
      // Load data in background
      setTimeout(() => {
        loadUserData();
      }, 100);
    }
  }, [activeSection, user]);

  const loadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('Loading addresses for user:', user.uid);
      const userAddresses = await getUserAddresses();
      console.log('Loaded addresses:', userAddresses);
      setAddresses(userAddresses);
      setOrders([]);
    } catch (error) {
      console.error('Error loading user data:', error);
      setAddresses([]);
      setOrders([]);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteUserAddress(addressId);
      await loadUserData();
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      icon: MapPin,
      title: "عناوين التوصيل",
      subtitle: "إدارة عناوين التوصيل",
      onClick: () => setActiveSection('addresses')
    },
    {
      icon: Package,
      title: "طلباتي",
      subtitle: "تتبع طلباتك السابقة",
      onClick: () => setActiveSection('orders')
    },
    {
      icon: Settings,
      title: "الإعدادات",
      subtitle: "إعدادات الحساب والتطبيق",
      onClick: () => {
        // TODO: Implement settings
        console.log('Settings clicked');
      }
    }
  ];

  const renderAddressesSection = () => (
    <div className="flex-1 overflow-y-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('Profile sidebar: Back button clicked from addresses, returning to menu');
            setActiveSection('menu');
          }}
          className="hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          عناوين التوصيل
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setLocation('/addresses');
            onClose();
          }}
          className="hover:bg-gray-100 rounded-full"
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Addresses List */}
      <div className="p-4 space-y-3">
        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              لا توجد عناوين محفوظة
            </p>
            <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              المستخدم: {user?.email}
            </p>
            <Button
              onClick={async () => {
                setLoading(true);
                try {
                  console.log('Adding test address...');
                  const { addUserAddress } = await import('@/lib/firebase-user-data');
                  await addUserAddress({
                    governorate: 'بغداد',
                    district: 'الكرادة', 
                    neighborhood: 'شارع المتنبي',
                    notes: 'قرب مقهى الشاهبندر',
                    isDefault: true
                  });
                  // Reload addresses immediately
                  setTimeout(async () => {
                    await loadUserData();
                  }, 500);
                  console.log('Test address added successfully');
                } catch (error) {
                  console.error('Error adding test address:', error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              className="mt-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white mr-2"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              {loading ? 'جاري الإضافة...' : 'إضافة عنوان تجريبي'}
            </Button>
            <Button
              onClick={() => {
                setLocation('/addresses');
                onClose();
              }}
              className="mt-3 bg-green-500 hover:bg-green-600 text-white"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              إضافة عنوان جديد
            </Button>
          </div>
        ) : (
          addresses.map((address, index) => (
            <div key={address.id} className="bg-gray-50 rounded-lg p-3 mb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {address.governorate} - {address.district}
                  </h4>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {address.neighborhood}
                  </p>
                  {address.notes && (
                    <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      {address.notes}
                    </p>
                  )}
                  {address.isDefault && (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-2">
                      العنوان الافتراضي
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteAddress(address.id!)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderOrdersSection = () => (
    <div className="flex-1 overflow-y-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            console.log('Profile sidebar: Back button clicked from orders, returning to menu');
            setActiveSection('menu');
          }}
          className="hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          طلباتي
        </h3>
        <div className="w-10"></div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
              لا توجد طلبات سابقة
            </p>
            <Button
              onClick={() => {
                setLocation('/');
                onClose();
              }}
              className="mt-3 bg-green-500 hover:bg-green-600 text-white"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              تصفح المنتجات
            </Button>
          </div>
        ) : (
          orders.map((order, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    طلب رقم #{index + 1}
                  </h4>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {/* Order details would go here */}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Background overlay */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-50 backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className={`absolute left-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out rounded-r-3xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {activeSection === 'menu' ? (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                {user ? 'الملف الشخصي' : 'القائمة'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  console.log('Profile sidebar: X button clicked, closing sidebar');
                  onClose();
                }}
                className="hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* User Info or Login Prompt */}
            {user ? (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      {user.email}
                    </h3>
                    <p className="text-sm text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      مرحباً بك
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 border-b border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-3" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    سجل دخولك للوصول إلى ملفك الشخصي وطلباتك
                  </p>
                  <Button
                    onClick={() => {
                      setLocation('/auth');
                      onClose();
                    }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    تسجيل الدخول
                  </Button>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {user ? (
                menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    className="w-full flex items-center space-x-3 space-x-reverse p-3 rounded-xl hover:bg-gray-50 transition-colors text-right"
                  >
                    <item.icon className="h-5 w-5 text-gray-600" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                        {item.subtitle}
                      </p>
                    </div>
                    <ChevronLeft className="h-5 w-5 text-gray-400" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    قم بتسجيل الدخول للوصول إلى عناوينك وطلباتك
                  </p>
                </div>
              )}
            </div>

            {/* Logout */}
            {user && (
              <div className="p-4 border-t border-gray-200">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full flex items-center justify-center space-x-2 space-x-reverse"
                  style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </Button>
              </div>
            )}
          </div>
        ) : activeSection === 'addresses' ? (
          renderAddressesSection()
        ) : activeSection === 'orders' ? (
          renderOrdersSection()
        ) : null}
      </div>
    </div>
  );
}