import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Wallet, Package, Settings, LogIn, LogOut, ArrowLeft, Plus, Trash2 } from "lucide-react";
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

  // Load addresses and orders when user changes
  useEffect(() => {
    if (user && isOpen) {
      loadUserData();
    }
  }, [user, isOpen]);

  const loadUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('Loading addresses for user:', user.uid);
      const userAddresses = await getUserAddresses();
      console.log('Loaded addresses:', userAddresses);
      setAddresses(userAddresses);
      // TODO: Load orders from API
      setOrders([]);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await deleteUserAddress(addressId);
      await loadUserData(); // Reload addresses
    } catch (error) {
      console.error('Error deleting address:', error);
    }
  };

  const handleLoginLogout = async () => {
    if (user) {
      // User is logged in, so logout
      try {
        await signOut();
        onClose();
      } catch (error) {
        console.error('Logout error:', error);
      }
    } else {
      // User is not logged in, redirect to auth
      setLocation('/auth');
      onClose();
    }
  };

  const menuItems = [
    {
      icon: User,
      title: "الملف الشخصي",
      subtitle: user ? user.email : "غير مسجل دخول",
      onClick: () => {
        if (!user) {
          setLocation('/auth');
        } else {
          setLocation('/profile');
        }
        onClose();
      },
      requireAuth: false
    },
    {
      icon: MapPin,
      title: "عنوان التوصيل",
      subtitle: "إدارة عناوين التوصيل",
      onClick: () => {
        if (!user) {
          setLocation('/auth');
        } else {
          setActiveSection('addresses');
        }
      },
      requireAuth: true
    },
    {
      icon: Wallet,
      title: "المحفظة",
      subtitle: "رصيد المحفظة والمدفوعات",
      onClick: () => {
        if (!user) {
          setLocation('/auth');
        } else {
          // TODO: Navigate to wallet page
          console.log('Navigate to wallet');
        }
        onClose();
      },
      requireAuth: true
    },
    {
      icon: Package,
      title: "طلباتي",
      subtitle: "تاريخ الطلبات والمتابعة",
      onClick: () => {
        if (!user) {
          setLocation('/auth');
        } else {
          setActiveSection('orders');
        }
      },
      requireAuth: true
    },
    {
      icon: Settings,
      title: "الاعدادات",
      subtitle: "إعدادات التطبيق والحساب",
      onClick: () => {
        if (!user) {
          setLocation('/auth');
        } else {
          // TODO: Navigate to settings page
          console.log('Navigate to settings');
        }
        onClose();
      },
      requireAuth: true
    }
  ];

  const renderAddressesSection = () => (
    <div className="flex-1 overflow-y-auto">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setActiveSection('menu')}
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
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : addresses.length === 0 ? (
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
                // Add a test address for this user
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
                  await loadUserData(); // Reload data
                  console.log('Test address added successfully');
                } catch (error) {
                  console.error('Error adding test address:', error);
                }
              }}
              className="mt-3 bg-blue-500 hover:bg-blue-600 text-white mr-2"
              style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
            >
              إضافة عنوان تجريبي
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
          addresses.map((address) => (
            <div key={address.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {address.governorate}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {address.district} - {address.neighborhood}
                  </p>
                  {address.isDefault && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                      العنوان الافتراضي
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAddress(address.id!)}
                  className="hover:bg-red-100 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
          onClick={() => setActiveSection('menu')}
          className="hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
          طلباتي
        </h3>
        <div className="w-10" />
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
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
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    طلب رقم #{order.id}
                  </h4>
                  <p className="text-sm text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    {order.status} - {order.total}
                  </p>
                </div>
                <span className="text-xs text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                  {order.date}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col rounded-r-3xl"
          >
            {activeSection === 'menu' && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                    القائمة الشخصية
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="hover:bg-gray-100 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {menuItems.map((item, index) => {
                  const Icon = item.icon;
                  const isDisabled = item.requireAuth && !user;
                  
                  return (
                    <motion.button
                      key={item.title}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={item.onClick}
                      disabled={isDisabled}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg text-right transition-all ${
                        isDisabled 
                          ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                          : 'hover:bg-green-50 hover:text-green-600 text-gray-700'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isDisabled ? 'text-gray-400' : 'text-green-600'}`} />
                      <div className="flex-1 text-right">
                        <div className="font-medium" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          {item.title}
                        </div>
                        <div className="text-sm text-gray-500" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>
                          {item.subtitle}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

                {/* Login/Logout Button */}
                <div className="p-4 border-t border-gray-200">
                  <Button
                    onClick={handleLoginLogout}
                    className={`w-full flex items-center justify-center gap-3 py-3 rounded-lg transition-all ${
                      user 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                    style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}
                  >
                    {user ? (
                      <>
                        <LogOut className="h-5 w-5" />
                        تسجيل الخروج
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5" />
                        تسجيل الدخول
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {activeSection === 'addresses' && renderAddressesSection()}
            {activeSection === 'orders' && renderOrdersSection()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}