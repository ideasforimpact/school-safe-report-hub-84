
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Client } from '@/contexts/ClientContext';

interface HeaderLogoProps {
  userClient: Client | null;
  isSaasOwner: boolean;
  dashboardPath: string;
}

const HeaderLogo = ({ userClient, isSaasOwner, dashboardPath }: HeaderLogoProps) => {
  // Debug logging for client logo
  console.log('HeaderLogo Debug:', {
    userClient,
    hasLogo: !!userClient?.logo,
    logoUrl: userClient?.logo,
    clientName: userClient?.name
  });

  return (
    <div className="flex items-center space-x-3 flex-shrink-0">
      <Link to={dashboardPath} className="flex items-center space-x-3">
        {userClient?.logo ? (
          <img 
            src={userClient.logo} 
            alt={`${userClient.name} logo`}
            className="h-14 w-auto object-contain"
            onError={(e) => {
              console.error('Logo failed to load:', userClient.logo);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="h-14 w-14 bg-primary/10 rounded-md flex items-center justify-center border border-primary/20">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
        )}
        
        <h1 className="text-xl font-bold text-foreground whitespace-nowrap">
          {userClient?.name || 'Safe School'}
        </h1>
      </Link>
    </div>
  );
};

export default HeaderLogo;
