
import { cn } from "@/lib/utils";
import { NavItem } from "./types";

interface MobileDropdownItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
}

const MobileDropdownItem = ({ item, isActive, handleNavigation }: MobileDropdownItemProps) => {
  const dropdownItems = item.items?.filter(subItem => subItem.allowed) || [];
  if (dropdownItems.length === 0) return null;

  return (
    <div key={item.title} className="space-y-1">
      <div className="px-3 py-2 text-base font-medium text-gray-900 border-b border-gray-200">
        {item.title}
      </div>
      <div className="pl-4 space-y-1">
        {dropdownItems.map(subItem => (
          <button
            key={subItem.title}
            onClick={() => handleNavigation(subItem.path)}
            className={cn(
              "block px-3 py-2 rounded-md text-sm w-full text-left",
              isActive(subItem.path)
                ? "bg-primary/10 text-primary font-medium"
                : "text-gray-700 hover:bg-gray-50"
            )}
          >
            {subItem.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileDropdownItem;
