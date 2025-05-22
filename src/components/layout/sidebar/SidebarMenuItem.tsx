
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarMenuItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
  accessLevel?: any;
  onClick?: () => void;
}

const SidebarMenuItem = ({ 
  icon: IconComponent, 
  label, 
  path, 
  isActive,
  accessLevel,
  onClick
}: SidebarMenuItemProps) => {
  // Split the label by newline character to handle multiline labels
  const labelParts = label.split('\n');
  
  const handleClick = () => {
    // Log the access level when clicked for debugging
    console.log(`Clicked on ${label} with access level:`, accessLevel);
    
    // Call the parent's onClick handler if provided
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <li>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex flex-col items-center justify-center py-3 px-2 rounded-md transition-colors text-center",
          isActive
            ? "bg-blue-700 text-white"
            : "text-blue-100 hover:bg-blue-800 hover:text-white"
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <IconComponent className="h-6 w-6 mb-1" />
        {labelParts.length > 1 ? (
          <div className="flex flex-col">
            {labelParts.map((part, index) => (
              <span 
                key={index} 
                className="text-[11px] font-medium whitespace-normal text-center leading-tight"
              >
                {part}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-medium whitespace-normal text-center">
            {label}
          </span>
        )}
      </button>
    </li>
  );
};

export default SidebarMenuItem;
