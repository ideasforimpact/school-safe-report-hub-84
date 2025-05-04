
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NavItem } from './types';

export function useNavigation() {
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
  const navigation: NavItem[] = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: "home",
      allowed: true,
    },
    {
      title: "Incidents",
      icon: "flag",
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
      icon: "bar-chart",
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
      icon: "settings",
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
  const backofficeItems: NavItem[] = [
    {
      title: "Backoffice",
      icon: "briefcase",
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

  // Check if an item or any of its subitems is active
  const isItemActive = (item: NavItem): boolean => {
    // If the item has a direct path and it's active
    if (item.path && isActive(item.path)) {
      return true;
    }
    
    // If the item has subitems, check if any of them are active
    if (item.items) {
      return item.items.some(subItem => subItem.path && isActive(subItem.path));
    }
    
    return false;
  };

  return {
    allNavItems,
    isActive,
    isItemActive,
    handleNavigation,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  };
}
