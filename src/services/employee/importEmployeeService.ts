
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { addEmployeeToApi } from './employeeApiService';
import { EmployeeType, DepartmentType, EmploymentStatus, Employee } from '@/contexts/employee/types';

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

// Define a type for the raw employee data from Excel
interface RawEmployeeData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeType: string;
  department: string;
  joiningDate: string;
  status: string;
  [key: string]: any;
}

/**
 * Process and import employees from Excel file
 */
export const processEmployeeExcel = async (file: File): Promise<Employee[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
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
        
        // Process and add employees
        const addedEmployees: Employee[] = [];
        const errors: string[] = [];
        let successCount = 0;
        
        // Process each row
        for (const [index, row] of rawData.entries()) {
          try {
            // Validate and normalize employee type
            const employeeType = validateEmployeeType(row.employeeType);
            if (!employeeType) {
              errors.push(`Row ${index + 2}: Invalid employee type "${row.employeeType}"`);
              continue;
            }
            
            // Validate and normalize department
            const department = validateDepartment(row.department);
            if (!department) {
              errors.push(`Row ${index + 2}: Invalid department "${row.department}"`);
              continue;
            }
            
            // Validate and normalize status
            const status = validateEmploymentStatus(row.status);
            if (!status) {
              errors.push(`Row ${index + 2}: Invalid status "${row.status}"`);
              continue;
            }
            
            // Prepare employee data
            const employeeData = {
              employeeId: String(row.employeeId),
              firstName: String(row.firstName),
              lastName: String(row.lastName),
              email: String(row.email),
              phone: row.phone ? String(row.phone) : undefined,
              employeeType,
              department,
              joiningDate: String(row.joiningDate),
              status,
              applicationFields: {}
            };
            
            // Add employee to database
            const addedEmployee = await addEmployeeToApi(employeeData);
            addedEmployees.push(addedEmployee);
            successCount++;
          } catch (error) {
            console.error(`Error processing row ${index + 2}:`, error);
            errors.push(`Row ${index + 2}: ${(error as Error).message || 'Unknown error'}`);
          }
        }
        
        // Show summary toast
        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} employees`);
        }
        
        // Show errors if any
        if (errors.length > 0) {
          console.error('Import errors:', errors);
          if (errors.length <= 3) {
            errors.forEach(error => toast.error(error));
          } else {
            toast.error(`Failed to import ${errors.length} employees. Check console for details.`);
          }
        }
        
        resolve(addedEmployees);
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
 * Validate and normalize employee type
 */
const validateEmployeeType = (value: string): EmployeeType | null => {
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Check if it's already a valid EmployeeType
  const validTypes: EmployeeType[] = ['permanent', 'contract', 'intern'];
  if (validTypes.includes(normalizedValue as EmployeeType)) {
    return normalizedValue as EmployeeType;
  }
  
  // Handle common variations
  const typeMap: Record<string, EmployeeType> = {
    permanent: 'permanent',
    perm: 'permanent',
    full_time: 'permanent',
    fulltime: 'permanent',
    'full-time': 'permanent',
    contract: 'contract',
    contractor: 'contract',
    temp: 'contract',
    temporary: 'contract',
    intern: 'intern',
    internship: 'intern'
  };
  
  return typeMap[normalizedValue] || null;
};

/**
 * Validate and normalize department
 */
const validateDepartment = (value: string): DepartmentType | null => {
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Check if it's already a valid DepartmentType
  const validDepartments: DepartmentType[] = ['admin', 'teaching', 'management', 'it', 'finance', 'hr'];
  if (validDepartments.includes(normalizedValue as DepartmentType)) {
    return normalizedValue as DepartmentType;
  }
  
  // Handle common variations
  const departmentMap: Record<string, DepartmentType> = {
    admin: 'admin',
    administration: 'admin',
    administrative: 'admin',
    teach: 'teaching',
    teaching: 'teaching',
    faculty: 'teaching',
    teacher: 'teaching',
    educator: 'teaching',
    professor: 'teaching',
    support: 'admin',
    support_staff: 'admin',
    'support staff': 'admin',
    management: 'management',
    manager: 'management',
    it: 'it',
    tech: 'it',
    technology: 'it',
    information_technology: 'it',
    'information technology': 'it',
    finance: 'finance',
    accounting: 'finance',
    financial: 'finance',
    hr: 'hr',
    'human resources': 'hr',
    human_resources: 'hr',
    facilities: 'admin',
    facility: 'admin',
    maintenance: 'admin',
    security: 'admin',
    safety: 'admin',
    guard: 'admin'
  };
  
  return departmentMap[normalizedValue] || null;
};

/**
 * Validate and normalize employment status
 */
const validateEmploymentStatus = (value: string): EmploymentStatus | null => {
  const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '_');
  
  // Check if it's already a valid EmploymentStatus
  const validStatuses: EmploymentStatus[] = ['active', 'on_leave', 'resigned', 'terminated', 'retired'];
  if (validStatuses.includes(normalizedValue as EmploymentStatus)) {
    return normalizedValue as EmploymentStatus;
  }
  
  // Handle common variations
  const statusMap: Record<string, EmploymentStatus> = {
    active: 'active',
    current: 'active',
    employed: 'active',
    working: 'active',
    on_leave: 'on_leave',
    leave: 'on_leave',
    'on leave': 'on_leave',
    resigned: 'resigned',
    quit: 'resigned',
    left: 'resigned',
    terminated: 'terminated',
    fired: 'terminated',
    dismissed: 'terminated',
    retired: 'retired',
    pension: 'retired'
  };
  
  return statusMap[normalizedValue] || null;
};
