import * as XLSX from 'xlsx';

export interface EmployeeTemplateData {
  'Employee ID': string;
  'First Name': string;
  'Last Name': string;
  'Email': string;
  'Phone': string;
  'Employee Type': string;
  'Department': string;
  'Joining Date': string;
  'Status': string;
  'Module':string;
}

/**
 * Generate sample data for the employee template
 */
const generateSampleData = (): EmployeeTemplateData[] => [
  {
    'Employee ID': 'EMP001',
    'First Name': 'John',
    'Last Name': 'Doe',
    'Email': 'john.doe@example.com',
    'Phone': '+1-555-0123',
    'Employee Type': 'permanent',
    'Department': 'operations',
    'Joining Date': '2024-01-15',
    'Status': 'active',
    'Module':'Incidents'
  },
  {
    'Employee ID': 'EMP002',
    'First Name': 'Jane',
    'Last Name': 'Smith',
    'Email': 'jane.smith@example.com',
    'Phone': '+1-555-0124',
    'Employee Type': 'contract',
    'Department': 'admin',
    'Joining Date': '2024-02-01',
    'Status': 'active',
    'Module':'Incidents'
  },
  {
    'Employee ID': 'EMP003',
    'First Name': 'Mike',
    'Last Name': 'Johnson',
    'Email': 'mike.johnson@example.com',
    'Phone': '+1-555-0125',
    'Employee Type': 'permanent',
    'Department': 'hr',
    'Joining Date': '2024-01-20',
    'Status': 'active',
    'Module':'Incidents'
  }
];

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
    { wch: 15 }, // Joining Date
    { wch: 10 },  // Status
    { wch: 20 }  // Module
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
        const value = row[header as keyof EmployeeTemplateData];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
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
    'Joining Date',
    'Status',
    'Module'
  ],
  supportedFormats: ['XLSX', 'XLS', 'CSV'],
  employeeTypes: ['permanent', 'contract', 'temporary', 'intern'],
  departments: ['operations', 'admin', 'hr', 'finance', 'it', 'marketing', 'sales'],
  statuses: ['active', 'inactive', 'terminated'],
  dateFormat: 'YYYY-MM-DD (e.g., 2024-01-15)'
});


