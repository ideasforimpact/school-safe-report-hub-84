
export interface VehicleDocument {
  id: string;
  type: 'insurance' | 'fitness' | 'pollution' | 'registration';
  number: string;
  issuedDate: string;
  expiryDate: string;
  provider: string;
  status: 'valid' | 'expired' | 'expiring_soon' | 'unverified';
  verificationDate?: string;
  verificationMethod?: 'api' | 'manual';
  verificationStatus?: 'verified' | 'failed' | 'pending';
  notes?: string;
  fileUrls?: string[];
}

export interface Vehicle {
  id: string;
  registrationNumber: string;
  type: 'bus' | 'car' | 'van' | 'truck' | 'other';
  make: string;
  model: string;
  year: number;
  capacity: number;
  driver?: string;
  route?: string;
  documents: VehicleDocument[];
  status: 'active' | 'maintenance' | 'inactive';
  createdAt: string;
  updatedAt: string;
}
