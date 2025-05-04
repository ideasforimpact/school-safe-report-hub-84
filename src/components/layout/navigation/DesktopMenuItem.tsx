
import { NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { NavItem } from "./types";

interface DesktopMenuItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
  isItemActive: (item: NavItem) => boolean;
}

const DesktopMenuItem = ({ item, isActive, handleNavigation, isItemActive }: DesktopMenuItemProps) => {
  // Regular menu item without dropdown
  if (!item.items) {
    return (
      <NavigationMenuItem key={item.title}>
        <NavigationMenuLink asChild>
          <button
            onClick={() => item.path && handleNavigation(item.path)}
            className={cn(
              "px-4 py-2 text-sm font-medium",
              item.path && isActive(item.path)
                ? "text-primary font-semibold"
                : "text-gray-700 hover:text-primary hover:bg-gray-50 rounded-md"
            )}
          >
            {item.title}
          </button>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  }
  
  return null;
};

export default DesktopMenuItem;
