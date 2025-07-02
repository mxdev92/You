import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Login from "@/pages/login";
import AdminPanel from "@/pages/admin-panel";
import AdminLogin from "@/pages/admin-login";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

// Protected Admin Route Component
function ProtectedAdminRoute() {
  const isAdminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
  
  console.log('Admin auth check:', { isAdminAuthenticated, localStorage: localStorage.getItem('adminAuthenticated') });
  
  if (!isAdminAuthenticated) {
    return <AdminLogin />;
  }
  
  return <AdminPanel />;
}

function Router() {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Switch>
      {/* Admin routes - separate authentication */}
      <Route path="/admin" component={ProtectedAdminRoute} />
      <Route path="/admin-login" component={AdminLogin} />
      
      {/* Regular user routes */}
      <Route path="/login" component={Login} />
      <Route path="/">
        {() => {
          if (loading) {
            return (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-fresh-green border-t-transparent rounded-full animate-spin" />
              </div>
            );
          }

          if (!isAuthenticated) {
            return <Login />;
          }

          return <Home />;
        }}
      </Route>
      
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
