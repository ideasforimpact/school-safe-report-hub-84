
import { NavItem } from "./types";
import MobileMenuItem from "./MobileMenuItem";
import MobileDropdownItem from "./MobileDropdownItem";

interface MobileNavigationProps {
  isOpen: boolean;
  navItems: NavItem[];
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
}

const MobileNavigation = ({ 
  isOpen, 
  navItems, 
  isActive, 
  handleNavigation 
}: MobileNavigationProps) => {
  if (!isOpen) return null;

  return (
    <div className="md:hidden bg-white shadow-lg">
      <div className="px-2 pt-2 pb-3 space-y-1">
        {navItems.map(item => {
          if (!item.items) {
            return (
              <MobileMenuItem 
                key={item.title}
                item={item} 
                isActive={isActive} 
                handleNavigation={handleNavigation} 
              />
            );
          }

          return (
            <MobileDropdownItem 
              key={item.title}
              item={item} 
              isActive={isActive} 
              handleNavigation={handleNavigation} 
            />
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation;
