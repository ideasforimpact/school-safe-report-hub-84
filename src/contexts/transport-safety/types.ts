
import { Vehicle, VehicleDocument, VehicleTypeOption } from '@/types/transportSafety';
import { ReactNode } from 'react';

export interface TransportSafetyContextType {
  vehicles: Vehicle[];
  loading: boolean;
  hasFetched: boolean;
  error: string | null;

  // Server-side pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;

  // Server-side filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: string;
  setStatusFilter: (s: string) => void;
  typeFilter: string;
  setTypeFilter: (t: string) => void;

  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;
  getVehicle: (id: string) => Vehicle | undefined;
  addDocument: (vehicleId: string, document: Omit<VehicleDocument, 'id'>) => void;
  updateDocument: (vehicleId: string, documentId: string, updates: Partial<VehicleDocument>) => void;
  deleteDocument: (vehicleId: string, documentId: string) => void;
  verifyDocument: (vehicleId: string, documentId: string, status: 'verified' | 'failed', method: 'api' | 'manual', notes?: string) => void;
  vehicleTypes: VehicleTypeOption[];
  fetchVehicles: (overrides?: { page?: number; search?: string; status?: string; typeId?: string }) => Promise<void>;
}

export interface TransportSafetyProviderProps {
  children: ReactNode;
}
