import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';

const AdminSettingsMenu = () => {
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
        {/* All menu items have been removed as requested */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminSettingsMenu;
