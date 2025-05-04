
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  PieChart,
  AlertTriangle,
  List,
  Users,
  Building,
  BarChart,
  Settings,
  User,
  Briefcase,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar
} from '@/components/ui/sidebar';

const Sidebar = () => {
  const { user, isAdmin, isSaasOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useSidebar();
  
  // If user is a SaaS owner, don't render the sidebar since they use the horizontal navigation
  if (isSaasOwner) {
    return null;
  }
  
  // Get user permissions
  const permissions = user?.modulePermissions || {
    incidentReporting: true,
    allIncidents: true,
    insights: true,
    benchmarking: false
  };

  // Client Admin and User Menu Items
  const clientItems = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      allowed: true,
    },
    {
      icon: AlertTriangle,
      label: 'Report Incident',
      path: '/report',
      allowed: permissions.incidentReporting,
    },
    {
      icon: List,
      label: 'All Incidents',
      path: '/incidents',
      allowed: permissions.allIncidents,
    },
    {
      icon: PieChart,
      label: 'Insights',
      path: '/insights',
      allowed: permissions.insights,
    },
    {
      icon: BarChart,
      label: 'Benchmarking',
      path: '/benchmarking',
      allowed: permissions.benchmarking,
    },
    {
      icon: Users,
      label: 'User Management',
      path: '/users',
      allowed: isAdmin && !isSaasOwner,
    },
    {
      icon: GraduationCap,
      label: 'Student Management',
      path: '/students',
      allowed: isAdmin && !isSaasOwner,
    },
    {
      icon: Building,
      label: 'Facility Management',
      path: '/facilities',
      allowed: isAdmin && !isSaasOwner,
    },
    {
      icon: Settings,
      label: 'Configuration',
      path: '/configuration',
      allowed: isAdmin && !isSaasOwner,
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <ShadcnSidebar collapsible="icon" variant="sidebar">
      <div className="flex justify-end p-2">
        <SidebarTrigger>
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </SidebarTrigger>
      </div>
      <SidebarContent>
        <SidebarMenu>
          {clientItems
            .filter(item => item.allowed)
            .map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton 
                onClick={() => navigate(item.path)}
                isActive={isActive(item.path)}
                tooltip={item.label}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </ShadcnSidebar>
  );
};

export default Sidebar;
