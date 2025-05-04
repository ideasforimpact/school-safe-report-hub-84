
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, ChevronDown } from 'lucide-react';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const MainNav = () => {
  const { user, isAdmin, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get user permissions
  const permissions = user?.modulePermissions || {
    incidentReporting: true,
    allIncidents: true,
    insights: true,
    benchmarking: false
  };
  
  const isActive = (path: string) => location.pathname === path;
  
  // Navigation structure
  const navigation = [
    {
      title: "Dashboard",
      path: "/dashboard",
      allowed: true,
    },
    {
      title: "Incidents",
      allowed: permissions.incidentReporting || permissions.allIncidents,
      items: [
        {
          title: "Report Incident",
          path: "/report-incident",
          allowed: permissions.incidentReporting,
        },
        {
          title: "All Incidents",
          path: "/incidents",
          allowed: permissions.allIncidents,
        }
      ]
    },
    {
      title: "Analytics",
      allowed: permissions.insights || permissions.benchmarking,
      items: [
        {
          title: "Insights",
          path: "/insights",
          allowed: permissions.insights,
        },
        {
          title: "Benchmarking",
          path: "/benchmarking",
          allowed: permissions.benchmarking,
        }
      ]
    },
    {
      title: "Administration",
      allowed: isAdmin,
      items: [
        {
          title: "User Management",
          path: "/users",
          allowed: isAdmin,
        },
        {
          title: "Facility Management",
          path: "/facilities",
          allowed: isAdmin,
        },
        {
          title: "Configuration",
          path: "/configuration",
          allowed: isAdmin,
        }
      ]
    },
  ];

  // Special case for SaaS owners
  const backofficeItems = [
    {
      title: "Backoffice",
      allowed: isSaasOwner,
      items: [
        {
          title: "Dashboard",
          path: "/backoffice",
          allowed: isSaasOwner,
        },
        {
          title: "Client Management",
          path: "/backoffice/clients",
          allowed: isSaasOwner,
        },
        {
          title: "Analytics",
          path: "/backoffice/analytics",
          allowed: isSaasOwner,
        },
        {
          title: "Settings",
          path: "/backoffice/settings",
          allowed: isSaasOwner,
        }
      ]
    }
  ];

  const allNavItems = [...navigation, ...backofficeItems].filter(item => item.allowed);

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

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
          <div className="hidden md:flex md:flex-1">
            <NavigationMenu className="mx-auto md:mx-0">
              <NavigationMenuList>
                {allNavItems.map((item) => {
                  // Regular menu item without dropdown
                  if (!item.items) {
                    return (
                      <NavigationMenuItem key={item.title}>
                        <NavigationMenuLink asChild>
                          <button
                            onClick={() => handleNavigation(item.path as string)}
                            className={cn(
                              "px-4 py-2 text-sm font-medium",
                              isActive(item.path as string)
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
                  
                  // Dropdown menu item
                  const dropdownItems = item.items?.filter(subItem => subItem.allowed) || [];
                  if (dropdownItems.length === 0) return null;
                  
                  return (
                    <NavigationMenuItem key={item.title}>
                      <NavigationMenuTrigger className={cn(
                        "px-4 py-2 text-sm font-medium",
                        dropdownItems.some(i => isActive(i.path)) 
                          ? "text-primary font-semibold" 
                          : "text-gray-700"
                      )}>
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[200px] gap-1 p-2">
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
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {allNavItems.map(item => {
              // Regular item
              if (!item.items) {
                return (
                  <button
                    key={item.title}
                    onClick={() => handleNavigation(item.path as string)}
                    className={cn(
                      "block px-3 py-2 rounded-md text-base font-medium w-full text-left",
                      isActive(item.path as string)
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    {item.title}
                  </button>
                );
              }

              // Dropdown items for mobile
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
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MainNav;
