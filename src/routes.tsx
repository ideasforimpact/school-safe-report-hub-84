
import React from "react";
import { Routes, Route } from "react-router-dom";
import BackofficeLayout from "./components/layout/BackofficeLayout";
import PublicLayout from "./components/layout/PublicLayout";
import Layout from "./components/layout/Layout";
import RouteGuard from "./components/RouteGuard";
import ModuleGuard from "./components/ModuleGuard";

// Import pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import BackofficeLogin from "./pages/BackofficeLogin"; // Add import for BackofficeLogin
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

// Import feature-specific routes
import { assessmentRoutes } from "./routes/assessmentRoutes";
import { employeeRoutes } from "./routes/employeeRoutes";
import { clientRoutes } from "./routes/clientRoutes";
import { userRoutes } from "./routes/userRoutes";
import { incidentRoutes } from "./routes/incidentRoutes";
import { transportRoutes } from "./routes/transportRoutes";
import { resourceRoutes } from "./routes/resourceRoutes";
import { grievanceRoutes } from "./routes/grievanceRoutes";
import { backofficeRoutes } from "./routes/backofficeRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="backoffice/login" element={<BackofficeLogin />} /> {/* Add backoffice login route */}
        <Route path="auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Protected routes */}
      <Route element={<RouteGuard />}>
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />

          {/* Feature routes - Assessments */}
          {assessmentRoutes}

          {/* Feature routes - Employees */}
          {employeeRoutes}

          {/* Feature routes - Clients */}
          {clientRoutes}

          {/* Feature routes - Users */}
          {userRoutes}

          {/* Feature routes - Incidents */}
          {incidentRoutes}

          {/* Feature routes - Transport */}
          {transportRoutes}

          {/* Feature routes - Resources */}
          {resourceRoutes}

          {/* Feature routes - Grievances */}
          {grievanceRoutes}
        </Route>
      </Route>

      {/* Backoffice Routes */}
      <Route element={<RouteGuard roles={['saas_owner']} />}>
        <Route path="/backoffice" element={<BackofficeLayout />}>
          {backofficeRoutes}
        </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
