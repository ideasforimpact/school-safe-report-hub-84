
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
    <div className="flex items-center whitespace-nowrap">
      <Link to={dashboardPath} className="flex items-center">
        {userClient?.logo ? (
          <img 
            src={userClient.logo} 
            alt={`${userClient.name} logo`}
            className="h-8 w-auto ml-0"
          />
        ) : (
          <div className="h-8 w-8 bg-primary-100 rounded-md flex items-center justify-center ml-0">
            <ShieldCheck className="h-5 w-5 text-primary-600" />
          </div>
        )}
        
        <h1 className="text-lg font-bold text-gray-800 ml-2 truncate">
          Safe School
        </h1>
      </Link>
    </div>
  );
};

export default HeaderLogo;
