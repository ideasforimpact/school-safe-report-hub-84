
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar } from 'lucide-react';
import { Employee } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import BackofficeDocumentCard from './BackofficeDocumentCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { File, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

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

  const handleOpenFiles = (document: any) => {
    setSelectedDoc(document);
    setFilesDialogOpen(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (file: { objectPath: string; fileName: string }) => {
    try {
      const signed = await supabase.storage
        .from('employee_other_documents')
        .createSignedUrl(file.objectPath, 300, { download: file.fileName });
      if (signed.error || !signed.data?.signedUrl) throw new Error('Failed to generate download URL');
      window.open(signed.data.signedUrl, '_blank');
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || 'Failed to download file', variant: 'destructive' });
    }
  };

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
                onOpenFiles={handleOpenFiles}
              />
            ))}
          </div>
        )}
      </CardContent>
      {/* View-Only Files Dialog */}
      <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Files</DialogTitle>
          </DialogHeader>
          {Array.isArray(selectedDoc?.documents_files) && selectedDoc.documents_files.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedDoc.documents_files.map((f: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.fileName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(f.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="ghost" size="sm" title="Download file" onClick={() => handleDownload(f)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4">No files available.</p>
          )}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setFilesDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BackofficeDocumentsList;
