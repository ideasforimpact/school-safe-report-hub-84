import { Vehicle, VehicleVerificationField } from '@/types/transportSafety';

export interface DocumentStatus {
  status: 'valid' | 'expired' | 'expiring_soon' | 'missing';
  expiryDate?: Date | null;
}

// Define a type for verification log item
export interface VerificationLogItem {
  [timestamp: string]: VehicleVerificationField[];
}

/**
 * Get the latest verification log entry from a vehicle's verification data
 */
export const getLatestVerificationLog = (vehicle: any) => {
  if (!vehicle.verificationData) return null;
  
  // Find the verification_log entry
  const logEntry = vehicle.verificationData.find((item: any) => item.field === 'verification_log');
  if (!logEntry || !logEntry.value) return null;
  
  // Get the timestamps from the log
  const timestamps = Object.keys(logEntry.value);
  if (timestamps.length === 0) return null;
  
  // Sort timestamps in descending order (latest first)
  timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Get the latest log entry
  return logEntry.value[timestamps[0]];
};

/**
 * Find a specific field in the verification log
 */
export const findVerificationField = (
  verificationData: VehicleVerificationField[] | null,
  fieldName: string
): VehicleVerificationField | undefined => {
  if (!verificationData) return undefined;
  return verificationData.find(item => item.field === fieldName);
};

/**
 * Get document status based on expiry date
 */
export const getDocumentStatusFromDate = (expiryDateStr: string | undefined): DocumentStatus => {
  if (!expiryDateStr) {
    return { status: 'missing' };
  }

  try {
    const expiryDate = new Date(expiryDateStr);
    const currentDate = new Date();
    
    // Check if date is valid
    if (isNaN(expiryDate.getTime())) {
      console.warn(`Invalid expiry date: ${expiryDateStr}`);
      return { status: 'missing', expiryDate: null };
    }
    
    // Check if expired
    if (expiryDate < currentDate) {
      return { status: 'expired', expiryDate };
    }
    
    // Check if expiring in 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);
    
    if (expiryDate < thirtyDaysFromNow) {
      return { status: 'expiring_soon', expiryDate };
    }
    
    return { status: 'valid', expiryDate };
  } catch (e) {
    console.error(`Error processing expiry date: ${expiryDateStr}`, e);
    return { status: 'missing', expiryDate: null };
  }
};

/**
 * Get status for a specific document type
 */
export const getDocumentStatus = (vehicle: Vehicle, docType: string): DocumentStatus => {
  // Get latest verification log
  const verificationLog = getLatestVerificationLog(vehicle);
  
  // Determine which field to look for based on document type
  let fieldName: string;
  switch (docType) {
    case 'fitness':
      fieldName = 'fit_up_to';
      break;
    case 'insurance':
      fieldName = 'insurance_upto';
      break;
    case 'pollution':
      fieldName = 'pucc_upto'; // Using pucc_upto (not pucc_up_to)
      break;
    default:
      // Default case (for RC and other types)
      return { status: 'missing' };
  }
  
  // Find the field in verification data
  const fieldItem = findVerificationField(verificationLog, fieldName);
  
  // Return status based on field value
  if (!fieldItem || !fieldItem.value) {
    //console.log(`Document ${docType} (${fieldName}) is missing in vehicle ${vehicle.registrationNumber}`);
    return { status: 'missing' };
  }
  
  return getDocumentStatusFromDate(String(fieldItem.value));
};

/**
 * Check if vehicle has a specific document type
 */
export const hasDocument = (vehicle: Vehicle, docType: string): boolean => {
  const verificationLog = getLatestVerificationLog(vehicle);
  
  if (docType === 'fitness') {
    return !!findVerificationField(verificationLog, 'fit_up_to');
  }
  
  if (docType === 'insurance') {
    return !!findVerificationField(verificationLog, 'insurance_upto');
  }
  
  if (docType === 'pollution') {
    return !!findVerificationField(verificationLog, 'pucc_upto');
  }
  
  return false;
};

/**
 * Check if vehicle has any expired or missing documents
 */
export const hasExpiredDocuments = (vehicle: Vehicle): boolean => {
  const fitnessStatus = getDocumentStatus(vehicle, 'fitness');
  const insuranceStatus = getDocumentStatus(vehicle, 'insurance');
  const pollutionStatus = getDocumentStatus(vehicle, 'pollution');
  
  return fitnessStatus.status === 'expired' || fitnessStatus.status === 'missing' ||
         insuranceStatus.status === 'expired' || insuranceStatus.status === 'missing' ||
         pollutionStatus.status === 'expired' || pollutionStatus.status === 'missing';
};

/**
 * Check if vehicle has any documents expiring soon but none expired
 */
export const hasExpiringDocuments = (vehicle: Vehicle): boolean => {
  const fitnessStatus = getDocumentStatus(vehicle, 'fitness');
  const insuranceStatus = getDocumentStatus(vehicle, 'insurance');
  const pollutionStatus = getDocumentStatus(vehicle, 'pollution');
  
  // No expired documents but at least one expiring soon
  return !hasExpiredDocuments(vehicle) && (
    fitnessStatus.status === 'expiring_soon' || 
    insuranceStatus.status === 'expiring_soon' || 
    pollutionStatus.status === 'expiring_soon'
  );
};

/**
 * Check if all vehicle documents are valid (not expired, not missing, not expiring soon)
 */
export const hasAllValidDocuments = (vehicle: Vehicle): boolean => {
  const fitnessStatus = getDocumentStatus(vehicle, 'fitness').status;
  const insuranceStatus = getDocumentStatus(vehicle, 'insurance').status;
  const pollutionStatus = getDocumentStatus(vehicle, 'pollution').status;
  
  return fitnessStatus === 'valid' && 
         insuranceStatus === 'valid' && 
         pollutionStatus === 'valid';
};

/**
 * Get vehicle row className based on document statuses
 */
export const getVehicleRowClassName = (vehicle: Vehicle): string => {
  const baseClasses = "hover:bg-muted/50";
  
  if (hasExpiredDocuments(vehicle)) {
    return `${baseClasses} bg-red-50 border-l-4 border-l-red-500`;
  }
  
  if (hasExpiringDocuments(vehicle)) {
    return `${baseClasses} bg-yellow-50 border-l-4 border-l-yellow-500`;
  }
  
  return `${baseClasses} border-l-4 border-l-green-500`;
};

/**
 * Get document status color classes
 */
export const getDocumentStatusColor = (status: string): string => {
  switch (status) {
    case 'valid':
      return 'bg-green-100 border-green-200 text-green-800';
    case 'expired':
    case 'missing':
      return 'bg-red-100 border-red-200 text-red-800';
    case 'expiring_soon':
      return 'bg-yellow-100 border-yellow-200 text-yellow-800';
    default:
      return 'bg-gray-100 border-gray-200 text-gray-800';
  }
};
