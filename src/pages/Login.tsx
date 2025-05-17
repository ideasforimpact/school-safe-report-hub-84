
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getUserFromStorage } from '@/services/auth/authService';
import { toast } from 'sonner';

const Login = () => {
  const { login, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        // Check if the user is a backoffice user and redirect accordingly
        const currentUser = getUserFromStorage();
        if (currentUser && currentUser.role === 'saas_owner') {
          navigate('/backoffice/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setIsLoading(false);
        setError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      setError('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md p-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleLogin}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            {authError && (
              <p className="text-red-500 text-sm mt-2">{authError}</p>
            )}
            <Button disabled={isLoading} className="w-full mt-4 bg-primary-600 hover:bg-primary-700">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="text-center text-sm text-gray-500">
            Don't have an account? <a href="/home" className="text-primary-600 hover:underline">Contact to Admin</a>
          </div>
          <div className="text-center text-sm text-gray-500 border-t pt-2">
            Looking for Backoffice access? <a href="/backoffice/login" className="text-primary-600 hover:underline">Go to Backoffice Login</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
