
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Lock, HelpCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

const Header = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white py-4 px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
        <div className="flex items-center space-x-2 mb-4 md:mb-0">
          <div 
            className="flex items-center cursor-pointer"
            onClick={() => navigate('/home')}
          >
            <ShieldCheck className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-semibold text-primary-600">
              Safe School
            </h1>
          </div>
          {user && (
            <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
              {isAdmin ? 'Admin' : 'Reporter'}
            </span>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6">
          {/* Top Navigation Menu - always visible */}
          <nav className="mb-4 md:mb-0">
            <ul className="flex space-x-6 items-center">
              <li>
                <Link to="/home" className="text-gray-700 hover:text-primary-600 font-medium">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-700 hover:text-primary-600 font-medium">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-gray-700 hover:text-primary-600 font-medium">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-700 hover:text-primary-600 font-medium">
                  Support
                </Link>
              </li>
            </ul>
          </nav>

          {/* User Menu */}
          {user ? (
            <>
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
            </>
          ) : (
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
