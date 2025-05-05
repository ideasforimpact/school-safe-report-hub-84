import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Settings, AlertTriangle, Building, LayoutGrid, MapPin } from 'lucide-react';

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
        
        {/* Category Configuration */}
        <DropdownMenuItem onClick={() => navigate('/category-configuration')} className="cursor-pointer">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Category Management</span>
        </DropdownMenuItem>
        
        {/* Location & Facility Configuration */}
        <DropdownMenuItem onClick={() => navigate('/location-facility-configuration')} className="cursor-pointer">
          <MapPin className="h-4 w-4 mr-2" />
          <span>Location & Facility Management</span>
        </DropdownMenuItem>
        
        {/* Incident Configuration */}
        <DropdownMenuItem onClick={() => navigate('/incident-configuration')} className="cursor-pointer">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>Incident Configuration</span>
        </DropdownMenuItem>
        
        {/* Educational Structure */}
        <DropdownMenuItem onClick={() => navigate('/educational-configuration')} className="cursor-pointer">
          <Building className="h-4 w-4 mr-2" />
          <span>Educational Structure</span>
        </DropdownMenuItem>
        
        {/* Other Settings */}
        <DropdownMenuItem onClick={() => navigate('/other-configuration')} className="cursor-pointer">
          <LayoutGrid className="h-4 w-4 mr-2" />
          <span>Other Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Keep basic settings */}
        <DropdownMenuItem onClick={() => navigate('/users')} className="cursor-pointer">
          User Management
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/students')} className="cursor-pointer">
          Student Management
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminSettingsMenu;
