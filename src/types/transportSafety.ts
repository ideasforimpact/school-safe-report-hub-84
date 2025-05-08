
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
  capacity?: number; // Added capacity as optional property
  documents: VehicleDocument[];
  status: string;
  createdAt: string;
  updatedAt: string;
}
