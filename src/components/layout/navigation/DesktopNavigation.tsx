
import {
  NavigationMenu,
  NavigationMenuList
} from "@/components/ui/navigation-menu";
import { NavItem } from "./types";
import DesktopMenuItem from "./DesktopMenuItem";
import DesktopDropdownItem from "./DesktopDropdownItem";

interface DesktopNavigationProps {
  navItems: NavItem[];
  isActive: (path: string) => boolean;
  isItemActive: (item: NavItem) => boolean;
  handleNavigation: (path: string) => void;
}

const DesktopNavigation = ({ 
  navItems, 
  isActive, 
  isItemActive, 
  handleNavigation 
}: DesktopNavigationProps) => {
  return (
    <div className="hidden md:flex md:flex-1">
      <NavigationMenu className="mx-auto md:mx-0">
        <NavigationMenuList>
          {navItems.map((item) => {
            if (!item.items) {
              return (
                <DesktopMenuItem 
                  key={item.title}
                  item={item} 
                  isActive={isActive} 
                  handleNavigation={handleNavigation}
                  isItemActive={isItemActive}
                />
              );
            }
            
            return (
              <DesktopDropdownItem 
                key={item.title}
                item={item} 
                isActive={isActive} 
                handleNavigation={handleNavigation}
                isItemActive={isItemActive}
              />
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
};

export default DesktopNavigation;
