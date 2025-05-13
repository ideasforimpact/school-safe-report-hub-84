
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TimeSeriesAnalysis from '@/components/insights/charts/TimeSeriesAnalysis';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { format, subMonths, eachMonthOfInterval } from 'date-fns';
import BarChartComponent from '@/components/insights/charts/BarChartComponent';
import { CHART_COLORS } from '@/utils/chartColorUtils';

const VerificationTrends = () => {
  const { documents, employees } = useEmployeeVerification();
  
  // Generate monthly data for the past 6 months
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 6);
  
  const months = eachMonthOfInterval({
    start: sixMonthsAgo,
    end: today
  });
  
  // Generate verification data (mocked with real document creation dates)
  const monthlyVerificationData = months.map(monthDate => {
    const month = format(monthDate, 'MMM');
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    
    // Count documents verified in this month
    const count = documents.filter(doc => {
      const verificationDate = doc.verificationDate ? new Date(doc.verificationDate) : null;
      return verificationDate && 
        verificationDate >= monthStart && 
        verificationDate <= monthEnd;
    }).length;
    
    return { month, count };
  });

  // Document types breakdown
  const documentTypeData = [
    { name: 'Aadhar', value: documents.filter(doc => doc.documentTypeName === 'aadhar').length },
    { name: 'PAN', value: documents.filter(doc => doc.documentTypeName === 'pan').length },
    { name: 'Driving License', value: documents.filter(doc => doc.documentTypeName === 'driving_license').length },
    { name: 'Passport', value: documents.filter(doc => doc.documentTypeName === 'passport').length },
    { name: 'Bank Account', value: documents.filter(doc => doc.documentTypeName === 'bank_account').length },
    { name: 'Voter ID', value: documents.filter(doc => doc.documentTypeName === 'voter_id').length },
    { name: 'Other', value: documents.filter(doc => doc.documentTypeName === 'other').length },
  ].filter(item => item.value > 0);
  
  // Employee type breakdown
  const employeeTypeData = [
    { name: 'Permanent', value: employees.filter(emp => emp.employeeType === 'permanent').length },
    { name: 'Contract', value: employees.filter(emp => emp.employeeType === 'contract').length },
    { name: 'Temporary', value: employees.filter(emp => emp.employeeType === 'temporary').length },
  ];

  // Verification method breakdown
  const verificationMethodData = [
    { name: 'API', value: documents.filter(doc => doc.verificationMethod === 'api' && doc.verificationStatus === 'verified').length },
    { name: 'Manual', value: documents.filter(doc => doc.verificationMethod === 'manual' && doc.verificationStatus === 'verified').length },
    { name: 'Pending', value: documents.filter(doc => doc.verificationStatus === 'pending').length },
    { name: 'Failed', value: documents.filter(doc => doc.verificationStatus === 'failed').length },
  ];
  
  return (
    <div className="space-y-8">
      {/* Monthly verification trends - full width */}
      <div className="w-full h-96">
        <TimeSeriesAnalysis 
          data={monthlyVerificationData}
          title="Verification Trends"
          description="Monthly trend of document verifications"
        />
      </div>
      
      {/* Two charts side by side with equal height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Document types breakdown */}
        <div className="h-80">
          <BarChartComponent 
            title="Document Types" 
            description="Breakdown of document types in the system"
            data={documentTypeData}
            color={CHART_COLORS.blue}
            layout="vertical"
          />
        </div>
        
        {/* Employee types breakdown */}
        <div className="h-80">
          <BarChartComponent 
            title="Employee Types" 
            description="Distribution of employees by employment type"
            data={employeeTypeData}
            color={CHART_COLORS.purple}
          />
        </div>
      </div>
      
      {/* Verification methods - full width */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Verification Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {verificationMethodData.map(item => (
              <div 
                key={item.name} 
                className={`p-6 rounded-lg ${
                  item.name === 'API' ? 'bg-blue-50 border-blue-200' : 
                  item.name === 'Manual' ? 'bg-green-50 border-green-200' :
                  item.name === 'Pending' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                } border shadow-sm`}
              >
                <p className="text-sm text-gray-500">{item.name}</p>
                <p className="text-2xl font-bold mt-2">{item.value}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {Math.round((item.value / documents.length) * 100)}% of total
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationTrends;
