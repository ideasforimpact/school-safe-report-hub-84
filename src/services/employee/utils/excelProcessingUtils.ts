import * as XLSX from 'xlsx';
import { RawEmployeeData } from '../types/importTypes';

/**
 * Parse Excel file and extract employee data
 */
export const parseExcelFile = async (file: File): Promise<RawEmployeeData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (!e.target?.result) {
          throw new Error('Failed to read file content');
        }
        
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        
        if (!sheetName) {
          throw new Error('No worksheet found in Excel file');
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet);
        
        console.info("Raw Excel data before mapping:", rawData);
        
        // Define header mapping from Excel to our data model
        const headerMapping: Record<string, string> = {
          'First Name': 'firstName',
          'Last Name': 'lastName',
          'Employee ID': 'employeeId',
          'Email ID': 'email',
          'Email': 'email', // Alternative header name
          'Phone': 'phone',
          'Employee Type': 'employeeType',
          'Department': 'department',
          'Date of Joining': 'joiningDate',
          'Joining Date': 'joiningDate', // Alternative header name
          'Status': 'status'
        };
        
        console.info("Header mapping:", headerMapping);
        
        // Transform data to match our data model
        const transformedData = rawData.map((row: any): RawEmployeeData => {
          const transformedRow: any = {};
          
          // Map fields based on header mapping
          Object.keys(row).forEach(key => {
            const mappedKey = headerMapping[key];
            if (mappedKey) {
              transformedRow[mappedKey] = row[key];
            } else {
              // Keep the original key if no mapping exists
              transformedRow[key] = row[key];
            }
          });
          
          // Handle date values that might be in Excel serial format
          if (transformedRow.joiningDate && typeof transformedRow.joiningDate === 'number') {
            try {
              // Convert Excel serial date to JS date
              const excelEpoch = new Date(1899, 11, 30);
              const date = new Date(excelEpoch.getTime() + (transformedRow.joiningDate * 24 * 60 * 60 * 1000));
              transformedRow.joiningDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            } catch (e) {
              console.error("Error converting Excel date:", e);
            }
          }
          
          return transformedRow;
        });
        
        console.info("Transformed data after mapping:", transformedData);
        resolve(transformedData);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error('Failed to read file'));
    };
    
    // Read the file as an array buffer
    reader.readAsArrayBuffer(file);
  });
};
