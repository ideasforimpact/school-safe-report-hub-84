
export interface RawEmployeeData {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  employeeType?: string;
  department?: string;
  designation?: string;
  joiningDate?: string;
  status?: string;
  // Personal Details
  middleName?: string;
  fatherName?: string;
  gender?: string;
  dob?: string;
  religion?: string;
  nationality?: string;
  bloodGroup?: string;
  residenceAddress?: string;
  staffId?: string;
  experience?: string;
  qualification?: string;
  // Professional Other Details
  aadharNo?: string;
  panNo?: string;
  esiNo?: string;
  pfNo?: string;
  resigningOrTerminationDate?: string;
  biometricUserId?: string;
  moduleAccessPayload?:  string[];
}

export interface ImportResult {
  addedEmployees: any[];
  successCount: number;
  errorCount: number;
  errors: string[];
  updatedCount: number;
}
