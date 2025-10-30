import * as XLSX from 'xlsx';

export interface StudentTemplateData {
  'Student ID': string;
  'Name': string;
  'Grade': string;
  'Section': string;
  'Campus': string;
}

/**
 * Generate sample data for the student template
 */
const generateSampleData = (): StudentTemplateData[] => [
  {
    'Student ID': 'STU001',
    'Name': 'John Smith',
    'Grade': '10',
    'Section': 'A',
    'Campus': 'Main Campus'
  },
  {
    'Student ID': 'STU002',
    'Name': 'Sarah Johnson',
    'Grade': '9',
    'Section': 'B',
    'Campus': 'Main Campus'
  },
  {
    'Student ID': 'STU003',
    'Name': 'Michael Brown',
    'Grade': '11',
    'Section': 'A',
    'Campus': 'North Campus'
  },
  {
    'Student ID': 'STU004',
    'Name': 'Emily Davis',
    'Grade': '8',
    'Section': 'C',
    'Campus': 'Main Campus'
  },
  {
    'Student ID': 'STU005',
    'Name': 'David Wilson',
    'Grade': '12',
    'Section': 'A',
    'Campus': 'South Campus'
  }
];

/**
 * Download Excel template with sample data
 */
export const downloadStudentExcelTemplate = (): void => {
  const sampleData = generateSampleData();
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create a worksheet from the sample data
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths for better readability
  const columnWidths = [
    { wch: 12 }, // Student ID
    { wch: 20 }, // Name
    { wch: 8 },  // Grade
    { wch: 10 }, // Section
    { wch: 15 }  // Campus
  ];
  worksheet['!cols'] = columnWidths;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  // Generate the Excel file and trigger download
  XLSX.writeFile(workbook, 'student_import_template.xlsx');
};

/**
 * Download CSV template with sample data
 */
export const downloadStudentCSVTemplate = (): void => {
  const sampleData = generateSampleData();
  
  // Convert to CSV format
  const headers = Object.keys(sampleData[0]);
  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => 
      headers.map(header => {
        const value = row[header as keyof StudentTemplateData];
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
  link.setAttribute('download', 'student_import_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get template format information for display
 */
export const getStudentTemplateFormatInfo = () => ({
  requiredColumns: [
    'Student ID',
    'Name',
    'Grade',
    'Section',
    'Campus'
  ],
  supportedFormats: ['XLSX', 'XLS', 'CSV'],
  grades: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  sections: ['A', 'B', 'C', 'D', 'E'],
  campusExamples: ['Main Campus', 'North Campus', 'South Campus', 'East Campus', 'West Campus'],
  notes: [
    'Student IDs must be unique within your organization',
    'Grade can be any valid grade level (1-12)',
    'Section can be any letter or identifier',
    'Campus should match your organization\'s campus names'
  ]
});



