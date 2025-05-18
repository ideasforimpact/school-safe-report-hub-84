import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// List of demo credentials for verification
const DEMO_CREDENTIALS = [
  { email: 'owner@saasplatform.com', password: 'owner123', role: 'SaaS Owner' },
  { email: 'admin@school.edu', password: 'admin123', role: 'Admin' },
  { email: 'reporter@school.edu', password: 'reporter123', role: 'Reporter' }
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const { login, authError, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in, redirect if they are
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  // Check for authentication redirect results and errors
  useEffect(() => {
    const checkForAuthRedirect = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (data?.session) {
        console.log("Session detected after redirect:", data.session);
        // The AuthContext will check if the user has proper access and handle redirect
      }
      
      if (error) {
        console.error("Auth redirect error:", error);
        toast.error("Authentication failed. Please try again.");
      }
    };
    
    checkForAuthRedirect();
  }, [navigate]);

  // Listen for auth errors from context
  useEffect(() => {
    if (authError) {
      setError(authError);
      // No need to show toast here, the auth context will handle it
      setIsLoading(false);
      setGoogleLoading(false);
    }
  }, [authError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting to log in with:", email, password);
      const success = await login(email, password);
      if (success) {
        // Redirect to the page they were trying to access before being redirected to login
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
        // Toast is now handled in AuthContext to prevent duplicates
      } else {
        if (!authError) {
          setError("Invalid email or password");
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError("");
      
      // Get the current origin for constructing redirect URL
      const origin = window.location.origin;
      const redirectTo = `${origin}/dashboard`;
      
      console.log("Initiating Google login with redirect to:", redirectTo);
      
      // Use signInWithOAuth to redirect to Google's login page directly
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
        }
      });
      
      if (error) {
        console.error("Google login error:", error);
        toast.error("Google login failed. Please try again.");
        setError(`Google authentication failed: ${error.message}`);
        setGoogleLoading(false);
      }
      // No else branch needed as successful OAuth will redirect the page
      
    } catch (err) {
      console.error("Google login unexpected error:", err);
      setError("An error occurred with Google login. Please try again.");
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
    setError("");
    setIsLoading(true);

    try {
      console.log("Using demo credentials:", demoEmail, demoPassword);
      const success = await login(demoEmail, demoPassword);
      if (success) {
        // Toast is now handled in AuthContext to prevent duplicates
        navigate("/dashboard");
      } else {
        if (!authError) {
          toast.error("Demo login failed. Please try again.");
          setError("Demo login failed. Please check the console for details.");
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setError("An error occurred with demo login. Please try again.");
      setIsLoading(false);
    }
  };

  // This function would be implemented when we connect to real OAuth providers
  const handleOAuthLogin = (provider: string) => {
    toast.info(`${provider} authentication is not configured yet. Please use Google or email login.`);
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

        <Card className="border-t-4 border-t-primary animate-scale-in">
          <CardHeader>
            <CardTitle>Log In</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
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
                  placeholder="you@school.edu"
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
              
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleOAuthLogin('Microsoft')}
                  disabled={isLoading || googleLoading}
                >
                  Microsoft
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleOAuthLogin('Zoho')}
                  disabled={isLoading || googleLoading}
                >
                  Zoho
                </Button>
              </div>
              
              <div className="flex gap-2 w-full mt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/home')} 
                  className="flex-1 transition-all hover:bg-primary/10"
                >
                  Back to Home
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/backoffice/login')} 
                  className="flex-1 transition-all hover:bg-primary/10"
                >
                  Backoffice Login
                </Button>
              </div>
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
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs" 
              onClick={() => handleDemoLogin("admin@school.edu", "admin123")}
              disabled={isLoading || googleLoading}
            >
              Login as Admin
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs" 
              onClick={() => handleDemoLogin("reporter@school.edu", "reporter123")}
              disabled={isLoading || googleLoading}
            >
              Login as Reporter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
