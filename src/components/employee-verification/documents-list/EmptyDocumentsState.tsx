
import React from 'react';
import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useParams } from 'react-router-dom';

const EmptyDocumentsState = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-md bg-muted/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-background">
        <FileX className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No documents found</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">
        This employee has no verification documents uploaded yet. Add some documents to begin the verification process.
      </p>
      <Button asChild className="mt-4">
        <Link to={`/employee-verification/${employeeId}/upload-document`}>
          Add First Document
        </Link>
      </Button>
    </div>
  );
};

export default EmptyDocumentsState;
