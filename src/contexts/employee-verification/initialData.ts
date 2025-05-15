import { Employee, DocumentType, DocumentStatus, VerificationDocument } from "@/types/employeeVerification";

export const initialEmployees: Employee[] = [
  {
    id: "1",
    employeeId: "EMP001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "9876543210",
    dateOfBirth: "1990-01-01",
    address: "123 Main St, City",
    joiningDate: "2020-01-15",
    department: "Engineering",
    position: "Software Developer",
    employeeType: "permanent",
    status: true, // Updated to boolean (active/true)
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  },
  {
    id: "2",
    employeeId: "EMP002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "9876543211",
    dateOfBirth: "1992-05-10",
    address: "456 Oak St, Town",
    joiningDate: "2021-03-10",
    department: "HR",
    position: "HR Manager",
    employeeType: "permanent",
    status: true, // Updated to boolean (active/true)
    createdAt: "2023-02-01T00:00:00Z",
    updatedAt: "2023-02-01T00:00:00Z"
  }
];

export const initialDocumentTypes: DocumentType[] = [
  {
    id: "1",
    name: "aadhar",
    description: "Aadhar Card",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "pan",
    description: "PAN Card",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "driving_license",
    description: "Driving License",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  },
  {
    id: "4",
    name: "passport",
    description: "Passport",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  },
  {
    id: "5",
    name: "bank_account",
    description: "Bank Account",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  }
];

export const initialDocumentStatuses: DocumentStatus[] = [
  {
    id: "1",
    name: "governance",
    description: "Verified with government database",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  },
  {
    id: "2",
    name: "manual",
    description: "Manually verified",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  },
  {
    id: "3",
    name: "partial",
    description: "Partially verified",
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-01-01T00:00:00Z"
  }
];

export const initialVerificationDocuments: VerificationDocument[] = [];
