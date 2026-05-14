import * as XLSX from 'xlsx';
import { EMPLOYEE_COMPLIANCE_DOCUMENTS } from '@/constants/employeeComplianceDocuments';

export interface EmployeeTemplateData {
  'Employee ID': string;
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Phone': string;
  'Employee Type': string;
  'Department': string;
  'Designation': string;
  'Joining Date': string;
  'Status': string;
  'Module': string;
  // Personal Details
  'Middle Name'?: string;
  'Father Name'?: string;
  'Gender'?: string;
  'DOB'?: string;
  'Religion'?: string;
  'Nationality'?: string;
  'Blood Group'?: string;
  'Residence Address'?: string;
  'Staff ID'?: string;
  'Experience'?: string;
  'Qualification'?: string;
  // Professional Other Details
  'Aadhar No'?: string;
  'PAN No'?: string;
  'ESI No'?: string;
  'PF No'?: string;
  'Resigning / Termination Date'?: string;
  'Biometric User ID'?: string;
  [key: string]: any;
}

/**
 * Generate sample data for the employee template
 */
const generateSampleData = (): EmployeeTemplateData[] => {
  return [
    {
      'Employee ID': 'EMP001',
      'First Name': 'John',
      'Last Name': 'Doe',
      'Email': 'john.doe@example.com',
      'Phone': '9876543210',
      'Employee Type': 'permanent',
      'Department': 'management',
      'Designation': 'Professor',
      'Joining Date': '2024-01-15',
      'Status': 'active',
      'Module': 'Incidents',
      'Middle Name': 'Robert',
      'Father Name': 'William Doe',
      'Gender': 'Male',
      'DOB': '1985-05-20',
      'Religion': 'Christian',
      'Nationality': 'Indian',
      'Blood Group': 'O+',
      'Residence Address': '123 Main St, City',
      'Staff ID': 'STF001',
      'Experience': '10',
      'Qualification': 'PhD',
      'Aadhar No': '1234 5678 9012',
      'PAN No': 'ABCDE1234F',
      'ESI No': '1234567890',
      'PF No': '123456789012',
      'Resigning / Termination Date': '2025-05-20',
      'Biometric User ID': 'BIO001'
    }
  ];
};

/**
 * Download Excel template with sample data
 */
export const downloadExcelTemplate = (): void => {
  const sampleData = generateSampleData();
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create a worksheet from the sample data
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths for better readability
  const columnWidths = [
    { wch: 12 }, // Employee ID
    { wch: 15 }, // First Name
    { wch: 15 }, // Last Name
    { wch: 25 }, // Email
    { wch: 15 }, // Phone
    { wch: 15 }, // Employee Type
    { wch: 15 }, // Department
    { wch: 18 }, // Designation
    { wch: 15 }, // Joining Date
    { wch: 10 }, // Status
    { wch: 20 }, // Module
    { wch: 15 }, // Middle Name
    { wch: 15 }, // Father Name
    { wch: 10 }, // Gender
    { wch: 12 }, // DOB
    { wch: 15 }, // Religion
    { wch: 15 }, // Nationality
    { wch: 12 }, // Blood Group
    { wch: 30 }, // Residence Address
    { wch: 12 }, // Staff ID
    { wch: 15 }, // Experience
    { wch: 25 }, // Qualification
    { wch: 18 }, // Aadhar No
    { wch: 15 }, // PAN No
    { wch: 15 }, // ESI No
    { wch: 15 }, // PF No
    { wch: 25 }, // Resigning / Termination Date
    { wch: 18 }  // Biometric User ID
  ];
  worksheet['!cols'] = columnWidths;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
  
  // Generate the Excel file and trigger download
  XLSX.writeFile(workbook, 'employee_import_template.xlsx');
};

/**
 * Download CSV template with sample data
 */
export const downloadCSVTemplate = (): void => {
  const sampleData = generateSampleData();
  
  // Convert to CSV format
  const headers = Object.keys(sampleData[0]);
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'employee_import_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get template format information for display
 */
export const getTemplateFormatInfo = () => ({
  requiredColumns: [
    'Employee ID',
    'First Name', 
    'Last Name',
    'Email',
    'Phone',
    'Employee Type',
    'Department',
    'Designation',
    'Joining Date',
    'Status',
    'Module'
  ],
  optionalColumns: [
    'Middle Name',
    'Father Name',
    'Gender',
    'DOB',
    'Religion',
    'Nationality',
    'Blood Group',
    'Residence Address',
    'Staff ID',
    'Experience',
    'Qualification',
    'Aadhar No',
    'PAN No',
    'ESI No',
    'PF No',
    'Resigning / Termination Date',
    'Biometric User ID',
  ],
  supportedFormats: ['XLSX', 'XLS', 'CSV'],
  employeeTypes: ['permanent', 'contract', 'temporary', 'intern'],
  departments: ['operations', 'admin', 'teaching', 'security', 'maintenance', 'transport', 'management'],
  statuses: ['active', 'inactive', 'terminated'],
  dateFormat: 'YYYY-MM-DD (e.g., 2024-01-15)'
});


