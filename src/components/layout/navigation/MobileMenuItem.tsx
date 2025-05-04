
import { cn } from "@/lib/utils";
import { NavItem } from "./types";

interface MobileMenuItemProps {
  item: NavItem;
  isActive: (path: string) => boolean;
  handleNavigation: (path: string) => void;
}

const MobileMenuItem = ({ item, isActive, handleNavigation }: MobileMenuItemProps) => {
  if (!item.items) {
    return (
      <button
        key={item.title}
        onClick={() => item.path && handleNavigation(item.path)}
        className={cn(
          "block px-3 py-2 rounded-md text-base font-medium w-full text-left",
          item.path && isActive(item.path)
            ? "bg-primary/10 text-primary"
            : "text-gray-700 hover:bg-gray-50"
        )}
      >
        {item.title}
      </button>
    );
  }
  
  return null;
};

export default MobileMenuItem;
