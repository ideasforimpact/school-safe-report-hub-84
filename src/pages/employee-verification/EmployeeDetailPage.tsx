
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
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
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
            <div className="flex items-center">
              <FileCheck className="h-6 w-6 mr-3 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-left">{employee.name}</h1>
                <p className="text-gray-500 text-left">{employee.position} • {employee.employeeId}</p>
              </div>
            </div>
          </div>

          {activeTab === 'documents' && !showAddDocumentForm && (
            <Button 
              onClick={() => setShowAddDocumentForm(true)} 
              className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-md hover:shadow-lg"
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="text-left">
          <TabsList className="mb-6 bg-gray-100 p-1">
            <TabsTrigger value="details" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Employee Details
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Documents
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="animate-fade-in">
            <EmployeeDetails employee={employee} />
          </TabsContent>
          
          <TabsContent value="documents" className="animate-fade-in">
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
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmployeeDetailPage;
