import { motion, AnimatePresence } from "framer-motion";
import { User, Wallet, ShoppingBag, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeftSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeftSidebar({ isOpen, onClose }: LeftSidebarProps) {
  const menuItems = [
    { icon: User, label: "Account", href: "#" },
    { icon: Wallet, label: "Wallet", href: "#" },
    { icon: ShoppingBag, label: "My Orders", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

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
            className="relative w-80 bg-white h-full shadow-2xl rounded-r-3xl flex flex-col"
          >
            {/* Top Section */}
            <div className="flex-1 pt-8 pb-4">
              <div className="px-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800">FreshCart</h2>
                <p className="text-gray-500 text-sm mt-1">Welcome back!</p>
              </div>

              <nav className="space-y-2 px-4">
                {menuItems.map((item, index) => (
                  <motion.a
                    key={item.label}
                    href={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                  >
                    <item.icon className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700">{item.label}</span>
                  </motion.a>
                ))}
              </nav>
            </div>

            {/* Bottom Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="px-6 pb-8"
            >
              <Button
                variant="destructive"
                className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-0"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
