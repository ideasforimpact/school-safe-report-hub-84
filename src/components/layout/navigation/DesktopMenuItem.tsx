
import React from 'react';
import { NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { NavItem } from "./types";
import * as Icons from 'lucide-react';

interface DesktopMenuItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
  isItemActive: (item: NavItem) => boolean;
}

const DesktopMenuItem = ({ item, isActive, handleNavigation, isItemActive }: DesktopMenuItemProps) => {
  // Get icon component
  const IconComponent = item.icon ? Icons[item.icon as keyof typeof Icons] : null;
  
  // Regular menu item without dropdown
  if (!item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuLink asChild>
          <button
            onClick={() => item.path && handleNavigation(item.path)}
            className={cn(
              "px-4 py-2 text-sm font-medium flex items-center gap-2",
              item.path && isActive(item.path)
                ? "text-primary font-semibold"
                : "text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
            )}
          >
            {IconComponent && React.createElement(IconComponent, { className: "h-4 w-4" })}
            {item.title}
          </button>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }
  
  return null;
};

export default DesktopMenuItem;
