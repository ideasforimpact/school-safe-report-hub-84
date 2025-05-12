
import { FileText, CreditCard, Passport, File, Car, FileCheck } from 'lucide-react';
import React from 'react';
import { VerificationDocumentType } from '@/types/employeeVerification';

export const getDocumentIcon = (documentType: VerificationDocumentType): React.ReactNode => {
  switch (documentType) {
    case 'aadhar':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case 'pan':
      return <CreditCard className="h-4 w-4 text-orange-600" />;
    case 'passport':
      return <Passport className="h-4 w-4 text-green-600" />;
    case 'driving_license':
      return <Car className="h-4 w-4 text-red-600" />;
    case 'voter_id':
      return <FileCheck className="h-4 w-4 text-purple-600" />;
    case 'bank_account':
      return <FileText className="h-4 w-4 text-yellow-600" />;
    default:
      return <File className="h-4 w-4 text-gray-600" />;
  }
};

export const getDocumentDisplayName = (documentType: VerificationDocumentType): string => {
  return documentType.replace('_', ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};
