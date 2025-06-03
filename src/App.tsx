import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from '@/contexts/AuthContext';
import { EmployeeProvider } from '@/store/EmployeeContext';
import { EmployeeVerificationProvider } from '@/contexts/employee-verification/EmployeeVerificationContext';
import { EmployeeProvider as LegacyEmployeeProvider } from '@/contexts/employee/EmployeeContext';
import RouteGuard from '@/components/RouteGuard';
import ModuleGuard from '@/components/ModuleGuard';

// Import pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import IncidentReporting from "./pages/IncidentReporting";
import IncidentDetail from "./pages/IncidentDetail";
import IncidentsList from "./pages/IncidentsList";
import EditIncident from "./pages/EditIncident";
import UserManagement from "./pages/UserManagement";
import AssessmentsPage from "./pages/AssessmentsPage";
import AssessmentTemplatesPage from "./pages/AssessmentTemplatesPage";
import AssessmentResponsePage from "./pages/AssessmentResponsePage";
import AssessmentAnswerPage from "./pages/AssessmentAnswerPage";
import Configuration from "./pages/Configuration";
import TransportSafety from "./pages/TransportSafety";
import EmployeeVerificationPage from "./pages/employee-verification/EmployeeVerificationPage";
import EmployeeVerificationDetailPage from "./pages/employee-verification/EmployeeVerificationDetailPage";
import EmployeeVerificationDashboard from "./pages/employee-verification/EmployeeVerificationDashboard";
import EduSafePage from "./pages/EduSafePage";
import GrievancesPage from "./pages/GrievancesPage";
import InsightsPage from "./pages/InsightsPage";
import BenchmarkingPage from "./pages/BenchmarkingPage";
import BackofficePage from "./pages/BackofficePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <EmployeeProvider>
              <LegacyEmployeeProvider>
                <EmployeeVerificationProvider>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    
                    {/* Protected routes */}
                    <Route element={<RouteGuard />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                      
                      {/* Incident Management Routes */}
                      <Route element={<ModuleGuard requiredModule="incident" />}>
                        <Route path="/incident-reporting" element={<IncidentReporting />} />
                        <Route path="/incidents" element={<IncidentsList />} />
                        <Route path="/incidents/:id" element={<IncidentDetail />} />
                        <Route path="/incidents/:id/edit" element={<EditIncident />} />
                      </Route>

                      {/* Assessment Routes */}
                      <Route element={<ModuleGuard requiredModule="assessment" />}>
                        <Route path="/assessments" element={<AssessmentsPage />} />
                        <Route path="/assessment-templates" element={<AssessmentTemplatesPage />} />
                        <Route path="/assessments/:id/respond" element={<AssessmentResponsePage />} />
                        <Route path="/assessments/:id/answer" element={<AssessmentAnswerPage />} />
                      </Route>

                      {/* Employee Verification Routes */}
                      <Route element={<ModuleGuard requiredModule="employee-verification" />}>
                        <Route path="/employee-verification" element={<EmployeeVerificationPage />} />
                        <Route path="/employee-verification/dashboard" element={<EmployeeVerificationDashboard />} />
                        <Route path="/employee-verification/:employeeId" element={<EmployeeVerificationDetailPage />} />
                      </Route>

                      {/* Other module routes */}
                      <Route element={<ModuleGuard requiredModule="transport-safety" />}>
                        <Route path="/transport-safety" element={<TransportSafety />} />
                      </Route>

                      <Route element={<ModuleGuard requiredModule="edusafe" />}>
                        <Route path="/edusafe" element={<EduSafePage />} />
                      </Route>

                      <Route element={<ModuleGuard requiredModule="grievances" />}>
                        <Route path="/grievances" element={<GrievancesPage />} />
                      </Route>

                      <Route path="/insights" element={<InsightsPage />} />
                      <Route path="/benchmarking" element={<BenchmarkingPage />} />
                      <Route path="/settings" element={<UserManagement />} />
                      <Route path="/configuration" element={<Configuration />} />
                      <Route path="/backoffice" element={<BackofficePage />} />
                    </Route>
                  </Routes>
                </EmployeeVerificationProvider>
              </LegacyEmployeeProvider>
            </EmployeeProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
