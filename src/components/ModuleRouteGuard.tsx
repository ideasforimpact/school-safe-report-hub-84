import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useEmployeeStore } from "@/store/EmployeeContext";

const normalize = (p: string) =>
  p.toLowerCase().replace(/\/+$/, "");

  const GLOBAL_ALLOWED_ROUTES = [
    "/report-incident",
    "/new-insights",
    "/learning-points"
  ];
const ModuleRouteGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useEmployeeStore();
  const { configuredModules } = state;

  useEffect(() => {
    const currentPath = normalize(location.pathname);

    if (currentPath.startsWith("/backoffice")) return;

    if (GLOBAL_ALLOWED_ROUTES.some(route => currentPath.startsWith(route))) {
      return;
    }

    if (!configuredModules || configuredModules.length === 0) return;

    const enabledModuleUrls = configuredModules
      .filter(m => m.enabled && m.url)
      .map(m => normalize(m.url));

    if (enabledModuleUrls.length === 0) return;

    const isAllowed = enabledModuleUrls.some(url =>
      currentPath.startsWith(url)
    );

    if (!isAllowed) {
      const target = enabledModuleUrls[0];
      console.warn("Module disabled → redirecting client to:", target);
      navigate(target, { replace: true });
    }
  }, [configuredModules, location.pathname, navigate]);

  return null;
};

export default ModuleRouteGuard;
