import { Vehicle, VehicleVerificationField, VehicleVerificationData } from '@/types/transportSafety';

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
 * Get a specific field's value from the latest verification_log
 * Returns undefined if not found. Use this for UI fallbacks.
 */
export const getLatestVerificationFieldValue = (
  vehicle: Vehicle,
  fieldName: string
): any | undefined => {
  if (!vehicle?.verificationData || vehicle.verificationData.length === 0) return undefined;
  const latestLog = getLatestVerificationLog(vehicle);
  if (!latestLog) return undefined;
  const item = findVerificationField(latestLog, fieldName);
  return item?.value;
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
  // Check if vehicle has verification data
  if (!vehicle.verificationData || vehicle.verificationData.length === 0) {
    return { status: 'missing' };
  }
  
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
    console.log(`Document ${docType} (${fieldName}) is missing in vehicle ${vehicle.registrationNumber}`);
    return { status: 'missing' };
  }
  
  return getDocumentStatusFromDate(String(fieldItem.value));
};

/**
 * Check if vehicle has a specific document type
 */
export const hasDocument = (vehicle: Vehicle, docType: string): boolean => {
  // Check if vehicle has verification data
  if (!vehicle.verificationData || vehicle.verificationData.length === 0) {
    return false;
  }
  
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
  // If no verification data, don't treat as expired (treat as unverified)
  if (!vehicle.verificationData || vehicle.verificationData.length === 0) {
    return false;
  }
  
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
  // If no verification data, don't treat as expiring
  if (!vehicle.verificationData || vehicle.verificationData.length === 0) {
    return false;
  }
  
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
  // If no verification data, can't be valid
  if (!vehicle.verificationData || vehicle.verificationData.length === 0) {
    return false;
  }
  
  const fitnessStatus = getDocumentStatus(vehicle, 'fitness').status;
  const insuranceStatus = getDocumentStatus(vehicle, 'insurance').status;
  const pollutionStatus = getDocumentStatus(vehicle, 'pollution').status;
  
  return fitnessStatus === 'valid' && 
         insuranceStatus === 'valid' && 
         pollutionStatus === 'valid';
};

/**
 * Check if vehicle is considered valid (at least 2 out of 3 certificates valid or expiring soon)
 * This is used for the "valid" filter to be more lenient
 */
export const hasValidVehicle = (vehicle: Vehicle): boolean => {
  // If no verification data, can't be valid
  if (!vehicle.verificationData || vehicle.verificationData.length === 0) {
    return false;
  }
  
  const fitnessStatus = getDocumentStatus(vehicle, 'fitness').status;
  const insuranceStatus = getDocumentStatus(vehicle, 'insurance').status;
  const pollutionStatus = getDocumentStatus(vehicle, 'pollution').status;
  
  // Count valid certificates (valid or expiring soon are both considered "good enough")
  let validCount = 0;
  if (fitnessStatus === 'valid' || fitnessStatus === 'expiring_soon') validCount++;
  if (insuranceStatus === 'valid' || insuranceStatus === 'expiring_soon') validCount++;
  if (pollutionStatus === 'valid' || pollutionStatus === 'expiring_soon') validCount++;
  
  // Vehicle is valid if at least 2 out of 3 certificates are valid/expiring soon
  return validCount >= 2;
};

/**
 * Get vehicle row className based on document statuses
 */
export const getVehicleRowClassName = (vehicle: Vehicle): string => {
  const baseClasses = "hover:bg-muted/50";
  
  // If no verification data, show grey border
  if (!vehicle.verificationData || vehicle.verificationData.length === 0) {
    return `${baseClasses} border-l-4 border-l-gray-300`;
  }
  
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
    case 'unverified':
      return 'bg-gray-100 border-gray-200 text-gray-800';
    default:
      return 'bg-gray-100 border-gray-200 text-gray-800';
  }
};


/**
 * Field order for verification data display.
 * This list defines the ONLY verification fields we render in the UI
 * (in this exact order) to keep "Run Safety" results, history, and
 * latest verification views consistent.
 */
