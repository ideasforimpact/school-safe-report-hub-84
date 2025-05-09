
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { RawEmployeeData } from '../types/importTypes';

// Define the expected columns in the Excel file
const expectedColumns = [
  'employeeId', 
  'firstName', 
  'lastName', 
  'email', 
  'phone', 
  'employeeType',
  'department',
  'joiningDate',
  'status'
];

/**
 * Parse Excel file and extract raw employee data
 */
export const parseExcelFile = (file: File): Promise<RawEmployeeData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const rawData = XLSX.utils.sheet_to_json<RawEmployeeData>(sheet);
        
        if (rawData.length === 0) {
          toast.error('No data found in the Excel file');
          reject(new Error('No data found in the Excel file'));
          return;
        }
        
        // Validate columns
        const firstRow = rawData[0];
        const missingColumns = expectedColumns.filter(col => !(col in firstRow));
        
        if (missingColumns.length > 0) {
          toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
          reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
          return;
        }
        
        resolve(rawData);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        toast.error('Failed to process Excel file');
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      toast.error('Error reading file');
      reject(error);
    };
    
    reader.readAsBinaryString(file);
  });
};
