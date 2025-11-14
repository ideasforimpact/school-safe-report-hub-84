
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Client } from '@/contexts/ClientContext';
import { buildClientLogoUrl } from '@/lib/utils';

interface HeaderLogoProps {
  userClient: Client | null;
  isSaasOwner: boolean;
  dashboardPath: string;
}

const HeaderLogo = ({ userClient, isSaasOwner, dashboardPath }: HeaderLogoProps) => {
  // Build logo URL from path if needed
  const logoUrl = userClient?.logo ? buildClientLogoUrl(userClient.logo) : undefined;
  
  // Debug logging for client logo
  console.log('HeaderLogo Debug:', {
    userClient,
    hasLogo: !!logoUrl,
    logoUrl: logoUrl,
    originalLogo: userClient?.logo,
    clientName: userClient?.name
  });

  return (
    <div className="flex items-center space-x-3 flex-shrink-0">
      <Link to={dashboardPath} className="flex items-center space-x-3">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={`${userClient?.name || 'Client'} logo`}
            className="h-12 w-auto object-contain"
            onError={(e) => {
              console.error('Logo failed to load:', logoUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="h-12 w-12 bg-primary/10 rounded-md flex items-center justify-center border border-primary/20">
            <ShieldCheck className="h-7 w-7 text-primary" />
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
