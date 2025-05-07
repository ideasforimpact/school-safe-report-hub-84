
import React from 'react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  FileCheck, 
  AlertTriangle, 
  Clock
} from 'lucide-react';

const VerificationOverview = () => {
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

  // Document verification average time (mocked for demo)
  const avgVerificationTime = "1.5 days";
  
  // Calculate department statistics (mocked for demo)
  const departmentStats = [
    { name: "Engineering", verified: 85, total: 100 },
    { name: "Marketing", verified: 25, total: 30 },
    { name: "HR", verified: 12, total: 15 },
    { name: "Finance", verified: 18, total: 20 },
  ];
  
  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewCard 
          title="Employees" 
          value={totalEmployees}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          bgColor="bg-blue-100"
          description={`${verifiedEmployees} verified, ${pendingEmployees} pending`}
        />
        
        <OverviewCard 
          title="Documents" 
          value={totalDocuments}
          icon={<FileCheck className="h-5 w-5 text-green-600" />}
          bgColor="bg-green-100"
          description={`${verifiedDocuments} verified, ${pendingDocuments} pending`}
        />
        
        <OverviewCard 
          title="Verification Rate" 
          value={`${verificationRate}%`}
          icon={<AlertTriangle className="h-5 w-5 text-yellow-600" />}
          bgColor="bg-yellow-100"
          description="Overall employee verification"
        />
        
        <OverviewCard 
          title="Avg. Time" 
          value={avgVerificationTime}
          icon={<Clock className="h-5 w-5 text-purple-600" />}
          bgColor="bg-purple-100"
          description="For document verification"
        />
      </div>
      
      {/* Department breakdown */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Department Breakdown</h3>
          <div className="space-y-4">
            {departmentStats.map(dept => (
              <div key={dept.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{dept.name}</span>
                  <span className="font-medium">{Math.round((dept.verified / dept.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(dept.verified / dept.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">{dept.verified} of {dept.total} verified</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface OverviewCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  description: string;
}

const OverviewCard = ({ title, value, icon, bgColor, description }: OverviewCardProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-base font-medium text-gray-500">{title}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-full ${bgColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificationOverview;
