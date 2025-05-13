
import { FileText, CreditCard, File, Car, FileCheck, Briefcase } from 'lucide-react';
import React from 'react';
import { VerificationDocumentType } from '@/types/employeeVerification';

export const getDocumentIcon = (documentType: string): React.ReactNode => {
  switch (documentType) {
    case 'aadhar':
      return <CreditCard className="h-4 w-4 text-blue-600" />;
    case 'pan':
      return <CreditCard className="h-4 w-4 text-orange-600" />;
    case 'passport':
      return <Briefcase className="h-4 w-4 text-green-600" />;
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

export const getDocumentDisplayName = (documentType: string): string => {
  return documentType.replace('_', ' ').split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export const getDocumentTypeLabel = (documentType: string): string => {
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

export const getDocumentPlaceholder = (documentType: string): string => {
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

export const getStatusDisplayName = (statusName: string): string => {
  switch (statusName) {
    case 'pending':
      return 'Pending';
    case 'governance':
      return 'Governance Verified';
    case 'manual':
      return 'Manually Verified';
    case 'rejected':
      return 'Rejected';
    default:
      return statusName;
  }
};

export const getStatusColorClass = (statusName: string): { bg: string; text: string; border: string } => {
  switch (statusName) {
    case 'pending':
      return { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200' };
    case 'governance':
      return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
    case 'manual':
      return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
    case 'rejected':
      return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  }
};
