
import { v4 as uuidv4 } from 'uuid';
import { Vehicle, VehicleType } from '@/types/transportSafety';

// Helper function to ensure the vehicle type is valid
const getValidVehicleType = (type: string): VehicleType => {
  const validTypes: VehicleType[] = ['bus', 'van', 'car', 'truck', 'other'];
  return validTypes.includes(type as VehicleType) ? type as VehicleType : 'other';
};

export const initialVehicles: Vehicle[] = [
  {
    id: uuidv4(),
    registrationNumber: 'KA-01-HH-1234',
    type: getValidVehicleType('bus'),
    make: 'Volvo',
    model: 'B9R',
    year: 2020,
    driver: 'John Doe',
    route: 'Main Campus - Downtown',
    capacity: 45, // Added capacity for bus
    documents: [
      {
        id: uuidv4(),
        type: 'Registration',
        number: 'REG123456',
        issuedDate: '2020-01-15',
        expiryDate: '2023-01-15',
        issuedBy: 'Regional Transport Office',
        status: 'valid',
        notes: 'Original registration',
        lastUpdated: '2020-01-15',
        fileUrls: ['/documents/registration.pdf']
      },
      {
        id: uuidv4(),
        type: 'Insurance',
        number: 'INS789012',
        issuedDate: '2022-03-10',
        expiryDate: '2023-03-10',
        issuedBy: 'Safety Insurance Co.',
        status: 'valid',
        notes: 'Comprehensive coverage',
        lastUpdated: '2022-03-10',
        fileUrls: ['/documents/insurance.pdf']
      },
      {
        id: uuidv4(),
        type: 'Pollution Certificate',
        number: 'POL345678',
        issuedDate: '2022-09-05',
        expiryDate: '2022-12-05',
        issuedBy: 'Environmental Protection Agency',
        status: 'expired',
        notes: 'Needs renewal',
        lastUpdated: '2022-09-05',
        fileUrls: ['/documents/pollution.pdf']
      }
    ],
    status: 'active',
    createdAt: '2022-01-01T12:00:00Z',
    updatedAt: '2022-09-10T15:30:00Z'
  },
  {
    id: uuidv4(),
    registrationNumber: 'MH-02-AB-5678',
    type: getValidVehicleType('van'),
    make: 'Toyota',
    model: 'Hiace',
    year: 2021,
    driver: 'Jane Smith',
    route: 'Campus A - Campus B',
    capacity: 12, // Added capacity for van
    documents: [
      {
        id: uuidv4(),
        type: 'Registration',
        number: 'REG567890',
        issuedDate: '2021-05-20',
        expiryDate: '2026-05-20',
        issuedBy: 'Regional Transport Office',
        status: 'valid',
        notes: 'Original registration',
        lastUpdated: '2021-05-20',
        fileUrls: ['/documents/registration-van.pdf']
      },
      {
        id: uuidv4(),
        type: 'Insurance',
        number: 'INS123456',
        issuedDate: '2022-01-15',
        expiryDate: '2023-02-01',
        issuedBy: 'Education Insurance Ltd.',
        status: 'expiring_soon',
        notes: 'Needs renewal soon',
        lastUpdated: '2022-01-15',
        fileUrls: ['/documents/insurance-van.pdf']
      }
    ],
    status: 'maintenance',
    createdAt: '2021-06-01T10:15:00Z',
    updatedAt: '2023-01-05T09:45:00Z'
  },
  {
    id: uuidv4(),
    registrationNumber: 'DL-03-CD-9012',
    type: getValidVehicleType('car'),
    make: 'Honda',
    model: 'Civic',
    year: 2022,
    driver: 'Robert Johnson',
    route: 'Director Transit',
    capacity: 5, // Added capacity for car
    documents: [
      {
        id: uuidv4(),
        type: 'Registration',
        number: 'REG901234',
        issuedDate: '2022-02-10',
        expiryDate: '2027-02-10',
        issuedBy: 'Regional Transport Office',
        status: 'valid',
        notes: 'Original registration',
        lastUpdated: '2022-02-10',
        fileUrls: ['/documents/registration-car.pdf']
      },
      {
        id: uuidv4(),
        type: 'Insurance',
        number: 'INS456789',
        issuedDate: '2022-02-15',
        expiryDate: '2023-02-15',
        issuedBy: 'Premium Auto Insurance',
        status: 'valid',
        notes: 'Full coverage',
        lastUpdated: '2022-02-15',
        fileUrls: ['/documents/insurance-car.pdf']
      },
      {
        id: uuidv4(),
        type: 'Fitness Certificate',
        number: 'FIT123456',
        issuedDate: '2022-03-01',
        expiryDate: '2022-11-01',
        issuedBy: 'Vehicle Testing Center',
        status: 'expired',
        notes: 'Needs renewal',
        lastUpdated: '2022-03-01',
        fileUrls: ['/documents/fitness.pdf']
      }
    ],
    status: 'active',
    createdAt: '2022-02-20T14:30:00Z',
    updatedAt: '2022-10-05T16:20:00Z'
  }
];
