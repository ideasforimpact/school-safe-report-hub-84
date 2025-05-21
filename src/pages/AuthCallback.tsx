
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, authError } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // If there's an auth error, redirect to login with error
    if (authError) {
      navigate('/login', { replace: true });
      setIsProcessing(false);
      return;
    }

    // If user is authenticated, navigate to appropriate page
    if (user) {
      if (user.role === "saas_owner") {
        navigate("/backoffice/dashboard", { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
      setIsProcessing(false);
      return;
    }

    // Set a timeout to redirect to login if taking too long
    // This ensures users don't get stuck on this page
    const redirectTimeout = setTimeout(() => {
      if (isProcessing) {
        navigate('/login', { replace: true });
      }
    }, 5000);

    return () => {
      clearTimeout(redirectTimeout);
    };
  }, [user, authError, navigate, isProcessing]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <Card className="p-8 shadow-lg max-w-md w-full">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <h2 className="text-xl font-medium">Verifying your credentials...</h2>
          <p className="text-gray-500 text-center">
            Please wait while we verify your login information.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AuthCallback;
