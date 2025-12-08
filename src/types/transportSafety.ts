
export type VehicleType = 'bus' | 'van' | 'car' | 'truck' | 'other'; // Legacy type, kept for backward compatibility

export interface VehicleTypeOption {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleDocument {
  id: string;
  type: string;
  number: string;
  issuedDate: string;
  expiryDate: string;
  issuedBy: string;
  status: 'valid' | 'expired' | 'expiring_soon';
  notes: string | null;
  lastUpdated: string;
  fileUrls: string[];
  provider?: string;
  verificationStatus?: string;
  verificationMethod?: 'api' | 'manual';
  verificationDate?: string;
}

export interface VehicleVerificationField {
  field: string;
  value: any;
  verified: boolean;
}

export interface VerificationLogItem {
  [timestamp: string]: VehicleVerificationField[];
}

export interface VehicleVerificationData {
  field: string;
  value: any;
  verified: boolean;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: VehicleType; // Legacy field, kept for backward compatibility (may contain UUID in new implementation)
  typeId?: string; // UUID reference to vehicle_type table
  typeName?: string; // Human-readable vehicle type name from vehicle_type table
  vehicleTypeIcon?: string | null; // Icon name from vehicle_type table
  internalVehicleName?: string; // New field for internal vehicle name
  make: string;
  model: string;
  year: number | null;
  driver: string;
  route: string;
  capacity?: number;
  documents: VehicleDocument[];
  status: 'active' | 'maintenance' | 'inactive';
  active?: boolean; // Active/inactive toggle status
  clientId?: string;
  employeeId?: string; // Add employeeId field
  createdAt: string;
  updatedAt: string;
  verificationStatus?: string;
  verificationDate?: string;
  verificationData?: VehicleVerificationData[];
  verification_log?: Record<string, any>; // Legacy field, keeping for backward compatibility
}
