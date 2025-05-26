import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Eye, ImageIcon, Video, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Document {
  name: string;
  type: string;
  data: string; // Base64 encoded data
}

interface SupportingDocumentsProps {
  documents: Document[];
}

const SupportingDocuments: React.FC<SupportingDocumentsProps> = ({ documents }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

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

  const handlePreview = (document: Document) => {
    const safeFileType = document.type || '';
    if (safeFileType.startsWith('image/')) {
      setSelectedDocument(document);
      setPreviewOpen(true);
    }
  };

  const handleDownload = (doc: Document) => {
    try {
      const link = window.document.createElement('a');
      link.href = doc.data;
      link.download = doc.name || 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supporting Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No supporting documents uploaded for this incident.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supporting Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((document, index) => {
              const isImage = (document.type || '').startsWith('image/');
              
              return (
                <div
                  key={index}
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
                      
                      {isImage && document.data && (
                        <div className="mt-3">
                          <img
                            src={document.data}
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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
                src={selectedDocument.data}
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
