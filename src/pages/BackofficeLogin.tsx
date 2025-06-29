
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck, Lock, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuthHandlers } from "@/contexts/auth/hooks/useAuthHandlers";
import { useEmployeeStore } from "@/store/EmployeeContext";
import { setAuthError } from "@/store/authActions";

const BackofficeLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const { state, dispatch } = useEmployeeStore();

  // Get the unified authentication handler
  const { handleUserAuthentication } = useAuthHandlers({
    user: null,
    users: [],
    setUser: () => {},
    setUsers: () => {},
    setAuthError: (error: string | null) => dispatch(setAuthError(error)),
    authInitCompleteRef: { current: false },
    setEmployeeData: () => {},
    dispatch
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission with FIXED authentication flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError("Please enter both email and password");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Verify backoffice credentials using Supabase RPC
      const { data, error: rpcError } = await supabase.rpc('verify_password', { 
        email: formData.email, 
        password_attempt: formData.password 
      });

      if (rpcError || data !== true) {
        setError("Invalid credentials");
        return;
      }

      // Fetch the backoffice user data
      const { data: backofficeUser, error: backofficeError } = await supabase
        .from('backoffice_users')
        .select('*')
        .eq('email', formData.email)
        .single();
        
      if (backofficeError || !backofficeUser) {
        setError("Error retrieving user data");
        return;
      }

      // Update last_signed_in
      await supabase
        .from('backoffice_users')
        .update({ last_signed_in: new Date().toISOString() })
        .eq('id', backofficeUser.id);

      // Use the FIXED unified authentication handler for backoffice login
      await handleUserAuthentication(null, true, backofficeUser);

      toast.success("Login successful! Redirecting to dashboard...");
      navigate("/backoffice/dashboard");

    } catch (err) {
      console.error("Backoffice login error:", err);
      setError("An error occurred during login. Please try again.");
      toast.error("Login failed. Please check your credentials.");
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
          <p className="text-sm text-gray-500 mt-2">Sign in with admin credentials to manage the system</p>
        </div>

        <Card className="border-t-4 border-t-primary animate-scale-in shadow-lg">
          <CardHeader>
            <CardTitle className="text-center">Backoffice Login</CardTitle>
            <CardDescription className="text-center">
              Access the administration portal with your credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com" 
                    className="pl-10" 
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="password"
                    name="password"
                    type="password" 
                    placeholder="••••••••" 
                    className="pl-10" 
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
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
