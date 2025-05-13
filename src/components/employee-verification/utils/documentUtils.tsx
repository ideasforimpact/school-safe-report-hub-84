
import React from 'react';
import { CreditCard, FileText, Wallet, Car, Globe, Building, Users } from 'lucide-react';

export const getDocumentIcon = (documentTypeName: string) => {
  switch (documentTypeName) {
    case 'aadhar':
      return <CreditCard className="h-4 w-4 text-blue-500" />;
    case 'pan':
      return <FileText className="h-4 w-4 text-amber-500" />;
    case 'driving_license':
      return <Car className="h-4 w-4 text-purple-500" />;
    case 'passport':
      return <Globe className="h-4 w-4 text-cyan-500" />;
    case 'bank_account':
      return <Building className="h-4 w-4 text-green-500" />;
    case 'voter_id':
      return <Users className="h-4 w-4 text-pink-500" />;
    default:
      return <Wallet className="h-4 w-4 text-gray-500" />;
  }
};

export const formatDocumentTypeName = (name: string): string => {
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
