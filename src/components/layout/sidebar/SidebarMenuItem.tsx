
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarMenuItemProps {
  icon: LucideIcon;
  label: string;
  path: string;
  isActive: boolean;
  accessLevel?: any; // Add accessLevel prop
}

const SidebarMenuItem = ({ icon: IconComponent, label, path, isActive, accessLevel }: SidebarMenuItemProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // Log the access_level when module is clicked
    if (accessLevel) {
      console.log(`Module "${label}" clicked - Access Level:`, accessLevel);
    } else {
      console.log(`Module "${label}" clicked - No access level data`);
    }
    
    navigate(path);
  };
  
  // Split the label by newline character to handle multiline labels
  const labelParts = label.split('\n');
  
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
