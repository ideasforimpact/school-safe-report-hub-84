
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  date: string;
  type: string;
  status: string;
}

interface VehicleDocumentsCardProps {
  documents: Document[];
  onAddDocument: () => void;
  onViewDocument: (document: Document) => void;
}

export const VehicleDocumentsCard: React.FC<VehicleDocumentsCardProps> = ({
  documents,
  onAddDocument,
  onViewDocument
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Documents</CardTitle>
        <Button variant="ghost" size="sm" onClick={onAddDocument}>
          <Plus className="h-4 w-4 mr-1" />
          Add Document
        </Button>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No documents available</p>
        ) : (
          <ul className="space-y-2">
            {documents.map(doc => (
              <li 
                key={doc.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                onClick={() => onViewDocument(doc)}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 text-blue-500 mr-2" />
                  <span>{doc.name}</span>
                </div>
                <span className="text-sm text-gray-600">{doc.date}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
