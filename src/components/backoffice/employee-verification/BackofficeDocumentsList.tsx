
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

  // Get the "Manual" document type ID
  const manualDocumentType = documentTypes.find(type => type.name.toLowerCase() === 'manual');
  const manualDocumentTypeId = manualDocumentType?.id;

  // Debug logging
  console.log('🔍 BackofficeDocumentsList Debug:', {
    documentTypes: documentTypes,
    manualDocumentType,
    manualDocumentTypeId,
    employeeDocuments: employee.documents,
    employeeId: employee.id
  });

  useEffect(() => {
    console.log('🔄 BackofficeDocumentsList: Fetching document types...');
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  useEffect(() => {
    filterDocuments();
  }, [timeFilter, employee.documents, manualDocumentTypeId]);

  const toTitleCase = (value: string) => {
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const filterDocuments = () => {
    const documents = employee.documents || [];
    const now = new Date();
    
    console.log('🔍 Filtering documents:', {
      totalDocuments: documents.length,
      manualDocumentTypeId,
      documentTypes: documentTypes.map(t => ({ id: t.id, name: t.name }))
    });
    
    // First filter by document type (only "Manual" documents)
    let filtered = documents.filter(doc => {
      console.log('🔍 Checking document:', {
        docId: doc.id,
        docTypeId: doc.documentTypeId,
        docTypeName: doc.documentTypeName,
        matchesManualId: manualDocumentTypeId ? doc.documentTypeId === manualDocumentTypeId : false
      });
      
      if (manualDocumentTypeId) {
        return doc.documentTypeId === manualDocumentTypeId;
      }
      // Fallback: filter by document type name if ID not found
      const docType = documentTypes.find(type => type.id === doc.documentTypeId);
      const matchesByName = docType?.name.toLowerCase() === 'manual';
      const matchesByDocName = doc.documentTypeName?.toLowerCase() === 'manual';
      
      console.log('🔍 Document type matching:', {
        docType,
        matchesByName,
        matchesByDocName,
        finalMatch: matchesByName || matchesByDocName
      });
      
      return matchesByName || matchesByDocName;
    });
    
    // Then filter by time
    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(doc => {
          const docDate = new Date(doc.createdAt);
          return docDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        filtered = filtered.filter(doc => {
          const docDate = new Date(doc.createdAt);
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return docDate >= weekAgo;
        });
        break;
      case 'month':
        filtered = filtered.filter(doc => {
          const docDate = new Date(doc.createdAt);
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return docDate >= monthAgo;
        });
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    setFilteredDocuments(filtered);
  };

  const getDocumentTypeName = (documentTypeId: string) => {
    const docType = documentTypes.find(type => type.id === documentTypeId);
    return docType?.name || 'Unknown Document Type';
  };

  // Compute a display-friendly document type name for manual docs
  const getDisplayDocumentTypeName = (doc: Employee['documents'][number]) => {
    const baseName = getDocumentTypeName(doc.documentTypeId);
    if (baseName.toLowerCase() === 'manual') {
      const params: any = doc.params || {};
      const custom = params.document_name || params.otherType || params.selected;
      if (typeof custom === 'string' && custom.trim().length > 0) {
        return toTitleCase(custom.trim());
      }
    }
    return baseName;
  };

  const getDocumentCounts = () => {
    // Count only "Manual" documents
    const manualDocuments = (employee.documents || []).filter(doc => {
      if (manualDocumentTypeId) {
        return doc.documentTypeId === manualDocumentTypeId;
      }
      const docType = documentTypes.find(type => type.id === doc.documentTypeId);
      const matchesByName = docType?.name.toLowerCase() === 'manual';
      const matchesByDocName = doc.documentTypeName?.toLowerCase() === 'manual';
      return matchesByName || matchesByDocName;
    });
    
    const verified = manualDocuments.filter(doc => doc.verificationStatus === 'verified').length;
    const completed = manualDocuments.filter(doc => doc.verificationStatus === 'completed').length;
    const pending = manualDocuments.filter(doc => doc.verificationStatus === 'pending').length;
    const inProgress = manualDocuments.filter(doc => doc.verificationStatus === 'in-progress').length;
    const failed = manualDocuments.filter(doc => doc.verificationStatus === 'failed').length;
    const rejected = manualDocuments.filter(doc => doc.verificationStatus === 'rejected').length;
    const total = manualDocuments.length;
    
    return { verified, completed, pending, inProgress, failed, rejected, total };
  };

  const counts = getDocumentCounts();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <div>
              <CardTitle>Manual Document Verification</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {counts.total} documents • {counts.completed} completed • {counts.inProgress} in-progress • {counts.pending} pending • {counts.rejected} rejected
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
              {timeFilter === 'all' ? 'No Manual Documents Available' : 'No Manual Documents in Selected Timeframe'}
            </h3>
            <p className="text-gray-500">
              {timeFilter === 'all' 
                ? 'This employee has not uploaded any "Manual" type verification documents yet.'
                : `No "Manual" type documents were uploaded in the selected timeframe (${timeFilter}).`}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredDocuments.map((document) => (
              <BackofficeDocumentCard
                key={document.id}
                document={document}
                documentTypeName={getDisplayDocumentTypeName(document)}
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
