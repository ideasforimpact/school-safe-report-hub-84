
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useBackofficeAuth } from "@/contexts/backoffice/BackofficeAuthContext";
import { supabase } from "@/integrations/supabase/client";

// List of demo credentials for verification
const DEMO_CREDENTIALS = [
  { email: 'owner@saasplatform.com', password: 'owner123', role: 'SaaS Owner' }
];

const BackofficeLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login: backofficeAuthLogin, user, error: authError, clearError } = useBackofficeAuth();
  const navigate = useNavigate();

  // Check if user is already logged in, redirect if they are
  useEffect(() => {
    if (user) {
      navigate('/backoffice/dashboard');
    }
  }, [user, navigate]);

  // Reset error when inputs change
  useEffect(() => {
    if (authError) {
      clearError();
    }
  }, [email, password, clearError, authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the login function from BackofficeAuthContext with explicit naming
      console.log("BackofficeLogin: Calling backofficeAuthLogin function with email:", email);
      let success = await backofficeAuthLogin(email, password);
      console.log("BackofficeLogin: backofficeAuthLogin function returned:", success);
      
      if (success) {
        navigate('/backoffice/dashboard');
      } else {
        toast.error("Login failed. Please check your credentials.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      
      // Get the current origin for constructing redirect URL
      const origin = window.location.origin;
      const redirectTo = `${origin}/backoffice/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
        }
      });
      
      if (error) {
        console.error("Google login error:", error);
        toast.error("Google login failed. Please try again.");
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error("Google login unexpected error:", err);
      toast.error("An error occurred with Google login. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    // First validate that this is a valid demo credential
    const isValidDemo = DEMO_CREDENTIALS.some(cred => 
      cred.email === demoEmail && cred.password === demoPassword
    );

    if (!isValidDemo) {
      toast.error("Invalid demo credentials");
      return;
    }
    
    setEmail(demoEmail);
    setPassword(demoPassword);
    
    setIsLoading(true);

    try {
      console.log("BackofficeLogin: Calling backofficeAuthLogin for demo with email:", demoEmail);
      const success = await backofficeAuthLogin(demoEmail, demoPassword);
      console.log("BackofficeLogin: backofficeAuthLogin demo login returned:", success);
      
      if (success) {
        toast.success("Demo login successful!");
        navigate("/backoffice/dashboard");
      } else {
        toast.error("Demo login failed");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setIsLoading(false);
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
          <p className="text-gray-600 mt-1">Backoffice Login</p>
          <p className="text-sm text-gray-500 mt-2">Sign in to manage your platform</p>
        </div>

        <Card className="border-t-4 border-t-primary animate-scale-in">
          <CardHeader>
            <CardTitle>Backoffice Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the backoffice
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {authError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-sm font-medium">
                    Password
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="transition-all focus:ring-2 focus:ring-primary"
                />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-3">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/80 transition-all" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </Button>
              
              <div className="w-full flex items-center gap-2 my-2">
                <Separator className="flex-1" />
                <span className="text-xs text-gray-500">OR</span>
                <Separator className="flex-1" />
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                className="w-full flex items-center gap-2 justify-center"
                onClick={handleGoogleLogin}
                disabled={googleLoading || isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                  <path fill="none" d="M1 1h22v22H1z" />
                </svg>
                {googleLoading ? "Connecting..." : "Continue with Google"}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/login')} 
                className="w-full mt-4 transition-all hover:bg-primary/10"
              >
                Regular Login
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center mt-6 text-sm text-gray-600 p-4 bg-white/80 rounded-md shadow-sm">
          <p>Demo Credentials:</p>
          <div className="mt-2 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs" 
              onClick={() => handleDemoLogin("owner@saasplatform.com", "owner123")}
              disabled={isLoading || googleLoading}
            >
              Login as SaaS Owner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackofficeLogin;
