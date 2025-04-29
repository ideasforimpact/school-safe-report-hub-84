
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, User, Lock, HelpCircle, Home, FileText, CreditCard } from 'lucide-react';
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
    <header className="bg-white py-4 px-6 border-b border-gray-200">
      <div className="container mx-auto flex flex-col md:flex-row md:items-center md:justify-between w-full">
        <nav className="mb-4 md:mb-0">
          <ul className="flex space-x-6 items-center">
            <li>
              <Link to="/home" className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                <Home className="h-4 w-4 mr-1" />
                Home
              </Link>
            </li>
            <li>
              <Link to="/blog" className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                <FileText className="h-4 w-4 mr-1" />
                Blog
              </Link>
            </li>
            <li>
              <Link to="/pricing" className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                <CreditCard className="h-4 w-4 mr-1" />
                Pricing
              </Link>
            </li>
            <li>
              <Link to="/support" className="flex items-center text-gray-700 hover:text-primary-600 font-medium">
                <HelpCircle className="h-4 w-4 mr-1" />
                Support
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* User Menu */}
        {user ? (
          <div className="flex items-center">
            {user && (
              <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full mr-3">
                {isAdmin ? 'Admin' : 'Reporter'}
              </span>
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
