
import React from 'react';
import { 
  NavigationMenuItem, 
  NavigationMenuTrigger, 
  NavigationMenuContent,
  NavigationMenuLink 
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { NavItem } from "./types";
import * as Icons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface DesktopDropdownItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
  isItemActive: (item: NavItem) => boolean;
}

const DesktopDropdownItem = ({ item, isActive, handleNavigation, isItemActive }: DesktopDropdownItemProps) => {
  // Get icon component if icon name is provided
  const IconComponent = item.icon ? (Icons[item.icon as keyof typeof Icons] as LucideIcon) : null;
  
  // Filter items by permission
  const dropdownItems = item.items?.filter(subItem => subItem.allowed) || [];
  if (dropdownItems.length === 0) return null;
  
  return (
    <NavigationMenuItem key={item.title} className="relative">
      <NavigationMenuTrigger className={cn(
        "px-4 py-2 text-sm font-medium flex items-center gap-2",
        isItemActive(item)
          ? "text-primary font-semibold" 
          : "text-gray-700"
      )}>
        {IconComponent && React.createElement(IconComponent, { className: "h-4 w-4" })}
        {item.title}
      </NavigationMenuTrigger>
      <NavigationMenuContent className="absolute z-50">
        <ul className="grid w-[200px] gap-1 p-2 bg-white rounded-md shadow-lg">
          {dropdownItems.map((subItem) => (
            <li key={subItem.title}>
              <NavigationMenuLink asChild>
                <button
                  onClick={() => handleNavigation(subItem.path)}
                  className={cn(
                    "flex w-full select-none items-center rounded-md px-3 py-2 text-sm",
                    isActive(subItem.path)
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  {subItem.title}
                </button>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};

export default DesktopDropdownItem;
