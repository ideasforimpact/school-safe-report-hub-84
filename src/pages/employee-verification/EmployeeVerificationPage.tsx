
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
        <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
          <div className="flex items-center space-x-4">
            <FileCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-left">Employee Verification</h1>
              <p className="text-gray-500 text-sm text-left">Manage and verify employee documents</p>
            </div>
          </div>
          <AddEmployeeDialog />
        </div>

        <Tabs defaultValue="employees" className="text-left">
          <TabsList className="mb-6 bg-gray-100 p-1">
            <TabsTrigger value="employees" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Employees
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Dashboard
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="employees" className="animate-fade-in">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-medium mb-4 text-left">Employees</h2>
              <EmployeesList />
            </div>
          </TabsContent>
          
          <TabsContent value="dashboard" className="animate-fade-in">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-medium mb-4 text-left">Verification Dashboard</h2>
                <VerificationSummary />
              </div>
              
              <div className="bg-gradient-to-b from-white to-gray-50 rounded-lg shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-medium mb-4 text-left flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  About Employee Verification
                </h2>
                <div className="prose max-w-none text-left">
                  <p>
                    The employee verification system helps ensure that all employee documentation is authentic and valid. 
                    We verify the following documents:
                  </p>
                  <ul className="space-y-2 ml-6 list-disc">
                    <li><strong>Aadhar Card</strong> - Government issued 12-digit Unique Identity Number</li>
                    <li><strong>PAN Card</strong> - Permanent Account Number for tax identification</li>
                    <li><strong>Driving License</strong> - Official document permitting a person to drive</li>
                    <li><strong>Passport</strong> - Official travel document issued by a government</li>
                    <li><strong>Voter ID</strong> - Electoral photo identity card issued by Election Commission</li>
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
