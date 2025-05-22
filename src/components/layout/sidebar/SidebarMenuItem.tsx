
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarMenuItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
  onClick?: () => void;  // Add onClick handler prop
  accessLevel?: any;     // Add accessLevel prop
}

const SidebarMenuItem = ({ 
  icon: Icon, 
  label, 
  path, 
  isActive, 
  onClick, 
  accessLevel 
}: SidebarMenuItemProps) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If onClick handler is provided, call it
    if (onClick) {
      onClick();
    }
  };

  return (
    <li>
      <Link
        to={path}
        onClick={handleClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          isActive 
            ? "bg-white/10 text-white" 
            : "text-gray-200 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span>{label}</span>
      </Link>
    </li>
  );
};

export default SidebarMenuItem;
