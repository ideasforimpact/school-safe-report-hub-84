
import React from 'react';
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
import AddDocumentForm from '@/components/transport-safety/documents/AddDocumentForm';
import { VehicleDocument } from '@/types/transportSafety';

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
  
  const vehicle = getVehicle(vehicleId);
  
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
  
  // Function to determine if a document has files attached
  const hasAttachedFiles = (document: VehicleDocument) => {
    return document.fileUrls && document.fileUrls.length > 0;
  };

  // Function to open file preview dialog
  const openFilePreview = (document: VehicleDocument, index: number = 0) => {
    setSelectedDocument(document);
    setSelectedFileIndex(index);
    setShowFilePreview(true);
  };

  // Function to navigate between files in preview
  const navigateFile = (direction: 'next' | 'prev') => {
    if (!selectedDocument || !selectedDocument.fileUrls) return;
    
    const totalFiles = selectedDocument.fileUrls.length;
    
    if (direction === 'next') {
      setSelectedFileIndex((selectedFileIndex + 1) % totalFiles);
    } else {
      setSelectedFileIndex((selectedFileIndex - 1 + totalFiles) % totalFiles);
    }
  };
  
  return (
    <Tabs defaultValue="documents">
      <TabsList className="mb-4">
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
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
            Add Document
          </Button>
        </div>
        
        {vehicle && vehicle.documents.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Uploaded Documents</h3>
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
                    {hasAttachedFiles(doc) ? (
                      <>
                        <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-1">
                          {doc.fileUrls.length} file{doc.fileUrls.length !== 1 ? 's' : ''}
                        </span>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          onClick={() => openFilePreview(doc)}
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
        
        <p className="text-gray-500 text-sm mt-4">
          For detailed document management, including verification and updates, please visit the 
          <Link to={`/transport-safety/${vehicleId}/documents`} className="text-primary ml-1">
            Document Management
          </Link> page.
        </p>
      </TabsContent>
      
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
      
      {/* Add Document Dialog */}
      <Dialog open={showAddDocumentDialog} onOpenChange={setShowAddDocumentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
            <DialogDescription>
              Upload a new document for this vehicle
            </DialogDescription>
          </DialogHeader>
          <AddDocumentForm 
            vehicleId={vehicleId} 
            onClose={() => setShowAddDocumentDialog(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={showFilePreview} onOpenChange={setShowFilePreview}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDocument && `${selectedDocument.type.charAt(0).toUpperCase() + selectedDocument.type.slice(1)} Document`}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument && `${selectedDocument.number} • Issued by ${selectedDocument.issuedBy}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-center items-center py-4">
            {selectedDocument && selectedDocument.fileUrls && selectedDocument.fileUrls[selectedFileIndex] && (
              <div className="w-full max-h-[60vh] overflow-y-auto">
                {selectedDocument.fileUrls[selectedFileIndex].startsWith('data:image') ? (
                  <img 
                    src={selectedDocument.fileUrls[selectedFileIndex]} 
                    alt={`Document file ${selectedFileIndex + 1}`} 
                    className="mx-auto max-h-full"
                  />
                ) : selectedDocument.fileUrls[selectedFileIndex].startsWith('data:application/pdf') ? (
                  <div className="p-4 bg-gray-100 text-center rounded-md">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                    <p>PDF Document (Preview not available)</p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 text-center rounded-md">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-600" />
                    <p>Document File (Preview not available)</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* File Navigation */}
          {selectedDocument && selectedDocument.fileUrls && selectedDocument.fileUrls.length > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-2">
              <Button variant="outline" onClick={() => navigateFile('prev')}>
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                {selectedFileIndex + 1} of {selectedDocument.fileUrls.length}
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
                if (selectedDocument && selectedFileIndex >= 0 && selectedDocument.fileUrls) {
                  // In a real app, we would implement proper delete functionality here
                  // For this demo, we'll just log it
                  console.log(`Delete file at index ${selectedFileIndex}`);
                  
                  // Close preview if it was the last file
                  if (selectedDocument.fileUrls.length <= 1) {
                    setShowFilePreview(false);
                  }
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
