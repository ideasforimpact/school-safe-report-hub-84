
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Filter, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { addMonths, format, isPast, isWithinInterval, subDays } from 'date-fns';

const DocumentExpiryAlerts = () => {
  const { documents, employees, getEmployee } = useEmployeeVerification();
  
  // For demonstration purposes, let's simulate some documents with expiry dates
  // In a real application, this would come from the actual document data
  const expiryAlerts = documents.map(doc => {
    const employee = getEmployee(doc.employeeId);
    
    // Generate a simulated expiry date based on the document creation date
    // Different document types have different validity periods
    let expiryDate;
    const creationDate = new Date(doc.createdAt);
    
    switch (doc.documentTypeName) {
      case 'aadhar':
        // Aadhar doesn't expire, but let's say we need to re-verify periodically
        expiryDate = addMonths(creationDate, 60); // 5 years
        break;
      case 'pan':
        // PAN doesn't expire, but let's say we need to re-verify
        expiryDate = addMonths(creationDate, 60); // 5 years
        break;
      case 'driving_license':
        expiryDate = addMonths(creationDate, 36); // 3 years
        break;
      case 'passport':
        expiryDate = addMonths(creationDate, 120); // 10 years
        break;
      case 'voter_id':
        // Voter ID doesn't expire, but let's say we need to re-verify
        expiryDate = addMonths(creationDate, 60); // 5 years
        break;
      case 'bank_account':
        // Bank account details should be verified regularly
        expiryDate = addMonths(creationDate, 24); // 2 years
        break;
      default:
        expiryDate = addMonths(creationDate, 12); // 1 year
    }
    
    // Randomly make some documents expired or about to expire for the demo
    const randomAdjustment = Math.floor(Math.random() * 4);
    if (randomAdjustment === 0) {
      expiryDate = subDays(new Date(), Math.floor(Math.random() * 30)); // Expired
    } else if (randomAdjustment === 1) {
      expiryDate = addMonths(new Date(), Math.floor(Math.random() * 2) + 1); // Expiring soon
    }
    
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
      id: doc.id,
      employeeId: doc.employeeId,
      employeeName: employee?.name || 'Unknown Employee',
      documentType: documentTypeNames[doc.documentTypeName || ''] || doc.documentTypeName,
      documentNumber: doc.documentNumber,
      expiryDate,
      status: isPast(expiryDate) ? 'expired' : 
        isWithinInterval(expiryDate, {
          start: new Date(), 
          end: addMonths(new Date(), 3)
        }) ? 'expiring-soon' : 'active'
    };
  });
  
  // Filter alerts to show expired and expiring soon documents
  const priorityAlerts = expiryAlerts.filter(
    alert => alert.status === 'expired' || alert.status === 'expiring-soon'
  ).slice(0, 10); // Show only top 10 for demo
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Document Expiry Alerts</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {priorityAlerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Document Number</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {priorityAlerts.map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell className="font-medium">{alert.employeeName}</TableCell>
                    <TableCell>{alert.documentType}</TableCell>
                    <TableCell>{alert.documentNumber}</TableCell>
                    <TableCell>{format(alert.expiryDate, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      {alert.status === 'expired' ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <XCircle className="h-3 w-3" />
                          <span>Expired</span>
                        </Badge>
                      ) : alert.status === 'expiring-soon' ? (
                        <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Expiring Soon</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          <span>Active</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        Send Alert
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        Request Renewal
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 opacity-50" />
              <h3 className="mt-4 text-lg font-medium">No Document Alerts</h3>
              <p className="mt-1 text-sm text-gray-500">All documents are currently valid.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Risk Assessment Section */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
              <h3 className="text-lg font-medium text-green-700 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                <span>Low Risk</span>
              </h3>
              <p className="text-2xl font-bold mt-2">
                {expiryAlerts.filter(a => a.status === 'active').length}
              </p>
              <p className="text-sm text-green-600 mt-1">Active documents</p>
            </div>
            
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
              <h3 className="text-lg font-medium text-yellow-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Medium Risk</span>
              </h3>
              <p className="text-2xl font-bold mt-2">
                {expiryAlerts.filter(a => a.status === 'expiring-soon').length}
              </p>
              <p className="text-sm text-yellow-600 mt-1">Expiring soon</p>
            </div>
            
            <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
              <h3 className="text-lg font-medium text-red-700 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                <span>High Risk</span>
              </h3>
              <p className="text-2xl font-bold mt-2">
                {expiryAlerts.filter(a => a.status === 'expired').length}
              </p>
              <p className="text-sm text-red-600 mt-1">Expired documents</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-base font-medium mb-2">Compliance Score</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-green-200 text-green-700">
                    {Math.round((expiryAlerts.filter(a => a.status === 'active').length / expiryAlerts.length) * 100)}%
                  </span>
                </div>
              </div>
              <div className="flex h-2 overflow-hidden text-xs bg-green-100 rounded-full">
                <div 
                  style={{ width: `${(expiryAlerts.filter(a => a.status === 'active').length / expiryAlerts.length) * 100}%` }} 
                  className="flex flex-col justify-center text-center text-white bg-green-500 shadow-none whitespace-nowrap"
                ></div>
                <div 
                  style={{ width: `${(expiryAlerts.filter(a => a.status === 'expiring-soon').length / expiryAlerts.length) * 100}%` }} 
                  className="flex flex-col justify-center text-center text-white bg-yellow-500 shadow-none whitespace-nowrap"
                ></div>
                <div 
                  style={{ width: `${(expiryAlerts.filter(a => a.status === 'expired').length / expiryAlerts.length) * 100}%` }} 
                  className="flex flex-col justify-center text-center text-white bg-red-500 shadow-none whitespace-nowrap"
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentExpiryAlerts;
