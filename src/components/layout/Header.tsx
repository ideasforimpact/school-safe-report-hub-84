import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Lock, Settings, ShieldCheck, BellIcon, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="w-full">
      <div className="w-full px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            {userClient?.logo ? (
              <img 
                src={userClient.logo} 
                alt={`${userClient.name} logo`}
                className="h-10 w-auto"
              />
            ) : (
              <div className="h-10 w-10 bg-primary-100 rounded-md flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary-600" />
              </div>
            )}
            
            <Link to={isSaasOwner ? "/backoffice" : "/dashboard"} className="flex items-center space-x-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-700 to-secondary-600 text-transparent bg-clip-text hidden md:block">
                {userClient ? `${userClient.name} Safe School` : 'Safe School'}
              </h1>
            </Link>
          </div>
          
          {/* Navigation links for home page */}
          {isHomePage && (
            <nav className="hidden md:block">
              <ul className="flex space-x-6 items-center">
                <li>
                  <Link to="/" className="nav-link active">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="nav-link">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="nav-link">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="nav-link">
                    Support
                  </Link>
                </li>
              </ul>
            </nav>
          )}
          
          {/* User Menu */}
          {user ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:text-gray-700 relative"
              >
                <BellIcon size={20} />
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary-600 rounded-full"></span>
              </Button>

              {user && (
                <span className="bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded-full mr-2 hidden md:inline-flex">
                  {isAdmin ? 'Admin' : 'Reporter'}
                </span>
              )}

              {/* Settings Menu - Only visible for admins */}
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                      <Settings size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border-gray-100 shadow-card">
                    <div className="px-2 py-2 text-sm font-medium text-gray-500">Settings</div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/configuration')} className="cursor-pointer">
                      Configuration
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/users')} className="cursor-pointer">
                      User Management
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/students')} className="cursor-pointer">
                      Student Management
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/facilities')} className="cursor-pointer">
                      Facility Management
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 ml-2">
                    <Avatar className="h-8 w-8 bg-primary-100">
                      <AvatarFallback className="text-primary-700 text-sm font-medium">
                        {user.name ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                    <ChevronDown size={16} className="text-gray-400 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white border-gray-100 shadow-card">
                  <div className="px-2 py-1.5 text-sm font-medium border-b border-gray-100 md:hidden">
                    <div>{user.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                  </div>
                  <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)} className="cursor-pointer">
                    <Lock size={16} className="mr-2" />
                    <span>Change Password</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut size={16} className="mr-2" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
            </div>
          ) : (
            <Button 
              onClick={() => navigate('/login')}
              className="bg-primary-600 hover:bg-primary-700"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
