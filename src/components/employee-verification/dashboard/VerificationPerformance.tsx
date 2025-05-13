
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format, differenceInDays } from 'date-fns';

const VerificationPerformance = () => {
  const { documents } = useEmployeeVerification();
  
  // Calculate the verification time for each verified document
  const verificationTimes = useMemo(() => {
    return documents
      .filter(doc => doc.verificationStatus === 'verified' && doc.verificationDate)
      .map(doc => {
        const createdDate = new Date(doc.createdAt);
        const verifiedDate = new Date(doc.verificationDate!);
        const days = differenceInDays(verifiedDate, createdDate);
        
        return {
          id: doc.id,
          documentType: doc.documentTypeName,
          verificationMethod: doc.verificationMethod || 'manual',
          days: Math.max(days, 0) // Ensure no negative values
        };
      });
  }, [documents]);
  
  // Calculate average verification times by document type
  const avgTimeByDocType = useMemo(() => {
    const groupedByType: Record<string, number[]> = {};
    
    verificationTimes.forEach(item => {
      if (!groupedByType[item.documentType]) {
        groupedByType[item.documentType] = [];
      }
      groupedByType[item.documentType].push(item.days);
    });
    
    return Object.entries(groupedByType).map(([type, times]) => {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      const documentTypeNames: Record<string, string> = {
        'aadhar': 'Aadhar Card',
        'pan': 'PAN Card',
        'driving_license': 'Driving License',
        'passport': 'Passport',
        'voter_id': 'Voter ID',
        'bank_account': 'Bank Account',
        'other': 'Other'
      };
      
      return {
        name: documentTypeNames[type] || type,
        avgDays: parseFloat(avg.toFixed(1))
      };
    }).sort((a, b) => a.avgDays - b.avgDays);
  }, [verificationTimes]);
  
  // Calculate API vs Manual verification ratio
  const verificationMethodCounts = useMemo(() => {
    const apiCount = verificationTimes.filter(item => item.verificationMethod === 'api').length;
    const manualCount = verificationTimes.filter(item => item.verificationMethod === 'manual').length;
    
    return [
      { name: 'API', value: apiCount },
      { name: 'Manual', value: manualCount }
    ];
  }, [verificationTimes]);
  
  // Calculate success rate by verification method
  const successRateByMethod = useMemo(() => {
    const apiVerifications = documents.filter(doc => doc.verificationMethod === 'api').length;
    const manualVerifications = documents.filter(doc => doc.verificationMethod === 'manual').length;
    
    const apiSuccesses = documents.filter(doc => 
      doc.verificationMethod === 'api' && doc.verificationStatus === 'verified'
    ).length;
    
    const manualSuccesses = documents.filter(doc => 
      doc.verificationMethod === 'manual' && doc.verificationStatus === 'verified'
    ).length;
    
    return [
      { 
        name: 'API', 
        successRate: apiVerifications ? Math.round((apiSuccesses / apiVerifications) * 100) : 0 
      },
      { 
        name: 'Manual', 
        successRate: manualVerifications ? Math.round((manualSuccesses / manualVerifications) * 100) : 0 
      }
    ];
  }, [documents]);
  
  // Colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Average verification time by document type */}
      <Card>
        <CardHeader>
          <CardTitle>Avg. Verification Time by Document Type</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={avgTimeByDocType}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" unit=" days" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip formatter={(value) => [`${value} days`, 'Average Time']} />
              <Legend />
              <Bar dataKey="avgDays" name="Avg. Days to Verify" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* API vs Manual verification ratio */}
      <Card>
        <CardHeader>
          <CardTitle>API vs Manual Verification</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={verificationMethodCounts}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {verificationMethodCounts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} verifications`, 'Count']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Success rate by method */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Success Rate by Method</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={successRateByMethod}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
              <Legend />
              <Bar dataKey="successRate" name="Success Rate" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Performance metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium">API Verification Speed</p>
              <div className="flex items-center">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <span className="ml-2 text-sm font-medium">90%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Average: 0.5 days</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Manual Verification Speed</p>
              <div className="flex items-center">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: '65%' }}></div>
                </div>
                <span className="ml-2 text-sm font-medium">65%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Average: 2.3 days</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">Verification Accuracy</p>
              <div className="flex items-center">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '95%' }}></div>
                </div>
                <span className="ml-2 text-sm font-medium">95%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Error rate: 5%</p>
            </div>
            
            <div>
              <p className="text-sm font-medium">First-time Approval Rate</p>
              <div className="flex items-center">
                <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '78%' }}></div>
                </div>
                <span className="ml-2 text-sm font-medium">78%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Documents approved without resubmission</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationPerformance;
