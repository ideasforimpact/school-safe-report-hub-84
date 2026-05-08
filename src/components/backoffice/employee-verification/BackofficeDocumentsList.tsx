
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Calendar, Search, X } from 'lucide-react';
import { Employee } from '@/types/employeeVerification';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import BackofficeDocumentCard from './BackofficeDocumentCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { File, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';

interface BackofficeDocumentsListProps {
  employee: Employee;
  onRefresh: () => void;
  isReadOnly?: boolean;
}

const BackofficeDocumentsList: React.FC<BackofficeDocumentsListProps> = ({ 
  employee, 
  onRefresh,
  isReadOnly = false
}) => {
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
  const [verificationFilter, setVerificationFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); 
  const hasActiveFilters =
    verificationFilter !== "all" ||
    searchTerm.trim().length > 0 ||
    (dateRange?.from != null || dateRange?.to != null);
  useEffect(() => {
    console.log('🔄 BackofficeDocumentsList: Fetching document types...');
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  useEffect(() => {
    filterDocuments();
  }, [employee.documents, manualDocumentTypeId, verificationFilter, searchTerm, dateRange]);
  
  useEffect(() => {
    if (!employee?.id) return;

    const channel = supabase
      .channel(`backoffice-employee-docs-${employee.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'employee_documents',
          filter: `employee_id=eq.${employee.id}`
        },
        async (payload) => {
          console.log('📡 BackofficeDocumentsList: employee_documents change detected:', payload);
          // When any doc changes for this employee, ask parent to refetch
          onRefresh();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from backoffice-employee-docs channel');
      supabase.removeChannel(channel);
    };
  }, [employee.id, onRefresh]);

  const toTitleCase = (value: string) => {
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const isManualOrFailedDocument = (doc: Employee['documents'][number]) => {
    const docType = documentTypes.find(type => type.id === doc.documentTypeId);
    const resolvedDocTypeName = (docType?.name || doc.documentTypeName || '').toLowerCase();

    const isManual =
      (manualDocumentTypeId ? doc.documentTypeId === manualDocumentTypeId : resolvedDocTypeName === 'manual');
    const isFinalized = (doc.verificationStatus === 'verified' || doc.verificationStatus === 'completed') ;
    const isManualsubmitDoc = doc.documentStatusName == 'manual';
    if (!isManual && isFinalized && !isManualsubmitDoc) return false;
    if (doc?.verificationStatus == "in-progress" || doc?.verificationStatus == "completed" ) {
      const StatusTypes = new Set(['pan', 'passport', 'aadhar', 'driving_license', 'voter_id']);
      const isStatusEligible = StatusTypes.has(resolvedDocTypeName);
      return  isStatusEligible || isManual;
    }
    return false;
  };

  const filterDocuments = () => {
    const documents = employee.documents || [];
    let filtered = documents.filter(isManualOrFailedDocument);
    if (verificationFilter !== 'all') {
      filtered = filtered.filter(doc => {
        const params: any = doc.params || {};
        const manualType =
          params.otherType ||
          params.document_name ||
          params.selected;

        const standardType = (doc.documentTypeName || '').toLowerCase();

        const docType = documentTypes.find(t => t.id === doc.documentTypeId);
        const mappedType = (docType?.name || '').toLowerCase();

        return (
          manualType === verificationFilter ||
          standardType === verificationFilter ||
          mappedType === verificationFilter
        );
      });
    }

    if (dateRange?.from || dateRange?.to) {
      const from = dateRange.from ? new Date(dateRange.from) : null;
      const to = dateRange.to ? new Date(dateRange.to) : null;

      filtered = filtered.filter(doc => {
        const docDate = new Date(doc.createdAt);
        if (isNaN(docDate.getTime())) return false;

        if (from && docDate < from) return false;
        if (to) {
          const endOfTo = new Date(to);
          endOfTo.setHours(23, 59, 59, 999);
          if (docDate > endOfTo) return false;
        }
        return true;
      });
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();

      filtered = filtered.filter(doc => {
        const displayName = getDisplayDocumentTypeName(doc).toLowerCase();
        const standardType = (doc.documentTypeName || '').toLowerCase();
        const docType = documentTypes.find(t => t.id === doc.documentTypeId);
        const mappedType = (docType?.name || '').toLowerCase();
        const id = String(doc.id ?? '').toLowerCase();
        const params: any = doc.params || {};
        const custom = (
          params.document_name ||
          params.otherType ||
          params.selected ||
          ''
        )
          .toString()
          .toLowerCase();
        return (
            displayName.includes(term) ||
            id.includes(term) ||
            custom.includes(term) ||
            standardType.includes(term) ||
            mappedType.includes(term)
        );
      });
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
    // Count manual documents and failed passports
    const manualAndFailedDocuments = (employee.documents || []).filter(isManualOrFailedDocument);
    
    const verified = manualAndFailedDocuments.filter(doc => doc.verificationStatus === 'verified').length;
    const completed = manualAndFailedDocuments.filter(doc => doc.verificationStatus === 'completed').length;
    const pending = manualAndFailedDocuments.filter(doc => doc.verificationStatus === 'pending').length;
    const inProgress = manualAndFailedDocuments.filter(doc => doc.verificationStatus === 'in-progress').length;
    const failed = manualAndFailedDocuments.filter(doc => doc.verificationStatus === 'failed').length;
    const rejected = manualAndFailedDocuments.filter(doc => doc.verificationStatus === 'rejected').length;
    const total = manualAndFailedDocuments.length;
    
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
  const VERIFICATION_TYPES = [
    { value: "bank_statement_analysis", label: "Bank Statement Analysis" },
    { value: "court_case_check", label: "Court Case Check" },
    { value: "police_verification", label: "Police Verification" },
    { value: "digital_credibility_check", label: "Digital Credibility Check" },
    { value: "social_personal_check", label: "Social Personal Check" },
    { value: "drug_check", label: "Drug Check" },
    { value: "aadhar", label: "Aadhar Card" },
    { value: "voter_id", label: "Voter ID" },
    { value: "pan", label: "PAN Card" },
    { value: "driving_license", label: "Driving License" },
    { value: "passport", label: "Passport" },
  ];

  
 
  return (
    <Card>
     <CardHeader>
        <div className="flex flex-col gap-4">  
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Document Verification</CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-4">

            <div className="w-64">
              <Select
                value={verificationFilter}
                onValueChange={setVerificationFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Verification Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verification Types</SelectItem>
                  {VERIFICATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Picker */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Date Range:</span>
              <DatePickerWithRange
                date={dateRange}
                onChange={setDateRange}
                className="w-[280px]"
              />
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-8 w-48 md:w-72"
                placeholder="Search by Document name / ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Clear Button */}
            {hasActiveFilters && (
              <Button
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setVerificationFilter("all");
                  setSearchTerm("");
                  setDateRange(undefined);
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No documents match the selected filters.
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
                isReadOnly={isReadOnly}
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
