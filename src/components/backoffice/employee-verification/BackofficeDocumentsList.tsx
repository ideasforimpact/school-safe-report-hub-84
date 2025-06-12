
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar } from 'lucide-react';
import { Employee } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import BackofficeDocumentCard from './BackofficeDocumentCard';

interface BackofficeDocumentsListProps {
  employee: Employee;
  onRefresh: () => void;
}

const BackofficeDocumentsList: React.FC<BackofficeDocumentsListProps> = ({ 
  employee, 
  onRefresh 
}) => {
  const [timeFilter, setTimeFilter] = useState('all');
  const [filteredDocuments, setFilteredDocuments] = useState(employee.documents || []);
  const { documentTypes, fetchDocumentTypes } = useEmployeeVerification();

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  useEffect(() => {
    filterDocuments();
  }, [timeFilter, employee.documents]);

  const filterDocuments = () => {
    const documents = employee.documents || [];
    const now = new Date();
    
    let filtered = documents;
    
    switch (timeFilter) {
      case 'today':
        filtered = documents.filter(doc => {
          const docDate = new Date(doc.createdAt);
          return docDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        filtered = documents.filter(doc => {
          const docDate = new Date(doc.createdAt);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return docDate >= weekAgo;
        });
        break;
      case 'month':
        filtered = documents.filter(doc => {
          const docDate = new Date(doc.createdAt);
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return docDate >= monthAgo;
        });
        break;
      default:
        filtered = documents;
    }
    
    setFilteredDocuments(filtered);
  };

  const getDocumentTypeName = (documentTypeId: string) => {
    const docType = documentTypes.find(type => type.id === documentTypeId);
    return docType?.name || 'Unknown Document Type';
  };

  const getDocumentCounts = () => {
    const documents = employee.documents || [];
    const verified = documents.filter(doc => doc.verificationStatus === 'verified').length;
    const pending = documents.filter(doc => doc.verificationStatus === 'pending').length;
    const failed = documents.filter(doc => doc.verificationStatus === 'failed').length;
    const total = documents.length;
    
    return { verified, pending, failed, total };
  };

  const counts = getDocumentCounts();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle>Documents & Verification</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {counts.total} documents • {counts.verified} verified • {counts.pending} pending • {counts.failed} failed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {timeFilter === 'all' ? 'No Documents Available' : 'No Documents in Selected Timeframe'}
            </h3>
            <p className="text-gray-500">
              {timeFilter === 'all' 
                ? 'This employee has not uploaded any verification documents yet.'
                : `No documents were uploaded in the selected timeframe (${timeFilter}).`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredDocuments.map((document) => (
              <BackofficeDocumentCard
                key={document.id}
                document={document}
                documentTypeName={getDocumentTypeName(document.documentTypeId)}
                employee={employee}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackofficeDocumentsList;
