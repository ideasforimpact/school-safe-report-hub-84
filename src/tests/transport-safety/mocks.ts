
import { Vehicle } from '@/types/transportSafety';

export const mockVehicle: Vehicle = {
  id: 'test-vehicle-id',
  registrationNumber: 'ABC123',
  type: 'bus',
  make: 'Toyota',
  model: 'Coaster',
  year: 2022,
  capacity: 30,
  documents: [
    {
      id: 'doc1',
      type: 'insurance',
      number: 'INS-12345',
      issuedDate: '2023-01-01',
      expiryDate: '2024-01-01',
      provider: 'Safety Insurance Co.',
      status: 'valid'
    },
    {
      id: 'doc2',
      type: 'fitness',
      number: 'FIT-54321',
      issuedDate: '2023-02-15',
      expiryDate: '2024-02-15',
      provider: 'Transport Authority',
      status: 'expiring_soon'
    }
  ],
  status: 'active',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-06-01T00:00:00.000Z'
};

export const mockTransportSafetyContext = {
  vehicles: [mockVehicle],
  addVehicle: jest.fn(),
  updateVehicle: jest.fn(),
  deleteVehicle: jest.fn(),
  getVehicle: jest.fn().mockImplementation((id) => 
    id === 'test-vehicle-id' ? mockVehicle : undefined
  ),
  addDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  verifyDocument: jest.fn()
};
