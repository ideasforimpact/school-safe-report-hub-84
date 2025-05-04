
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';

const AdminSettingsMenu = () => {
  const navigate = useNavigate();
  
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
  );
};

export default AdminSettingsMenu;
