
import { FileText, CreditCard, File, Car, FileCheck, Briefcase } from 'lucide-react';
import React from 'react';
import { VerificationDocumentType } from '@/types/employeeVerification';

export const getDocumentIcon = (documentType: VerificationDocumentType): React.ReactNode => {
  switch (documentType) {
    case 'aadhar':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case 'pan':
      return <CreditCard className="h-4 w-4 text-orange-600" />;
    case 'passport':
      return <Briefcase className="h-4 w-4 text-green-600" />; // Changed Passport to Briefcase
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

// Add the missing functions
export const getDocumentTypeLabel = (documentType: VerificationDocumentType): string => {
  switch (documentType) {
    case 'aadhar':
      return 'Aadhar Card';
    case 'pan':
      return 'PAN Card';
    case 'passport':
      return 'Passport';
    case 'driving_license':
      return 'Driving License';
    case 'voter_id':
      return 'Voter ID';
    case 'bank_account':
      return 'Bank Account';
    case 'other':
      return 'Other Document';
    default:
      return 'Document';
  }
};

export const getDocumentPlaceholder = (documentType: VerificationDocumentType): string => {
  switch (documentType) {
    case 'aadhar':
      return 'Enter 12-digit Aadhar number';
    case 'pan':
      return 'Enter 10-digit PAN number';
    case 'passport':
      return 'Enter passport number';
    case 'driving_license':
      return 'Enter driving license number';
    case 'voter_id':
      return 'Enter voter ID number';
    case 'bank_account':
      return 'Enter account number';
    case 'other':
      return 'Enter document reference (optional)';
    default:
      return 'Enter document number';
  }
};
