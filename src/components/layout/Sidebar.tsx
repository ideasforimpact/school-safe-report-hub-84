
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  Home, 
  FileText, 
  PieChart,
  AlertTriangle,
  List,
  CheckSquare,
  Users,
  Edit 
} from 'lucide-react';

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
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
      allowed: true,
    },
    {
      icon: List,
      label: 'All Incidents',
      path: '/incidents',
      allowed: true,
    },
    {
      icon: CheckSquare,
      label: 'My Action Items',
      path: '/my-actions',
      allowed: true,
    },
    {
      icon: PieChart,
      label: 'Insights',
      path: '/insights',
      allowed: isAdmin, // Only admin can access insights
    },
    {
      icon: Users,
      label: 'User Management',
      path: '/users',
      allowed: isAdmin, // Only admin can access user management
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="bg-gray-50 w-64 min-h-screen py-6 hidden md:block">
      <nav>
        <ul className="space-y-2 px-4">
          {menuItems
            .filter(item => item.allowed)
            .map((item) => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                  isActive(item.path)
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
