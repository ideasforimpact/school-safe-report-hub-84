import React from 'react';
import { buildClientLogoUrl } from '@/lib/utils';

interface ClientLogoCellProps {
  name: string;
  logo?: string;
}

const ClientLogoCell = ({ name, logo }: ClientLogoCellProps) => {
  const logoUrl = logo ? buildClientLogoUrl(logo) : undefined;
  
  return (
    <>
      {logoUrl ? (
        <div className="h-10 w-10 overflow-hidden rounded">
          <img 
            src={logoUrl} 
            alt={`${name} logo`} 
            className="h-full w-full object-contain"
            onError={(e) => {
              console.error('Client logo failed to load:', logoUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </>
  );
};

export default ClientLogoCell;
