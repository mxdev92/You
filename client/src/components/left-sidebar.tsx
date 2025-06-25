import { motion, AnimatePresence } from "framer-motion";
import { User, Wallet, ShoppingBag, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KiwiLogo } from "@/components/ui/kiwi-logo";
import { LanguageSelector } from "@/components/language-selector";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/hooks/use-translation";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  
  const menuItems = [
    { icon: User, label: t('profile'), href: "#" },
    { icon: Wallet, label: t('wallet'), href: "#" },
    { icon: ShoppingBag, label: t('orders'), href: "#" },
  ];

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm touch-action-manipulation"
            onClick={onClose}
          />
          
          {/* Sidebar Content */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3 
            }}
            className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl rounded-r-3xl flex flex-col safe-area-inset"
          >
            {/* Top Section */}
            <div className="flex-1 pt-8 pb-4">
              <div className="px-6 mb-8">
                <div className="flex items-center space-x-3 mb-3">
                  <KiwiLogo size={36} />
                  <h2 className="text-2xl font-bold text-gray-800">{t('appName')}</h2>
                </div>
                <p className="text-gray-500 text-sm mt-1">{t('welcomeBackSidebar')}</p>
                {user?.email && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>
                )}
              </div>

              <nav className="px-6 space-y-2">
                {menuItems.map((item, index) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  >
                    <item.icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
              </nav>
              
              {/* Settings Section */}
              <div className="px-6 py-4 border-t border-gray-100 mt-4">
                <div className="flex items-center space-x-2 mb-4 text-gray-700">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('settings')}</span>
                </div>
                <LanguageSelector />
              </div>
            </div>

            {/* Bottom Section */}
            <div className="px-6 pb-6">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="mr-3 h-4 w-4" />
                {t('logout')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
