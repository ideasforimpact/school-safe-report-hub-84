
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldCheck, HomeIcon, FileText, CreditCard, HelpCircle, Users } from 'lucide-react';

const HomeNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto py-4 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <ShieldCheck className="h-8 w-8 text-primary mr-2" />
            <h1 className="text-2xl font-bold text-primary">Safe School</h1>
          </div>
          <div className="flex flex-wrap gap-2 md:gap-6">
            <Link 
              to="/" 
              className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
            >
              <HomeIcon className="h-4 w-4 mr-1" />
              Home
            </Link>
            <Link 
              to="/blog" 
              className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
            >
              <FileText className="h-4 w-4 mr-1" />
              Blog
            </Link>
            <Link 
              to="/pricing" 
              className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Pricing
            </Link>
            <Link 
              to="/support" 
              className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Support
            </Link>
            <Link 
              to="/backoffice" 
              className="flex items-center text-gray-700 hover:text-primary transition-colors font-medium"
            >
              <Users className="h-4 w-4 mr-1" />
              Backoffice
            </Link>
            <div className="ml-0 md:ml-4 mt-4 md:mt-0 w-full md:w-auto flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="transition-all hover:bg-primary hover:text-white"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => navigate('/login')}
                className="bg-primary hover:bg-primary/80 transition-all"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;
