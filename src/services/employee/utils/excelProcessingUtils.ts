
import * as XLSX from 'xlsx';
import { RawEmployeeData } from '../types/importTypes';

/**
 * Sanitize a raw cell value from Excel or CSV.
 *
 * Removes invisible characters that copy-paste from Word / Outlook / browsers
 * leaves behind (zero-width chars, BOM, soft hyphen, word joiner). Converts
 * non-breaking space and line/paragraph separators into a regular space so
 * trimming and downstream regex checks behave as expected. Finally trims
 * leading/trailing whitespace.
 *
 * Returns a string. Empty / null / undefined become ''.
 *
 * NOTE: This intentionally does NOT strip characters from inside the value
 * that are valid in names/addresses (unicode letters etc.). It only removes
 * formatting noise. Validation rules elsewhere are unchanged.
 */
export const sanitizeCellValue = (value: unknown): string => {
  if (value === undefined || value === null) return '';
  return String(value)
    // Strip invisible / formatting characters that copy-paste from
    // Word / Outlook / browsers tends to leave behind:
    //   \u200B zero-width space
    //   \u200C zero-width non-joiner
    //   \u200D zero-width joiner
    //   \u2060 word joiner
    //   \uFEFF BOM / zero-width no-break space
    //   \u00AD soft hyphen
    .replace(/(\u200B|\u200C|\u200D|\u2060|\uFEFF|\u00AD)/g, '')
    // Normalize exotic whitespace into a regular space so trim() and
    // \s-based regexes treat them like normal whitespace:
    //   \u00A0 non-breaking space
    //   \u2028 line separator
    //   \u2029 paragraph separator
    .replace(/[\u00A0\u2028\u2029]/g, ' ')
    .trim();
};

/**
 * Safely detect CSV delimiter (comma / semicolon / tab)
 */
const detectDelimiter = (headerLine: string): string => {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;

  if (semicolonCount > commaCount && semicolonCount >= tabCount) return ';';
  if (tabCount > commaCount && tabCount >= semicolonCount) return '\t';
  return ','; // default
};

/**
 * Parse a single CSV line into values, honoring quotes and a dynamic delimiter.
 * This is more robust than a simple split and avoids column-shift issues.
 */
const parseCsvLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Handle escaped quotes ("")
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else if (char !== '\r') {
      current += char;
    }
  }

  values.push(current.trim());

  return values.map(v => v.replace(/^"|"$/g, '').trim());
};

/**
 * Parse a CSV file into structured employee data
 */
