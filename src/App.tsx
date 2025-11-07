import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import DashboardLayout from "./pages/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Comptabilite from "./pages/modules/Comptabilite";
import Logistique from "./pages/modules/Logistique";
import Clientele from "./pages/modules/Clientele";
import RH from "./pages/modules/RH";
import Commercial from "./pages/modules/Commercial";
import UsersManagement from "./pages/modules/Users";
import Session from "./pages/modules/Session";
import SupervisorSession from "./pages/modules/SupervisorSession";
import ClosureReports from "./pages/modules/ClosureReports";
import Logs from "./pages/modules/Logs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
          <Route path="comptabilite" element={<Comptabilite />} />
          <Route path="session" element={<Session />} />
          <Route path="supervisor-session" element={<SupervisorSession />} />
          <Route path="closure-reports" element={<ClosureReports />} />
            <Route path="logistique" element={<Logistique />} />
            <Route path="clientele" element={<Clientele />} />
            <Route path="rh" element={<RH />} />
            <Route path="commercial" element={<Commercial />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="logs" element={<Logs />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
