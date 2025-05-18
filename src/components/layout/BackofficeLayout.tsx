
import { ReactNode, useEffect, useState } from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { formatUserFullName } from '@/utils/userUtils';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface BackofficeLayoutProps {
  children: ReactNode;
}

const BackofficeLayout = ({ children }: BackofficeLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isSaasOwner } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug logging
  console.log("BackofficeLayout mounted, auth state:", { 
    userId: user?.id || "null",
    userEmail: user?.email || "null", 
    isSaasOwner 
  });
  
  useEffect(() => {
    // Add a small delay to ensure auth state is stable
    const timer = setTimeout(() => {
      console.log("Authentication check after delay:", { 
        userId: user?.id || "null", 
        userEmail: user?.email || "null", 
        isSaasOwner 
      });
      
      if (!user) {
        console.log("No user found, redirecting to login");
        // Use replace instead of push to prevent back button issues
        navigate('/login', { replace: true, state: { from: location.pathname } });
        toast.error("Please log in to access the backoffice.");
      } else if (!isSaasOwner) {
        console.log("User found but not SaaS owner, redirecting to dashboard");
        // Use replace instead of push to prevent back button issues
        navigate('/dashboard', { replace: true });
        toast.error("You don't have permission to access the backoffice.");
      }
      
      setIsLoading(false);
    }, 100); // Small delay to ensure auth has stabilized
    
    return () => clearTimeout(timer);
  }, [user, isSaasOwner, navigate, location]);

  // If still loading, show a minimal loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If no user or not a SaaS owner, render nothing as we're redirecting
  if (!user || !isSaasOwner) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Function to safely get the user's initial
  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.substring(0, 1).toUpperCase();
    }
    return 'U'; // Default fallback if firstName is undefined
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Top nav */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Safe School Backoffice</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="font-medium text-sm text-primary-700">
                          {getUserInitial()}
                        </span>
                      </div>
                      <span>{formatUserFullName(user)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      Client Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut size={16} className="mr-2" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content - Using flex-col for vertical layout */}
      <div className="flex-grow">
        <main className="container mx-auto py-8 px-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default BackofficeLayout;
