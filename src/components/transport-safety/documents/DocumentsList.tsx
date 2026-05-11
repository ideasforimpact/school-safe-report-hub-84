
import React, { useState } from 'react';
import { File } from 'lucide-react';
import { VehicleDocument } from '@/types/transportSafety';
import DocumentCard from './DocumentCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import EditDocumentForm from './EditDocumentForm';

interface DocumentsListProps {
  documents: VehicleDocument[]                                                                                                                                                                                                                                                                                                                                                                                                                                        ;
  vehicleId: string;
  isReadOnly?: boolean;
}

const DocumentsList: React.FC<DocumentsListProps> = ({ documents, vehicleId, isReadOnly = false }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState<VehicleDocument | null>(null);

  const handleEditDocument = (document: VehicleDocument) => {
    if (isReadOnly) return;
    setDocumentToEdit(document);
    setEditDialogOpen(true);
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No Documents Found</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          This vehicle doesn't have any documents yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map(document => (
          <DocumentCard key={document.id} document={document} onEdit={handleEditDocument} isReadOnly={isReadOnly} />
        ))}
      </div>

      <Dialog 
        open={editDialogOpen && !isReadOnly} 
        onOpenChange={(isOpen) => { 
          if (!isOpen) {
            setEditDialogOpen(false);
            setDocumentToEdit(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          {documentToEdit && (
            <EditDocumentForm 
              vehicleId={vehicleId} 
              document={documentToEdit} 
              onClose={() => setEditDialogOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentsList;
