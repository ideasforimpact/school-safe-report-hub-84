
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Settings, AlertTriangle, School, Users, GraduationCap, UserPlus, Import } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminSettingsMenu = () => {
  const navigate = useNavigate();
  const { employeeData } = useAuth();
  const isSuperAdmin = employeeData?.isSuperAdmin === true;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
          <Settings size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-white border-gray-100 shadow-lg">
        <div className="px-2 py-2 text-sm font-medium text-gray-500">Settings</div>
        <DropdownMenuSeparator />
        
        {/* Incident Configuration */}
        <DropdownMenuItem onClick={() => navigate('/incident-configuration')} className="cursor-pointer">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Incident Configuration</span>
        </DropdownMenuItem>
        
        {/* Educational Structure */}
        <DropdownMenuItem onClick={() => navigate('/educational-configuration')} className="cursor-pointer">
          <School className="h-4 w-4 mr-2" />
          <span>Educational Structure</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* User management links with icons */}
        <DropdownMenuItem onClick={() => navigate('/users')} className="cursor-pointer">
          <Users className="h-4 w-4 mr-2" />
          <span>User Management</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/students')} className="cursor-pointer">
          <GraduationCap className="h-4 w-4 mr-2" />
          <span>Student Management</span>
        </DropdownMenuItem>
        
        {/* Super Admin-only options for employee management */}
        {isSuperAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/employees/add')} className="cursor-pointer">
              <UserPlus className="h-4 w-4 mr-2" />
              <span>Add Employee</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/employees/import')} className="cursor-pointer">
              <Import className="h-4 w-4 mr-2" />
              <span>Import Employees</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminSettingsMenu;
