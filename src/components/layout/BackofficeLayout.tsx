
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from 'react-router-dom';

interface BackofficeLayoutProps {
  children: ReactNode;
}

const BackofficeLayout = ({ children }: BackofficeLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top nav */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Safe School Backoffice</h1>
            </div>
            <Link 
              to="/"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Main Site</span>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Tabs navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="w-full justify-start h-16">
              <TabsTrigger 
                value="dashboard" 
                className={`${isActive('/backoffice') ? 'border-b-2 border-primary' : ''}`}
                onClick={() => navigate('/backoffice')}
              >
                Dashboard
              </TabsTrigger>
              <TabsTrigger 
                value="clients" 
                className={`${isActive('/backoffice/clients') ? 'border-b-2 border-primary' : ''}`}
                onClick={() => navigate('/backoffice/clients')}
              >
                Client Management
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className={`${isActive('/backoffice/analytics') ? 'border-b-2 border-primary' : ''}`}
                onClick={() => navigate('/backoffice/analytics')}
              >
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="settings" 
                className={`${isActive('/backoffice/settings') ? 'border-b-2 border-primary' : ''}`}
                onClick={() => navigate('/backoffice/settings')}
              >
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Main content */}
      <main className="container mx-auto py-8 px-6">
        {children}
      </main>
    </div>
  );
};

export default BackofficeLayout;