export const parseCSVFile = async (file: File): Promise<RawEmployeeData[]> => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          if (!e.target || !e.target.result) {
            reject(new Error('Failed to read CSV file'));
            return;
          }
          
          const csvText = e.target.result as string;
          const lines = csvText.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length < 2) {
            reject(new Error('CSV file must contain at least a header row and one data row'));
            return;
          }

          // Detect delimiter from the first line so semicolon- or tab-separated CSVs work too
          const rawHeaderLine = lines[0].replace(/^\uFEFF/, ''); // strip BOM if present
          const delimiter = detectDelimiter(rawHeaderLine);
          
          // Parse header row
          const headers = parseCsvLine(rawHeaderLine, delimiter).map(header =>
            header.trim().replace(/"/g, '')
          );
          console.log("CSV delimiter detected:", JSON.stringify(delimiter));
          console.log("CSV headers:", headers);
          
          // Parse data rows
          const jsonData = lines.slice(1).map((line) => {
            const values = parseCsvLine(line, delimiter);
            const row: Record<string, string> = {};
            
            headers.forEach((header, i) => {
              const key = header.trim();
              // Skip completely empty header cells to avoid weird composite keys
              if (!key) return;
              row[key] = values[i] ?? '';
            });
            
            return row;
          });
          
          console.log("Raw CSV data:", JSON.stringify(jsonData));
          
          // Use the same mapping logic as Excel
          const employeeData: RawEmployeeData[] = jsonData.map((row: Record<string, string>, index: number) => {
          const normalizeDate = (value: unknown): string => {
              if (!value) return "";

              if (value instanceof Date && !isNaN(value.getTime())) {
                const y = value.getFullYear();
                const m = String(value.getMonth() + 1).padStart(2, "0");
                const d = String(value.getDate()).padStart(2, "0");
                return `${y}-${m}-${d}`;
              }

              const isExcelNumber = (v: unknown) =>
                typeof v === "number" ||
                (typeof v === "string" && /^[0-9]+$/.test(v));

              if (isExcelNumber(value)) {
                const serial = Number(value);
                if (serial > 1 && serial < 60000) {
                  const excelEpoch = new Date(1899, 11, 30);
                  const date = new Date(excelEpoch.getTime() + serial * 86400000);
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  return `${y}-${m}-${d}`;
                }
              }

              if (typeof value === "string" && value.includes("/")) {
                const parts = value.split("/");
                if (parts.length === 3) {
                  const trimmed = parts.map(v => v.trim());
                  const d = trimmed[0];
                  const m = trimmed[1];
                  let y = trimmed[2];

                  if (y.length === 2) y = "20" + y;

                  const date = new Date(Number(y), Number(m) - 1, Number(d));

                  const yy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, "0");
                  const dd = String(date.getDate()).padStart(2, "0");
                  return `${yy}-${mm}-${dd}`;
                }
              }
              const parsed = new Date(value as string | number);
              if (!isNaN(parsed.getTime())) {
                const y = parsed.getFullYear();
                const m = String(parsed.getMonth() + 1).padStart(2, "0");
                const d = String(parsed.getDate()).padStart(2, "0");
                return `${y}-${m}-${d}`;
              }

              return String(value);
            };
            const getFieldValue = (fieldNames: string[]): string => {
              for (const name of fieldNames) {
                if (row[name] !== undefined) return sanitizeCellValue(row[name]);

                const lowerName = name.toLowerCase();
                for (const key of Object.keys(row)) {
                  if (key.toLowerCase() === lowerName) return sanitizeCellValue(row[key]);
                }
              }
              return '';
            };

            const findModuleField = (): string[] => {
              const knownFieldNames = [
                'Module', 'Modules', 'module', 'modules',
                'Assigned Module', 'Assigned Modules', 'assigned_module',
                'module_name', 'module(s)'
              ];
              const foundValues: string[] = [];
              for (const key of Object.keys(row)) {
                if (knownFieldNames.some(v => v.toLowerCase() === key.toLowerCase())) {
                  foundValues.push(row[key]);
                }
              }
              if (foundValues.length === 0) return [];

              return foundValues
                .flatMap(value => sanitizeCellValue(value).split(","))
                .map(v => sanitizeCellValue(v))
                .filter(Boolean);
            };

            const findEmailField = (): string => {
              const knownFieldNames = ['Email', 'email', 'EMAIL', 'EmailAddress', 'Email Address',
                'email_address', 'Mail', 'E-Mail', 'e-mail', 'E Mail', 'email_id', 'Email ID'];

              for (const name of knownFieldNames) {
                if (row[name] !== undefined && row[name] !== '') {
                  return sanitizeCellValue(row[name]);
                }
              }

              for (const key of Object.keys(row)) {
                if ((key.toLowerCase().includes('email') || key.toLowerCase().includes('mail')) && row[key] !== '') {
                  console.log(`Found email in column: ${key} = ${row[key]}`);
                  return sanitizeCellValue(row[key]);
                }
              }

              for (const key of Object.keys(row)) {
                const value = row[key];
                if (typeof value === 'string' && value.includes('@')) {
                  console.log(`Found email by @ symbol in column: ${key} = ${value}`);
                  return sanitizeCellValue(value);
                }
              }

              return '';
            };
            
            const mappedData: RawEmployeeData = {
              employeeId: getFieldValue(['Employee ID', 'EmployeeID', 'employeeId', 'employee_id', 'id', 'ID', 'Id', 'EmpID', 'EmpId']),
              firstName: getFieldValue(['First Name', 'FirstName', 'firstName', 'first_name', 'First name', 'FIRSTNAME', 'Name', 'First', 'Given Name']),
              lastName: getFieldValue(['Last Name', 'LastName', 'lastName', 'last_name', 'Last name', 'LASTNAME', 'Surname', 'Family Name']),
              email: findEmailField(),
              phone: getFieldValue(['Phone', 'phone', 'PhoneNumber', 'phone_number', 'Phone Number', 'Contact', 'Mobile', 'Cell', 'Telephone']),
              employeeType: getFieldValue(['Employee Type', 'EmployeeType', 'employeeType', 'employee_type', 'Type', 'Position', 'Role']).toLowerCase() || undefined,
              department: getFieldValue(['Department', 'department', 'DEPARTMENT', 'Dept', 'Team', 'Division', 'Unit']) || undefined,
              designation: getFieldValue(['Designation', 'designation', 'DESIGNATION', 'Title', 'Job Title', 'JobTitle', 'Role Name']),
              joiningDate: normalizeDate(getFieldValue([
                              'Joining Date', 'JoiningDate', 'joiningDate', 'joining_date',
                              'Start Date', 'DateJoined', 'Date of Joining', 'Hire Date'
                            ])) || new Date().toISOString().split("T")[0],
              status: getFieldValue(['Status', 'status', 'STATE', 'Employment Status', 'Employee Status']) || 'active',
              moduleAccessPayload: findModuleField(),
              // Personal Details
              middleName: getFieldValue(['Middle Name', 'middleName', 'middle_name']),
              fatherName: getFieldValue(['Father Name', 'fatherName', 'father_name']),
              gender: getFieldValue(['Gender', 'gender']).toLowerCase(),
              dob: normalizeDate(getFieldValue(['DOB', 'Date of Birth', 'dob', 'date_of_birth'])),
              religion: getFieldValue(['Religion', 'religion']),
              nationality: getFieldValue(['Nationality', 'nationality']),
              bloodGroup: getFieldValue(['Blood Group', 'bloodGroup', 'blood_group']),
              residenceAddress: getFieldValue(['Residence Address', 'residenceAddress', 'residence_address', 'Address']),
              experience: getFieldValue(['Experience', 'experience']),
              qualification: getFieldValue(['Qualification', 'qualification']),
              // Professional Other Details
              aadharNo: getFieldValue(['Aadhar No', 'Aadhaar No', 'Aadhar Number', 'aadharNo', 'aadhar_no', 'aadhaar_number']),
              panNo: getFieldValue(['PAN No', 'PAN Number', 'panNo', 'pan_no', 'pan_number']),
              esiNo: getFieldValue(['ESI No', 'ESI Number', 'esiNo', 'esi_no', 'esi_number']),
              pfNo: getFieldValue(['PF No', 'PF Number', 'pfNo', 'pf_no', 'pf_number']),
              resigningOrTerminationDate: normalizeDate(getFieldValue(['Resigning Date', 'Termination Date', 'Resigning / Termination Date', 'Exit Date', 'exitDate', 'exit_date'])),
              biometricUserId: getFieldValue(['Biometric User ID', 'Biometric ID', 'biometricUserId', 'biometric_user_id']),
            };
            
            console.log(`Mapped CSV row ${index + 1}:`, mappedData);
            
            if (!mappedData.email) {
              console.warn(`Warning: CSV Row ${index + 1} is missing email address. Original row:`, row);
              console.warn(`Available columns for this row:`, Object.keys(row));
            }
            
            return mappedData;
          });
          
          console.log("Processed CSV employee data:", employeeData);
          resolve(employeeData);
        } catch (error) {
          console.error("Error parsing CSV file:", error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        reject(error);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Exception in parseCSVFile:", error);
      reject(error);
    }
  });
};

