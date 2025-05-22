
import React, { useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatUserFullName } from '@/utils/userUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';

const UserProfileMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { state } = useEmployeeStore();
  
  // Get employee data and admin status from Redux
  const employeeData = getEmployeeData(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  
  // Show settings only for super admins based on Redux data
  const showSettings = isSuperAdmin;

  const getInitials = () => {
    if (!user || !user.firstName || !user.lastName) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out user');
      
      // First sign out from Supabase
      await supabase.auth.signOut();
      console.log('✅ Signed out from Supabase');
      
      // Then proceed with our app's logout
      await logout();
      console.log('✅ Local logout complete');
      
      toast.success('You have been logged out successfully');
      // navigate('/login');
    } catch (error) {
      console.error('❌ Error during logout:', error);
      toast.error('There was an error logging out');
    }
  };

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center space-x-2 rounded-full p-1 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{formatUserFullName(user)}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          {showSettings && (
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleChangePassword}>
            <Key className="mr-2 h-4 w-4" />
            <span>Change Password</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Change Password</DialogTitle>
          <ChangePasswordDialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserProfileMenu;
