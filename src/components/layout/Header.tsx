
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Lock, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

const Header = () => {
  const { user, logout, isAdmin, isSaasOwner } = useAuth();
  const { clients } = useClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
  // Check if we're on the home page
  const isHomePage = location.pathname === "/" || location.pathname === "/home";
  
  // Find the client associated with the current user
  const userClient = user?.clientId ? clients.find(c => c.id === user.clientId) : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white py-4 px-6 border-b border-gray-200">
      <div className="container mx-auto flex items-center justify-between w-full">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          {userClient?.logo ? (
            <img 
              src={userClient.logo} 
              alt={`${userClient.name} logo`}
              className="h-8 w-auto"
            />
          ) : (
            <ShieldCheck className="h-7 w-7 text-primary" />
          )}
          
          <Link to={isSaasOwner ? "/backoffice" : "/dashboard"} className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-primary hidden md:block">
              {userClient ? `${userClient.name} Safe School Console` : 'Safe School'}
            </h1>
          </Link>
        </div>
        
        {/* Navigation links for home page */}
        {isHomePage && (
          <nav className="hidden md:block">
            <ul className="flex space-x-6 items-center">
              <li>
                <Link to="/" className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/blog" className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/support" className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                  Support
                </Link>
              </li>
            </ul>
          </nav>
        )}
        
        {/* User Menu */}
        {user ? (
          <div className="flex items-center">
            {user && (
              <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full mr-3">
                {isAdmin ? 'Admin' : 'Reporter'}
              </span>
            )}

            {/* Settings Menu - Only visible for admins */}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 mr-2" size="icon">
                    <Settings size={18} className="text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/configuration')}>
                    Configuration
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/users')}>
                    User Management
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/students')}>
                    Student Management
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/facilities')}>
                    Facility Management
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <User size={14} className="text-primary-700" />
                  </div>
                  <span>{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)}>
                  <Lock size={16} className="mr-2" />
                  <span>Change Password</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut size={16} className="mr-2" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
          </div>
        ) : (
          <Button onClick={() => navigate('/login')}>
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
