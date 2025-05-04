
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown } from 'lucide-react';

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink
} from "@/components/ui/navigation-menu";

const MainNav = () => {
  const { user, isAdmin, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user permissions
  const permissions = user?.modulePermissions || {
    incidentReporting: true,
    allIncidents: true,
    insights: true,
    benchmarking: false
  };
  
  const isActive = (path: string) => location.pathname === path;
  
  // Main navigation items
  const mainNavItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      allowed: true,
    }
  ];
  
  // Incident management items
  const incidentItems = [
    {
      label: 'Report Incident',
      path: '/report',
      allowed: permissions.incidentReporting,
    },
    {
      label: 'All Incidents',
      path: '/incidents',
      allowed: permissions.allIncidents,
    }
  ];
  
  // Analytics items
  const analyticsItems = [
    {
      label: 'Insights',
      path: '/insights',
      allowed: permissions.insights,
    },
    {
      label: 'Benchmarking',
      path: '/benchmarking',
      allowed: permissions.benchmarking,
    }
  ];
  
  // Admin items
  const adminItems = [
    {
      label: 'User Management',
      path: '/users',
      allowed: isAdmin,
    },
    {
      label: 'Facility Management',
      path: '/facilities',
      allowed: isAdmin,
    },
    {
      label: 'Configuration',
      path: '/configuration',
      allowed: isAdmin,
    }
  ];

  // SaaS owner items
  const saasOwnerItems = [
    {
      label: 'Client Management',
      path: '/backoffice/clients',
      allowed: isSaasOwner,
    },
    {
      label: 'Analytics',
      path: '/backoffice/analytics',
      allowed: isSaasOwner,
    },
    {
      label: 'Settings',
      path: '/backoffice/settings',
      allowed: isSaasOwner,
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <NavigationMenu className="mx-auto">
          <NavigationMenuList>
            {/* Main navigation items */}
            {mainNavItems.map((item) => (
              item.allowed && (
                <NavigationMenuItem key={item.path}>
                  <NavigationMenuLink
                    className={`block px-4 py-3 text-sm ${
                      isActive(item.path)
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-700 hover:text-gray-900'
                    } transition-colors`}
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.label}
                  </NavigationMenuLink>
                </NavigationMenuItem>
              )
            ))}
            
            {/* Incidents dropdown */}
            {incidentItems.some(item => item.allowed) && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                  Incidents
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-48 p-2">
                    {incidentItems.filter(item => item.allowed).map((item) => (
                      <NavigationMenuLink
                        key={item.path}
                        className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                        onClick={() => handleNavigation(item.path)}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
            
            {/* Analytics dropdown */}
            {analyticsItems.some(item => item.allowed) && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                  Analytics
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-48 p-2">
                    {analyticsItems.filter(item => item.allowed).map((item) => (
                      <NavigationMenuLink
                        key={item.path}
                        className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                        onClick={() => handleNavigation(item.path)}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
            
            {/* Admin dropdown */}
            {adminItems.some(item => item.allowed) && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                  Administration
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-48 p-2">
                    {adminItems.filter(item => item.allowed).map((item) => (
                      <NavigationMenuLink
                        key={item.path}
                        className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                        onClick={() => handleNavigation(item.path)}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
            
            {/* SaaS owner items */}
            {saasOwnerItems.some(item => item.allowed) && (
              <NavigationMenuItem>
                <NavigationMenuTrigger className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900">
                  Backoffice
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-48 p-2">
                    {saasOwnerItems.filter(item => item.allowed).map((item) => (
                      <NavigationMenuLink
                        key={item.path}
                        className="block px-3 py-2 text-sm rounded-md hover:bg-gray-100"
                        onClick={() => handleNavigation(item.path)}
                      >
                        {item.label}
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default MainNav;
