import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useScheduledDispatcher } from "@/hooks/use-app-data";
import { useToast } from "@/hooks/use-toast";
import { ReactNode, useCallback } from "react";

// Pages
import InboxPage from "@/pages/inbox";
import SentPage from "@/pages/sent";
import ScheduledPage from "@/pages/scheduled";
import OutboxPage from "@/pages/outbox";
import DraftsPage from "@/pages/drafts";
import PendingPage from "@/pages/pending";
import SettingsPage from "@/pages/settings";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import NotFound from "@/pages/not-found";
import ClaimsPage from "@/pages/claims";
import MarketPage from "@/pages/market";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false }
  }
});

/** Watches for scheduled documents and auto-sends them when the time arrives */
function ScheduledDispatcher() {
  const { toast } = useToast();
  const handleDispatched = useCallback((title: string) => {
    toast({
      title: "Envoi automatique effectué",
      description: `"${title}" vient d'être envoyé automatiquement.`,
    });
  }, [toast]);
  useScheduledDispatcher(handleDispatched);
  return null;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Redirect to="/login" />;
  return <>{children}</>;
}

function Router() {
  return (
    <>
      <ScheduledDispatcher />
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/">
          <ProtectedRoute><Redirect to="/inbox" /></ProtectedRoute>
        </Route>
        <Route path="/inbox">
          <ProtectedRoute><InboxPage /></ProtectedRoute>
        </Route>
        <Route path="/sent">
          <ProtectedRoute><SentPage /></ProtectedRoute>
        </Route>
        <Route path="/scheduled">
          <ProtectedRoute><ScheduledPage /></ProtectedRoute>
        </Route>
        <Route path="/outbox">
          <ProtectedRoute><OutboxPage /></ProtectedRoute>
        </Route>
        <Route path="/drafts">
          <ProtectedRoute><DraftsPage /></ProtectedRoute>
        </Route>
        <Route path="/pending">
          <ProtectedRoute><PendingPage /></ProtectedRoute>
        </Route>
        <Route path="/settings">
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        </Route>
        <Route path="/claims">
          <ProtectedRoute><ClaimsPage /></ProtectedRoute>
        </Route>
        <Route path="/market">
          <ProtectedRoute><MarketPage /></ProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
