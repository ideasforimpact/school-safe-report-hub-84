
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileUp, Check, AlertCircle, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmployeeExcel } from '@/services/employee/importEmployeeService';
import { Progress } from '@/components/ui/progress';

interface ImportEmployeeDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onImportEmployees: (file: File, clientId?: string) => Promise<void>;
  clientId?: string;
}

const ImportEmployeeDialog = ({ isOpen, setIsOpen, onImportEmployees, clientId }: ImportEmployeeDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isValidated, setIsValidated] = useState(false);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  
  // Remove authentication checks - we'll assume the user is allowed to import

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
        setIsValidated(false);
        setValidationErrors([]);
        setRecordCount(null);
        
        // Auto-validate when a file is selected
        handleValidateFile(selectedFile);
      } else {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        e.target.value = '';
      }
    }
  };

  const handleValidateFile = async (selectedFile: File = file!) => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setIsValidating(true);
    setValidationErrors([]);

    try {
      // Show status message if it's a large file (based on file size)
      if (selectedFile.size > 1000000) { // Roughly 1MB
        toast.info('Validating a large file. This might take a moment...');
      }
      
      const errors = await validateEmployeeExcel(selectedFile);
      setValidationErrors(errors);
      
      // Estimate number of records from file size or extract it during validation
      try {
        // This is simplified - in a real app would be more accurate
        const data = await parseExcelForCount(selectedFile);
        setRecordCount(data);
      } catch (e) {
        console.error("Couldn't determine record count", e);
      }
      
      if (errors.length === 0) {
        setIsValidated(true);
        toast.success('File validated successfully');
      } else {
        setIsValidated(false);
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
      const { parseExcelFile } = await import('@/services/employee/utils/excelProcessingUtils');
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

    if (!isValidated) {
      toast.error('Please validate the file before importing');
      return;
    }

    // Remove authentication check - proceed directly with import
    setIsLoading(true);
    try {
      // Show a message for large imports to manage user expectations
      if (recordCount && recordCount > 100) {
        toast.info(`Processing ${recordCount} records. This may take a moment...`);
      }
      
      console.log("Using clientId:", clientId);
      
      // Pass clientId to the import function
      await onImportEmployees(file, clientId);
      
      // Reset state and close dialog after successful import
      setFile(null);
      setIsValidated(false);
      setValidationErrors([]);
      setRecordCount(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Import failed:', error);
      toast.error(`Import failed: ${(error as Error).message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    // Clear state when dialog is closed
    setFile(null);
    setIsValidated(false);
    setValidationErrors([]);
    setIsLoading(false);
    setRecordCount(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Employees</DialogTitle>
          <DialogDescription>
            Upload an Excel file containing employee information. The file should include employee ID, name, email, and department.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                      {file ? file.name : 'Click to select an Excel file'}
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
                    accept=".xls,.xlsx"
                  />
                </div>
              </div>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="border border-destructive/50 rounded-md p-3 bg-destructive/10">
              <h3 className="font-medium flex items-center text-destructive mb-2">
                <AlertCircle className="h-4 w-4 mr-1" />
                Validation Errors
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
          )}

          {isValidated && validationErrors.length === 0 && (
            <div className="border border-green-500/50 rounded-md p-3 bg-green-500/10">
              <p className="text-green-600 flex items-center">
                <Check className="h-4 w-4 mr-1" />
                File is valid and ready to import
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

          {isLoading && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Importing data...</span>
              </div>
              <Progress value={isLoading ? 70 : 0} className="h-1" />
            </div>
          )}

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
            <Button
              onClick={() => handleValidateFile()}
              disabled={!file || isValidating}
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
              disabled={!isValidated || isLoading}
              className="gap-1"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Importing...</>
              ) : (
                <><FileUp className="h-4 w-4 mr-1" /> Import Employees</>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportEmployeeDialog;
