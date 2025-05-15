
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { ChevronRight, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const VerificationOverview = () => {
  const { employees } = useEmployeeVerification();
  
  // Calculate verification status counts
  const totalEmployees = employees.length;
  const verifiedEmployees = employees.filter(emp => emp.status === true).length;
  const pendingEmployees = employees.filter(emp => emp.status === false).length;
  const failedEmployees = employees.filter(emp => emp.status === false).length;
  
  const verificationRate = totalEmployees > 0 
    ? Math.round((verifiedEmployees / totalEmployees) * 100) 
    : 0;
    
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">
          Employee Verification Status
        </CardTitle>
        <Link to="/employee-verification" className="text-xs text-blue-600 flex items-center">
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-500">Total Employees</span>
          </div>
          <span className="font-semibold">{totalEmployees}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            <span className="text-sm text-gray-500">Verified</span>
          </div>
          <span className="font-semibold text-green-600">{verifiedEmployees}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
            <span className="text-sm text-gray-500">Failed</span>
          </div>
          <span className="font-semibold text-red-600">{failedEmployees}</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-3">
          <div 
            className="bg-green-600 h-2.5 rounded-full" 
            style={{ width: `${verificationRate}%` }}>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{verificationRate}% verified</span>
          <span>{totalEmployees} total</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificationOverview;
