
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
          
          // Convert the worksheet to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });
          console.log("Raw Excel data:", jsonData);
          
          // Map Excel column names to our expected property names
          const employeeData: RawEmployeeData[] = jsonData.map((row: any, index: number) => {
            // Handle different possible column names for each field
            const mappedData: RawEmployeeData = {
              employeeId: row['Employee ID'] || row['EmployeeID'] || row['employeeId'] || row['employee_id'] || row['id'] || '',
              firstName: row['First Name'] || row['FirstName'] || row['firstName'] || row['first_name'] || '',
              lastName: row['Last Name'] || row['LastName'] || row['lastName'] || row['last_name'] || '',
              email: row['Email'] || row['email'] || '',
              phone: row['Phone'] || row['phone'] || '',
              employeeType: row['Employee Type'] || row['EmployeeType'] || row['employeeType'] || row['employee_type'] || 'permanent',
              department: row['Department'] || row['department'] || 'operations',
              // Handle date formats
              joiningDate: row['Joining Date'] || row['JoiningDate'] || row['joiningDate'] || row['joining_date'] || 
                          (new Date().toISOString().split('T')[0]), // Default to today
              status: row['Status'] || row['status'] || 'active'
            };
            
            // Log each mapped row to verify
            console.log(`Mapped row ${index + 1}:`, mappedData);
            
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
