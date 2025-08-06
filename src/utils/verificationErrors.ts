export interface VerificationError {
  code: string;
  message: string;
  type: 'validation' | 'api' | 'server' | 'network';
  documentType?: string;
  retry?: boolean;
}

// Document type specific error mappings
export const DocumentVerificationErrors = {
  // PAN Card errors
  PAN: {
    INVALID_FORMAT: {
      code: 'PAN_INVALID_FORMAT',
      message: 'Please enter a valid PAN number (e.g., ABCDE1234F)',
      type: 'validation' as const,
      retry: false
    },
    INVALID_PAN: {
      code: 'PAN_INVALID',
      message: 'This PAN number is not found in government records',
      type: 'api' as const,
      retry: false
    },
    ALREADY_LINKED: {
      code: 'PAN_ALREADY_LINKED',
      message: 'This PAN is already linked to another Aadhaar',
      type: 'api' as const,
      retry: false
    },
    VERIFICATION_FAILED: {
      code: 'PAN_VERIFICATION_FAILED',
      message: 'PAN verification failed. Please check the number and try again.',
      type: 'api' as const,
      retry: true
    }
  },

  // Aadhaar Card errors
  AADHAAR: {
    INVALID_FORMAT: {
      code: 'AADHAAR_INVALID_FORMAT',
      message: 'Please enter a valid 12-digit Aadhaar number',
      type: 'validation' as const,
      retry: false
    },
    INVALID_AADHAAR: {
      code: 'AADHAAR_INVALID',
      message: 'This Aadhaar number is not found in UIDAI records',
      type: 'api' as const,
      retry: false
    },
    NOT_LINKED: {
      code: 'AADHAAR_NOT_LINKED',
      message: 'This Aadhaar is not linked to a mobile number',
      type: 'api' as const,
      retry: false
    },
    OTP_FAILED: {
      code: 'AADHAAR_OTP_FAILED',
      message: 'Invalid OTP. Please request a new OTP and try again.',
      type: 'api' as const,
      retry: true
    }
  },

  // Voter ID errors
  VOTER_ID: {
    INVALID_FORMAT: {
      code: 'VOTER_ID_INVALID_FORMAT',
      message: 'Please enter a valid Voter ID number',
      type: 'validation' as const,
      retry: false
    },
    INVALID_VOTER_ID: {
      code: 'VOTER_ID_INVALID',
      message: 'This Voter ID is not found in electoral records',
      type: 'api' as const,
      retry: false
    },
    EXPIRED: {
      code: 'VOTER_ID_EXPIRED',
      message: 'This Voter ID appears to be expired or inactive',
      type: 'api' as const,
      retry: false
    }
  },

  // Driving License errors
  DRIVING_LICENSE: {
    INVALID_FORMAT: {
      code: 'DL_INVALID_FORMAT',
      message: 'Please enter a valid Driving License number',
      type: 'validation' as const,
      retry: false
    },
    INVALID_DL: {
      code: 'DL_INVALID',
      message: 'This Driving License number is not found in RTO records',
      type: 'api' as const,
      retry: false
    },
    EXPIRED: {
      code: 'DL_EXPIRED',
      message: 'This Driving License has expired',
      type: 'api' as const,
      retry: false
    },
    DOB_MISMATCH: {
      code: 'DL_DOB_MISMATCH',
      message: 'Date of birth doesn\'t match with Driving License records',
      type: 'api' as const,
      retry: false
    }
  },

  // Bank Account errors
  BANK_ACCOUNT: {
    INVALID_ACCOUNT_FORMAT: {
      code: 'BANK_INVALID_ACCOUNT_FORMAT',
      message: 'Please enter a valid bank account number',
      type: 'validation' as const,
      retry: false
    },
    INVALID_IFSC: {
      code: 'BANK_INVALID_IFSC',
      message: 'Please enter a valid IFSC code',
      type: 'validation' as const,
      retry: false
    },
    ACCOUNT_NOT_FOUND: {
      code: 'BANK_ACCOUNT_NOT_FOUND',
      message: 'This bank account is not found or inactive',
      type: 'api' as const,
      retry: false
    },
    IFSC_MISMATCH: {
      code: 'BANK_IFSC_MISMATCH',
      message: 'IFSC code doesn\'t match with the account number',
      type: 'api' as const,
      retry: false
    }
  },

  // Server/API errors
  SERVER: {
    CONNECTION_TIMEOUT: {
      code: 'CONNECTION_TIMEOUT',
      message: 'Verification service is temporarily unavailable. Please try again.',
      type: 'network' as const,
      retry: true
    },
    API_LIMIT_EXCEEDED: {
      code: 'API_LIMIT_EXCEEDED',
      message: 'Too many verification attempts. Please try again after some time.',
      type: 'api' as const,
      retry: true
    },
    INTERNAL_ERROR: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong during verification. Please try again.',
      type: 'server' as const,
      retry: true
    }
  }
};

