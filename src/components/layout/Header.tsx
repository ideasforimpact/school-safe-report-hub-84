
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Lock, Settings, ShieldCheck, BellIcon, ChevronDown, HelpCircle, Search } from 'lucide-react';
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

  // Determine the dashboard path based on user role
  const dashboardPath = isSaasOwner ? "/backoffice" : "/dashboard";

  return (
    <div className="w-full h-16 bg-white shadow-sm">
      <div className="w-full h-full px-4">
        <div className="container mx-auto h-full flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Link to={dashboardPath} className="flex items-center space-x-2 md:ml-16 lg:ml-64">
              {userClient?.logo ? (
                <img 
                  src={userClient.logo} 
                  alt={`${userClient.name} logo`}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="h-8 w-8 bg-primary-100 rounded-md flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary-600" />
                </div>
              )}
              
              <h1 className="text-lg font-bold text-gray-800 hidden md:block">
                {isSaasOwner ? 'SaaS Admin Platform' : (userClient ? `${userClient.name} Safe School` : 'Safe School')}
              </h1>
            </Link>
          </div>
          
          {/* Search Bar - Only for logged-in users */}
          {user && !isHomePage && (
            <div className="hidden md:block max-w-md w-full mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  className="pl-10 bg-gray-50 border border-gray-200 focus:border-primary-500 w-full"
                />
              </div>
            </div>
          )}
          
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
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:text-gray-700 relative"
              >
                <HelpCircle size={20} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-500 hover:text-gray-700 relative"
              >
                <BellIcon size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>

              {user && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 hidden md:inline-flex">
                  {isSaasOwner ? 'SaaS Owner' : (isAdmin ? 'Admin' : 'Reporter')}
                </span>
              )}

              {/* Settings Menu - Only visible for admins */}
              {isAdmin && !isSaasOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
                      <Settings size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border-gray-100 shadow-lg">
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
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8 bg-blue-100">
                      <AvatarFallback className="text-blue-700 text-sm font-medium">
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
                <DropdownMenuContent align="end" className="w-56 bg-white border-gray-100 shadow-lg">
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
