
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck, LogIn } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { providerConfigs } from "@/utils/authProviders";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [zohoLoading, setZohoLoading] = useState(false);
  const [error, setError] = useState("");
  const { authError, user, handleUserAuthentication } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in, redirect if they are
  useEffect(() => {
    if (user) {
      // Get the intended destination from location state or use dashboard as default
      const from = location.state?.from?.pathname || "/dashboard";

      if(user?.role === "saas_owner"){
         navigate("/backoffice/dashboard");
      }
      else{
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate, location.state]);

  // Listen for auth errors from context
  useEffect(() => {
    if (authError) {
      setError(authError);
      setIsLoading(false);
      setGoogleLoading(false);
      setMicrosoftLoading(false);
      setZohoLoading(false);
      toast.error(authError);
    }
  }, [authError]);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      
      // Get the current origin for constructing redirect URL
      const origin = window.location.origin;
      // Always redirect to dashboard after login
      const redirectTo = `${origin}/dashboard`;
      
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <ShieldCheck className="h-12 w-12 text-primary mb-2" />
          </div>
          <h1 className="text-3xl font-bold text-primary">Safe School</h1>
          <p className="text-gray-600 mt-1">Incident Management System</p>
          <p className="text-sm text-gray-500 mt-2">Sign in to start protecting your school community</p>
        </div>

        <Card className="border-t-4 border-t-primary animate-scale-in shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Log In with SSO</CardTitle>
            <CardDescription className="text-center">
              Use your organization credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              {/* Google SSO button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-3 justify-center bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 shadow-sm transition-all transform hover:scale-[1.02] py-6"
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
              
              {/* Microsoft SSO button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-3 justify-center border bg-[#2F2F2F] hover:bg-[#1E1E1E] text-white transition-all transform hover:scale-[1.02] py-6"
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
              </Button>
              
              {/* Zoho SSO button */}
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-3 justify-center border bg-[#0073AA] hover:bg-[#005E8A] text-white transition-all transform hover:scale-[1.02] py-6"
                onClick={handleZohoLogin}
                disabled={googleLoading || microsoftLoading || zohoLoading || isLoading}
              >
                <LogIn className="h-5 w-5" />
                <span className="text-base font-medium">{zohoLoading ? "Connecting..." : "Sign in with Zoho"}</span>
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <div className="w-full flex items-center gap-2 my-2">
              <Separator className="flex-1" />
              <span className="text-xs text-gray-500">NEED HELP?</span>
              <Separator className="flex-1" />
            </div>
            
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => navigate('/home')} 
              className="w-full transition-all hover:bg-primary/10"
            >
              Back to Home
            </Button>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              Contact your administrator if you're having trouble signing in
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
