
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
  const [redirect, setRedirect] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // Initialize with auth check
  useEffect(() => {
    console.log("Backoffice Layout - Initial mount, checking auth state");
    // Set initial check to true after first render
    setInitialCheckDone(true);
  }, []);
  
  // Redirect if not SaaS owner or not logged in, but only after initial render
  useEffect(() => {
    console.log("Backoffice Layout - Auth state:", { 
      isUser: !!user, 
      isSaasOwner, 
      redirect,
      initialCheckDone,
      pathname: location.pathname,
      userDetails: user ? `${user.firstName} ${user.lastName} (${user.role})` : 'No user'
    });
    
    // Only check for redirection after initial check is done
    if (initialCheckDone) {
      if (!user && redirect) {
        // User is not logged in at all, redirect to backoffice login
        console.log("Backoffice Layout - No user, redirecting to backoffice login");
        toast.error("Please log in to access the backoffice.");
        navigate('/backoffice/login');
        return;
      }
      
      if (user && !isSaasOwner && redirect) {
        // User is logged in but not a SaaS owner
        console.log("Backoffice Layout - User is not a SaaS owner, redirecting to dashboard");
        toast.error("You don't have permission to access the backoffice.");
        navigate('/dashboard');
        return;
      }

      // Set redirect flag to true after initial render
      if (!redirect) {
        console.log("Backoffice Layout - Setting redirect flag to true");
        setRedirect(true);
      }
    }
  }, [user, isSaasOwner, navigate, redirect, location.pathname, initialCheckDone]);

  const handleLogout = async () => {
    console.log("Backoffice Layout - Logging out user");
    await logout();
    navigate('/backoffice/login');
  };

  // Function to safely get the user's initial
  const getUserInitial = () => {
    if (user?.firstName) {
      return user.firstName.substring(0, 1).toUpperCase();
    }
    return 'U'; // Default fallback if firstName is undefined
  };

  // If initial check isn't done, show loading
  if (!initialCheckDone) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading backoffice...</p>
      </div>
    );
  }

  // If not SaaS owner or not logged in, don't render anything while redirecting
  if (!user || !isSaasOwner) {
    return null;
  }

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
