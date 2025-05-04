
import React from 'react';
import { cn } from "@/lib/utils";
import { NavItem } from "./types";
import * as Icons from 'lucide-react';

interface MobileMenuItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
}

const MobileMenuItem = ({ item, isActive, handleNavigation }: MobileMenuItemProps) => {
  // Get icon component if icon name is provided
  const iconName = item.icon as keyof typeof Icons;
  const hasIcon = item.icon && Icons[iconName];
  
  if (!item.items) {
    return (
      <button
        key={item.title}
        onClick={() => item.path && handleNavigation(item.path)}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium w-full text-left",
          item.path && isActive(item.path)
            ? "bg-primary/10 text-primary"
            : "text-gray-700 hover:bg-gray-50"
        )}
      >
        {hasIcon && React.createElement(Icons[iconName], { className: "h-5 w-5" })}
        {item.title}
      </button>
    );
  }
  
  return null;
};

export default MobileMenuItem;
