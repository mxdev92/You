import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { usePostgresAuth } from "@/hooks/use-postgres-auth";
import { FastLoadingSpinner } from "@/components/loading-fallback";
import React, { Suspense, lazy } from "react";

// Code splitting - lazy load heavy components for instant initial loading
const Home = lazy(() => import("@/pages/home"));
const AuthPage = lazy(() => import("@/pages/auth"));
const AdminPanel = lazy(() => import("@/pages/admin-panel"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const WhatsAppAdmin = lazy(() => import("@/pages/whatsapp-admin"));
const BaileysWhatsAppAdmin = lazy(() => import("@/pages/baileys-whatsapp-admin"));
const WasenderAdminPage = lazy(() => import("@/pages/wasender-admin").then(m => ({ default: m.WasenderAdminPage })));
const PrivacyPolicy = lazy(() => import("@/pages/privacy-policy"));
const WalletPage = lazy(() => import("@/pages/wallet"));
const WalletSuccess = lazy(() => import("@/pages/wallet-success"));
const WalletFailed = lazy(() => import("@/pages/wallet-failed"));
const DriverPage = lazy(() => import("@/pages/driver"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
    <Suspense fallback={<FastLoadingSpinner />}>
      <Switch>
        {/* Admin routes - separate authentication */}
        <Route path="/admin" component={ProtectedAdminRoute} />
        <Route path="/admin-login" component={() => <Suspense fallback={<FastLoadingSpinner />}><AdminLogin /></Suspense>} />
        <Route path="/whatsapp-admin" component={() => <Suspense fallback={<FastLoadingSpinner />}><BaileysWhatsAppAdmin /></Suspense>} />
        <Route path="/whatsapp-admin-old" component={() => <Suspense fallback={<FastLoadingSpinner />}><WhatsAppAdmin /></Suspense>} />
        <Route path="/wasender-admin" component={() => <Suspense fallback={<FastLoadingSpinner />}><WasenderAdminPage /></Suspense>} />
        
        {/* Driver page - independent authentication */}
        <Route path="/driver" component={() => <Suspense fallback={<FastLoadingSpinner />}><DriverPage /></Suspense>} />
        
        {/* Home page - allows anonymous browsing */}
        <Route path="/" component={() => <Suspense fallback={<FastLoadingSpinner />}><Home /></Suspense>} />
        
        {/* Privacy Policy - public access */}
        <Route path="/privacy-policy" component={() => <Suspense fallback={<FastLoadingSpinner />}><PrivacyPolicy /></Suspense>} />
        
        {/* Wallet pages */}
        <Route path="/wallet" component={() => <ProtectedRoute component={WalletPage} />} />
        <Route path="/wallet/success" component={() => <Suspense fallback={<FastLoadingSpinner />}><WalletSuccess /></Suspense>} />
        <Route path="/wallet/failed" component={() => <Suspense fallback={<FastLoadingSpinner />}><WalletFailed /></Suspense>} />
        
        {/* Auth page */}
        <Route path="/auth" component={() => <Suspense fallback={<FastLoadingSpinner />}><AuthPage /></Suspense>} />
        <Route component={() => <Suspense fallback={<FastLoadingSpinner />}><NotFound /></Suspense>} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
