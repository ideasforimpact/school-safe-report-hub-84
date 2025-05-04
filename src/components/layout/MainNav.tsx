
import { Menu } from 'lucide-react';
import { useNavigation } from './navigation/useNavigation';
import DesktopNavigation from './navigation/DesktopNavigation';
import MobileNavigation from './navigation/MobileNavigation';

const MainNav = () => {
  const {
    allNavItems,
    isActive,
    isItemActive,
    handleNavigation,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useNavigation();

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="relative flex justify-between h-16">
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Desktop Navigation */}
          <DesktopNavigation
            navItems={allNavItems}
            isActive={isActive}
            isItemActive={isItemActive}
            handleNavigation={handleNavigation}
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMobileMenuOpen}
        navItems={allNavItems}
        isActive={isActive}
        handleNavigation={handleNavigation}
      />
    </div>
  );
};

export default MainNav;
