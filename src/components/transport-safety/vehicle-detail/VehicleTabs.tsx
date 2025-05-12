import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/dateUtils';
import { History, FilePlus, FileText, FileX, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { VehicleDocument } from '@/types/transportSafety';
import DocumentUploader from '../documents/DocumentUploader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UploadedDocument } from '@/types/fileTypes'; // Import the interface

interface VehicleTabsProps {
  vehicleId: string;
}

const VehicleTabs: React.FC<VehicleTabsProps> = ({ vehicleId }) => {
  const { getVehicle } = useTransportSafety();
  const [showVerificationDetails, setShowVerificationDetails] = React.useState(false);
  const [selectedVerificationData, setSelectedVerificationData] = React.useState<any>(null);
  const [showAddDocumentDialog, setShowAddDocumentDialog] = React.useState(false);
  const [showFilePreview, setShowFilePreview] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<VehicleDocument | null>(null);
  const [selectedFileIndex, setSelectedFileIndex] = React.useState<number>(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [selectedUploadedDocument, setSelectedUploadedDocument] = useState<UploadedDocument | null>(null);
  
  const vehicle = getVehicle(vehicleId);
  
  // Fetch uploaded documents from the database
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!vehicleId) return;
      
      setIsLoadingDocuments(true);
      try {
        const { data, error } = await supabase
          .from('vehicle_documents')
          .select('*')
          .eq('vehicle_id', vehicleId)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching documents:', error);
          toast({
            title: 'Error fetching documents',
            description: 'There was an error fetching your documents',
            variant: 'destructive',
          });
        }
        
        if (data && data.documents) {
          // Safely transform the data using type assertion after validation
          const rawDocuments = Array.isArray(data.documents) ? data.documents : [];
          
          // Transform and validate each document
          const transformedDocuments: UploadedDocument[] = rawDocuments
            .filter((doc: any) => 
              doc && 
              typeof doc.name === 'string' && 
              typeof doc.type === 'string' && 
              typeof doc.uploadedAt === 'string' &&
              Array.isArray(doc.files)
            )
            .map((doc: any) => ({
              name: doc.name,
              type: doc.type,
              uploadedAt: doc.uploadedAt,
              files: Array.isArray(doc.files) 
                ? doc.files.map((file: any) => ({
                    name: file.name || 'Unnamed file',
                    path: file.path || '',
                    url: file.url || '',
                    uploadedAt: file.uploadedAt || doc.uploadedAt
                  }))
                : []
            }));
            
          setUploadedDocuments(transformedDocuments);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setIsLoadingDocuments(false);
      }
    };
    
    fetchDocuments();
  }, [vehicleId]);
  
  // Find verification log entry to get history
  const getVerificationLog = () => {
    if (!vehicle?.verificationData) return null;
    
    const logEntry = vehicle.verificationData.find(item => item.field === 'verification_log');
    return logEntry?.value || null;
  };
  
  const verificationLog = getVerificationLog();
  
  // Get verification history entries sorted by date (newest first)
  const getVerificationHistory = () => {
    if (!verificationLog) return [];
    
    return Object.entries(verificationLog)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, data]) => ({
        date,
        data
      }));
  };
  
  const verificationHistory = getVerificationHistory();
  
  const formatVerificationData = (data: any) => {
    if (!data || !Array.isArray(data)) return [];
    
    return data
      .filter((item: any) => item.field !== 'verification_log' && item.field !== 'last_response' && item.field !== 'status')
      .map((item: any) => ({
        label: item.field.replace(/_/g, ' ').split(' ').map((word: string) => 
          word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        value: item.value
      }));
  };
  
  const viewVerificationDetails = (data: any) => {
    setSelectedVerificationData(data);
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
    
    // Refresh the documents list
    if (result.result && result.result[0] && result.result[0].documents) {
      setUploadedDocuments(result.result[0].documents);
    }
    
    toast({
      title: 'Documents Uploaded',
      description: 'Your documents have been uploaded successfully',
    });
  };
  
  // Delete a file from storage and update database
  const handleDeleteFile = async (document: UploadedDocument, fileIndex: number) => {
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
      
    } catch (error) {
      console.error('Error in handleDeleteFile:', error);
      toast({
        title: 'Error deleting file',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };
  
  // Get current file URL for preview
  const getCurrentFileUrl = () => {
    if (selectedUploadedDocument) {
      return selectedUploadedDocument.files[selectedFileIndex]?.url || '';
    } else if (selectedDocument && selectedDocument.fileUrls) {
      return selectedDocument.fileUrls[selectedFileIndex] || '';
    }
    return '';
  };

  // Check if current file is a PDF
  const isPdfFile = () => {
    const fileUrl = getCurrentFileUrl();
    return fileUrl.toLowerCase().endsWith('.pdf') || 
           fileUrl.toLowerCase().includes('application/pdf') ||
           (selectedUploadedDocument?.files[selectedFileIndex]?.name && 
            selectedUploadedDocument.files[selectedFileIndex].name.toLowerCase().endsWith('.pdf'));
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
          <Button 
            onClick={() => setShowAddDocumentDialog(true)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
          >
            <FilePlus className="h-4 w-4" />
            Upload Documents
          </Button>
        </div>
        
        {/* Documents List: Loading, Empty, or Populated */}
        {isLoadingDocuments ? (
          <div className="text-center py-8">
            <p>Loading documents...</p>
          </div>
        ) : uploadedDocuments.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Uploaded Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedDocuments.map((doc, idx) => (
                <div 
                  key={`${doc.name}-${idx}`} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        Uploaded: {formatDate(new Date(doc.uploadedAt))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.files && doc.files.length > 0 ? (
                      <>
                        <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-1">
                          {doc.files.length} file{doc.files.length !== 1 ? 's' : ''}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => openUploadedFilePreview(doc, 0)}
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                        </Button>
                      </>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vehicle.documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}</p>
                      <p className="text-xs text-gray-500">
                        {doc.number} • Expires: {formatDate(new Date(doc.expiryDate))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.fileUrls && doc.fileUrls.length > 0 ? (
                      <>
                        <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-1">
                          {doc.fileUrls.length} file{doc.fileUrls.length !== 1 ? 's' : ''}
                        </span>
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
                      </>
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
        
        <p className="text-gray-500 text-sm mt-4">
          For detailed document management, including verification and updates, please visit the 
          <Link to={`/transport-safety/${vehicleId}/documents`} className="text-primary ml-1">
            Document Management
          </Link> page.
        </p>
      </TabsContent>
      
      {/* History Tab Content */}
      <TabsContent value="history" className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4 text-left">Verification History</h2>
        
        {!verificationHistory.length && (
          <p className="text-gray-500 text-left">No verification history available for this vehicle.</p>
        )}
        
        {verificationHistory.length > 0 && (
          <div className="space-y-4">
            {verificationHistory.map((entry, idx) => (
              <div key={idx} className="border rounded-md p-4">
                <h4 className="font-medium mb-2">
                  {new Date(entry.date).toLocaleString()}
                </h4>
                <div className="text-xs text-gray-500 mb-2">
                  Verification status: <span className={
                    Array.isArray(entry.data) && 
                    entry.data.find((i: any) => i.field === 'status')?.value === 'active' ? 
                    'text-green-600' : 'text-amber-600'
                  }>
                    {Array.isArray(entry.data) ? 
                      String(entry.data.find((i: any) => i.field === 'status')?.value || 'Unknown').toUpperCase() : 
                      'Unknown'
                    }
                  </span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => viewVerificationDetails(entry.data)}
                >
                  <History className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
      
      {/* Verification Details Dialog */}
      <Dialog open={showVerificationDetails} onOpenChange={setShowVerificationDetails}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Verification Details</DialogTitle>
            <DialogDescription>
              Registration details verified through Surepass API.
            </DialogDescription>
          </DialogHeader>
          
          <div className="border rounded-md divide-y">
            {formatVerificationData(selectedVerificationData).map((field: any, index: number) => (
              <div key={index} className="flex justify-between px-4 py-2">
                <span className="font-medium text-gray-500">{field.label}:</span>
                <span className="text-gray-900">{typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value)}</span>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowVerificationDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Upload Document Dialog */}
      <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload new documents for this vehicle
            </DialogDescription>
          </DialogHeader>
          <DocumentUploader 
            vehicleId={vehicleId} 
            onClose={() => setShowAddDocumentDialog(false)} 
            onSuccess={handleUploadSuccess}
          />
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
                ? `Uploaded on: ${formatDate(new Date(selectedUploadedDocument.uploadedAt))}`
                : selectedDocument && `${selectedDocument.number} • Issued by ${selectedDocument.issuedBy}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center items-center py-4">
            {/* Display the currently selected file */}
            {getCurrentFileUrl() && (
              <div className="w-full max-h-[60vh] overflow-y-auto">
                {isPdfFile() ? (
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
                   getCurrentFileUrl().includes('image/') || 
                   getCurrentFileUrl().includes('/storage/v1/object/public/vehicle-documents') ? (
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
            <Button onClick={() => setShowFilePreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
};

export default VehicleTabs;
