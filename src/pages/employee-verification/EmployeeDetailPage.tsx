
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import EmployeeDetails from '@/components/employee-verification/EmployeeDetails';
import DocumentsList from '@/components/employee-verification/DocumentsList';
import AddDocumentForm from '@/components/employee-verification/AddDocumentForm';
import Layout from '@/components/layout/Layout';
import { Separator } from '@/components/ui/separator';

const EmployeeDetailPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { getEmployee } = useEmployeeVerification();
  const [showAddDocumentForm, setShowAddDocumentForm] = useState(false);

  const employee = getEmployee(employeeId || '');

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
      <div className="container mx-auto py-6 px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <div className="flex items-center mb-4 sm:mb-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/employee-verification')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{employee.name}</h1>
              <p className="text-gray-500">{employee.position} • {employee.employeeId}</p>
            </div>
          </div>

          {!showAddDocumentForm && (
            <Button 
              onClick={() => setShowAddDocumentForm(true)} 
              className="shadow-md"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          )}
          
          {showAddDocumentForm && (
            <Button variant="outline" onClick={() => setShowAddDocumentForm(false)}>
              Cancel
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6">
            <EmployeeDetails employee={employee} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <h2 className="text-xl font-semibold">Documents & Verification</h2>
              <Separator className="flex-grow ml-4" />
            </div>
            
            {showAddDocumentForm ? (
              <AddDocumentForm 
                employeeId={employee.id} 
                onSuccess={() => setShowAddDocumentForm(false)} 
              />
            ) : (
              <DocumentsList 
                employeeId={employee.id} 
                onAddDocument={() => setShowAddDocumentForm(true)} 
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDetailPage;
