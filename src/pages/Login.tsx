
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, LogIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { providerConfigs } from "@/utils/authProviders";
import { useEmployeeStore } from "@/store/EmployeeContext";
import { authCoordinator } from "@/utils/authCoordinator";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [zohoLoading, setZohoLoading] = useState(false);
  const [error, setError] = useState("");
  const { authError, user, handleUserAuthentication } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useEmployeeStore();
  
  // Use refs to prevent multiple operations and store redirect path
  const hasRedirectedRef = useRef(false);
  const hasCheckedErrorRef = useRef(false);
  const isInitializedRef = useRef(false);
  const redirectPathRef = useRef(location.state?.from?.pathname || "/dashboard");

  // Single initialization effect - runs only once on mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    const timestamp = new Date().toISOString();
    console.log('🔍 Login: Component initialized at:', timestamp);
    
    // Clear any existing logout flags on mount
    const logoutFlag = sessionStorage.getItem('is_logout_initiated');
    if (logoutFlag === 'true') {
      console.log('🧹 Login: Clearing logout flag from sessionStorage at:', timestamp);
      sessionStorage.removeItem('is_logout_initiated');
      console.log('✅ Login: Logout flag cleared');
    }
    
    isInitializedRef.current = true;
  }, []); // Empty dependency array - runs only once

  // Separate effect for user redirect - uses refs to prevent continuous execution
  useEffect(() => {
    // Skip if we're logging out or already redirected
    if (state.isLoggingOut || hasRedirectedRef.current || authCoordinator.shouldBlockOperation('login redirect')) {
      console.log('⏸️ Login: Skipping redirect', { 
        loggingOut: state.isLoggingOut, 
        redirected: hasRedirectedRef.current,
        blocked: authCoordinator.shouldBlockOperation('login redirect')
      });
      return;
    }

    // Skip if logout is in progress via coordinator
    if (authCoordinator.isLogoutInProgress()) {
      console.log('⏸️ Login: Blocking redirect - logout in progress via coordinator');
      return;
    }

    // Only redirect if we have a user and haven't redirected yet
    if (user && !hasRedirectedRef.current) {
      // Add a small delay to ensure logout state is properly cleared
      setTimeout(() => {
        // Double-check logout status after delay
        if (state.isLoggingOut || authCoordinator.isLogoutInProgress()) {
          console.log('⏸️ Login: Logout detected after delay, blocking redirect');
          return;
        }

        hasRedirectedRef.current = true;
        const timestamp = new Date().toISOString();
        console.log('✅ Login: User exists, redirecting at:', timestamp);
        
        const redirectTo = redirectPathRef.current;
        
        if (user?.role === "saas_owner") {
          console.log('🏢 Login: Redirecting to backoffice dashboard');
          navigate("/backoffice/dashboard", { replace: true });
        } else {
          console.log('🏠 Login: Redirecting to:', redirectTo);
          navigate(redirectTo, { replace: true });
        }
      }, 100);
    }
  }, [user, state.isLoggingOut, navigate]); // Minimal dependencies

  // Listen for auth errors from context
  useEffect(() => {
    if (authError && !hasCheckedErrorRef.current) {
      hasCheckedErrorRef.current = true;
      setError(authError);
      setIsLoading(false);
      setGoogleLoading(false);
      setMicrosoftLoading(false);
      setZohoLoading(false);
      toast.error(authError);
    }
  }, [authError]);

  // Check for authentication errors in URL parameters (for SSO redirects)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const errorCode = queryParams.get('error');
    const errorDescription = queryParams.get('error_description');
    
    if (errorCode || errorDescription) {
      const errorMessage = errorDescription || `Authentication error: ${errorCode}`;
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Clear the error from URL to prevent showing it again on refresh
      if (window.history && window.history.replaceState) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      
      // Get the current origin for constructing redirect URL
      const origin = window.location.origin;
      // Always redirect to dashboard after login
      const redirectTo = `${origin}/callback`;
      
      // Use signInWithOAuth to redirect to Google's login page
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            // Add a timestamp to prevent caching issues
            ts: new Date().getTime().toString()
          }
        }
      });
      
      if (error) {
        console.error("Google login error:", error);
        toast.error("Google login failed. Please try again.");
        setError(`Google authentication failed: ${error.message}`);
        setGoogleLoading(false);
      }
      // Successful OAuth will redirect the page, no need for else branch
      
    } catch (err) {
      console.error("Google login unexpected error:", err);
      setError("An error occurred with Google login. Please try again.");
      toast.error("An error occurred with Google login. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      setMicrosoftLoading(true);
      setError("");
      
      const origin = window.location.origin;
      const redirectTo = `${origin}/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            ts: new Date().getTime().toString()
          }
        }
      });
      
      if (error) {
        console.error("Microsoft login error:", error);
        toast.error("Microsoft login failed. Please try again.");
        setError(`Microsoft authentication failed: ${error.message}`);
        setMicrosoftLoading(false);
      }
      
    } catch (err) {
      console.error("Microsoft login unexpected error:", err);
      setError("An error occurred with Microsoft login. Please try again.");
      toast.error("An error occurred with Microsoft login. Please try again.");
      setMicrosoftLoading(false);
    }
  };

  const handleZohoLogin = async () => {
    try {
      setZohoLoading(true);
      setError("");
      
      toast.info("Zoho authentication is not configured yet. Please use Google or Microsoft login.");
      setZohoLoading(false);
      
    } catch (err) {
      console.error("Zoho login unexpected error:", err);
      setError("An error occurred with Zoho login. Please try again.");
      toast.error("An error occurred with Zoho login. Please try again.");
      setZohoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Animated Background with Floating Shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80"></div>
      
      {/* Multiple Floating Shapes for Depth */}
      <div className="absolute inset-0 opacity-40">
        {/* Large floating shapes */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-purple-200/60 rounded-full mix-blend-multiply filter blur-xl animate-float-slow"></div>
        <div className="absolute top-20 right-10 w-56 h-56 bg-blue-200/60 rounded-full mix-blend-multiply filter blur-xl animate-float-medium"></div>
        <div className="absolute bottom-20 left-1/3 w-48 h-48 bg-pink-200/60 rounded-full mix-blend-multiply filter blur-xl animate-float-fast"></div>
        
        {/* Medium floating shapes */}
        <div className="absolute top-1/2 left-20 w-32 h-32 bg-teal-200/50 rounded-full mix-blend-multiply filter blur-lg animate-float-reverse"></div>
        <div className="absolute bottom-32 right-1/4 w-40 h-40 bg-indigo-200/50 rounded-full mix-blend-multiply filter blur-lg animate-float-slow"></div>
        
        {/* Small accent shapes */}
        <div className="absolute top-1/4 right-1/3 w-20 h-20 bg-rose-200/40 rounded-full mix-blend-multiply filter blur-md animate-float-medium"></div>
        <div className="absolute bottom-1/4 left-1/2 w-24 h-24 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-md animate-float-fast"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <img 
              src="/safeschool_weblogo.png" 
              alt="Safe School Logo" 
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-700 mt-4">Safe School</h1>
          <p className="text-slate-600 mt-1">School Safety Compliance System</p>
          <p className="text-sm text-slate-500 mt-2">Protecting What Matters Most, Aligned With India's Child Safety Framework</p>
        </div>

        {/* Enhanced Glassy Card with Pastel Shadows */}
        <Card className="bg-white/80 backdrop-blur-md border border-purple-200/30 shadow-2xl shadow-purple-200/25 rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-slate-700">Sign In</CardTitle>
            <CardDescription className="text-slate-600">
              Use your organization credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50/90 backdrop-blur-sm border-red-200/50 shadow-sm shadow-red-200/20">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Enhanced Google SSO button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-3 justify-center bg-white/90 hover:bg-white/95 backdrop-blur-sm border border-blue-200/40 text-gray-700 shadow-lg shadow-blue-200/15 transition-all transform hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-200/25 py-6 rounded-xl"
                onClick={handleGoogleLogin}
                disabled={googleLoading || microsoftLoading || zohoLoading || isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                <span className="text-base font-medium">{googleLoading ? "Connecting..." : "Sign in with Google"}</span>
              </Button>
              
              {/* Enhanced Microsoft SSO button */}
              {/* <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-3 justify-center bg-slate-800/95 hover:bg-slate-800 backdrop-blur-sm border border-slate-600/40 text-white shadow-lg shadow-slate-400/15 transition-all transform hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-400/25 py-6 rounded-xl"
                onClick={handleMicrosoftLogin}
                disabled={googleLoading || microsoftLoading || zohoLoading || isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.5 3.5H3.5V11.5H11.5V3.5Z" fill="white"/>
                  <path d="M11.5 12.5H3.5V20.5H11.5V12.5Z" fill="white"/>
                  <path d="M20.5 3.5H12.5V11.5H20.5V3.5Z" fill="white"/>
                  <path d="M20.5 12.5H12.5V20.5H20.5V12.5Z" fill="white"/>
                </svg>
                <span className="text-base font-medium">{microsoftLoading ? "Connecting..." : "Sign in with Microsoft"}</span>
              </Button> */}
              
              {/* Enhanced Zoho SSO button */}
              {/* <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-3 justify-center bg-teal-500/95 hover:bg-teal-600/95 backdrop-blur-sm border border-teal-300/40 text-white shadow-lg shadow-teal-200/15 transition-all transform hover:scale-[1.02] hover:shadow-xl hover:shadow-teal-200/25 py-6 rounded-xl"
                onClick={handleZohoLogin}
                disabled={googleLoading || microsoftLoading || zohoLoading || isLoading}
              >
                <LogIn className="h-5 w-5" />
                <span className="text-base font-medium">{zohoLoading ? "Connecting..." : "Sign in with Zoho"}</span>
              </Button> */}
            </div>
          </CardContent>
        </Card>
        
        {/* Terms and Privacy Policy Links */}
        <div className="mt-6 mb-8 text-center">
          <p className="text-xs text-slate-400 mb-2">
            By signing in, you agree to our
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <button
              onClick={() => navigate('/terms-of-service', { 
                state: { fromLogin: true, originalRoute: '/login' } 
              })}
              className="hover:text-slate-700 transition-colors underline"
            >
              Terms of Service
            </button>
            <span>|</span>
            <button
              onClick={() => navigate('/privacy-policy', { 
                state: { fromLogin: true, originalRoute: '/login' } 
              })}
              className="hover:text-slate-700 transition-colors underline"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