export const VERIFICATION_FIELD_ORDER = [
  'display_type',
  'display_year',
  'rc_number',
  'fit_up_to',
  'registration_date',
  'owner_name',
  'father_name',
  'present_address',
  'permanent_address',
  'vehicle_category',
  'vehicle_chasi_number',
  'vehicle_engine_number',
  'maker_description',
  'maker_model',
  'body_type',
  'fuel_type',
  'color',
  'norms_type',
  'financer',
  'insurance_company',
  'insurance_policy_number',
  'insurance_upto',
  'manufacturing_date',
  'manufacturing_date_formatted',
  'registered_at',
  'latest_by',
  'less_info',
  'tax_upto',
  'tax_paid_upto',
  'cubic_capacity',
  'vehicle_gross_weight',
  'no_cylinders',
  'seat_capacity',
  'sleeper_capacity',
  'standing_capacity',
  'wheelbase',
  'unladen_weight',
  'vehicle_category_description',
  'pucc_number',
  'pucc_upto',
  'owner_number',
  'rc_status',
] as const;

// Strict TypeScript type for allowed verification field keys
export type VerificationFieldKey = typeof VERIFICATION_FIELD_ORDER[number];

// Runtime type guard – helps us safely filter dynamic field names
export const isVerificationFieldKey = (field: string): field is VerificationFieldKey => {
  return (VERIFICATION_FIELD_ORDER as readonly string[]).includes(field);
};

/**
 * Transform API response data into ordered format
 * Returns array of { field, value, verified } objects in specified order
 */
export const transformApiResponseData = (
  apiResponse: any,
  vehicleChallans?: any
): VehicleVerificationData[] => {
  const result: VehicleVerificationData[] = [];

  /**
   * Priority 1: Use the transformed verification log returned by the
   * `vehicle-verify` edge function. This already contains the derived
   * helper fields like `display_type` and `display_year`, and matches
   * what we persist and show in history.
   */
  if (Array.isArray(apiResponse?.transformed)) {
    const verificationLogEntry = apiResponse.transformed.find(
      (item: any) => item?.field === 'verification_log' && item?.value
    );

    if (verificationLogEntry && verificationLogEntry.value && typeof verificationLogEntry.value === 'object') {
      const timestamps = Object.keys(verificationLogEntry.value);

      if (timestamps.length > 0) {
        // Use the latest log entry
        timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const latestLog = verificationLogEntry.value[timestamps[0]] as VehicleVerificationField[] | undefined;

        if (Array.isArray(latestLog)) {
          const fieldMap = new Map<VerificationFieldKey, any>();

          // Collect only allowed fields from the latest log
          latestLog.forEach((item) => {
            if (item?.field && isVerificationFieldKey(item.field)) {
              fieldMap.set(item.field, item.value);
            }
          });

          // Push fields strictly in the configured order
          VERIFICATION_FIELD_ORDER.forEach((fieldName) => {
            if (fieldMap.has(fieldName)) {
              result.push({
                field: fieldName,
                value: fieldMap.get(fieldName) ?? '',
                verified: true,
              });
            }
          });
        }
      }
    }
  }

  /**
   * Fallback: If for some reason transformed data is not available,
   * fall back to the raw provider RC data while still enforcing the
   * same allowed key set and ordering.
   */
  if (result.length === 0) {
    // Get RC data from API response
    let rcData: any = null;

    if (apiResponse?.original?.data) {
      rcData = apiResponse.original.data;
    } else if (apiResponse?.data) {
      rcData = apiResponse.data;
    }

    if (rcData && typeof rcData === 'object') {
      const fieldMap = new Map<VerificationFieldKey, any>();

      Object.entries(rcData).forEach(([key, value]) => {
        const fieldLower = key.toLowerCase();
        // Skip internal / non-UI fields
        if (
          ['verification_log', 'last_response', 'status', 'rc_history_log', 'response_metadata', 'challan_details'].some(
            (f) => fieldLower.includes(f)
          )
        ) {
          return;
        }

        if (isVerificationFieldKey(key)) {
          fieldMap.set(key, value);
        }
      });

      VERIFICATION_FIELD_ORDER.forEach((fieldName) => {
        if (fieldMap.has(fieldName)) {
          result.push({
            field: fieldName,
            value: fieldMap.get(fieldName) ?? '',
            verified: true,
          });
        }
      });
    }
  }
  
  // Add challan_details from vehicle_challans if available
  if (vehicleChallans?.latest_challan_data) {
    const challanData = vehicleChallans.latest_challan_data;
    let challanDetails: any = null;
    
    if (challanData?.data?.challan_details) {
      challanDetails = {
        challan_details: challanData.data.challan_details
      };
    } else if (challanData?.data?.challan_data) {
      challanDetails = {
        challan_details: {
          challans: Array.isArray(challanData.data.challan_data) 
            ? challanData.data.challan_data 
            : []
        }
      };
    } else if (challanData?.challan_details) {
      challanDetails = {
        challan_details: challanData.challan_details
      };
    }
    
    if (challanDetails) {
      result.push({
        field: 'challan_details',
        value: challanDetails,
        verified: true
      });
    }
  }
  
  return result;
};

