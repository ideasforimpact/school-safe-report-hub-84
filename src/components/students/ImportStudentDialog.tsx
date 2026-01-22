
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileUp, AlertCircle, Check, Loader2, Download, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';
import { processStudentExcel, validateStudentExcel } from '@/services/student/importStudentService';
import { downloadStudentExcelTemplate, downloadStudentCSVTemplate } from '@/services/student/utils/templateGenerator';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/auth';
import { Progress } from '@/components/ui/progress';
import { validateExcelData } from '@/services/student/utils/excelValidationUtils';
import { processStudentData } from '@/services/student/importProcessingService';
import { RawStudentData } from '@/services/student/types/importTypes';
import { parseStudentFile } from '@/services/student/utils/excelProcessingUtils';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import FileUploadValidator from '../common/FileUploadValidator';

interface ImportStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportStudents: (file: File) => Promise<void>;
}

const ImportStudentDialog = ({ open, onOpenChange, onImportStudents }: ImportStudentDialogProps) => {
  const { students } = useStudents();
  const { employeeData } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [errorRowNumbers, setErrorRowNumbers] = useState<Set<number>>(new Set());
  const [parsedData, setParsedData] = useState<RawStudentData[] | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Helper function to parse error messages and extract row numbers
  const parseErrorRowNumbers = (errors: string[]): Set<number> => {
    const rowNumbers = new Set<number>();
    errors.forEach(error => {
      // Match patterns like "Row 4:", "Row 5:", etc.
      const match = error.match(/Row\s+(\d+):/i);
      if (match) {
        const rowNum = parseInt(match[1], 10);
        if (!isNaN(rowNum)) {
          rowNumbers.add(rowNum);
        }
      }
    });
    return rowNumbers;
  };
  const handleValidateParsedData = async (data: RawStudentData[]) => {
    if (!employeeData?.clientId) return;

    setIsValidating(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      const { errors, warnings, skippedRowNumbers } = await validateExcelData(structuredClone(data), employeeData.clientId);
      setValidationErrors(errors);
      setValidationWarnings(warnings);
      const mergedSkippedRows = new Set<number>([
        ...parseErrorRowNumbers(errors),
        ...skippedRowNumbers,
      ]);
      setErrorRowNumbers(mergedSkippedRows);

      setIsValidated(errors.length === 0);

      if (errors.length === 0) {
        toast.success('File validated successfully');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setIsValidated(false);
    setValidationErrors([]);
    setRecordCount(null);
    setErrorRowNumbers(new Set());
    setParsedData(null);

    if (!selectedFile || !employeeData?.clientId) return;

    try {
      const parsed = structuredClone(await parseStudentFile(selectedFile));

      setParsedData(parsed);
      setRecordCount(parsed.length);

      await handleValidateParsedData(parsed);
    } catch (e) {
      toast.error('Failed to read file');
    }
  };

  const handleValidateFile = async (selectedFile: File = file!) => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    if (!employeeData?.clientId) {
      toast.error('Client information not available. Please ensure you are logged in properly.');
      return;
    }

    // Check if file is CSV or Excel
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    setIsValidating(true);
    setValidationErrors([]);

    try {
      // Show status message if it's a large file (based on file size)
      if (selectedFile.size > 1000000) { // Roughly 1MB
        toast.info('Validating a large file. This might take a moment...');
      }
      
      // Pass client ID for client-specific validation
      const errors = await validateStudentExcel(selectedFile, employeeData.clientId);
      setValidationErrors(errors);
      
      // Parse error row numbers
      const errorRows = parseErrorRowNumbers(errors);
      setErrorRowNumbers(errorRows);
      
      // Estimate number of records from file size or extract it during validation
      let totalRecords = 0;
      try {
        const data = await parseExcelForCount(selectedFile);
        totalRecords = data;
        setRecordCount(data);
      } catch (e) {
        console.error("Couldn't determine record count", e);
      }
      
      if (errors.length === 0) {
        setIsValidated(true);
        toast.success('File validated successfully - no duplicate student IDs found');
      } else {
        setIsValidated(false);
        // Show specific duplicate errors in toast
        const duplicateErrors = errors.filter(error => error.includes('already exists'));
        if (duplicateErrors.length > 0) {
          if (duplicateErrors.length <= 3) {
            duplicateErrors.forEach(error => toast.error(error));
          } else {
            toast.error(`Found ${duplicateErrors.length} duplicate student IDs. Please check the error list below.`);
          }
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate file');
    } finally {
      setIsValidating(false);
    }
  };

  // Simple function to estimate record count from the Excel file
  const parseExcelForCount = async (file: File): Promise<number> => {
    // This is a simplification - we're reusing existing functionality
    try {
      const { parseExcelFile } = await import('@/services/student/utils/excelProcessingUtils');
      const data = await parseExcelFile(file);
      return data.length;
    } catch (e) {
      console.error("Error parsing Excel for count:", e);
      return 0;
    }
  };

  const handleImport = async () => {
    if (!parsedData || !employeeData?.clientId) return;

    setIsUploading(true);

    try {
      const importData = structuredClone(parsedData);
      
      await processStudentData(
        importData.filter((_, i) => !errorRowNumbers.has(i + 2)),
        employeeData.clientId
      );

      handleDialogClose();
    } catch (e) {
      toast.error('Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDialogClose = () => {
    // Clear state when dialog is closed
    setFile(null);
    setIsValidated(false);
    setValidationErrors([]);
    setValidationWarnings([]);
    setIsUploading(false);
    setRecordCount(null);
    setErrorRowNumbers(new Set());
    onOpenChange(false);
  };

  // Calculate how many records will be imported (excluding error rows)
  const validRecordCount = recordCount ? recordCount - errorRowNumbers.size : null;
  const hasValidRecords = validRecordCount !== null && validRecordCount > 0;

  return (
    <AlertDialog open={open} onOpenChange={handleDialogClose}>
      <AlertDialogContent className="sm:max-w-[500px] overflow-hidden">
        <AlertDialogHeader>
          <AlertDialogTitle>Import Students</AlertDialogTitle>
          <AlertDialogDescription>
            Upload a CSV or Excel file containing student information. The file should have columns for Student ID, Name, Grade, Section, and Campus. 
            <br />
            <strong>Note:</strong> Student IDs must be unique within your organization.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Template Download Section */}
          <div className="flex flex-col gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-blue-800">Sample Template Available</Label>
            </div>
            <p className="text-xs text-blue-700">
              Download a sample file with the correct format and column headers to get started
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadStudentExcelTemplate}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Download className="h-3 w-3 mr-1" />
                Excel Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadStudentCSVTemplate}
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
              >
                <Download className="h-3 w-3 mr-1" />
                CSV Template
              </Button>
            </div>
          </div>

          {/* Show client info for debugging */}
          {!employeeData?.clientId && (
            <div className="border border-destructive/50 rounded-md p-3 bg-destructive/10">
              <p className="text-destructive text-sm">
                <AlertCircle className="h-4 w-4 inline mr-1" />
                Client information not available. Please ensure you are logged in properly.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium">
              Select File
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-grow">
                <div className="border rounded-md p-4 text-center cursor-pointer bg-muted/50 hover:bg-muted/70 transition-colors">
                  <Label htmlFor="file" className="w-full cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {file ? file.name : 'Click to select a CSV or Excel file'}
                    </span>
                    {recordCount && (
                      <span className="text-xs text-muted-foreground">
                        {recordCount} records detected
                      </span>
                    )}
                  </Label>
                  <input
                    type="file"
                    id="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept=".csv,.xls,.xlsx"
                    disabled={!employeeData?.clientId}
                  />
                </div>
              </div>
            </div>
          </div>

          <FileUploadValidator
            errors={validationErrors}
            warnings={validationWarnings}
            warningTitle="Duplicate Students"
            warningFooterText="These Students will be skipped during import."
          />
          {isValidated && validationErrors.length === 0 && (
            <div className="border border-green-500/50 rounded-md p-3 bg-green-500/10">
              <p className="text-green-600 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                File is valid and ready to import
                {validationWarnings.length > 0 && (
                  <span className="block text-xs text-muted-foreground mt-1">
                    {validationWarnings.length} duplicate record(s) will be skipped
                  </span>
                )}
              </p>
            </div>
          )}

          {isValidating && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Validating file...</span>
              </div>
              <Progress value={isValidating ? 80 : 0} className="h-1" />
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Importing data...</span>
              </div>
              <Progress value={isUploading ? 70 : 0} className="h-1" />
            </div>
          )}

          <AlertDialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button
              onClick={() => parsedData && handleValidateParsedData(parsedData)}
              disabled={!parsedData || isValidating || !employeeData?.clientId}
              variant="outline"
            >
              {isValidating ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Validating...</>
              ) : isValidated ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Validated
                </>
              ) : (
                "Verify"
              )}
            </Button>
            <Button
              onClick={handleImport}
              disabled={(!isValidated && !hasValidRecords) || isUploading || !employeeData?.clientId || !file}
              className="gap-1"
            >
              {isUploading ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importing...</>
              ) : (
                <><FileUp className="h-4 w-4 mr-1" /> Import Students</>
              )}
            </Button>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ImportStudentDialog;
