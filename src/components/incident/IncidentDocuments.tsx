
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, ImageIcon, Video, File, Trash2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useIncidentDocuments } from '@/hooks/useIncidentDocuments';
import { incidentDocumentService } from '@/services/incident/incidentDocumentService';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { FileItem } from '@/types/incident';

interface IncidentDocumentsProps {
  incidentId: string;
  canEdit?: boolean;
}

const IncidentDocuments: React.FC<IncidentDocumentsProps> = ({ 
  incidentId, 
  canEdit = false 
}) => {
  const {
    documents,
    loading,
    uploading,
    fetchDocuments,
    uploadDocuments,
    deleteDocument,
    downloadDocument
  } = useIncidentDocuments(incidentId);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const getFileIcon = (mimeType: string) => {
    const type = mimeType?.toLowerCase() || '';
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (type.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-500" />;
    } else if (type.startsWith('application/pdf') || type.includes('document')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const handlePreview = (document: any) => {
    if (incidentDocumentService.canPreview(document.mime_type)) {
      setSelectedDocument(document);
      setPreviewOpen(true);
    }
  };

  const handleUpload = async () => {
    if (pendingFiles.length > 0) {
      await uploadDocuments(pendingFiles);
      setPendingFiles([]);
      setShowUpload(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading documents...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({documents.length})
            </CardTitle>
            {canEdit && (
              <Button
                onClick={() => setShowUpload(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Documents
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents uploaded for this incident.</p>
              {canEdit && (
                <Button
                  onClick={() => setShowUpload(true)}
                  variant="outline"
                  className="mt-4"
                >
                  Upload Documents
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((document) => {
                const isImage = document.mime_type?.startsWith('image/');
                const canPreview = incidentDocumentService.canPreview(document.mime_type);
                
                return (
                  <div
                    key={document.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {getFileIcon(document.mime_type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={document.file_name}>
                          {document.file_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {incidentDocumentService.formatFileSize(document.file_size)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(document.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {isImage && (
                      <div className="mb-3">
                        <img
                          src={document.storage_url}
                          alt={document.file_name}
                          className="w-full h-24 object-cover rounded cursor-pointer"
                          onClick={() => handlePreview(document)}
                        />
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {canPreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreview(document)}
                          className="flex items-center gap-1 text-xs"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocument(document)}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument(document.id)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <MultipleFilesUpload
              onFilesChange={setPendingFiles}
              initialFiles={pendingFiles}
              maxFiles={10}
              className="min-h-40"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpload(false);
                  setPendingFiles([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={pendingFiles.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${pendingFiles.length} file(s)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg truncate">
              {selectedDocument?.file_name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center py-4">
            {selectedDocument && (
              <>
                {selectedDocument.mime_type?.startsWith('image/') ? (
                  <img
                    src={selectedDocument.storage_url}
                    alt={selectedDocument.file_name}
                    className="max-h-[70vh] max-w-full object-contain rounded-md"
                  />
                ) : selectedDocument.mime_type === 'application/pdf' ? (
                  <iframe
                    src={selectedDocument.storage_url}
                    className="w-full h-[70vh] border rounded-md"
                    title={selectedDocument.file_name}
                  />
                ) : (
                  <div className="text-center py-8">
                    <File className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Preview not available for this file type</p>
                    <Button
                      onClick={() => downloadDocument(selectedDocument)}
                      className="mt-4"
                    >
                      Download to view
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default IncidentDocuments;
