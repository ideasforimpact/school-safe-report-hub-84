
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmployeeVerification } from '@/contexts/EmployeeVerificationContext';
import EmployeeDetails from '@/components/employee-verification/EmployeeDetails';
import DocumentsList from '@/components/employee-verification/DocumentsList';
import AddDocumentForm from '@/components/employee-verification/AddDocumentForm';
import Layout from '@/components/layout/Layout';

const EmployeeDetailPage = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { getEmployee } = useEmployeeVerification();
  const [activeTab, setActiveTab] = useState('details');
  const [showAddDocumentForm, setShowAddDocumentForm] = useState(false);

  const employee = getEmployee(employeeId || '');

  if (!employee) {
    return (
      <Layout>
        <div className="p-8 text-center">
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
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/employee-verification')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Employee Details</h1>
          </div>

          {activeTab === 'documents' && !showAddDocumentForm && (
            <Button onClick={() => setShowAddDocumentForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          )}
          
          {showAddDocumentForm && (
            <Button variant="outline" onClick={() => setShowAddDocumentForm(false)}>
              Cancel
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="details">Employee Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <EmployeeDetails employee={employee} />
          </TabsContent>
          
          <TabsContent value="documents">
            {showAddDocumentForm ? (
              <AddDocumentForm 
                employeeId={employee.id} 
                onSuccess={() => setShowAddDocumentForm(false)} 
              />
            ) : (
              <DocumentsList employeeId={employee.id} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmployeeDetailPage;
