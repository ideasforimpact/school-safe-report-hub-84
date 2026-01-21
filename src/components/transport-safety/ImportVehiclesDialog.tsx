import React, { useState, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    UploadCloud,
    FileCheck,
    Download,
    FileText,
    X,
    File as FileIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    downloadVehicleCSVTemplate,
    downloadVehicleExcelTemplate,
} from '@/services/vehicle/templateGeneratorVehicle';
import {
    importVehicles,
    validateVehicleExcel,
} from '@/services/vehicle/importVehicleService';
import { useAuth } from '@/contexts';

interface ImportVehiclesDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'csv'];

const ImportVehicleDialog: React.FC<ImportVehiclesDialogProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { employeeData } = useAuth();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [validationWarnings, setValidationWarnings] = useState<string[]>([]);


    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = () => {
        setSelectedFile(null);
        setIsVerified(false);
        setIsVerifying(false);
        setIsLoading(false);
        setValidationErrors([]);
        setValidationWarnings([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDialogChange = (open: boolean) => {
        if (!open) {
            resetState();
            onClose();
        }
    };

    const readFileWithRetry = async (
        file: File,
        retries = 5,
        delay = 300
    ): Promise<ArrayBuffer> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                if (file.arrayBuffer) {
                    return await file.arrayBuffer();
                }
                throw new Error('arrayBuffer not supported');
            } catch (err) {
                console.warn(`arrayBuffer attempt ${attempt} failed`, err);

                if (attempt >= retries - 1) {
                    try {
                        return await new Promise<ArrayBuffer>((resolve, reject) => {
                            const reader = new FileReader();

                            reader.onload = () => resolve(reader.result as ArrayBuffer);
                            reader.onerror = () =>
                                reject(new Error('FileReader failed'));

                            reader.readAsArrayBuffer(file);
                        });
                    } catch (readerErr) {
                        console.error('FileReader fallback failed', readerErr);
                        throw readerErr;
                    }
                }

                await new Promise(res => setTimeout(res, delay));
            }
        }

        throw new Error('Unable to read file after retries');
    };


    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        if (!e.target.files || !e.target.files[0]) return;

        const originalFile = e.target.files[0];
        e.target.value = '';

        const ext = originalFile.name.split('.').pop()?.toLowerCase();
        if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
            toast.error('Only XLSX, XLS and CSV files are allowed');
            return;
        }

        try {
            const buffer = await readFileWithRetry(originalFile, 5, 300);

            const safeFile = new File([buffer], originalFile.name, {
                type: originalFile.type,
            });

            setSelectedFile(safeFile);
            setIsVerified(false);
            setValidationErrors([]);
            toast.success('File uploaded successfully');
        } catch (err: any) {
            console.error('Could not read file:', err);

            const message =
                err?.name === 'NotReadableError' ||
                    err?.message?.includes('FileReader') ||
                    err?.message?.includes('read')
                    ? 'The file is currently open or locked by Excel. Please close it and try again.'
                    : 'Failed to load file. Please try again.';

            toast.error(message);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setIsVerified(false);
        setValidationErrors([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleVerify = async () => {
        if (!selectedFile) {
            toast.error('Please select a file to verify');
            return;
        }

        setIsVerifying(true);
        setValidationErrors([]);
        try {
            const { errors, warnings } = await validateVehicleExcel(
                selectedFile,
                employeeData.clientId,
            );

            setValidationErrors(errors);
            setValidationWarnings(warnings);

            // Verified if NO blocking errors
            setIsVerified(errors.length === 0);

            if (errors.length === 0) {
                toast.success('File validated successfully');
            }
        } catch (error) {
            console.error('Validation error:', error);
            setValidationErrors(['Validation failed. Please try again.']);
            setIsVerified(false);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile || !isVerified) return;

        setIsLoading(true);
        try {
            await importVehicles(
                selectedFile,
                employeeData.clientId,
                employeeData.id,
            );

            toast.success('Vehicles imported successfully');
            resetState();
            onSuccess();
            onClose();
        } catch (err) {
            toast.error('Vehicle import failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={handleDialogChange}>
            <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Import Vehicles</AlertDialogTitle>
                </AlertDialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Template section */}
                    <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <Label className="text-sm font-medium text-blue-800">
                                Sample Template Available
                            </Label>
                        </div>

                        <p className="text-xs text-blue-700 mb-2">
                            Download a sample file with the correct format and column headers.
                        </p>
                        <p className="text-xs text-blue-700 mb-3">
                            <span className="font-medium">Note:</span>
                        </p>

                        <ul className="list-disc list-inside text-xs text-blue-700 mb-3">
                            <li>
                                Follow the same format used in the file for <strong>Vehicle Type</strong> only.
                            </li>
                        </ul>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={downloadVehicleExcelTemplate}
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Excel Template
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={downloadVehicleCSVTemplate}
                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                            >
                                <Download className="h-3 w-3 mr-1" />
                                CSV Template
                            </Button>
                        </div>
                    </div>

                    {/* Upload section */}
                    <div className="flex flex-col gap-2">
                        <Label>Upload file</Label>

                        {selectedFile ? (
                            <div className="border-2 border-blue-500 bg-blue-50 rounded-md p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <FileIcon className="h-8 w-8 text-blue-600" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(selectedFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={removeFile}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                        disabled={isLoading || isVerifying}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                {isVerified && (
                                    <div className="mt-2 flex items-center gap-2 text-green-600">
                                        <FileCheck className="h-4 w-4" />
                                        <span className="text-xs">
                                            File verified successfully
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-gray-50"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                    Click to upload or drag and drop
                                </p>

                                <Button variant="outline" size="sm" className="mt-2">
                                    Select File
                                </Button>

                                <p className="text-xs text-gray-500 mt-2">
                                    Supported formats: XLSX, XLS, CSV
                                </p>

                                <Input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        )}
                    </div>
                </div>
                {validationErrors.length > 0 && (
                    <div className="border border-red-300 bg-red-50 rounded-md p-3 max-h-48 overflow-y-auto no-scrollbar">
                        <p className="text-sm font-medium text-red-700 mb-2">
                            Validation Errors ({validationErrors.length})
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                            {validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {validationWarnings.length > 0 && (
                    <div className="border border-yellow-300 bg-yellow-50 rounded-md p-3 max-h-40 overflow-y-auto no-scrollbar">
                        <p className="text-sm font-medium text-yellow-700 mb-2">
                            Duplicate Vehicles ({validationWarnings.length})
                        </p>

                        <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                            {validationWarnings.slice(0, 10).map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}

                            {validationWarnings.length > 10 && (
                                <li className="font-medium">
                                    ... and {validationWarnings.length - 10} more duplicates
                                </li>
                            )}
                        </ul>

                        <p className="text-xs text-yellow-700 mt-2">
                            These vehicles were skipped during import.
                        </p>
                    </div>
                )}

                <AlertDialogFooter className="flex flex-col sm:flex-row sm:justify-between items-center">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={handleVerify}
                        disabled={!selectedFile || isLoading || isVerifying}
                        className="w-full sm:w-auto mb-2 sm:mb-0"
                    >
                        {isVerifying ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isVerified ? (
                            <FileCheck className="mr-2 h-4 w-4" />
                        ) : null}
                        Verify
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={() => {
                                resetState();
                                onClose();
                            }}
                            disabled={isLoading || isVerifying}
                            className="w-full sm:w-auto mb-2 sm:mb-0"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!selectedFile || isLoading || !isVerified || validationErrors.length > 0}
                            className="w-full sm:w-auto"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Import
                        </Button>
                    </div>
                </AlertDialogFooter>

            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ImportVehicleDialog;
