
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useEmployeeVerification } from '@/contexts/employee-verification';

const VerificationSummary = () => {
  const { employees, documents } = useEmployeeVerification();

  // Calculate statistics
  const totalEmployees = employees.length;
  const verifiedEmployees = employees.filter(emp => emp.status === 'verified').length;
  const pendingEmployees = employees.filter(emp => emp.status === 'pending').length;
  const failedEmployees = employees.filter(emp => emp.status === 'failed').length;
  
  const totalDocuments = documents.length;
  const verifiedDocuments = documents.filter(doc => doc.verificationStatus === 'verified').length;
  const pendingDocuments = documents.filter(doc => doc.verificationStatus === 'pending').length;
  const failedDocuments = documents.filter(doc => doc.verificationStatus === 'failed').length;
  
  const verificationRate = totalEmployees > 0 
    ? Math.round((verifiedEmployees / totalEmployees) * 100) 
    : 0;

  const statsItems = [
    { label: 'Total Employees', value: totalEmployees },
    { label: 'Verified', value: verifiedEmployees, color: 'text-green-600' },
    { label: 'Pending', value: pendingEmployees, color: 'text-yellow-600' },
    { label: 'Failed', value: failedEmployees, color: 'text-red-600' },
  ];

  const docStatsItems = [
    { label: 'Total Documents', value: totalDocuments },
    { label: 'Verified', value: verifiedDocuments, color: 'text-green-600' },
    { label: 'Pending', value: pendingDocuments, color: 'text-yellow-600' },
    { label: 'Failed', value: failedDocuments, color: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Employee Verification Summary</h3>
          
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-gray-500">Verification Rate</p>
              <p className="text-3xl font-bold">{verificationRate}%</p>
            </div>
            <div className="h-16 w-16 rounded-full border-4 flex items-center justify-center" 
                 style={{ borderColor: `${verificationRate >= 70 ? '#10B981' : verificationRate >= 40 ? '#F59E0B' : '#EF4444'}` }}>
              <span className="text-lg font-bold">{verificationRate}%</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {statsItems.map((item) => (
              <div key={item.label} className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className={`text-xl font-bold ${item.color || ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Document Verification</h3>
          
          <div className="grid grid-cols-2 gap-4">
            {docStatsItems.map((item) => (
              <div key={item.label} className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className={`text-xl font-bold ${item.color || ''}`}>{item.value}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-2">Documents by Type</h4>
            <div className="space-y-2">
              {['aadhar', 'pan', 'driving_license', 'passport', 'bank_account'].map(type => {
                const count = documents.filter(doc => doc.documentTypeName === type).length;
                const typeName = type === 'aadhar' ? 'Aadhar Card' :
                                type === 'pan' ? 'PAN Card' :
                                type === 'driving_license' ? 'Driving License' :
                                type === 'passport' ? 'Passport' : 'Bank Account';
                return (
                  <div key={type} className="flex justify-between">
                    <span className="text-sm">{typeName}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationSummary;
