
import { Vehicle } from '@/types/transportSafety';

export const mockVehicle: Vehicle = {
  id: "v1",
  registrationNumber: "KA-01-AA-1234",
  type: "bus",
  make: "Ashok Leyland",
  model: "Falcon School Bus",
  year: 2020,
  driver: "John D.",
  route: "North Campus Route",
  documents: [],
  status: "active",
  createdAt: "2023-01-15T10:30:00Z",
  updatedAt: "2023-04-10T14:22:30Z"
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
