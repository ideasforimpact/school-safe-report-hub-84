
import * as XLSX from 'xlsx';
import { RawEmployeeData } from '../types/importTypes';

/**
 * Parse an Excel file into structured employee data
 */
export const parseExcelFile = async (file: File): Promise<RawEmployeeData[]> => {
  return new Promise((resolve, reject) => {
    try {
      // Create a FileReader to read the Excel file
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (!e.target || !e.target.result) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          // Parse the Excel file
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert the worksheet to JSON with raw: true to get all data types preserved
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: '' });
          console.log("Raw Excel data:", JSON.stringify(jsonData));
          
          // Map Excel column names to our expected property names
          const employeeData: RawEmployeeData[] = jsonData.map((row: any, index: number) => {
            // Enhanced mapping for various possible column names
            // First try exact match, then case-insensitive, then with spaces or underscores
            const getFieldValue = (fieldNames: string[]): string => {
              for (const name of fieldNames) {
                // Try direct key match
                if (row[name] !== undefined) return String(row[name]);
                
                // Try case-insensitive match
                const lowerName = name.toLowerCase();
                for (const key of Object.keys(row)) {
                  if (key.toLowerCase() === lowerName) return String(row[key]);
                }
              }
              return '';
            };
            
            // Fix email mapping - add more possible column names
            const mappedData: RawEmployeeData = {
              employeeId: getFieldValue(['Employee ID', 'EmployeeID', 'employeeId', 'employee_id', 'id', 'ID', 'Id']),
              firstName: getFieldValue(['First Name', 'FirstName', 'firstName', 'first_name', 'First name', 'FIRSTNAME']),
              lastName: getFieldValue(['Last Name', 'LastName', 'lastName', 'last_name', 'Last name', 'LASTNAME']),
              email: getFieldValue(['Email', 'email', 'EMAIL', 'EmailAddress', 'email_address', 'Email Address', 'Mail']),
              phone: getFieldValue(['Phone', 'phone', 'PhoneNumber', 'phone_number', 'Phone Number', 'Contact', 'Mobile']),
              employeeType: getFieldValue(['Employee Type', 'EmployeeType', 'employeeType', 'employee_type', 'Type']) || 'permanent',
              department: getFieldValue(['Department', 'department', 'DEPARTMENT', 'Dept']) || 'operations',
              // Handle date formats
              joiningDate: getFieldValue(['Joining Date', 'JoiningDate', 'joiningDate', 'joining_date', 'Start Date', 'DateJoined']) || 
                          (new Date().toISOString().split('T')[0]),
              status: getFieldValue(['Status', 'status', 'STATE', 'Employment Status']) || 'active'
            };
            
            // Log each mapped row to debug
            console.log(`Mapped row ${index + 1}:`, mappedData);
            
            // Extra validation for required fields, especially email
            if (!mappedData.email) {
              console.warn(`Warning: Row ${index + 1} is missing email address`);
            }
            
            return mappedData;
          });
          
          console.log("Processed employee data:", employeeData);
          
          resolve(employeeData);
        } catch (error) {
          console.error("Error parsing Excel file:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
      };
      
      // Read the file as an array buffer
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error("Exception in parseExcelFile:", error);
      reject(error);
    }
  });
};