/**
 * Parse an Excel or CSV file into structured employee data
 */
export const parseEmployeeFile = async (file: File): Promise<RawEmployeeData[]> => {
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  if (fileExtension === 'csv') {
    return parseCSVFile(file);
  } else {
    return parseExcelFile(file);
  }
};

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
          
          // Identify column headers for debugging
          console.log("Available columns:", Object.keys(jsonData[0] || {}));
          
          // Map Excel column names to our expected property names
          const employeeData: RawEmployeeData[] = jsonData.map((row: Record<string, unknown>, index: number) => {
            // Enhanced mapping for various possible column names
            // First try exact match, then case-insensitive, then with spaces or underscores
          const normalizeDate = (value: unknown): string => {
              if (!value) return "";

              if (value instanceof Date && !isNaN(value.getTime())) {
                const y = value.getFullYear();
                const m = String(value.getMonth() + 1).padStart(2, "0");
                const d = String(value.getDate()).padStart(2, "0");
                return `${y}-${m}-${d}`;
              }

              const isExcelNumber = (v: unknown) =>
                typeof v === "number" ||
                (typeof v === "string" && /^[0-9]+$/.test(v));

              if (isExcelNumber(value)) {
                const serial = Number(value);
                if (serial > 1 && serial < 60000) {
                  const excelEpoch = new Date(1899, 11, 30);
                  const date = new Date(excelEpoch.getTime() + serial * 86400000);
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  return `${y}-${m}-${d}`;
                }
              }

              if (typeof value === "string" && value.includes("/")) {
                const parts = value.split("/");
                if (parts.length === 3) {
                  const trimmed = parts.map(v => v.trim());
                  const d = trimmed[0];
                  const m = trimmed[1];
                  let y = trimmed[2];

                  if (y.length === 2) y = "20" + y; // Convert 25 → 2025

                  const date = new Date(Number(y), Number(m) - 1, Number(d));

                  const yy = date.getFullYear();
                  const mm = String(date.getMonth() + 1).padStart(2, "0");
                  const dd = String(date.getDate()).padStart(2, "0");
                  return `${yy}-${mm}-${dd}`;
                }
              }

              // 4. Try standard parsing
              const parsed = new Date(value as string | number);
              if (!isNaN(parsed.getTime())) {
                const y = parsed.getFullYear();
                const m = String(parsed.getMonth() + 1).padStart(2, "0");
                const d = String(parsed.getDate()).padStart(2, "0");
                return `${y}-${m}-${d}`;
              }

              return String(value);
            };
            // Cell sanitization is handled by the module-scope `sanitizeCellValue`
            // declared at the top of this file. It strips zero-width chars, BOM,
            // soft hyphen, word joiner, and normalizes NBSP / line / paragraph
            // separators to a regular space, then trims.
            const getFieldValue = (fieldNames: string[]): string => {
              for (const name of fieldNames) {
                // Try direct key match
                if (row[name] !== undefined) return sanitizeCellValue(row[name]);

                // Try case-insensitive match
                const lowerName = name.toLowerCase();
                for (const key of Object.keys(row)) {
                  if (key.toLowerCase() === lowerName) return sanitizeCellValue(row[key]);
                }
              }
              return '';
            };
            
            // Enhanced email field detection with additional common variants
            // Check for ANY column containing "email" in the name
            const findEmailField = (): string => {
              // First try known field names
              const knownFieldNames = ['Email', 'email', 'EMAIL', 'EmailAddress', 'Email Address', 
                'email_address', 'Mail', 'E-Mail', 'e-mail', 'E Mail', 'email_id', 'Email ID'];
              
              for (const name of knownFieldNames) {
                if (row[name] !== undefined && row[name] !== '') {
                  return sanitizeCellValue(row[name]);
                }
              }

              // Try case-insensitive match for any field containing "email" or "mail"
              for (const key of Object.keys(row)) {
                if ((key.toLowerCase().includes('email') || key.toLowerCase().includes('mail')) && row[key] !== '') {
                  console.log(`Found email in column: ${key} = ${row[key]}`);
                  return sanitizeCellValue(row[key]);
                }
              }

              // Try any field that might be an email (contains @)
              for (const key of Object.keys(row)) {
                const value = row[key];
                if (typeof value === 'string' && value.includes('@')) {
                  console.log(`Found email by @ symbol in column: ${key} = ${value}`);
                  return sanitizeCellValue(value);
                }
              }
              
              return '';
            };
          const findModuleField = (): string[] => {
            const knownFieldNames = [
              'Module', 'Modules', 'module', 'modules',
              'Assigned Module', 'Assigned Modules', 'assigned_module',
              'module_name', 'module(s)'
            ];
            const foundValues: unknown[] = [];
            for (const key of Object.keys(row)) {
              if (knownFieldNames.some(v => v.toLowerCase() === key.toLowerCase())) {
                foundValues.push(row[key]);  
              }
            }
            if (foundValues.length === 0) return [];
            return foundValues
              .flatMap(value => sanitizeCellValue(value).split(","))
              .map(v => sanitizeCellValue(v))
              .filter(Boolean);
          };

            // Fix email mapping with enhanced detection
            const mappedData: RawEmployeeData = {
              employeeId: getFieldValue(['Employee ID', 'EmployeeID', 'employeeId', 'employee_id', 'id', 'ID', 'Id', 'EmpID', 'EmpId']),
              firstName: getFieldValue(['First Name', 'FirstName', 'firstName', 'first_name', 'First name', 'FIRSTNAME', 'Name', 'First', 'Given Name']),
              lastName: getFieldValue(['Last Name', 'LastName', 'lastName', 'last_name', 'Last name', 'LASTNAME', 'Surname', 'Family Name']),
              email: findEmailField(),
              phone: getFieldValue(['Phone', 'phone', 'PhoneNumber', 'phone_number', 'Phone Number', 'Contact', 'Mobile', 'Cell', 'Telephone']),
              employeeType: getFieldValue(['Employee Type', 'EmployeeType', 'employeeType', 'employee_type', 'Type', 'Position', 'Role']).toLowerCase() || undefined,
              department: getFieldValue(['Department', 'department', 'DEPARTMENT', 'Dept', 'Team', 'Division', 'Unit']) || undefined,
              designation: getFieldValue(['Designation', 'designation', 'DESIGNATION', 'Title', 'Job Title', 'JobTitle', 'Role Name']),
              // Handle date formats
              joiningDate: normalizeDate(getFieldValue([
                        'Joining Date', 'JoiningDate', 'joiningDate', 'joining_date',
                        'Start Date', 'DateJoined', 'Date of Joining', 'Hire Date'
                      ])
                    ) || new Date().toISOString().split("T")[0],
              status: getFieldValue(['Status', 'status', 'STATE', 'Employment Status', 'Employee Status']) || 'active',
              moduleAccessPayload: findModuleField(),
              // Personal Details
              middleName: getFieldValue(['Middle Name', 'middleName', 'middle_name']),
              fatherName: getFieldValue(['Father Name', 'fatherName', 'father_name']),
              gender: getFieldValue(['Gender', 'gender']).toLowerCase(),
              dob: normalizeDate(getFieldValue(['DOB', 'Date of Birth', 'dob', 'date_of_birth'])),
              religion: getFieldValue(['Religion', 'religion']),
              nationality: getFieldValue(['Nationality', 'nationality']),
              bloodGroup: getFieldValue(['Blood Group', 'bloodGroup', 'blood_group']),
              residenceAddress: getFieldValue(['Residence Address', 'residenceAddress', 'residence_address', 'Address']),
              experience: getFieldValue(['Experience', 'experience']),
              qualification: getFieldValue(['Qualification', 'qualification']),
              // Professional Other Details
              aadharNo: getFieldValue(['Aadhar No', 'Aadhaar No', 'Aadhar Number', 'aadharNo', 'aadhar_no', 'aadhaar_number']),
              panNo: getFieldValue(['PAN No', 'PAN Number', 'panNo', 'pan_no', 'pan_number']),
              esiNo: getFieldValue(['ESI No', 'ESI Number', 'esiNo', 'esi_no', 'esi_number']),
              pfNo: getFieldValue(['PF No', 'PF Number', 'pfNo', 'pf_no', 'pf_number']),
              resigningOrTerminationDate: normalizeDate(getFieldValue(['Resigning Date', 'Termination Date', 'Resigning / Termination Date', 'Exit Date', 'exitDate', 'exit_date'])),
              biometricUserId: getFieldValue(['Biometric User ID', 'Biometric ID', 'biometricUserId', 'biometric_user_id']),
            };
            
            // Log each mapped row to debug
            console.log(`Mapped row ${index + 1}:`, mappedData);
            
            // Extra validation for required fields, especially email
            if (!mappedData.email) {
              console.warn(`Warning: Row ${index + 1} is missing email address. Original row:`, row);
              console.warn(`Available columns for this row:`, Object.keys(row));
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
