
import { Button } from '@/components/ui/button';
import { HelpCircle, BellIcon } from 'lucide-react';

const HeaderIcons = () => {
  return (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-500 hover:text-gray-700 relative"
      >
        <HelpCircle size={20} />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-500 hover:text-gray-700 relative"
      >
        <BellIcon size={20} />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
      </Button>
    </>
  );
};

export default HeaderIcons;