// Function to get user-friendly error message from API response
export function getVerificationErrorMessage(
  documentType: string,
  apiResponse: any,
  fallbackMessage?: string
): VerificationError {
  const docType = documentType.toUpperCase().replace(' ', '_');
  
  // Check for specific API error codes or messages
  if (apiResponse?.message) {
    const message = apiResponse.message.toLowerCase();
    
    // PAN specific errors
    if (docType.includes('PAN')) {
      if (message.includes('invalid pan') || message.includes('pan not found')) {
        return DocumentVerificationErrors.PAN.INVALID_PAN;
      }
      if (message.includes('format') || message.includes('pattern')) {
        return DocumentVerificationErrors.PAN.INVALID_FORMAT;
      }
      if (message.includes('already linked')) {
        return DocumentVerificationErrors.PAN.ALREADY_LINKED;
      }
    }
    
    // Aadhaar specific errors
    if (docType.includes('AADHAAR') || docType.includes('AADHAR')) {
      if (message.includes('invalid aadhaar') || message.includes('aadhaar not found')) {
        return DocumentVerificationErrors.AADHAAR.INVALID_AADHAAR;
      }
      if (message.includes('not linked') || message.includes('mobile')) {
        return DocumentVerificationErrors.AADHAAR.NOT_LINKED;
      }
      if (message.includes('otp') && message.includes('invalid')) {
        return DocumentVerificationErrors.AADHAAR.OTP_FAILED;
      }
    }
    
    // Voter ID specific errors
    if (docType.includes('VOTER')) {
      if (message.includes('invalid voter') || message.includes('voter id not found')) {
        return DocumentVerificationErrors.VOTER_ID.INVALID_VOTER_ID;
      }
      if (message.includes('expired') || message.includes('inactive')) {
        return DocumentVerificationErrors.VOTER_ID.EXPIRED;
      }
    }
    
    // Driving License specific errors
    if (docType.includes('DRIVING') || docType.includes('LICENSE')) {
      if (message.includes('invalid driving') || message.includes('not found in rto')) {
        return DocumentVerificationErrors.DRIVING_LICENSE.INVALID_DL;
      }
      if (message.includes('expired')) {
        return DocumentVerificationErrors.DRIVING_LICENSE.EXPIRED;
      }
      if (message.includes('dob') || message.includes('date of birth')) {
        return DocumentVerificationErrors.DRIVING_LICENSE.DOB_MISMATCH;
      }
    }
    
    // Bank Account specific errors
    if (docType.includes('BANK')) {
      if (message.includes('account not found') || message.includes('inactive')) {
        return DocumentVerificationErrors.BANK_ACCOUNT.ACCOUNT_NOT_FOUND;
      }
      if (message.includes('ifsc') && message.includes('mismatch')) {
        return DocumentVerificationErrors.BANK_ACCOUNT.IFSC_MISMATCH;
      }
      if (message.includes('invalid ifsc')) {
        return DocumentVerificationErrors.BANK_ACCOUNT.INVALID_IFSC;
      }
    }
    
    // Generic server/API errors
    if (message.includes('timeout') || message.includes('connection')) {
      return DocumentVerificationErrors.SERVER.CONNECTION_TIMEOUT;
    }
    if (message.includes('limit') || message.includes('too many')) {
      return DocumentVerificationErrors.SERVER.API_LIMIT_EXCEEDED;
    }
  }
  
  // HTTP status code based errors
  if (apiResponse?.status === 429) {
    return DocumentVerificationErrors.SERVER.API_LIMIT_EXCEEDED;
  }
  if (apiResponse?.status === 408 || apiResponse?.status === 504) {
    return DocumentVerificationErrors.SERVER.CONNECTION_TIMEOUT;
  }
  
  // Default fallback with document type context
  const documentDisplayName = getDocumentDisplayName(documentType);
  return {
    code: 'VERIFICATION_FAILED',
    message: fallbackMessage || `Something went wrong during ${documentDisplayName} verification. Please try again.`,
    type: 'server',
    retry: true,
    documentType: documentDisplayName
  };
}

// Function to get human-readable document type names
export function getDocumentDisplayName(documentType: string): string {
  const typeMap: Record<string, string> = {
    'pan': 'PAN Card',
    'aadhar': 'Aadhaar Card',
    'aadhaar': 'Aadhaar Card',
    'voter_id': 'Voter ID',
    'driving_license': 'Driving License',
    'bank_account': 'Bank Account',
    'bank_statement': 'Bank Statement',
    'other': 'Document'
  };
  
  return typeMap[documentType.toLowerCase()] || 'Document';
}

// Function to get validation hints for document types
export function getValidationHints(documentType: string): string[] {
  const hints: Record<string, string[]> = {
    pan: [
      'PAN format: ABCDE1234F',
      '5 letters + 4 digits + 1 letter',
      'Example: BNZAA2318J'
    ],
    aadhar: [
      'Aadhaar is a 12-digit number',
      'Example: 1234 5678 9012',
      'Ensure it\'s linked to your mobile number'
    ],
    voter_id: [
      'Voter ID format varies by state',
      'Usually 3 letters + 7 digits',
      'Example: ABC1234567'
    ],
    driving_license: [
      'DL format varies by state',
      'Usually state code + numbers',
      'Example: MH-01 20110012345'
    ],
    bank_account: [
      'Enter complete account number',
      'IFSC format: BANK0001234',
      '4 letters + 7 characters'
    ]
  };
  
  return hints[documentType.toLowerCase()] || [];
}