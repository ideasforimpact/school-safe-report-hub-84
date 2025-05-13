
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

// Add the missing functions
export const getDocumentTypeLabel = (typeName: string): string => {
  const documentTypeLabels: Record<string, string> = {
    'aadhar': 'Aadhar Card',
    'pan': 'PAN Card',
    'driving_license': 'Driving License',
    'passport': 'Passport',
    'voter_id': 'Voter ID',
    'bank_account': 'Bank Account',
    'other': 'Other Document'
  };

  return documentTypeLabels[typeName] || formatDocumentTypeName(typeName);
};

export const getStatusDisplayName = (status: string): string => {
  const statusDisplayNames: Record<string, string> = {
    'pending': 'Pending',
    'verified': 'Verified',
    'failed': 'Failed',
    'rejected': 'Rejected',
    'expired': 'Expired',
    'governance': 'Governance Verified',
  };

  return statusDisplayNames[status] || formatDocumentTypeName(status);
};

export const getDocumentPlaceholder = (documentType: string): string => {
  switch (documentType) {
    case 'aadhar':
      return 'xxxx xxxx xxxx';
    case 'pan':
      return 'ABCDE1234F';
    case 'driving_license':
      return 'DL12 20123456789';
    case 'passport':
      return 'A1234567';
    case 'voter_id':
      return 'ABC1234567';
    case 'bank_account':
      return 'Account Number';
    default:
      return 'Document Reference Number';
  }
};
