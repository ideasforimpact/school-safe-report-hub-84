
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { VerificationDocument } from '@/types/employeeVerification';

interface DocumentsListProps {
  employeeId: string;
  onAddDocument: () => void;
  initialLoadComplete: boolean;
  documents?: VerificationDocument[];
}

const DocumentsList: React.FC<DocumentsListProps> = ({ 
  employeeId, 
  onAddDocument, 
  initialLoadComplete,
  documents = []
}) => {
  const [localDocuments, setLocalDocuments] = useState<VerificationDocument[]>([]);

  useEffect(() => {
    if (documents) {
      setLocalDocuments(documents);
    }
  }, [documents]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  if (!initialLoadComplete) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading documents...</p>
      </div>
    );
  }

  if (localDocuments.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
        <p className="text-gray-600 mb-6">This employee hasn't uploaded any verification documents yet.</p>
        <Button onClick={onAddDocument}>
          <Upload className="h-4 w-4 mr-2" />
          Upload First Document
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {localDocuments.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {document.documentTypeName}
                    </h4>
                    <Badge className={`flex items-center space-x-1 ${getStatusColor(document.verificationStatus)}`}>
                      {getStatusIcon(document.verificationStatus)}
                      <span className="capitalize">{document.verificationStatus}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    {document.documentNumber && (
                      <div>
                        <span className="font-medium">Document Number:</span> {document.documentNumber}
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Uploaded: {formatDate(document.createdAt)}</span>
                    </div>
                  </div>
                  
                  {document.verificationNotes && (
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">Notes:</span> {document.verificationNotes}
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0 ml-4">
                  {document.documentImage && (
                    <img
                      src={document.documentImage}
                      alt={document.documentTypeName}
                      className="h-16 w-16 object-cover rounded border"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DocumentsList;
