import * as XLSX from 'xlsx';
import type { ClientTypeKey } from '@/lang/types';

export interface StudentTemplateLabels {
  studentId: string;
  name: string;
  grade: string;
  section: string;
  campus: string;
}

const DEFAULT_LABELS: StudentTemplateLabels = {
  studentId: 'Student ID',
  name: 'Name',
  grade: 'Grade',
  section: 'Section',
  campus: 'Campus'
};

interface SampleRow {
  name: string;
  grade: string;
  section: string;
  campus: string;
}

// Sample rows for types that actually have students - institutes track courses
// (Department) and admission years (Batch), schools track grade levels and letter
// sections. Work has no students, so it gets no sample rows (headers only).
const SAMPLE_ROWS_BY_TYPE: Partial<Record<ClientTypeKey, SampleRow[]>> = {
  institute: [
    { name: 'John Smith', grade: 'BSC IT', section: '2021', campus: 'Main Campus' },
    { name: 'Sarah Johnson', grade: 'MSC CS', section: '2022', campus: 'Main Campus' },
    { name: 'Michael Brown', grade: 'BCA', section: '2021', campus: 'North Campus' },
    { name: 'Emily Davis', grade: 'BCOM', section: '2023', campus: 'Main Campus' },
    { name: 'David Wilson', grade: 'MBA', section: '2020', campus: 'South Campus' }
  ],
  school: [
    { name: 'John Smith', grade: '10', section: 'A', campus: 'Main Campus' },
    { name: 'Sarah Johnson', grade: '9', section: 'B', campus: 'Main Campus' },
    { name: 'Michael Brown', grade: '11', section: 'A', campus: 'North Campus' },
    { name: 'Emily Davis', grade: '8', section: 'C', campus: 'Main Campus' },
    { name: 'David Wilson', grade: '12', section: 'A', campus: 'South Campus' }
  ]
};

const getHeaders = (labels: StudentTemplateLabels): string[] => [
  labels.studentId,
  labels.name,
  labels.grade,
  labels.section,
  labels.campus
];

const getSampleRows = (
  labels: StudentTemplateLabels,
  clientTypeKey?: ClientTypeKey
): Record<string, string>[] => {
  const rows = clientTypeKey ? SAMPLE_ROWS_BY_TYPE[clientTypeKey] : undefined;
  if (!rows) return [];

  return rows.map((row, index) => ({
    [labels.studentId]: `STU00${index + 1}`,
    [labels.name]: row.name,
    [labels.grade]: row.grade,
    [labels.section]: row.section,
    [labels.campus]: row.campus
  }));
};

/**
 * Download Excel template - with sample rows for school/institute, headers only for work
 */
export const downloadStudentExcelTemplate = (
  labels: StudentTemplateLabels = DEFAULT_LABELS,
  clientTypeKey?: ClientTypeKey
): void => {
  const headers = getHeaders(labels);
  const sampleRows = getSampleRows(labels, clientTypeKey);
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  // Create a worksheet - header row plus any sample rows for this client type
  const worksheet = sampleRows.length > 0
    ? XLSX.utils.json_to_sheet(sampleRows, { header: headers })
    : XLSX.utils.aoa_to_sheet([headers]);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 12 }, // Student ID
    { wch: 20 }, // Name
    { wch: 14 }, // Grade
    { wch: 12 }, // Section
    { wch: 15 }  // Campus
  ];
  worksheet['!cols'] = columnWidths;
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
  
  // Generate the Excel file and trigger download
  XLSX.writeFile(workbook, 'student_import_template.xlsx');
};

/**
 * Download CSV template - with sample rows for school/institute, headers only for work
 */
export const downloadStudentCSVTemplate = (
  labels: StudentTemplateLabels = DEFAULT_LABELS,
  clientTypeKey?: ClientTypeKey
): void => {
  const headers = getHeaders(labels);
  const sampleRows = getSampleRows(labels, clientTypeKey);
  const csvContent = [
    headers.join(','),
    ...sampleRows.map(row =>
      headers.map(header => {
        const value = row[header];
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
export const getStudentTemplateFormatInfo = (labels: StudentTemplateLabels = DEFAULT_LABELS) => ({
  requiredColumns: getHeaders(labels),
  supportedFormats: ['XLSX', 'XLS', 'CSV'],
  notes: [
    `${labels.studentId}s must be unique within your organization`,
    `${labels.campus} should match your organization's ${labels.campus.toLowerCase()} names`
  ]
});



