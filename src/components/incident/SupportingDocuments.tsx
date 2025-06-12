
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Eye, ImageIcon, Video, File, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIncidentDocuments } from '@/hooks/useIncidentDocuments';
import { IncidentDocument } from '@/services/incident/incidentDocumentService';
import { useAuth } from '@/contexts/auth/AuthContext';
import IncidentDocumentUploader from './IncidentDocumentUploader';

interface SupportingDocumentsProps {
  incidentId: string;
  documents?: IncidentDocument[];
  canDelete?: boolean;
  canUpload?: boolean;
  onDocumentDeleted?: () => void;
}

const SupportingDocuments: React.FC<SupportingDocumentsProps> = ({ 
  incidentId, 
  documents: propDocuments,
  canDelete = false,
  canUpload = false,
  onDocumentDeleted
}) => {
  const { user } = useAuth();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IncidentDocument | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const { documents: hookDocuments, loadDocuments, deleteDocument } = useIncidentDocuments();
  
  // Use prop documents if provided, otherwise use hook documents
  const documents = propDocuments || hookDocuments;

  useEffect(() => {
    if (incidentId && !propDocuments) {
      loadDocuments(incidentId);
    }
  }, [incidentId, propDocuments, loadDocuments]);

  const getFileIcon = (fileType: string) => {
    const safeFileType = fileType || '';
    if (safeFileType.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (safeFileType.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-500" />;
    } else if (safeFileType.startsWith('application/pdf') || 
               safeFileType.includes('document')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const handlePreview = (document: IncidentDocument) => {
    const safeFileType = document.type || '';
    if (safeFileType.startsWith('image/')) {
      setSelectedDocument(document);
      setPreviewOpen(true);
    }
  };

  const handleDownload = (doc: IncidentDocument) => {
    try {
      const link = window.document.createElement('a');
      link.href = doc.url;
      link.download = doc.name || 'document';
      link.target = '_blank';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleDelete = async (doc: IncidentDocument) => {
    if (!canDelete) return;
    
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      try {
        await deleteDocument(incidentId, doc.path);
        onDocumentDeleted?.();
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleDocumentsUploaded = (count: number) => {
    console.log(`${count} documents uploaded successfully`);
    // Refresh documents list
    if (!propDocuments) {
      loadDocuments(incidentId);
    }
    setShowUploader(false);
    onDocumentDeleted?.(); // Trigger refresh in parent component
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Supporting Documents ({documents?.length || 0})
            </CardTitle>
            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploader(!showUploader)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Documents
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Upload Section */}
          {canUpload && showUploader && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <IncidentDocumentUploader
                incidentId={incidentId}
                onDocumentsUploaded={handleDocumentsUploaded}
              />
            </div>
          )}

          {/* Documents List */}
          {!documents || documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No supporting documents uploaded for this incident.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document, index) => {
                const isImage = (document.type || '').startsWith('image/');
                
                return (
                  <div
                    key={document.id || index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {getFileIcon(document.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {document.name || `Document ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {document.type || 'Unknown type'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {document.size ? `${(document.size / 1024).toFixed(1)} KB` : ''}
                        </p>
                        
                        {isImage && document.url && (
                          <div className="mt-3">
                            <img
                              src={document.url}
                              alt={document.name}
                              className="w-full h-24 object-cover rounded cursor-pointer"
                              onClick={() => handlePreview(document)}
                            />
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-3">
                          {isImage && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(document)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(document)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          {canDelete && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(document)}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-4">
            {selectedDocument && (
              <img
                src={selectedDocument.url}
                alt={selectedDocument.name}
                className="max-h-[70vh] max-w-full object-contain rounded-md"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SupportingDocuments;
