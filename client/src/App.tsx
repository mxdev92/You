import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import AdminPanel from "@/pages/admin-panel";
import AdminLogin from "@/pages/admin-login";
import WhatsAppAdmin from "@/pages/whatsapp-admin";
import BaileysWhatsAppAdmin from "@/pages/baileys-whatsapp-admin";
import { WasenderAdminPage } from "@/pages/wasender-admin";
import PrivacyPolicy from "@/pages/privacy-policy";
import WalletPage from "@/pages/wallet";
import WalletSuccess from "@/pages/wallet-success";
import WalletFailed from "@/pages/wallet-failed";
import DriverPage from "@/pages/driver";
import NotFound from "@/pages/not-found";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import React from "react";

// Global Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md mx-auto">
              <h2 className="font-bold text-lg mb-2">خطأ في التطبيق</h2>
              <p className="text-sm">حدث خطأ غير متوقع. يرجى تحديث الصفحة.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm"
              >
                تحديث الصفحة
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Ultra-Stable Protected Admin Route Component
function ProtectedAdminRoute() {
  // Multi-layer admin authentication check for maximum stability
  const adminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  const adminEmail = localStorage.getItem('adminEmail');
  const adminSessionRaw = localStorage.getItem('adminSession');
  
  let isValidSession = false;
  
  try {
    if (adminSessionRaw) {
      const adminSession = JSON.parse(adminSessionRaw);
      const isNotExpired = new Date().getTime() < new Date(adminSession.expiresAt).getTime();
      isValidSession = Boolean(adminAuthenticated) && Boolean(adminEmail) && isNotExpired;
    } else {
      // Fallback to basic check for backward compatibility
      isValidSession = Boolean(adminAuthenticated) && Boolean(adminEmail);
    }
  } catch (error) {
    console.warn('Admin session parsing error, using fallback check:', error);
    isValidSession = Boolean(adminAuthenticated) && Boolean(adminEmail);
  }
  
  console.log('Ultra-stable admin auth check:', { 
    adminAuthenticated, 
    adminEmail, 
    hasSession: !!adminSessionRaw,
    isValidSession 
  });
  
  if (!isValidSession) {
    return <AdminLogin />;
  }
  
  return <AdminPanel />;
}

// Protected Route Component for regular users
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = usePostgresAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600" style={{ fontFamily: 'Cairo, system-ui, sans-serif' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <AuthPage />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Admin routes - separate authentication */}
      <Route path="/admin" component={ProtectedAdminRoute} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/whatsapp-admin" component={BaileysWhatsAppAdmin} />
      <Route path="/whatsapp-admin-old" component={WhatsAppAdmin} />
      <Route path="/wasender-admin" component={WasenderAdminPage} />
      
      {/* Driver page - independent authentication */}
      <Route path="/driver" component={DriverPage} />
      
      {/* Home page - allows anonymous browsing */}
      <Route path="/" component={Home} />
      
      {/* Privacy Policy - public access */}
      <Route path="/privacy-policy" component={PrivacyPolicy} />
      
      {/* Wallet pages */}
      <Route path="/wallet" component={() => <ProtectedRoute component={WalletPage} />} />
      <Route path="/wallet/success" component={WalletSuccess} />
      <Route path="/wallet/failed" component={WalletFailed} />
      
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <PWAInstallPrompt />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
