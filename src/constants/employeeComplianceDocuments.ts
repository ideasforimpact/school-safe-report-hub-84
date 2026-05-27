/**
 * Profile compliance documents collected in Add/Edit User wizards.
 * Keys must stay aligned with `employee-management` edge function and storage.
 */
export const EMPLOYEE_COMPLIANCE_DOCUMENTS = [
  { key: 'letterOfAppointment', label: 'Letter of Appointment' },
  { key: 'marksheets10And12', label: '10th / 12th and Degree Mark Sheets' },
  {
    key: 'bachelorsMastersCertificates',
    label: 'Bachelors / Masters Degree and Educational Qualification Certificates',
  },
  { key: 'previousEmploymentLetter', label: 'Previous Employment Discharge Letter' },
  { key: 'lastEarnedPayslip', label: 'Last Earned Pay Slip' },
  { key: 'birthCertificate', label: 'Birth Certificate' },
  { key: 'aadhaarCard', label: 'Aadhaar Card' },
  { key: 'panCard', label: 'PAN Card' },
  { key: 'passport', label: 'Passport [If Any]' },
  { key: 'passportPhoto', label: 'Passport Size Photo' },
  {
    key: 'additionalQualificationCertificates',
    label: 'Certificates of Additional Qualifications Pursued',
  },
  {
    key: 'addressConfirmation',
    label: 'Confirmation Whether Permanent Address Is Same As Residential Address',
  },
  { key: 'bankPassbook', label: 'Bank Passbook First Page' },
  { key: 'providentFundNumber', label: 'Provident Fund Number If Any' },
  {
    key: 'employeeStateInsurance',
    label: 'Employee State Insurance Corporation Number / Card If Any',
  },
] as const;

export type EmployeeComplianceDocumentKey = (typeof EMPLOYEE_COMPLIANCE_DOCUMENTS)[number]['key'];
