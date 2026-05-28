import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/Dateformat';
import { History, FilePlus, FileText, FileX, Eye, Trash2, Check, Info, Calendar } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Vehicle, VehicleDocument } from '@/types/transportSafety';
import DocumentUploader from '../documents/DocumentUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UploadedDocument, formatSupabaseUrl, isPdfFile } from '@/types/fileTypes';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import VerificationDetailsDialog from '../VerificationDetailsDialog';
import { getVehicleChallans, getVehicleDocuments } from '@/services/transport-safety/vehicleService';
import { VehicleChallans } from '@/types/transportSafety';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

interface VehicleTabsProps {
  vehicleId: string;
  vehicle: Vehicle;
}

const VehicleTabs: React.FC<VehicleTabsProps> = ({ vehicleId, vehicle }) => {
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();
  const [showVerificationDetails, setShowVerificationDetails] = React.useState(false);
  const [selectedVerificationData, setSelectedVerificationData] = React.useState<any>(null);
  const [vehicleChallans, setVehicleChallans] = React.useState<VehicleChallans | null>(vehicle.vehicleChallans || null);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = React.useState(false);
  const [showFilePreview, setShowFilePreview] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<VehicleDocument | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = React.useState<number>(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [selectedUploadedDocument, setSelectedUploadedDocument] = useState<UploadedDocument | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ document: UploadedDocument; fileIndex: number } | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const isUploadDisabled = !documentName || documentName.trim().length === 0;
  const existingDocumentNames = uploadedDocuments.map(d => d.name.toLowerCase());

  const handleCloseDialog = () => {
    setShowAddDocumentDialog(false);
    setDocumentName("");
    setDuplicateError("");
  };
  // Fetch uploaded documents from the database

  const fetchDocuments = useCallback(async (force: boolean = false) => {
    if (!vehicleId) return;
    
    setIsLoadingDocuments(true);
    try {
      setUploadedDocuments(await getVehicleDocuments(vehicleId, vehicle.clientId, { force }));
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error fetching documents',
        description: 'There was an error fetching your documents',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  }, [vehicle.clientId, vehicleId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const fetchVehicleChallansForHistory = useCallback(async () => {
    if (!vehicleId) return;
    try {
      const challans = await getVehicleChallans(vehicleId);
      setVehicleChallans(challans);
    } catch (error) {
      console.error("Error fetching vehicle_challans:", error);
    }
  }, [vehicleId]);

  const handleDocumentUpdate = useCallback(async () => {
    await fetchDocuments(true);
  }, [fetchDocuments]);
  const verificationHistory = React.useMemo(() => {
    const log = vehicleChallans?.challan_history_log;

    if (!log || typeof log !== 'object') return [];

    const entries = Object.entries(log).map(([date, snapshot]: [string, any]) => ({
      date,
      snapshot, // full challan snapshot from DB
    }));

    // To avoid duplicate history rows when both providers fail in a single
    // challan attempt, we hide the fallback entry that is explicitly marked
    // as bothFallback with a parent_process_id pointing to the primary attempt.
    const hasPrimaryByProcessId = new Set(
      entries
        .map(e => e.snapshot?.process_id)
        .filter((id: string | undefined | null) => !!id) as string[]
    );

    const filtered = entries.filter(({ snapshot }) => {
      const bothFallback = snapshot?.bothFallback === true;
      const parentId = snapshot?.parent_process_id as string | undefined;

      if (bothFallback && parentId && hasPrimaryByProcessId.has(parentId)) {
        return false;
      }

      return true;
    });

    return filtered.sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [vehicleChallans]);


  useRealTimeSubHook({
  channelName: `vehicle-documents-${vehicleId}`,
  events: "*",
  table: "vehicle_documents",
  filter: vehicleId ? `vehicle_id=eq.${vehicleId}` : undefined,
  enabled: !!vehicleId,
  onPayload: handleDocumentUpdate,
});

  // Re-fetch challan history whenever vehicle_challans row changes in Supabase
  useRealTimeSubHook({
    channelName: `vehicle-challans-${vehicleId}`,
    events: "*",
    table: "vehicle_challans",
    filter: vehicleId ? `vehicle_id=eq.${vehicleId}` : undefined,
    enabled: !!vehicleId,
    onPayload: fetchVehicleChallansForHistory,
  });
  // Find verification log entry to get history
  // const getVerificationLog = () => {
  //   if (!vehicle?.verificationData) return null;
    
  //   const logEntry = vehicle.verificationData.find(item => item.field === 'verification_log');
  //   return logEntry?.value || null;
  // };
  
  // const verificationLog = getVerificationLog();
  
  // // Get verification history entries sorted by date (newest first)
  // const getVerificationHistory = () => {
  //   if (!verificationLog) return [];
    
  //   return Object.entries(verificationLog)
  //     .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
  //     .map(([date, data]) => ({
  //       date,
  //       data
  //     }));
  // };
  
  // const verificationHistory = getVerificationHistory();
  
  // Format verification data - remove internal/noisy fields
  const formatVerificationData = (data: any) => {
    if (!data || !Array.isArray(data)) return [];
    
    // Filter out fields we don't want to show in the details popup
    return data
      .filter((item: any) => {
        const fieldName = String(item.field || '').toLowerCase();
        // Skip verification_log, last_response, status, challan_details, response metadata,
        // less info, and any client identifiers
        if (fieldName === 'verification_log' || 
            fieldName === 'last_response' || 
            fieldName === 'status' ||
            fieldName === 'challan_details' ||
            fieldName === 'response_metadata' ||
            fieldName.includes('response metadata') ||
            fieldName === 'less_info' ||
            fieldName.includes('less info') ||
            fieldName === 'client_id' ||
            fieldName === 'clientid' ||
            fieldName.includes('client id')) {
          return false;
        }
        
        return true;
      })
      .map((item: any) => {
        // Format the field label
        let label = item.field.replace(/_/g, ' ')
                          .split(' ')
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
        
        // Format the value
        return {
          label,
          value: item.value
        };
      });
  };
  
  const viewVerificationDetails = (entry: { date: string; snapshot: any }) => {
    const challanSnapshot = entry.snapshot;

    const challanError =
      challanSnapshot?.success === false
        ? (
            'Unable to fetch challan details. Please contact the administrator for support.'
          )
        : null;

    setSelectedVerificationData({
      challanSnapshot,
      challanError,
    });

    setShowVerificationDetails(true);
  };
  
  // Function to open file preview dialog for uploaded documents
  const openUploadedFilePreview = (document: UploadedDocument, fileIndex: number = 0) => {
    console.log("Opening preview for uploaded document:", document, "fileIndex:", fileIndex);
    setSelectedUploadedDocument(document);
    setSelectedFileIndex(fileIndex);
    setShowFilePreview(true);
  };

  // Function to navigate between files in preview
  const navigateFile = (direction: 'next' | 'prev') => {
    // Check if we're viewing an uploaded document or a legacy document
    if (selectedUploadedDocument) {
      const totalFiles = selectedUploadedDocument.files.length;
      if (totalFiles <= 1) return;
      
      if (direction === 'next') {
        setSelectedFileIndex((selectedFileIndex + 1) % totalFiles);
      } else {
        setSelectedFileIndex((selectedFileIndex - 1 + totalFiles) % totalFiles);
      }
    } else if (selectedDocument && selectedDocument.fileUrls) {
      const totalFiles = selectedDocument.fileUrls.length;
      if (totalFiles <= 1) return;
      
      if (direction === 'next') {
        setSelectedFileIndex((selectedFileIndex + 1) % totalFiles);
      } else {
        setSelectedFileIndex((selectedFileIndex - 1 + totalFiles) % totalFiles);
      }
    }
  };

  // Handle successful upload
  const handleUploadSuccess = (result: any) => {
    console.log('Upload success:', result);
    
    // Use documentData for the newly uploaded file, not the entire result array
    if (result.documentData) {
      // Add the new document to the existing list
      setUploadedDocuments(prev => [...prev, result.documentData]);
    }
    
    toast({
      title: 'Document Uploaded',
      description: 'Your document has been uploaded successfully',
    });
  };
  
  // Show delete confirmation dialog
  const handleDeleteFile = (document: UploadedDocument, fileIndex: number) => {
    if (isReadOnlySwitchedContext) return;
    setDocumentToDelete({ document, fileIndex });
    setShowDeleteConfirm(true);
  };

  // Actually delete the file from storage and update database
  const confirmDeleteFile = async () => {
    if (isReadOnlySwitchedContext) return;
    if (!documentToDelete) return;
    
    const { document, fileIndex } = documentToDelete;
    try {
      const file = document.files[fileIndex];
      
      if (!file || !file.path) {
        toast({
          title: 'Error deleting file',
          description: 'File information is missing',
          variant: 'destructive',
        });
        return;
      }
      
      // First, delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('vehicle-documents')
        .remove([file.path]);
        
      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        toast({
          title: 'Error deleting file',
          description: 'Could not delete file from storage',
          variant: 'destructive',
        });
        return;
      }
      
      // Then, update the document record in the database
      const updatedDocumentFiles = document.files.filter((_, idx) => idx !== fileIndex);
      
      // If there are no more files, remove the entire document
      if (updatedDocumentFiles.length === 0) {
        const { data: currentData, error: fetchError } = await supabase
          .from('vehicle_documents')
          .select('documents')
          .eq('vehicle_id', vehicleId)
          .single();
          
        if (fetchError) {
          console.error('Error fetching documents:', fetchError);
          return;
        }
        
        if (currentData && Array.isArray(currentData.documents)) {
          const updatedDocuments = currentData.documents.filter(
            (doc: any) => doc.uploadedAt !== document.uploadedAt
          );
          
          const { error: updateError } = await supabase
            .from('vehicle_documents')
            .update({ documents: updatedDocuments })
            .eq('vehicle_id', vehicleId);
            
          if (updateError) {
            console.error('Error updating documents:', updateError);
            return;
          }
          
          // Update local state to reflect deletion
          setUploadedDocuments(prev => 
            prev.filter(doc => doc.uploadedAt !== document.uploadedAt)
          );
        }
      } else {
        // Just update the files array of the document
        const { data: currentData, error: fetchError } = await supabase
          .from('vehicle_documents')
          .select('documents')
          .eq('vehicle_id', vehicleId)
          .single();
          
        if (fetchError) {
          console.error('Error fetching documents:', fetchError);
          return;
        }
        
        if (currentData && Array.isArray(currentData.documents)) {
          const updatedDocuments = currentData.documents.map((doc: any) => {
            if (doc.uploadedAt === document.uploadedAt) {
              return {
                ...doc,
                files: doc.files.filter((_: any, idx: number) => idx !== fileIndex)
              };
            }
            return doc;
          });
          
          const { error: updateError } = await supabase
            .from('vehicle_documents')
            .update({ documents: updatedDocuments })
            .eq('vehicle_id', vehicleId);
            
          if (updateError) {
            console.error('Error updating documents:', updateError);
            return;
          }
          
          // Update local state to reflect file deletion
          setUploadedDocuments(prev => 
            prev.map(doc => {
              if (doc.uploadedAt === document.uploadedAt) {
                return {
                  ...doc,
                  files: doc.files.filter((_, idx) => idx !== fileIndex)
                };
              }
              return doc;
            })
          );
        }
      }
      
      toast({
        title: 'File deleted',
        description: 'The file has been deleted successfully',
      });
      
      // Close the preview if it was the last file
      if (document.files.length <= 1) {
        setShowFilePreview(false);
      } else if (fileIndex >= document.files.length - 1) {
        // If we deleted the last file in the array, set index to the new last file
        setSelectedFileIndex(document.files.length - 2);
      }
      
      // Close the confirmation dialog and reset state
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
      
    } catch (error) {
      console.error('Error in handleDeleteFile:', error);
      toast({
        title: 'Error deleting file',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
      
      // Close the confirmation dialog and reset state on error
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };
  
  // Get current file URL for preview
  const getCurrentFileUrl = () => {
    if (selectedUploadedDocument) {
      const fileUrl = selectedUploadedDocument.files[selectedFileIndex]?.url || '';
      return formatSupabaseUrl(fileUrl);
    } else if (selectedDocument && selectedDocument.fileUrls) {
      const fileUrl = selectedDocument.fileUrls[selectedFileIndex] || '';
      return formatSupabaseUrl(fileUrl);
    }
    return '';
  };

  // Function to download a file
  const handleDownloadFile = async (fileUrl: string, fileName: string, filePath?: string) => {
    try {
      let downloadUrl: string;
      
      // If we have a file path, use Supabase storage API to create a signed URL
      if (filePath) {
        const { data, error } = await supabase.storage
          .from('vehicle-documents')
          .createSignedUrl(filePath, 300, { download: fileName });
        
        if (error || !data?.signedUrl) {
          // Fallback to direct URL if signed URL fails
          downloadUrl = formatSupabaseUrl(fileUrl);
        } else {
          downloadUrl = data.signedUrl;
        }
      } else {
        // Use the formatted URL directly
        downloadUrl = formatSupabaseUrl(fileUrl);
      }
      
      // Fetch the file
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast({
        title: 'Download started',
        description: `Downloading ${fileName}`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to download the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Check if current file is a PDF
  const isPdfFileForPreview = () => {
    const fileUrl = getCurrentFileUrl();
    const fileName = selectedUploadedDocument?.files[selectedFileIndex]?.name;
    return isPdfFile(fileUrl, fileName);
  };

  // Get total files count
  const getTotalFiles = () => {
    if (selectedUploadedDocument) {
      return selectedUploadedDocument.files.length;
    } else if (selectedDocument && selectedDocument.fileUrls) {
      return selectedDocument.fileUrls.length;
    }
    return 0;
  };
  
  return (
    <Tabs defaultValue="documents">
      <TabsList className="mb-4">
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      {/* Documents Tab Content */}
      <TabsContent value="documents" className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Vehicle Documents</h2>
          {!isReadOnlySwitchedContext && (
            <Button 
              onClick={() => setShowAddDocumentDialog(true)} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
            >
              <FilePlus className="h-4 w-4" />
              Upload Documents
            </Button>
          )}
        </div>
        
        {/* Documents List: Loading, Empty, or Populated */}
        {isLoadingDocuments ? (
          <div className="text-center py-8">
            <p>Loading documents...</p>
          </div>
        ) : uploadedDocuments.length > 0 ? (
          <div className="space-y-4">
            
            {uploadedDocuments.map((doc, docIdx) => {
              // Debug: Log each document group
              return (
                <div key={`${doc.name}-${docIdx}`} className="space-y-3">
                  {/* Document Group Header */}
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-sm font-medium text-gray-700">{doc.name}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {doc.files?.length || 0} file{(doc.files?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Files under this document group */}
                  <div className="grid grid-cols-1 gap-3">
                    {doc.files?.map((file, fileIdx) => (
                      <div
                        key={`${doc.name}-${docIdx}-${file.path || file.url || fileIdx}`}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 min-h-[60px]"
                      >
                        <div className="flex items-center flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {formatDate(file.uploadedAt || doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 px-2"
                            onClick={() => {
                              const url = file.url;
                              if (url) {
                                const formattedUrl = formatSupabaseUrl(url);
                                window.open(formattedUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            <Eye className="h-4 w-4 text-gray-500 mr-1" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => {
                              if (file.url && file.name) {
                                handleDownloadFile(file.url, file.name, file.path);
                              }
                            }}
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                            Download
                          </Button>
                          {!isReadOnlySwitchedContext && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title="Delete file"
                              onClick={() => handleDeleteFile(doc, fileIdx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border border-dashed rounded-md bg-gray-50">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-500 mb-2">No Documents Uploaded</h3>
            <p className="text-gray-400 text-sm mb-3">Add important vehicle documents like registration, insurance, and pollution certificates.</p>
          </div>
        )}
        
        {/* Legacy Documents Section */}
        {vehicle && vehicle.documents.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Legacy Documents</h3>
            <div className="grid grid-cols-1 gap-4">
              {vehicle.documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 min-h-[60px]"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <FileText className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}</p>
                      <p className="text-xs text-gray-500">
                        {doc.number} •Expires: {formatDate(doc.expiryDate)}
                        {doc.fileUrls && doc.fileUrls.length > 0 && (
                          <span className="ml-2">
                            • {doc.fileUrls.length} file{doc.fileUrls.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {doc.fileUrls && doc.fileUrls.length > 0 ? (
                      <div className="flex items-center">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => {
                            setSelectedDocument(doc);
                            setSelectedUploadedDocument(null);
                            setSelectedFileIndex(0);
                            setShowFilePreview(true);
                          }}
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-1">
                        No files
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        

      </TabsContent>
      
      {/* History Tab Content */}
      <TabsContent value="history" className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4 text-left">Verification History</h2>
        
        {!verificationHistory.length && (
          <p className="text-gray-500 text-left">No verification history available for this vehicle.</p>
        )}
      {verificationHistory.length > 0 && (
        <div className="space-y-4">
          {verificationHistory.map((entry, idx) => {
            const status =
              entry.snapshot?.success === false ? 'FAILED' : 'SUCCESS';

            return (
              <div key={idx} className="border rounded-md p-4">
                <h4 className="font-medium mb-2">
                  {formatDate(entry.date)}
                </h4>

                <div className="text-xs text-gray-500 mb-2">
                  Verification status:{' '}
                  <span
                    className={
                      status === 'SUCCESS'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    {status}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() =>
                    viewVerificationDetails({
                      date: entry.date,
                      snapshot: entry.snapshot,
                    })
                  }
                >
                  <History className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </TabsContent>
      
      {/* Verification Details Dialog */}
   <VerificationDetailsDialog
  open={showVerificationDetails}
  onOpenChange={setShowVerificationDetails}
  challanSnapshot={selectedVerificationData?.challanSnapshot}
  challanError={selectedVerificationData?.challanError}
  vehicle={vehicle || undefined}
  vehicleChallans={vehicleChallans}
/>
      
      {/* Upload Document Dialog */}
      <Dialog open={showAddDocumentDialog && !isReadOnlySwitchedContext} onOpenChange={setShowAddDocumentDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="break-words">Upload Documents</DialogTitle>
            <DialogDescription className="break-words">
              Upload new documents for this vehicle
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-6">

          {/* Document Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Document Name <span className="text-red-500">*</span></label>
            <Input
              placeholder="Enter document name"
              maxLength={50}
              value={documentName}
              onChange={(e) => {
                const value = e.target.value;
                setDocumentName(value);

                if (existingDocumentNames.includes(value.trim().toLowerCase())) {
                  setDuplicateError("A document with this name already exists.");
                } else {
                  setDuplicateError("");
                }
              }}
              className="mt-1"
            />
            {duplicateError && (
              <p className="text-xs text-red-500 mt-1">{duplicateError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">{documentName.length}/50 characters</p>
          </div>

          <DocumentUploader 
            vehicleId={vehicleId} 
            clientId={vehicle?.clientId}
            onClose={handleCloseDialog} 
            onSuccess={handleUploadSuccess}
            documentName={documentName}
            disabled={isUploadDisabled || duplicateError !== ""}
            existingDocumentNames={uploadedDocuments.map(d => d.name.toLowerCase())}
          />
          </div>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={showFilePreview} onOpenChange={setShowFilePreview}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedUploadedDocument 
                ? `${selectedUploadedDocument.name}`
                : selectedDocument && `${selectedDocument.type.charAt(0).toUpperCase() + selectedDocument.type.slice(1)} Document`}
            </DialogTitle>
            <DialogDescription>
              {selectedUploadedDocument 
                ? `Uploaded on: ${formatDate(selectedUploadedDocument.uploadedAt)}`
                : selectedDocument && `${selectedDocument.number} • Issued by ${selectedDocument.issuedBy}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center items-center py-4">
            {/* Display the currently selected file */}
            {getCurrentFileUrl() && (
              <div className="w-full max-h-[60vh] overflow-y-auto">
                {isPdfFileForPreview() ? (
                  <div className="relative w-full" style={{ height: '60vh' }}>
                    <iframe 
                      src={getCurrentFileUrl()} 
                      className="absolute inset-0 w-full h-full border-0"
                      title="PDF Document Viewer"
                    />
                  </div>
                ) : getCurrentFileUrl().endsWith('.jpg') || 
                   getCurrentFileUrl().endsWith('.jpeg') || 
                   getCurrentFileUrl().endsWith('.png') || 
                   getCurrentFileUrl().includes('image/') ? (
                  <img 
                    src={getCurrentFileUrl()} 
                    alt={`Document file ${selectedFileIndex + 1}`} 
                    className="mx-auto max-h-full"
                  />
                ) : (
                  <div className="p-4 bg-gray-100 text-center rounded-md">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                    <p>Document File (Preview not available)</p>
                    <a 
                      href={getCurrentFileUrl()} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline mt-2 inline-block"
                    >
                      Download File
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Navigation */}
          {getTotalFiles() > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-2">
              <Button variant="outline" onClick={() => navigateFile('prev')}>
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                {selectedFileIndex + 1} of {getTotalFiles()}
              </span>
              <Button variant="outline" onClick={() => navigateFile('next')}>
                Next
              </Button>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            {!isReadOnlySwitchedContext && (
              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={() => {
                  if (selectedUploadedDocument) {
                    handleDeleteFile(selectedUploadedDocument, selectedFileIndex);
                  } else {
                    console.log(`Delete legacy file at index ${selectedFileIndex}`);
                    toast({
                      title: 'Delete not implemented',
                      description: 'Legacy file deletion feature will be implemented soon',
                    });
                  }
                  
                  // Close preview if it was the last file
                  if (getTotalFiles() <= 1) {
                    setShowFilePreview(false);
                  }
                }}
              >
                <FileX className="h-4 w-4" />
                Delete File
              </Button>
            )}
            <Button onClick={() => setShowFilePreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Document Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm && !isReadOnlySwitchedContext} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Delete Document
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-800 font-medium mb-2">
                  Warning: This action cannot be undone!
                </p>
                <p className="text-red-700 text-sm">
                  You are about to permanently delete the document <strong>
                    {documentToDelete?.document.files[documentToDelete.fileIndex]?.name || 'Unknown file'}
                  </strong>.
                </p>
              </div>
              

              
              <p className="text-gray-600 text-sm">
                Please confirm that you want to proceed with this deletion. 
                This action will immediately remove the document and cannot be recovered.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <Button 
              onClick={confirmDeleteFile} 
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              variant="destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Yes, Delete Document
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Tabs>
  );
};

export default VehicleTabs;
