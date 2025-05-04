
import React from 'react';

interface ClientLogoCellProps {
  name: string;
  logo?: string;
}

const ClientLogoCell = ({ name, logo }: ClientLogoCellProps) => {
  return (
    <>
      {logo ? (
        <div className="h-10 w-10 overflow-hidden rounded">
          <img 
            src={logo} 
            alt={`${name} logo`} 
            className="h-full w-full object-contain"
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
