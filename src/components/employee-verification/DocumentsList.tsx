
import React, { useState } from 'react';
import { useEmployeeVerification } from '@/contexts/EmployeeVerificationContext';
import DocumentCard from './DocumentCard';
import { FileX, CheckCircle, AlertCircle, Clock, Upload, ShieldCheck, ShieldX } from 'lucide-react';
import VerificationStatusBadge from './VerificationStatusBadge';
import { VerificationDocumentType } from '@/types/employeeVerification';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface DocumentsListProps {
  employeeId: string;
  onAddDocument: () => void;
}

// Helper function to get document type display name
const getDocumentTypeLabel = (type: VerificationDocumentType) => {
  switch (type) {
    case 'aadhar': return 'Aadhar Card';
    case 'pan': return 'PAN Card';
    case 'driving_license': return 'Driving License';
    case 'passport': return 'Passport';
    case 'voter_id': return 'Voter ID';
    case 'bank_account': return 'Bank Account';
    case 'other': return 'Other Document';
    default: return type;
  }
};

const DocumentsList: React.FC<DocumentsListProps> = ({ employeeId, onAddDocument }) => {
  const { getEmployeeDocuments } = useEmployeeVerification();
  const documents = getEmployeeDocuments(employeeId);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // All possible document types
  const allDocumentTypes: VerificationDocumentType[] = [
    'aadhar', 'pan', 'driving_license', 'passport', 'voter_id', 'bank_account', 'other'
  ];

  // Create a map of document types to their verification status
  const documentStatusMap = new Map<VerificationDocumentType, {
    status: 'verified' | 'failed' | 'pending' | 'missing',
    document?: any
  }>();
  
  // Initialize all document types as missing
  allDocumentTypes.forEach(type => {
    documentStatusMap.set(type, { status: 'missing' });
  });
  
  // Update with actual document statuses
  documents.forEach(doc => {
    documentStatusMap.set(doc.documentType, {
      status: doc.verificationStatus,
      document: doc
    });
  });

  // Count documents by status
  const pendingCount = documents.filter(doc => doc.verificationStatus === 'pending').length;
  const verifiedCount = documents.filter(doc => doc.verificationStatus === 'verified').length;
  const failedCount = documents.filter(doc => doc.verificationStatus === 'failed').length;
  
  // Count by verification method
  const apiVerifiedCount = documents.filter(doc => 
    doc.verificationStatus === 'verified' && doc.verificationMethod === 'api'
  ).length;
  const manualVerifiedCount = documents.filter(doc => 
    doc.verificationStatus === 'verified' && doc.verificationMethod === 'manual'
  ).length;

  if (documents.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-8 text-left">
        <div className="flex flex-col items-center md:items-start md:flex-row gap-4">
          <div className="p-4 bg-white rounded-full shadow-sm">
            <FileX className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-1">No Documents Found</h3>
            <p className="text-gray-500">
              No verification documents have been added for this employee yet.
            </p>
            <Button 
              className="mt-4 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700"
              onClick={onAddDocument}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload First Document
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div className="bg-gradient-to-br from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Verification Status Overview</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-3 py-1 text-sm">
            Total: {documents.length}
          </div>
          <div className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-md px-3 py-1 text-sm">
            Pending: {pendingCount}
          </div>
          <div className="bg-green-50 text-green-700 border border-green-200 rounded-md px-3 py-1 text-sm flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Verified: {verifiedCount}
          </div>
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-1 text-sm">
            Failed: {failedCount}
          </div>
        </div>

        {verifiedCount > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-3 py-1 text-sm flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Auto-verified: {apiVerifiedCount}
            </div>
            <div className="bg-purple-50 text-purple-700 border border-purple-200 rounded-md px-3 py-1 text-sm flex items-center gap-1">
              <ShieldX className="h-3.5 w-3.5" />
              Manually verified: {manualVerifiedCount}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from(documentStatusMap.entries()).map(([type, { status }]) => (
            <div 
              key={type} 
              className={`p-4 rounded-lg border flex items-center justify-between transition-all 
                ${status === 'verified' ? 'bg-green-50 border-green-200' : 
                status === 'failed' ? 'bg-red-50 border-red-200' : 
                status === 'pending' ? 'bg-yellow-50 border-yellow-200' : 
                'bg-gray-50 border-gray-200'}`}
            >
              <div className="flex items-center">
                {status === 'verified' && <CheckCircle className="h-5 w-5 text-green-600 mr-2" />}
                {status === 'failed' && <AlertCircle className="h-5 w-5 text-red-600 mr-2" />}
                {status === 'pending' && <Clock className="h-5 w-5 text-yellow-600 mr-2" />}
                {status === 'missing' && <FileX className="h-5 w-5 text-gray-400 mr-2" />}
                <span className="font-medium">{getDocumentTypeLabel(type)}</span>
              </div>
              {status !== 'missing' ? (
                <VerificationStatusBadge status={status} />
              ) : (
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Not Uploaded</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            variant={viewMode === 'cards' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('cards')}
          >
            Card View
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('table')}
          >
            Table View
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 bg-gray-100 p-1 w-full justify-start">
          <TabsTrigger value="all">All Documents ({documents.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="verified">Verified ({verifiedCount})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedCount})</TabsTrigger>
        </TabsList>
        
        {viewMode === 'cards' ? (
          <>
            <TabsContent value="all" className="animate-in fade-in mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {documents.map((document) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="pending" className="animate-in fade-in mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {documents.filter(doc => doc.verificationStatus === 'pending').map((document) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="verified" className="animate-in fade-in mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {documents.filter(doc => doc.verificationStatus === 'verified').map((document) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="failed" className="animate-in fade-in mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {documents.filter(doc => doc.verificationStatus === 'failed').map((document) => (
                  <DocumentCard key={document.id} document={document} />
                ))}
              </div>
            </TabsContent>
          </>
        ) : (
          <>
            <TabsContent value="all" className="animate-in fade-in mt-0">
              <DocumentsTable documents={documents} />
            </TabsContent>
            
            <TabsContent value="pending" className="animate-in fade-in mt-0">
              <DocumentsTable documents={documents.filter(doc => doc.verificationStatus === 'pending')} />
            </TabsContent>
            
            <TabsContent value="verified" className="animate-in fade-in mt-0">
              <DocumentsTable documents={documents.filter(doc => doc.verificationStatus === 'verified')} />
            </TabsContent>
            
            <TabsContent value="failed" className="animate-in fade-in mt-0">
              <DocumentsTable documents={documents.filter(doc => doc.verificationStatus === 'failed')} />
            </TabsContent>
          </>
        )}
      </Tabs>

      <div className="flex justify-center mt-8">
        <Button 
          onClick={onAddDocument}
          className="bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary-700"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload New Document
        </Button>
      </div>
    </div>
  );
};

const DocumentsTable: React.FC<{ documents: any[] }> = ({ documents }) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Type</TableHead>
            <TableHead>Document Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Verification Method</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map(doc => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">{getDocumentTypeLabel(doc.documentType)}</TableCell>
              <TableCell>{doc.documentNumber || '-'}</TableCell>
              <TableCell><VerificationStatusBadge status={doc.verificationStatus} /></TableCell>
              <TableCell>
                {doc.verificationStatus === 'verified' && doc.verificationMethod ? (
                  doc.verificationMethod === 'api' ? (
                    <div className="flex items-center text-blue-600">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      <span>Auto</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-purple-600">
                      <ShieldX className="h-3.5 w-3.5 mr-1" />
                      <span>Manual</span>
                    </div>
                  )
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{doc.verificationDate ? new Date(doc.verificationDate).toLocaleDateString() : '-'}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DocumentsList;
