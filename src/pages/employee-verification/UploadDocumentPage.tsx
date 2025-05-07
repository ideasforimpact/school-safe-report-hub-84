
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import AddDocumentForm from '@/components/employee-verification/AddDocumentForm';
import Layout from '@/components/layout/Layout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const UploadDocumentPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { getEmployee } = useEmployeeVerification();
  const [dialogOpen, setDialogOpen] = useState(true);

  const employee = getEmployee(employeeId || '');

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      navigate(`/employee-verification/${employeeId}`);
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    navigate(`/employee-verification/${employeeId}`);
  };

  if (!employee) {
    return (
      <Layout>
        <div className="p-8 text-left">
          <h2 className="text-2xl font-bold mb-4">Employee Not Found</h2>
          <p className="text-gray-600 mb-6">The employee you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/employee-verification')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-3xl">
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/employee-verification/${employeeId}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Upload Document</h1>
            <p className="text-gray-500">For employee: {employee.name}</p>
          </div>
        </div>

        {/* Dialog for document upload form */}
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Upload Document for {employee.name}</DialogTitle>
            </DialogHeader>
            <AddDocumentForm 
              employeeId={employee.id} 
              onSuccess={handleSuccess} 
            />
          </DialogContent>
        </Dialog>
        
        {/* Message when dialog is closed but user is still on page */}
        {!dialogOpen && (
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden p-6 text-center">
            <p className="text-gray-500">Upload completed or canceled.</p>
            <Button 
              onClick={() => setDialogOpen(true)} 
              className="mt-4"
            >
              Upload Another Document
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UploadDocumentPage;
