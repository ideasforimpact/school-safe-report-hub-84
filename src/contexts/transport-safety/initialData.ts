
import { Vehicle, VehicleDocument } from '@/types/transportSafety';
import { v4 as uuidv4 } from 'uuid';

const currentDate = new Date();

// Helper function to get date strings
const getDateString = (months: number): string => {
  const date = new Date(currentDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
};

// Mock insurance document
const createInsuranceDocument = (vehicleId: string, status: 'valid' | 'expired' | 'expiring_soon' = 'valid'): VehicleDocument => {
  const expiryMonths = status === 'valid' ? 10 : status === 'expiring_soon' ? 1 : -1;
  return {
    id: uuidv4(),
    type: 'insurance',
    number: `INS-${Math.floor(100000 + Math.random() * 900000)}`,
    issuedDate: getDateString(-12),
    expiryDate: getDateString(expiryMonths),
    provider: 'Safe Drive Insurance',
    status,
    verificationStatus: 'verified',
    verificationDate: getDateString(-1),
    verificationMethod: 'api'
  };
};

// Mock fitness certificate document
const createFitnessDocument = (vehicleId: string, status: 'valid' | 'expired' | 'expiring_soon' = 'valid'): VehicleDocument => {
  const expiryMonths = status === 'valid' ? 8 : status === 'expiring_soon' ? 1 : -2;
  return {
    id: uuidv4(),
    type: 'fitness',
    number: `FC-${Math.floor(10000 + Math.random() * 90000)}`,
    issuedDate: getDateString(-6),
    expiryDate: getDateString(expiryMonths),
    provider: 'Regional Transport Office',
    status,
    verificationStatus: 'verified',
    verificationDate: getDateString(-1),
    verificationMethod: 'api'
  };
};

// Mock pollution certificate document
const createPollutionDocument = (vehicleId: string, status: 'valid' | 'expired' | 'expiring_soon' = 'valid'): VehicleDocument => {
  const expiryMonths = status === 'valid' ? 5 : status === 'expiring_soon' ? 0.5 : -1;
  return {
    id: uuidv4(),
    type: 'pollution',
    number: `PUC-${Math.floor(10000 + Math.random() * 90000)}`,
    issuedDate: getDateString(-1),
    expiryDate: getDateString(expiryMonths),
    provider: 'Pollution Control Board',
    status,
    verificationStatus: 'verified',
    verificationDate: getDateString(-0.5),
    verificationMethod: 'api'
  };
};

// Mock registration document
const createRegistrationDocument = (vehicleId: string, registrationNumber: string, hasChallan: boolean = false): VehicleDocument => {
  return {
    id: uuidv4(),
    type: 'registration',
    number: registrationNumber,
    issuedDate: getDateString(-24),
    expiryDate: getDateString(36),
    provider: 'Regional Transport Office',
    status: 'valid',
    verificationStatus: 'verified',
    verificationDate: getDateString(-1),
    verificationMethod: 'api',
    notes: hasChallan ? 'Vehicle has pending police challan from last month.' : undefined
  };
};

// Create challan document
const createChallanDocument = (vehicleId: string): VehicleDocument => {
  return {
    id: uuidv4(),
    type: 'registration',
    number: `CH-${Math.floor(10000 + Math.random() * 90000)}`,
    issuedDate: getDateString(-1),
    expiryDate: getDateString(1),
    provider: 'Traffic Police Department',
    status: 'valid',
    verificationStatus: 'verified',
    verificationDate: getDateString(-0.5),
    verificationMethod: 'api',
    notes: 'Challan issued for traffic rule violation - Speeding'
  };
};

// Create initial vehicles
export const initialVehicles: Vehicle[] = [
  {
    id: uuidv4(),
    registrationNumber: 'KA-01-JK-1234',
    type: 'bus',
    make: 'Ashok Leyland',
    model: 'Viking',
    year: 2020,
    capacity: 52,
    driver: 'John Smith',
    route: 'North Campus Route',
    status: 'active',
    documents: [] as VehicleDocument[],
    createdAt: getDateString(-6),
    updatedAt: getDateString(0)
  },
  {
    id: uuidv4(),
    registrationNumber: 'KA-01-MG-5678',
    type: 'van',
    make: 'Maruti Suzuki',
    model: 'Eeco',
    year: 2021,
    capacity: 8,
    driver: 'Emily Davis',
    route: 'East Campus Route',
    status: 'active',
    documents: [] as VehicleDocument[],
    createdAt: getDateString(-5),
    updatedAt: getDateString(0)
  },
  {
    id: uuidv4(),
    registrationNumber: 'KA-02-PQ-9012',
    type: 'car',
    make: 'Toyota',
    model: 'Innova',
    year: 2022,
    capacity: 7,
    driver: 'Michael Johnson',
    route: 'Administrative Use',
    status: 'active',
    documents: [] as VehicleDocument[],
    createdAt: getDateString(-3),
    updatedAt: getDateString(0)
  },
  {
    id: uuidv4(),
    registrationNumber: 'KA-03-RS-3456',
    type: 'bus',
    make: 'TATA',
    model: 'Starbus',
    year: 2019,
    capacity: 45,
    driver: 'Robert Wilson',
    route: 'South Campus Route',
    status: 'maintenance',
    documents: [] as VehicleDocument[],
    createdAt: getDateString(-12),
    updatedAt: getDateString(-0.1)
  }
];

// Add documents to vehicles
initialVehicles.forEach(vehicle => {
  // First vehicle with all valid documents and a challan
  if (vehicle.registrationNumber === 'KA-01-JK-1234') {
    vehicle.documents.push(
      createInsuranceDocument(vehicle.id),
      createFitnessDocument(vehicle.id),
      createPollutionDocument(vehicle.id),
      createRegistrationDocument(vehicle.id, vehicle.registrationNumber),
      createChallanDocument(vehicle.id)  // Add challan to this vehicle
    );
  }
  // Second vehicle with expiring insurance and no challan
  else if (vehicle.registrationNumber === 'KA-01-MG-5678') {
    vehicle.documents.push(
      createInsuranceDocument(vehicle.id, 'expiring_soon'),
      createFitnessDocument(vehicle.id),
      createPollutionDocument(vehicle.id),
      createRegistrationDocument(vehicle.id, vehicle.registrationNumber)
    );
  }
  // Third vehicle with expired fitness and a challan
  else if (vehicle.registrationNumber === 'KA-02-PQ-9012') {
    vehicle.documents.push(
      createInsuranceDocument(vehicle.id),
      createFitnessDocument(vehicle.id, 'expired'),
      createPollutionDocument(vehicle.id),
      createRegistrationDocument(vehicle.id, vehicle.registrationNumber, true)  // Add challan note to registration
    );
  }
  // Fourth vehicle with expired pollution and no challan
  else if (vehicle.registrationNumber === 'KA-03-RS-3456') {
    vehicle.documents.push(
      createInsuranceDocument(vehicle.id),
      createFitnessDocument(vehicle.id),
      createPollutionDocument(vehicle.id, 'expired'),
      createRegistrationDocument(vehicle.id, vehicle.registrationNumber)
    );
  }
});
