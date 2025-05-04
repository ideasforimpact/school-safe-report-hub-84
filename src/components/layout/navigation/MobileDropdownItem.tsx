
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { NavItem } from "./types";

interface MobileDropdownItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
}

const MobileDropdownItem = ({ item, isActive, handleNavigation }: MobileDropdownItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Filter items by permission
  const dropdownItems = item.items?.filter(subItem => subItem.allowed) || [];
  if (dropdownItems.length === 0) return null;

  // Check if any subitems are active
  const isActiveDropdown = dropdownItems.some(subItem => isActive(subItem.path));
  
  return (
    <div key={item.title} className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium",
          isActiveDropdown ? "bg-primary/10 text-primary" : "text-gray-700 hover:bg-gray-50"
        )}
      >
        <span>{item.title}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 transition-transform duration-200",
            isOpen && "transform rotate-180"
          )}
        />
      </button>
      
      {isOpen && (
        <div className="px-3 py-1 ml-4 border-l border-gray-200 z-50">
          {dropdownItems.map((subItem) => (
            <button
              key={subItem.title}
              onClick={() => handleNavigation(subItem.path)}
              className={cn(
                "block w-full text-left px-3 py-2 rounded-md text-base font-medium my-1",
                isActive(subItem.path)
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              {subItem.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileDropdownItem;
