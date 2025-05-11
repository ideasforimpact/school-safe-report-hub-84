
export type VehicleType = 'bus' | 'van' | 'car' | 'truck' | 'other';

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

export interface VehicleVerificationData {
  field: string;
  value: string | number | boolean;
  verified: boolean;
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: VehicleType;
  make: string;
  model: string;
  year: number;
  driver: string;
  route: string;
  capacity?: number;
  documents: VehicleDocument[];
  status: 'active' | 'maintenance' | 'inactive';
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  verificationStatus?: string;
  verificationDate?: string;
  verificationData?: VehicleVerificationData[];
}