/**
 * Transform vehicle data from current_rc_data and vehicle_challans into the standard format
 * Returns array of { field, value, verified } objects
 * Challan details come from vehicle_challans table, not from API response
 */
export const transformVehicleData = (
  vehicle: Vehicle | null | undefined
): VehicleVerificationData[] => {
  if (!vehicle) return [];

  const result: VehicleVerificationData[] = [];
  
  // Get RC data from current_rc_data (preferred) or fallback to verificationData
  let rcData: any = null;
  
  if (vehicle.currentRcData) {
    // current_rc_data might be:
    // 1. Full API response: { success: true, data: { ... } } or { status_code: 200, data: { ... } }
    // 2. Just the data object: { ... }
    // 3. Already the data object nested: { data: { ... } }
    
    if (vehicle.currentRcData.data && typeof vehicle.currentRcData.data === 'object') {
      // Case 1 & 3: Has nested data property
      rcData = vehicle.currentRcData.data;
    } else if (vehicle.currentRcData.success !== undefined || vehicle.currentRcData.status_code !== undefined) {
      // Case 1: Full API response but data might be at root level
      rcData = vehicle.currentRcData.data || vehicle.currentRcData;
    } else {
      // Case 2: Already the data object
      rcData = vehicle.currentRcData;
    }
  } else if (vehicle.verificationData && Array.isArray(vehicle.verificationData)) {
    // Fallback: try to reconstruct from verificationData
    const latestLog = getLatestVerificationLog(vehicle);
    if (latestLog) {
      // Convert array format to object format
      rcData = {};
      latestLog.forEach((item: VehicleVerificationField) => {
        if (item.field !== 'challan_details' && 
            item.field !== 'verification_log' && 
            item.field !== 'last_response' && 
            item.field !== 'status' &&
            item.field !== 'rc_history_log') {
          rcData[item.field] = item.value;
        }
      });
    }
  }

  // Transform RC data fields using the same strict order and allowed keys
  if (rcData && typeof rcData === 'object') {
    // Fields to exclude (internal system fields, not user data)
    const excludedFields = [
      'verification_log',
      'last_response',
      'status',
      'rc_history_log',
      'response_metadata', // Exclude response_metadata as per user request
    ];

    const fieldMap = new Map<VerificationFieldKey, any>();

    Object.entries(rcData).forEach(([key, value]) => {
      const fieldLower = key.toLowerCase();

      // Skip internal system fields
      if (excludedFields.some((f) => fieldLower.includes(f))) {
        return;
      }

      // Skip challan_details from RC data - we'll add it separately from vehicle_challans
      if (fieldLower === 'challan_details') {
        return;
      }

      if (isVerificationFieldKey(key)) {
        fieldMap.set(key, value);
      }
    });

    // Ensure rc_status is available even if it's stored outside the filtered rcData
    if (!fieldMap.has('rc_status')) {
      const possibleRcStatus =
        (rcData as any).rc_status ??
        (vehicle as any)?.currentRcData?.rc_status ??
        (vehicle as any)?.rcStatus ??
        null;

      if (possibleRcStatus !== null && possibleRcStatus !== undefined && possibleRcStatus !== '') {
        fieldMap.set('rc_status', possibleRcStatus);
      }
    }

    // Push fields in the configured display order
    VERIFICATION_FIELD_ORDER.forEach((fieldName) => {
      if (fieldMap.has(fieldName)) {
        result.push({
          field: fieldName,
          value: fieldMap.get(fieldName) ?? '',
          verified: true,
        });
      }
    });
  }

  // Add challan_details from vehicle_challans table
  if (vehicle.vehicleChallans?.latest_challan_data) {
    const challanData = vehicle.vehicleChallans.latest_challan_data;
    
    // Extract challan_details from different possible structures
    let challanDetails: any = null;
    
    if (challanData?.data?.challan_details) {
      challanDetails = {
        challan_details: challanData.data.challan_details
      };
    } else if (challanData?.data?.challan_data) {
      challanDetails = {
        challan_details: {
          challans: Array.isArray(challanData.data.challan_data) 
            ? challanData.data.challan_data 
            : []
        }
      };
    } else if (challanData?.challan_details) {
      challanDetails = {
        challan_details: challanData.challan_details
      };
    }

    if (challanDetails) {
      result.push({
        field: 'challan_details',
        value: challanDetails,
        verified: true
      });
    }
  }

  return result;
};
