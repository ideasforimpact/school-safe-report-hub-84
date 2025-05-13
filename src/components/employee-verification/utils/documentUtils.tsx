
import React from 'react';
import { FileText, CreditCard, Car, Globe2 as Globe, FileCheck, Vote, File } from 'lucide-react';

export const getDocumentIcon = (documentType: string) => {
  switch (documentType) {
    case 'aadhar':
      return <CreditCard className="h-4 w-4 text-blue-500" />;
    case 'driving_license':
      return <Car className="h-4 w-4 text-green-500" />;
    case 'passport':
      return <Globe className="h-4 w-4 text-red-500" />;
    case 'pan':
      return <FileText className="h-4 w-4 text-yellow-500" />;
    case 'voter_id':
      return <Vote className="h-4 w-4 text-purple-500" />;
    case 'bank_account':
      return <FileCheck className="h-4 w-4 text-indigo-500" />;
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
};

export const formatDocumentTypeName = (documentType: string) => {
  switch (documentType) {
    case 'aadhar':
      return 'Aadhar Card';
    case 'driving_license':
      return 'Driving License';
    case 'passport':
      return 'Passport';
    case 'pan':
      return 'PAN Card';
    case 'voter_id':
      return 'Voter ID';
    case 'bank_account':
      return 'Bank Account';
    default:
      return documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

export const getDocumentPlaceholder = (documentTypeId: string) => {
  switch (documentTypeId) {
    case 'aadhar':
      return '1234 5678 9012';
    case 'driving_license':
      return 'DL1234567890123';
    case 'passport':
      return 'A1234567';
    case 'pan':
      return 'ABCDE1234F';
    case 'voter_id':
      return 'ABC1234567';
    case 'bank_account':
      return '12345678901234';
    default:
      return 'Enter document number';
  }
};

export const getDocumentTypeLabel = (documentType: string) => {
  return formatDocumentTypeName(documentType);
};

export const getStatusDisplayName = (status: string) => {
  switch (status) {
    case 'governance':
      return 'Governance';
    case 'rejected':
      return 'Rejected';
    case 'pending':
      return 'Pending';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};
