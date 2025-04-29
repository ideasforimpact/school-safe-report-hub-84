import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { IncidentProvider } from "./contexts/IncidentContext";
import { FacilityProvider } from "./contexts/FacilityContext";
import RouteGuard from "./components/RouteGuard";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ReportIncident from "./pages/ReportIncident";
import IncidentsList from "./pages/IncidentsList";
import IncidentDetail from "./pages/IncidentDetail";
import EditIncident from "./pages/EditIncident";
import Insights from "./pages/Insights";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import FacilityManagement from "./pages/FacilityManagement";
import MyActionItems from "./pages/MyActionItems";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import Pricing from "./pages/Pricing";
import Support from "./pages/Support";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <FacilityProvider>
          <IncidentProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Home />} />
                <Route path="/home" element={<Home />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/support" element={<Support />} />
                <Route
                  path="/dashboard"
                  element={
                    <RouteGuard>
                      <Dashboard />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/report"
                  element={
                    <RouteGuard>
                      <ReportIncident />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/incidents"
                  element={
                    <RouteGuard>
                      <IncidentsList />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/incidents/:id"
                  element={
                    <RouteGuard>
                      <IncidentDetail />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/incidents/edit/:id"
                  element={
                    <RouteGuard>
                      <EditIncident />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/insights"
                  element={
                    <RouteGuard>
                      <Insights />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <RouteGuard requireAdmin={true}>
                      <UserManagement />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/facilities"
                  element={
                    <RouteGuard requireAdmin={true}>
                      <FacilityManagement />
                    </RouteGuard>
                  }
                />
                <Route
                  path="/my-actions"
                  element={
                    <RouteGuard>
                      <MyActionItems />
                    </RouteGuard>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </IncidentProvider>
        </FacilityProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
