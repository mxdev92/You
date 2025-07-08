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
import NotFound from "@/pages/not-found";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";

// Protected Admin Route Component
function ProtectedAdminRoute() {
  const isAdminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  
  console.log('Admin auth check:', { isAdminAuthenticated, localStorage: localStorage.getItem('adminAuthenticated') });
  
  if (!isAdminAuthenticated) {
    return <AdminLogin />;
  }
  
  return <AdminPanel />;
}

// Protected Route Component for regular users
function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useFirebaseAuth();
  
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
      
      {/* Home page - allows anonymous browsing */}
      <Route path="/" component={Home} />
      
      {/* Auth pages */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
