
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { LogOut, Lock, ChevronDown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { User } from '@/contexts/types';

interface UserProfileMenuProps {
  user: User;
  logout: () => void;
}

const UserProfileMenu = ({ user, logout }: UserProfileMenuProps) => {
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  
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
    <>
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
    </>
  );
};

export default UserProfileMenu;
