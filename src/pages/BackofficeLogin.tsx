
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const BackofficeLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      
      // Use the existing login function from AuthContext, which already handles backoffice users
      const success = await login(email, password);
      
      if (success) {
        // Redirect happens automatically in the AuthProvider after login
        toast.success("Login successful");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
      toast.error("Login failed. Please try again.");
    } finally {
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
          <h1 className="text-3xl font-bold text-primary">Safe School Backoffice</h1>
          <p className="text-gray-600 mt-1">Administration Portal</p>
          <p className="text-sm text-gray-500 mt-2">Sign in with your admin credentials</p>
        </div>

        <Card className="border-t-4 border-t-primary animate-scale-in shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Backoffice Login</CardTitle>
            <CardDescription className="text-center">
              Enter your email and password to access the admin portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-2"
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full px-4 py-2"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
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
              Contact system administrator if you're having trouble signing in
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BackofficeLogin;
