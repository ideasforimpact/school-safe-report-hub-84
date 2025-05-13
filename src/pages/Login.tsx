
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Attempting to log in with:", email, password);
      const success = await login(email, password);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
    setIsLoading(true);

    try {
      console.log("Using demo credentials:", demoEmail, demoPassword);
      const success = await login(demoEmail, demoPassword);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("Demo login failed. Please try again.");
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setError("An error occurred with demo login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // This function would be implemented when we connect to real OAuth providers
  const handleOAuthLogin = (provider: string) => {
    setIsLoading(true);
    // In a real implementation, this would redirect to the OAuth provider
    console.log(`Authenticating with ${provider}...`);
    setTimeout(() => {
      setError(`${provider} authentication is not configured yet. Please use email and password.`);
      setIsLoading(false);
    }, 1000);
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
              
              <div className="grid grid-cols-3 gap-2 w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleOAuthLogin('Google')}
                  disabled={isLoading}
                >
                  Google
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleOAuthLogin('Microsoft')}
                  disabled={isLoading}
                >
                  Microsoft
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleOAuthLogin('Zoho')}
                  disabled={isLoading}
                >
                  Zoho
                </Button>
              </div>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/home')} 
                className="w-full mt-4 transition-all hover:bg-primary/10"
              >
                Back to Home
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
              disabled={isLoading}
            >
              Login as SaaS Owner
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs" 
              onClick={() => handleDemoLogin("admin@school.edu", "admin123")}
              disabled={isLoading}
            >
              Login as Admin
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs" 
              onClick={() => handleDemoLogin("reporter@school.edu", "reporter123")}
              disabled={isLoading}
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
