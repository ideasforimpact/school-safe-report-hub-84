
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { 
  CheckCircle, 
  ChevronRight, 
  Clock, 
  FileCheck, 
  Shield, 
  XCircle 
} from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { format, formatDistanceToNow } from 'date-fns';
import { VerificationDocument } from '@/types/employeeVerification';
import { Badge } from '@/components/ui/badge';

const RecentVerifications = () => {
  const { documents, employees, getEmployee } = useEmployeeVerification();
  
  // Get recent verification activities (all documents with verificationDate)
  const recentVerifications = documents
    .filter(doc => doc.verificationDate)
    .sort((a, b) => {
      return new Date(b.verificationDate!).getTime() - new Date(a.verificationDate!).getTime();
    })
    .slice(0, 10); // Show only latest 10

  // Get documents pending verification
  const pendingVerifications = documents
    .filter(doc => doc.verificationStatus === 'pending')
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .slice(0, 5); // Show only latest 5
    
  return (
    <div className="space-y-6">
      {/* Recent activity feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Verification Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recentVerifications.map(doc => (
              <ActivityItem 
                key={doc.id} 
                document={doc} 
                employee={getEmployee(doc.employeeId)} 
              />
            ))}
            
            {recentVerifications.length === 0 && (
              <div className="text-center py-6">
                <Clock className="h-12 w-12 mx-auto text-gray-400" />
                <p className="mt-2 text-gray-500">No recent verification activities</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Pending Verification Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Verification Queue</CardTitle>
          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
            {pendingVerifications.length} Pending
          </Badge>
        </CardHeader>
        <CardContent>
          {pendingVerifications.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVerifications.map(doc => {
                  const employee = getEmployee(doc.employeeId);
                  const documentTypeNames: Record<string, string> = {
                    'aadhar': 'Aadhar Card',
                    'pan': 'PAN Card',
                    'driving_license': 'Driving License',
                    'passport': 'Passport',
                    'voter_id': 'Voter ID',
                    'bank_account': 'Bank Account',
                    'other': 'Other'
                  };
                  
                  // Calculate priority based on submission date
                  // Older submissions get higher priority
                  const submittedDate = new Date(doc.createdAt);
                  const daysSinceSubmission = Math.floor((Date.now() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  let priority = "low";
                  if (daysSinceSubmission > 7) {
                    priority = "high";
                  } else if (daysSinceSubmission > 3) {
                    priority = "medium";
                  }
                  
                  return (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="font-medium">
                          {documentTypeNames[doc.documentType] || doc.documentType}
                        </div>
                        <div className="text-xs text-gray-500">{doc.documentNumber}</div>
                      </TableCell>
                      <TableCell>{employee?.name || 'Unknown Employee'}</TableCell>
                      <TableCell>
                        <div>{format(new Date(doc.createdAt), 'dd MMM yyyy')}</div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {priority === "high" ? (
                          <Badge variant="destructive">High</Badge>
                        ) : priority === "medium" ? (
                          <Badge variant="outline" className="bg-yellow-50 border-yellow-200 text-yellow-700">
                            Medium
                          </Badge>
                        ) : (
                          <Badge variant="outline">Low</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 cursor-pointer">
                            Verify API
                          </Badge>
                          <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 cursor-pointer">
                            Verify Manual
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h3 className="mt-4 text-lg font-medium">All Caught Up!</h3>
              <p className="mt-1 text-sm text-gray-500">No documents pending verification.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Activity Map (simplified for demo) */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, index) => {
              // Randomly generate activity levels for the heatmap
              const activityLevel = Math.floor(Math.random() * 5); // 0-4
              
              return (
                <div 
                  key={index} 
                  className={`h-8 rounded ${
                    activityLevel === 0 ? 'bg-gray-100' :
                    activityLevel === 1 ? 'bg-blue-100' :
                    activityLevel === 2 ? 'bg-blue-200' :
                    activityLevel === 3 ? 'bg-blue-300' :
                    'bg-blue-400'
                  }`}
                  title={`${activityLevel} verifications`}
                ></div>
              );
            })}
          </div>
          <div className="flex justify-end items-center gap-2 mt-2 text-xs text-gray-500">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>None</span>
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Low</span>
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <span>Medium</span>
            <div className="w-3 h-3 bg-blue-300 rounded"></div>
            <span>High</span>
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <span>Very High</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ActivityItemProps {
  document: VerificationDocument;
  employee: any; // Should be the Employee type from your system
}

const ActivityItem = ({ document, employee }: ActivityItemProps) => {
  const documentTypeNames: Record<string, string> = {
    'aadhar': 'Aadhar Card',
    'pan': 'PAN Card',
    'driving_license': 'Driving License',
    'passport': 'Passport',
    'voter_id': 'Voter ID',
    'bank_account': 'Bank Account',
    'other': 'Other'
  };
  
  return (
    <div className="flex items-start space-x-4 py-3 border-b border-gray-100 last:border-none">
      <div className={`p-2 rounded-full flex-shrink-0 ${
        document.verificationStatus === 'verified' 
          ? 'bg-green-100'
          : 'bg-red-100'
      }`}>
        {document.verificationStatus === 'verified' ? (
          <FileCheck className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-900">
            {document.verificationStatus === 'verified' ? 'Verified' : 'Verification Failed'}
          </p>
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(document.verificationDate!), { addSuffix: true })}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mt-1">
          {documentTypeNames[document.documentType] || document.documentType} for {employee?.name || 'Unknown Employee'}
        </p>
        
        <div className="flex items-center mt-2 gap-2">
          <Badge 
            variant="outline" 
            className={`text-xs ${
              document.verificationMethod === 'api'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-purple-50 border-purple-200 text-purple-700'
            }`}
          >
            {document.verificationMethod === 'api' ? (
              <>
                <Shield className="h-3 w-3 mr-1" />
                API Verification
              </>
            ) : (
              <>
                <Shield className="h-3 w-3 mr-1" />
                Manual Verification
              </>
            )}
          </Badge>
          
          {document.verificationNotes && (
            <span className="text-xs text-gray-500 truncate flex-1">
              {document.verificationNotes}
            </span>
          )}
          
          <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default RecentVerifications;
