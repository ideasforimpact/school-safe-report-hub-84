
import * as XLSX from 'xlsx';
import { validateExcelData } from './utils/excelValidationUtils';
import { processStudentData, showImportResultNotifications } from './importProcessingService';
import { RawStudentData } from './types/importTypes';
import { useAuth } from '@/contexts/auth';

/**
 * Validate Excel/CSV data to ensure all required fields are present and valid
 */
export const validateStudentExcel = async (file: File): Promise<string[]> => {
  console.log('Starting student Excel validation for file:', file.name);
  
  // Get client ID from auth context
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  
  if (!clientId) {
    throw new Error('Client ID is required for validating students');
  }
  
  try {
    // Read and parse Excel file
    const rawData = await readExcelFile(file);
    console.log('Raw data from Excel:', rawData);
    
    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in the Excel file');
    }
    
    // Validate the data structure and business rules
    console.log('Validating Excel data...');
    const validationErrors = await validateExcelData(rawData, clientId);
    
    return validationErrors;
    
  } catch (error) {
    console.error('Error in student Excel validation:', error);
    throw error;
  }
};

/**
 * Main function to process Excel file and import students
 */
export const processStudentExcel = async (file: File): Promise<void> => {
  console.log('Starting student Excel processing for file:', file.name);
  
  // Get client ID from auth context
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  
  if (!clientId) {
    throw new Error('Client ID is required for importing students');
  }
  
  try {
    // Read and parse Excel file
    const rawData = await readExcelFile(file);
    console.log('Raw data from Excel:', rawData);
    
    if (!rawData || rawData.length === 0) {
      throw new Error('No data found in the Excel file');
    }
    
    // Validate the data structure and business rules
    console.log('Validating Excel data...');
    const validationErrors = await validateExcelData(rawData, clientId);
    
    if (validationErrors.length > 0) {
      console.error('Validation errors found:', validationErrors);
      throw new Error(`Validation failed:\n${validationErrors.join('\n')}`);
    }
    
    console.log('Validation passed, processing student data...');
    
    // Process the validated data
    const result = await processStudentData(rawData, clientId);
    
    console.log('Import result:', result);
    
    // Show appropriate notifications
    showImportResultNotifications(result);
    
  } catch (error) {
    console.error('Error in student Excel processing:', error);
    throw error;
  }
};

/**
 * Read and parse Excel file to extract student data
 */
const readExcelFile = async (file: File): Promise<RawStudentData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('No worksheets found in the Excel file'));
          return;
        }
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '', // Default value for empty cells
          blankrows: false // Skip blank rows
        }) as any[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file must contain at least a header row and one data row'));
          return;
        }
        
        // Get headers from first row
        const headers = jsonData[0].map((header: any) => String(header).trim().toLowerCase());
        console.log('Excel headers found:', headers);
        
        // Map expected column names to possible variations
        const columnMapping: Record<string, string[]> = {
          studentId: ['studentid', 'student_id', 'student id', 'id', 'student number', 'studentnumber'],
          name: ['name', 'student name', 'studentname', 'full name', 'fullname'],
          grade: ['grade', 'class', 'level', 'year'],
          section: ['section', 'division', 'group'],
          campus: ['campus', 'school', 'branch', 'location']
        };
        
        // Create index mapping for columns
        const columnIndexes: Record<string, number> = {};
        
        for (const [key, variations] of Object.entries(columnMapping)) {
          const foundIndex = headers.findIndex(header => 
            variations.some(variation => header.includes(variation))
          );
          
          if (foundIndex !== -1) {
            columnIndexes[key] = foundIndex;
          }
        }
        
        console.log('Column indexes mapped:', columnIndexes);
        
        // Check if all required columns are found
        const requiredColumns = ['studentId', 'name', 'grade', 'section', 'campus'];
        const missingColumns = requiredColumns.filter(col => !(col in columnIndexes));
        
        if (missingColumns.length > 0) {
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}. Found headers: ${headers.join(', ')}`));
          return;
        }
        
        // Convert data rows to objects
        const studentData: RawStudentData[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          // Skip empty rows
          if (!row || row.every(cell => !cell || String(cell).trim() === '')) {
            continue;
          }
          
          const student: RawStudentData = {
            studentId: row[columnIndexes.studentId] || '',
            name: row[columnIndexes.name] || '',
            grade: row[columnIndexes.grade] || '',
            section: row[columnIndexes.section] || '',
            campus: row[columnIndexes.campus] || ''
          };
          
          studentData.push(student);
        }
        
        console.log(`Parsed ${studentData.length} student records from Excel`);
        resolve(studentData);
        
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
