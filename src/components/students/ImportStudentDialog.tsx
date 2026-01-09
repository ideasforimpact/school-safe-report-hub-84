
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileUp, AlertCircle, Check, Loader2, Download, FileText, Info } from 'lucide-react';
import { toast } from 'sonner';
import { processStudentExcel, validateStudentExcel } from '@/services/student/importStudentService';
import { downloadStudentExcelTemplate, downloadStudentCSVTemplate } from '@/services/student/utils/templateGenerator';
import { useStudents } from '@/contexts/StudentContext';
import { useAuth } from '@/contexts/auth';
import { Progress } from '@/components/ui/progress';

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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setIsValidated(false);
    setValidationErrors([]);
    setRecordCount(null);
    setErrorRowNumbers(new Set());
    
    // Auto-validate when a file is selected
    if (selectedFile) {
      handleValidateFile(selectedFile);
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
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    if (!employeeData?.clientId) {
      toast.error('Client information not available. Please ensure you are logged in properly.');
      return;
    }

    // Check if there are any valid records to import
    const validRecordCount = recordCount ? recordCount - errorRowNumbers.size : null;
    if (validRecordCount !== null && validRecordCount <= 0) {
      toast.error('No valid records to import. All records have errors.');
      return;
    }

    setIsUploading(true);

    try {
      // Show a message for large imports to manage user expectations
      const recordsToProcess = validRecordCount || recordCount;
      if (recordsToProcess && recordsToProcess > 100) {
        toast.info(`Processing ${recordsToProcess} records. This may take a moment...`);
      }
      
      // Use the enhanced import function with client-specific processing
      // Pass error row numbers to exclude them from import
      await processStudentExcel(file, employeeData.clientId, Array.from(errorRowNumbers));
      handleDialogClose();
    } catch (error) {
      console.error('Import error:', error);
      setIsUploading(false);
    }
  };

  const handleDialogClose = () => {
    // Clear state when dialog is closed
    setFile(null);
    setIsValidated(false);
    setValidationErrors([]);
    setIsUploading(false);
    setRecordCount(null);
    setErrorRowNumbers(new Set());
    onOpenChange(false);
  };

  // Calculate how many records will be imported (excluding error rows)
  const validRecordCount = recordCount ? recordCount - errorRowNumbers.size : null;
  const hasValidRecords = validRecordCount !== null && validRecordCount > 0;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file containing student information. The file should have columns for Student ID, Name, Grade, Section, and Campus. 
            <br />
            <strong>Note:</strong> Student IDs must be unique within your organization.
          </DialogDescription>
        </DialogHeader>

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

          {validationErrors.length > 0 && (
            <div className="space-y-3">
              <div className="border border-destructive/50 rounded-md p-3 bg-destructive/10">
                <h3 className="font-medium flex items-center text-destructive mb-2">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Validation Errors ({validationErrors.length} found)
                </h3>
                <div className="max-h-40 overflow-y-auto text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index} className="text-destructive">
                        {error}
                      </li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-destructive font-medium">
                        ... and {validationErrors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Confirmation message for importing valid records */}
              {hasValidRecords && (
                <div className="border border-blue-500/50 rounded-md p-3 bg-blue-500/10">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 mb-1">
                        We exclude the error list from import
                      </p>
                      <p className="text-sm text-blue-700">
                        Processed To Import: <strong>{validRecordCount}</strong> of {recordCount} records
                        {errorRowNumbers.size > 0 && (
                          <span className="block mt-1 text-xs">
                            ({errorRowNumbers.size} record{errorRowNumbers.size !== 1 ? 's' : ''} with errors will be excluded)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isValidated && validationErrors.length === 0 && (
            <div className="border border-green-500/50 rounded-md p-3 bg-green-500/10">
              <p className="text-green-600 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                File is valid and ready to import - no duplicate student IDs found
                {recordCount && ` (${recordCount} records)`}
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

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button
              onClick={() => handleValidateFile()}
              disabled={!file || isValidating || !employeeData?.clientId}
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
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportStudentDialog;
