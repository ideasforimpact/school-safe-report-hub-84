
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Client } from '@/contexts/ClientContext';

interface HeaderLogoProps {
  userClient: Client | null;
  isSaasOwner: boolean;
  dashboardPath: string;
}

const HeaderLogo = ({ userClient, isSaasOwner, dashboardPath }: HeaderLogoProps) => {
  return (
    <div className="flex items-center space-x-3 flex-shrink-0">
      <Link to={dashboardPath} className="flex items-center space-x-3">
        {userClient?.logo ? (
          <img 
            src={userClient.logo} 
            alt={`${userClient.name} logo`}
            className="h-14 w-auto"
          />
        ) : (
          <div className="h-14 w-14 bg-primary-100 rounded-md flex items-center justify-center">
            <ShieldCheck className="h-8 w-8 text-primary-600" />
          </div>
        )}
        
        <h1 className="text-xl font-bold text-gray-800 whitespace-nowrap">
          Safe School
        </h1>
      </Link>
    </div>
  );
};

export default HeaderLogo;
