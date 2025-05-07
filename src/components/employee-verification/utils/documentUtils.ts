
import { VerificationDocumentType } from '@/types/employeeVerification';

/**
 * Gets a human-readable label for a document type
 */
export const getDocumentTypeLabel = (type: VerificationDocumentType): string => {
  switch (type) {
    case 'aadhar': return 'Aadhar Card';
    case 'pan': return 'PAN Card';
    case 'driving_license': return 'Driving License';
    case 'passport': return 'Passport';
    case 'voter_id': return 'Voter ID';
    case 'bank_account': return 'Bank Account';
    default: return type;
  }
};

/**
 * Gets a placeholder text for document number input based on type
 */
export const getDocumentPlaceholder = (type: VerificationDocumentType): string => {
  switch (type) {
    case 'aadhar': return '1234 5678 9012';
    case 'pan': return 'ABCDE1234F';
    case 'driving_license': return 'DL98765432109876';
    case 'passport': return 'A1234567';
    case 'voter_id': return 'XYZ1234567';
    default: return 'XXXX1234';
  }
};
