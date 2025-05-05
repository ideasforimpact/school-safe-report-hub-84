import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { Settings, AlertTriangle, Building, LayoutGrid } from 'lucide-react';

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
        
        {/* Configuration with submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <span>Incident Related</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 bg-white">
            <DropdownMenuItem onClick={() => navigate('/configuration?category=incident')} className="cursor-pointer">
              Categories & Subcategories
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/configuration?category=incident&tab=locations')} className="cursor-pointer">
              Locations
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/configuration?category=incident&tab=facilities')} className="cursor-pointer">
              Facilities
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {/* Educational Structure submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <Building className="h-4 w-4 mr-2" />
            <span>Educational Structure</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 bg-white">
            <DropdownMenuItem onClick={() => navigate('/configuration?category=educational&tab=campuses')} className="cursor-pointer">
              Campuses
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/configuration?category=educational&tab=classes')} className="cursor-pointer">
              Classes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/configuration?category=educational&tab=sections')} className="cursor-pointer">
              Sections
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
        {/* Other Settings submenu */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            <LayoutGrid className="h-4 w-4 mr-2" />
            <span>Other Settings</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56 bg-white">
            <DropdownMenuItem onClick={() => navigate('/configuration?category=other&tab=designations')} className="cursor-pointer">
              Designations
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        
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
