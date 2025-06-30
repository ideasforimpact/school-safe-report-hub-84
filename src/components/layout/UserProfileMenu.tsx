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
import { LogOut, User, Key } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatUserFullName } from '@/utils/userUtils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData, isEmployeeAdmin, isEmployeeSuperAdmin } from '@/store/employeeSelectors';
import { getIsBackofficeUser } from '@/store/authSelectors';

const UserProfileMenu = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const { state } = useEmployeeStore();
  
  // Get employee data and admin status from Redux
  const employeeData = getEmployeeData(state);
  const isAdmin = isEmployeeAdmin(state);
  const isSuperAdmin = isEmployeeSuperAdmin(state);
  const isBackofficeUser = getIsBackofficeUser(state);
  
  // Check if current route is a backoffice route
  const isBackofficeRoute = location.pathname.startsWith('/backoffice');

  const getInitials = () => {
    if (!user || !user.firstName || !user.lastName) return '';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = async () => {
    console.log('🚪 UserProfileMenu: Logout clicked');
    console.log('🕐 UserProfileMenu: Logout initiated at:', new Date().toISOString());
    console.log('🔍 UserProfileMenu: Current user before setting to null:', user);
    
    // Set user to null first as requested
    console.log('🔄 UserProfileMenu: Setting user to null before logout');
    setUser(null);
    console.log('✅ UserProfileMenu: User set to null, now calling logout');
    
    // Add a small delay to ensure state propagation
    setTimeout(async () => {
      console.log('⏰ UserProfileMenu: Delayed logout call starting');
      // Use the centralized logout which handles all navigation
      await logout();
      console.log('🏁 UserProfileMenu: Logout process completed');
    }, 50);
  };

  const handleProfileClick = () => {
    console.log("Navigating to profile page");
    navigate('/profile');
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
          <DropdownMenuItem onClick={handleProfileClick}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          {isBackofficeRoute && (
            <DropdownMenuItem onClick={handleChangePassword}>
              <Key className="mr-2 h-4 w-4" />
              <span>Change Password</span>
            </DropdownMenuItem>
          )}
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
