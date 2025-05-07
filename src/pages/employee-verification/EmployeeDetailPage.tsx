
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmployeeVerification } from '@/contexts/employee-verification';
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

          {activeTab === 'documents' && !showAddDocumentForm && (
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

        <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="text-left">
            <TabsList className="bg-gray-50 p-0 border-b border-gray-100 w-full rounded-none">
              <TabsTrigger value="details" className="rounded-none py-3 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Employee Details
              </TabsTrigger>
              <TabsTrigger value="documents" className="rounded-none py-3 px-6 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Documents
              </TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="details" className="mt-0">
                <EmployeeDetails employee={employee} />
              </TabsContent>
              
              <TabsContent value="documents" className="mt-0">
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
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDetailPage;
