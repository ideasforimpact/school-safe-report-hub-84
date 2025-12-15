import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getConfiguredModules } from '@/store/employeeSelectors';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { state } = useEmployeeStore();
  const configured = getConfiguredModules(state);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  function redirectUser(configured: any[], navigate: any) {
    if (!configured || configured.length === 0) {
      navigate("/no-access", { replace: true });
      return;
    }

    const dashboardModule = configured.find((m) => m.name === "Dashboard");
    if (dashboardModule) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const firstModule = configured[0];
    
    const route = firstModule.url;

    if (route) {
      navigate(route, { replace: true });
    } else {
      console.warn("No route found in first module → fallback to no-access");
      navigate("/no-access", { replace: true });
    }
  }

  useEffect(() => {
    if (configured.length > 0) {
      redirectUser(configured, navigate);
    }
  }, [configured.length, navigate]);


  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="mb-4">Signing you in…</p>
        {errorMsg && <p className="text-red-500">{errorMsg}</p>}
      </div>
    </div>
  );
}
