
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/layout/Layout';
import AddEmployeeDialog from '@/components/employee-verification/AddEmployeeDialog';
import EmployeesList from '@/components/employee-verification/EmployeesList';
import VerificationSummary from '@/components/employee-verification/VerificationSummary';
import { FileCheck, FileText } from 'lucide-react';

const EmployeeVerificationPage = () => {
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <FileCheck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Employee Verification</h1>
          </div>
          <AddEmployeeDialog />
        </div>

        <Tabs defaultValue="employees">
          <TabsList className="mb-6">
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees">
            <div className="bg-white rounded-md shadow p-6">
              <h2 className="text-lg font-medium mb-4">Employees</h2>
              <EmployeesList />
            </div>
          </TabsContent>
          
          <TabsContent value="dashboard">
            <div className="space-y-6">
              <div className="bg-white rounded-md shadow p-6">
                <h2 className="text-lg font-medium mb-4">Verification Dashboard</h2>
                <VerificationSummary />
              </div>
              
              <div className="bg-white rounded-md shadow p-6">
                <h2 className="text-lg font-medium mb-4">About Employee Verification</h2>
                <div className="prose max-w-none">
                  <p>
                    The employee verification system helps ensure that all employee documentation is authentic and valid. 
                    We verify the following documents:
                  </p>
                  <ul>
                    <li><strong>Aadhar Card</strong> - Government issued 12-digit Unique Identity Number</li>
                    <li><strong>PAN Card</strong> - Permanent Account Number for tax identification</li>
                    <li><strong>Driving License</strong> - Official document permitting a person to drive</li>
                    <li><strong>Passport</strong> - Official travel document issued by a government</li>
                    <li><strong>Bank Account</strong> - Verify bank account details for salary transfers</li>
                  </ul>
                  <p>
                    The verification process typically takes 1-2 business days. Once all documents are verified, 
                    the employee will be marked as fully verified in the system.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmployeeVerificationPage;
