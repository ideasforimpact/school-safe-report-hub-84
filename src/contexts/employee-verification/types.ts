
export interface EmployeeVerificationContextType {
  verifyEmployee: (employeeId: string) => Promise<boolean>;
  isVerifying: boolean;
  verificationError: string | null;
}
