import { motion, AnimatePresence } from "framer-motion";
import { X, User, MapPin, Wallet, Package, Settings, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useLocation } from "wouter";
import { useState } from "react";

interface ProfileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { user, signOut } = useFirebaseAuth();
  const [, setLocation] = useLocation();

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
          setLocation('/addresses');
        }
        onClose();
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
          setLocation('/orders');
        }
        onClose();
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col"
          >
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}