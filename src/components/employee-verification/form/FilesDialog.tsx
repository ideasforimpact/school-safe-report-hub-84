import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, Download, Trash2, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileItem } from '@/types/fileTypes';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { enqueueEmployeeDocumentUpload } from '@/services/employee/employeeDocumentUploadService';

interface FileInfo {
  objectPath: string;
  fileName: string;
  contentType?: string;
  size?: number;
  uploadedAt?: string;
}

interface FilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  employeeId: string;
  clientId: string;
  files: FileInfo[];
  verificationType?: string; // e.g., 'police', 'court_case', etc.
  onRefresh?: () => void;
  onCloseWithFilesCount?: (count: number) => void;
  isReadOnly?: boolean;
}

const FilesDialog: React.FC<FilesDialogProps> = ({
  open,
  onOpenChange,
  documentId,
  employeeId,
  clientId,
  files: existingFiles,
  verificationType = 'police',
  onRefresh,
  onCloseWithFilesCount,
  isReadOnly = false,
}) => {
  const { toast } = useToast();
  const [newFiles, setNewFiles] = useState<FileItem[]>([]);
  const [localFiles, setLocalFiles] = useState<FileInfo[]>(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<{ id: string; name: string; progress: number; status: 'uploading' | 'done' | 'error'; error?: string }[]>([]);
  const [uiError, setUiError] = useState<string | null>(null);
  const errorShownRef = React.useRef(false);

  const totalProgress = React.useMemo(() => {
    if (!uploading || uploadItems.length === 0) return 0;
    const sum = uploadItems.reduce((acc, it) => acc + (isFinite(it.progress) ? it.progress : 0), 0);
    return Math.floor(sum / uploadItems.length);
  }, [uploading, uploadItems]);

  const [deleting, setDeleting] = useState(false);
  const [deletingFileName, setDeletingFileName] = useState<string | null>(null);
  const [deletePct, setDeletePct] = useState<number>(0);

  // Normalize verificationType to avoid unintended folder creation
  const normalizedType = React.useMemo(() => {
    const t = (verificationType || '').toLowerCase();
    if (t.includes('police')) return 'police';
    if (t === '' || t === 'manual') return 'manual';
    return t.replace(/[^a-z0-9\-]/g, '-');
  }, [verificationType]);

  const toFriendlyStorageError = (err: any): string => {
    console.log(err, "FileError");
    try {
      const src = err?.parsed ?? err; // prefer parsed JSON from xhr
      const status = src?.statusCode ?? src?.status ?? err?.status ?? err?.code;
      const errorField = src?.error ?? err?.error;
      const msgField = src?.message ?? err?.message;
      if (status === 409) {
        return 'File already exists in storage. Rename the file or delete the existing one and try again.';
      }
      const combined = `${errorField || ''} ${msgField || ''}`.toLowerCase();
      if (/duplicate|already exists/.test(combined)) {
        return 'File already exists in storage. Rename the file or delete the existing one and try again.';
      }
    } catch (_) {}
    return 'Something went wrong. Please retry after some time.';
  };

  const pickErrorMessage = (err: any): string => {
    console.log(err,"pickErrorMessage");
    const hasStatus = !!(err?.parsed?.statusCode || err?.statusCode || err?.status || err?.code);
    return hasStatus ? toFriendlyStorageError(err) : 'Something went wrong. Please retry after some time.';
  };

  const showErrorOnce = (title: string, description: string) => {
    if (errorShownRef.current) return;
    errorShownRef.current = true;
    setUiError(description);
    toast({ title, description, variant: 'destructive' });
  };

  // Keep localFiles in sync when dialog opens or prop changes
  React.useEffect(() => {
    if (open) {
      setLocalFiles(existingFiles || []);
      setUiError(null);
      errorShownRef.current = false;
    }
  }, [open, existingFiles]);

  // Reset transient state when dialog closes so it opens fresh next time
  React.useEffect(() => {
    if (!open) {
      setNewFiles([]);
      setUploadItems([]);
      setUploading(false);
      setUiError(null);
      errorShownRef.current = false;
    }
  }, [open]);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setUiError('Please upload JPG, PNG, or PDF files only');
      toast({
        title: 'Invalid file type',
        description: 'Please upload JPG, PNG, or PDF files only',
        variant: 'destructive',
      });
      return false;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUiError('File too large. Please upload a file smaller than 5MB');
      toast({
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
        variant: 'destructive',
      });
      return false;
    }

    setUiError(null);
    return true;
  };

  const processFile = (file: File): Promise<FileItem> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const newFile: FileItem = {
          id: uuidv4(),
          name: file.name,
          size: file.size,
          type: file.type,
          base64: base64,
        };
        resolve(newFile);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelection = useCallback(async (fileList: FileList | null) => {
    if (isReadOnly) return;
    if (!fileList || fileList.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (validateFile(file)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    try {
      const processedFiles = await Promise.all(validFiles.map(processFile));
      setUiError(null);
      setNewFiles((prev) => [...prev, ...processedFiles]);
    } catch (error) {
      toast({
        title: 'Error processing files',
        description: 'Failed to process some files. Please try again.',
        variant: 'destructive',
      });
    }
  }, [isReadOnly, toast]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files);
    if (e.target) e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isReadOnly) return;
    handleFileSelection(e.dataTransfer.files);
  }, [handleFileSelection, isReadOnly]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleRemoveNewFile = (id: string) => {
    if (isReadOnly) return;
    setNewFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const xhrPut = (url: string, data: Blob, onProgress?: (pct: number) => void, contentType?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        const pct = (evt.loaded / evt.total) * 100;
        onProgress?.(pct);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          let message = `Upload failed with status ${xhr.status}`;
          let parsed: any = null;
          if (xhr.responseText) {
            try {
              parsed = JSON.parse(xhr.responseText);
              // Common Supabase Storage error shape: { statusCode, error, message }
              if (parsed?.message) message = parsed.message;
              else if (parsed?.error) message = parsed.error;
            } catch {
              message = `${xhr.status}: ${xhr.responseText}`;
            }
          }
          // Friendly duplicate message
          if (xhr.status === 409) {
            message = 'File already exists in storage. Rename the file or delete the existing one and try again.';
          }
          const error = new Error(message) as any;
          (error).status = xhr.status;
          (error).raw = xhr.responseText;
          if (parsed) (error).parsed = parsed;
          reject(error);
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      if (contentType) xhr.setRequestHeader('Content-Type', contentType);
      xhr.send(data);
    });
  };

  const handleUpload = async () => {
    if (isReadOnly) return;
    if (newFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    setUiError(null);
    setUploading(true);
    setUploadItems(newFiles.map((f) => ({ id: f.id, name: f.name, progress: 0, status: 'uploading' as const })));

    try {
      const bucketName = 'employee_other_documents';
      const baseFolderPath = `${clientId}/${employeeId}/${documentId}/${normalizedType}`;

      const uploadPromises = newFiles.map(async (fileItem, idx) => {
        try {
          const base64Data = fileItem.base64.includes(',') 
            ? fileItem.base64.split(',')[1] 
            : fileItem.base64;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileItem.type || 'application/octet-stream' });

          const objectPath = `${baseFolderPath}/${fileItem.name}`;
          
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucketName)
            .createSignedUploadUrl(objectPath);

          console.log({ signedData, signedError }, "Signed");
          
          if (signedError || !signedData?.signedUrl) {
            // Immediate toast for storage createSignedUploadUrl error
            const rawMsg = signedError?.message || 'Failed to create signed upload URL';
            console.log({ signedData, signedError }, "Signed Error");
            const errorMsg = pickErrorMessage(signedError);
            setTimeout(() => {
              showErrorOnce('Upload error', `${fileItem.name}: ${errorMsg}`);
            }, 0);
            throw new Error(rawMsg);
          }

          await xhrPut(signedData.signedUrl, blob, (pct) => {
            setUploadItems((prev) => prev.map((it, i) => i === idx ? { ...it, progress: pct } : it));
          }, fileItem.type || 'application/octet-stream');

          setUploadItems((prev) => prev.map((it, i) => i === idx ? { ...it, progress: 100, status: 'done' } : it));

          return {
            objectPath,
            fileName: fileItem.name,
            contentType: fileItem.type || 'application/octet-stream',
            size: fileItem.size,
          };
        } catch (err: any) {
          // const errorMsg = pickErrorMessage(err);
          // setTimeout(() => {
          //   showErrorOnce('Upload failed', `${fileItem.name}: ${errorMsg}`);
          // }, 0);
          // setUploadItems((prev) => prev.map((it, i) => i === idx ? { ...it, status: 'error' as const, error: errorMsg } : it));
          throw err;
        }
      });

      const uploadedFiles = await Promise.allSettled(uploadPromises);
      const successfulFiles = uploadedFiles
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      if (successfulFiles.length === 0) {
        throw new Error('All file uploads failed');
      }

      await enqueueEmployeeDocumentUpload({
        clientId,
        employeeId,
        documentId,
        files: successfulFiles,
      });

      toast({
        title: 'Files uploaded',
        description: `${successfulFiles.length} file(s) uploaded successfully.`,
      });

      // Optimistic update
      const optimistic: FileInfo[] = successfulFiles.map((f: any) => ({
        objectPath: f.objectPath,
        fileName: f.fileName,
        contentType: f.contentType,
        size: f.size,
        uploadedAt: new Date().toISOString(),
      }));
      setLocalFiles((prev) => [...prev, ...optimistic]);
      setNewFiles([]);
      if (onRefresh) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        onRefresh();
      }
    } catch (error: any) {
      // const message = pickErrorMessage(error);
      // showErrorOnce('Error', message);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadItems([]), 500);
    }
  };

  const handleDelete = async (file: FileInfo) => {
    if (isReadOnly) return;
    setDeleting(true);
    setDeletingFileName(file.fileName);
    try {
      const { data, error } = await supabase.functions.invoke('delete-employee-document-file', {
        body: {
          clientId,
          employeeId,
          documentId,
          objectPath: file.objectPath,
        },
      });
      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Failed to delete file');
      }
      // Optimistic update
      setLocalFiles((prev) => prev.filter((f) => f.objectPath !== file.objectPath));
      toast({ title: 'File deleted', description: `${file.fileName} removed` });
      if (onRefresh) {
        await new Promise(r => setTimeout(r, 300));
        onRefresh();
      }
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeletingFileName(null);
      setDeletePct(0);
    }
  };

  const handleDownload = async (file: FileInfo) => {
    try {
      const signed = await supabase.storage
        .from('employee_other_documents')
        .createSignedUrl(file.objectPath, 300, { download: file.fileName });
      
      if (signed.error || !signed.data?.signedUrl) {
        throw new Error('Failed to generate download URL');
      }

      window.open(signed.data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleView = async (file: FileInfo) => {
    try {
      const signed = await supabase.storage
        .from('employee_other_documents')
        .createSignedUrl(file.objectPath, 300);

      if (signed.error || !signed.data?.signedUrl) {
        throw new Error('Failed to generate view URL');
      }

      window.open(signed.data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast({ title: 'Error', description: error?.message || 'Failed to open file', variant: 'destructive' });
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleClose = async () => {
    // Give backend a moment to finish queue writes so Files button reflects latest state
    const delay = uploading ? 1500 : deleting ? 400 : 100;
    try {
      if (onCloseWithFilesCount) onCloseWithFilesCount(localFiles.length);
      if (onRefresh) {
        await new Promise((r) => setTimeout(r, delay));
        onRefresh();
      }
    } finally {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>{isReadOnly ? 'Files' : 'Manage Files'}</DialogTitle>
        </DialogHeader>

        {uiError && (
          <div role="alert" className="mb-3 rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm break-words break-all">
            {uiError}
          </div>
        )}

        {/* Upload new files section */}
        <div className="space-y-4">
          {!isReadOnly && (
            <div>
              <h3 className="text-sm font-medium mb-2">Upload New Files</h3>
              <div
                className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('file-input-files-dialog')?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop files here, or click to select files
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Supported formats: JPG, PNG, PDF • Max file size: 5MB
                </p>
                <input
                  id="file-input-files-dialog"
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" disabled={uploading}>
                  Browse Files
                </Button>
              </div>

              {newFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {newFiles.map((file) => (
                    <div key={file.id} className="flex items-start justify-between p-2 bg-gray-50 rounded gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0 overflow-hidden">
                        <File className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <span className="text-sm break-words break-all block">{file.name}</span>
                          <span className="text-xs text-gray-500 block mt-1">({formatFileSize(file.size)})</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNewFile(file.id)}
                        disabled={uploading}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || newFiles.length === 0}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Existing files section */}
          <div>
            <h3 className="text-sm font-medium mb-2">Existing Files ({localFiles.length})</h3>
            {localFiles.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">No files uploaded yet.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto overflow-x-hidden">
                {localFiles.map((file, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 border rounded gap-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0 overflow-hidden cursor-pointer" onClick={() => handleView(file)} title="Open in new tab">
                      <File className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium break-words break-all">{file.fileName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(file.size)}
                          {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    {!isReadOnly && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(file)}
                          disabled={deleting}
                          title="Delete file"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
      {(uploading || deleting) && (
        <div className="fixed top-4 right-4 z-[100]">
          <div className="w-[min(90vw,320px)] rounded-lg border bg-white shadow p-3 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-800">
                {uploading ? 'Uploading files…' : 'Deleting files…'}
              </span>
              {uploading && (
                <span className="text-[11px] text-gray-500">{totalProgress}%</span>
              )}
            </div>
            <div className="h-2 w-full bg-gray-100 rounded overflow-hidden">
              {uploading ? (
                <div
                  className="h-2 bg-blue-500 transition-all"
                  style={{ width: `${totalProgress}%` }}
                />
              ) : (
                <div className="h-2 w-3/5 bg-blue-500 animate-pulse" />
              )}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default FilesDialog;
