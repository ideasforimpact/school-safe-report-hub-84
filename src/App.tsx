
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { IncidentProvider } from "./contexts/IncidentContext";
import RouteGuard from "./components/RouteGuard";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ReportIncident from "./pages/ReportIncident";
import IncidentsList from "./pages/IncidentsList";
import IncidentDetail from "./pages/IncidentDetail";
import Insights from "./pages/Insights";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/UserManagement";
import MyActionItems from "./pages/MyActionItems";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <IncidentProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <RouteGuard>
                    <Dashboard />
                  </RouteGuard>
                }
              />
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
                path="/insights"
                element={
                  <RouteGuard requireAdmin={true}>
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
