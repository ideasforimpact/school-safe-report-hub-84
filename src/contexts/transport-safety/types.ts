
import { Vehicle, VehicleDocument } from '@/types/transportSafety';
import { ReactNode } from 'react';

export interface TransportSafetyContextType {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getVehicle: (id: string) => Vehicle | undefined;
  addDocument: (vehicleId: string, document: Omit<VehicleDocument, 'id'>) => void;
  updateDocument: (vehicleId: string, documentId: string, updates: Partial<VehicleDocument>) => void;
  deleteDocument: (vehicleId: string, documentId: string) => void;
  verifyDocument: (vehicleId: string, documentId: string, status: 'verified' | 'failed', method: 'api' | 'manual', notes?: string) => void;
}

export interface TransportSafetyProviderProps {
  children: ReactNode;
}
