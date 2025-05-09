
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { RawEmployeeData } from '../types/importTypes';

// Define the expected columns in the Excel file and their mappings
const columnMappings = {
  'employeeId': ['employee id', 'employeeid', 'employee_id', 'id', 'emp id', 'empid'],
  'firstName': ['first name', 'firstname', 'first_name', 'given name', 'name'],
  'lastName': ['last name', 'lastname', 'last_name', 'surname', 'family name'],
  'email': ['email', 'email address', 'mail', 'email id', 'emailid'],
  'phone': ['phone', 'phone number', 'mobile', 'contact'],
  'employeeType': ['employee type', 'employeetype', 'type', 'employment type', 'emp type', 'emp. type'],
  'department': ['department', 'dept', 'division', 'team'],
  'joiningDate': ['joining date', 'joiningdate', 'join date', 'start date', 'hired date', 'date of joining'],
  'status': ['status', 'employment status', 'state']
};

// Create a reverse mapping for lookup
const reverseColumnMappings: Record<string, string> = {};

Object.entries(columnMappings).forEach(([key, values]) => {
  values.forEach(value => {
    reverseColumnMappings[value] = key;
  });
});

/**
 * Parse Excel file and extract raw employee data with proper column mapping
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
        
        // Convert sheet to JSON with raw header names
        const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);
        
        if (rawData.length === 0) {
          toast.error('No data found in the Excel file');
          reject(new Error('No data found in the Excel file'));
          return;
        }

        // Log the raw data for debugging
        console.log("Raw Excel data before mapping:", rawData);
        
        // Get the header row keys
        const headers = Object.keys(rawData[0]);
        
        // Map Excel headers to our expected field names
        const headerMap: Record<string, string> = {};
        
        headers.forEach(header => {
          const normalizedHeader = header.toLowerCase().trim();
          
          // Check if this header matches any of our expected field mappings
          const mappedField = reverseColumnMappings[normalizedHeader];
          
          if (mappedField) {
            headerMap[header] = mappedField;
          } else {
            // Try to find a partial match
            for (const [key, values] of Object.entries(columnMappings)) {
              if (values.some(value => normalizedHeader.includes(value))) {
                headerMap[header] = key;
                break;
              }
            }
            
            // If still no match, use the original header
            if (!headerMap[header]) {
              headerMap[header] = header;
            }
          }
        });

        console.log("Header mapping:", headerMap);
        
        // Transform the data using our header mapping
        const transformedData: RawEmployeeData[] = rawData.map(row => {
          const transformed: Record<string, any> = {};
          
          Object.entries(row).forEach(([originalHeader, value]) => {
            const mappedHeader = headerMap[originalHeader] || originalHeader;
            transformed[mappedHeader] = value;
          });
          
          return transformed as RawEmployeeData;
        });
        
        console.log("Transformed data after mapping:", transformedData);
        resolve(transformedData);
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

/**
 * Check if all required columns are present in the Excel file
 */
export const validateRequiredColumns = (data: Record<string, any>[]): string[] => {
  const requiredColumns = ['employeeId', 'firstName', 'lastName', 'email', 'employeeType', 'department', 'joiningDate', 'status'];
  const missingColumns: string[] = [];
  
  if (data.length === 0) return ['No data found in the file'];
  
  const firstRow = data[0];
  requiredColumns.forEach(col => {
    if (!(col in firstRow)) {
      missingColumns.push(col);
    }
  });
  
  return missingColumns;
};

