import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, Calendar, User, Hash } from 'lucide-react';
import { VerificationDocument, Employee } from '@/types/employeeVerification';
import { format } from 'date-fns';

interface BackofficeDocumentCardProps {
  document: VerificationDocument;
  documentTypeName: string;
  employee: Employee;
  onRefresh: () => void;
}

const BackofficeDocumentCard: React.FC<BackofficeDocumentCardProps> = ({
  document,
  documentTypeName,
  employee,
  onRefresh
}) => {
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500 hover:bg-green-600">Verified</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">In Progress</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getDocumentTypeIcon = (typeName: string) => {
    const lowerTypeName = typeName.toLowerCase();
    if (lowerTypeName.includes('aadhar') || lowerTypeName.includes('aadhaar')) {
      return '🆔';
    } else if (lowerTypeName.includes('pan')) {
      return '💳';
    } else if (lowerTypeName.includes('driving') || lowerTypeName.includes('license')) {
      return '🚗';
    } else if (lowerTypeName.includes('bank') || lowerTypeName.includes('account')) {
      return '🏦';
    } else if (lowerTypeName.includes('voter')) {
      return '🗳️';
    } else if (lowerTypeName.includes('passport')) {
      return '📘';
    }
    return '📄';
  };

  const handleDownload = () => {
    if (document.documentImage) {
      const link = window.document.createElement('a');
      link.href = document.documentImage;
      link.download = `${employee.name}_${documentTypeName}_${document.id}.jpg`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleViewImage = () => {
    setImagePreviewOpen(true);
  };

  const formatDocumentTypeName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <>
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="text-2xl">{getDocumentTypeIcon(documentTypeName)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">
                    {formatDocumentTypeName(documentTypeName)}
                  </h3>
                  {getStatusBadge(document.verificationStatus)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    <span>Document ID: {document.id.slice(0, 8)}...</span>
                  </div>
                  
                  {document.documentNumber && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Number: {document.documentNumber}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Uploaded: {format(new Date(document.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Employee: {employee.name}</span>
                  </div>
                </div>

                {document.verificationDate && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Verified: {format(new Date(document.verificationDate), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                )}

                {document.verificationNotes && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm"><strong>Notes:</strong> {document.verificationNotes}</p>
                  </div>
                )}

                {document.details && Object.keys(document.details).length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Verification Details:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(document.details).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {document.documentImage && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewImage}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {imagePreviewOpen && document.documentImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setImagePreviewOpen(false)}
        >
          <div className="max-w-4xl max-h-screen p-4">
            <img
              src={document.documentImage}
              alt={`${documentTypeName} for ${employee.name}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="outline"
              className="absolute top-4 right-4 bg-white text-black"
              onClick={() => setImagePreviewOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default BackofficeDocumentCard;
