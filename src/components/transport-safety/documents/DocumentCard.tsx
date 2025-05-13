
import React from 'react';
import { FileText, FileUp, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VehicleDocument } from '@/types/transportSafety';
import DocumentStatusBadge from '@/components/transport-safety/DocumentStatusBadge';

interface DocumentCardProps {
  document: VehicleDocument;
  onEdit: (document: VehicleDocument) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onEdit }) => {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-3 text-gray-400" />
            <div>
              <h3 className="font-medium">
                {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
              </h3>
              <p className="text-sm text-gray-500">{document.number}</p>
            </div>
          </div>
          <DocumentStatusBadge status={document.status} />
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500">Provider:</span> {document.provider || document.issuedBy}
            </div>
            <div>
              <span className="text-gray-500">Verification:</span> {document.verificationStatus || 'Unverified'}
            </div>
            <div>
              <span className="text-gray-500">Issued:</span> {new Date(document.issuedDate).toLocaleDateString()}
            </div>
            <div>
              <span className="text-gray-500">Expires:</span> {new Date(document.expiryDate).toLocaleDateString()}
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => onEdit(document)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="flex items-center">
              <FileUp className="h-4 w-4 mr-2" />
              Upload Copy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentCard;
