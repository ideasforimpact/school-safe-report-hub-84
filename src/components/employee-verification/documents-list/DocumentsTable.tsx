
import React, { useEffect, useState } from 'react';
import { Eye, Download, MessageCircle, FileSearch, MoreVertical, Trash, Loader2, Wrench, User, Clock, File, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import GovernmentEmblemIcon from '@/components/ui/GovernmentEmblemIcon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationDocument } from '@/types/employeeVerification';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { getDocumentIcon, formatDocumentTypeName, getManualVerificationDisplayName } from '../utils/documentUtils';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { useToast } from '@/hooks/use-toast';
import {formatDate} from '@/lib/Dateformat';
import { formatSupabaseUrl, isPdfFile } from '@/types/fileTypes';
import BankStatementDetailsDialog from '../document-card/BankStatementDetailsDialog';
import DocumentCommentsDialog from '../DocumentCommentsDialog';
import FilesDialog from '../form/FilesDialog';
import { useAuth } from '@/contexts/AuthContext';
import GovernmentVerificationPopup, { GovernmentDocumentType } 
from '../document-card/GovernmentVerificationPopup';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
interface DocumentsTableProps {
  documents: VerificationDocument[];
  onViewDocument: (documentImage: string) => void;
  onDownloadDocument: (documentImage: string) => void;
  onVerifyDocument: (documentId: string) => void;
  onDocumentAction?: () => void;
  onQuickVerify?: (documentId: string, method: 'api' | 'manual') => void;
  onViewGovernment?: (doc: VerificationDocument) => void;
  isReadOnly?: boolean;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
  documents,
  onViewDocument,
  onDownloadDocument,
  onVerifyDocument,
  onDocumentAction,
  onQuickVerify,
  onViewGovernment,
  isReadOnly = false,
}) => {
  const { documentStatuses, deleteDocument, employees, fetchEmployeeDocuments } = useEmployeeVerification();
  const { toast } = useToast();
  const { user } = useAuth();
  const clientId = (user as any)?.client_id || (user as any)?.clientId || '';
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State for Files dialog
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [selectedVerificationType, setSelectedVerificationType] = useState<string>('police');
  const [bankStatementDialogOpen, setBankStatementDialogOpen] = React.useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = React.useState(false);
  const [selectedBankStatementDetails, setSelectedBankStatementDetails] = React.useState<any>(null);
  const [selectedVerificationHistory, setSelectedVerificationHistory] = React.useState<any[]>([]);
  const [filesCountOverrides, setFilesCountOverrides] = useState<Record<string, number>>({});

  const [govPopupOpen, setGovPopupOpen] = useState(false);
  const [selectedGovType, setSelectedGovType] =
    useState<GovernmentDocumentType>("driving_license");
  const [selectedGovData, setSelectedGovData] = useState<any>(null);

  const parseDoe = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3 && parts[0].length <= 2) {
      const [d, m, y] = parts.map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(dateStr);
  };

  const getDrivingLicenseDoe = (doc: VerificationDocument): string | undefined => {
    const govLog = doc.employee_docs_log?.find(log =>
      log.response && (log.response.success === true || log.response.status_code === 200)
    );
    if (!govLog) return undefined;
    const raw = govLog.response?.data;
    const data = raw?.data?.data || raw?.data || raw;
    return data?.doe;
  };

  // Log documents for debugging
  console.log('DocumentsTable - All documents:', documents);
  
  useEffect(() => {
    console.log('DocumentsTable - Documents with driving license:', 
      documents.filter(doc => doc.documentTypeName?.toLowerCase().includes('driving')));
  }, [documents]);

  // Function to sort documents by verification status priority
  const sortDocumentsByStatus = (docs: VerificationDocument[]): VerificationDocument[] => {
    const statusPriority = {
      'pending': 1,
      'in-progress': 2,
      'verified': 3,
      'completed': 4,
      'failed': 5,
      'rejected': 6
    };

    return [...docs].sort((a, b) => {
      const priorityA = statusPriority[a.verificationStatus] || 999;
      const priorityB = statusPriority[b.verificationStatus] || 999;
      
      // If same priority, sort by creation date (newest first)
      if (priorityA === priorityB) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      
      return priorityA - priorityB;
    });
  };

  const handleFilesClick = (documentId: string, employeeId: string, files: any[]) => {
    const doc = documents.find(d => d.id === documentId);
    const verificationType = (doc?.params as any)?.selected || 'manual';
    setSelectedDocumentId(documentId);
    setSelectedEmployeeId(employeeId);
    setSelectedFiles(files);
    setSelectedVerificationType(verificationType);
    setFilesDialogOpen(true);
  };

  const handleFilesDialogRefresh = async () => {
    if (selectedEmployeeId) {
      await fetchEmployeeDocuments(selectedEmployeeId);
      if (onDocumentAction) onDocumentAction();
    }
  };

  const handleFilesDialogClosed = (documentId: string, filesCount: number) => {
    setFilesCountOverrides((prev) => ({ ...prev, [documentId]: filesCount }));
  };

  const handleViewDocument = (documentImage: string) => {
    if (!documentImage) {
      toast({
        title: "No Document",
        description: "No document image available to view.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedUrl = formatSupabaseUrl(documentImage);
      console.log('Opening document URL for viewing:', formattedUrl);
      
      // Check if it's a PDF or image for proper viewing
      const isPdf = isPdfFile(formattedUrl);
      
      if (isPdf) {
        // For PDFs, open with PDF viewer controls
        const pdfViewerUrl = `${formattedUrl}#toolbar=1&navpanes=1&scrollbar=1`;
        window.open(pdfViewerUrl, '_blank', 'noopener,noreferrer');
      } else {
        // For images, open directly
        window.open(formattedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening document:', error);
      toast({
        title: "Error",
        description: "Failed to open document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDocument = (documentImage: string) => {
    if (!documentImage) {
      toast({
        title: "No Document",
        description: "No document available to download.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedUrl = formatSupabaseUrl(documentImage);
      console.log('Downloading document URL:', formattedUrl);
      
      // Use fetch to download the file and then create blob URL
      fetch(formattedUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `document-${Date.now()}`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the blob URL
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Download Started",
            description: "Document download has been initiated.",
          });
        })
        .catch(error => {
          console.error('Error downloading document:', error);
          
          // Fallback: try direct link download
          const link = document.createElement('a');
          link.href = formattedUrl;
          link.download = `document-${Date.now()}`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Download Started",
            description: "Document download has been initiated (fallback method).",
          });
        });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getDocumentStatusName = (document: VerificationDocument): string | undefined => {
    if (!document.documentStatusId || document.verificationStatus !== 'verified' || documentStatuses.length === 0) {
      return undefined;
    }
    
    const status = documentStatuses.find(s => s.id === document.documentStatusId);
    return status?.name;
  };

  const handleCommentsClick = (doc: VerificationDocument) => {
    console.log('DocumentsTable - Comments button clicked for document:', doc);
    
    // Get verification history from params
    const verificationHistory = (doc.params as any)?.verification_history || [];
    setSelectedVerificationHistory(verificationHistory);
    setSelectedDocumentId(doc.id);
    setCommentsDialogOpen(true);
    
    toast({
      title: "Viewing Comments",
      description: "Showing verification history and comments for this document."
    });
  };

// const handleBadgeClick = (doc: VerificationDocument) => {
//   console.log("Badge clicked:", doc);

//   const logs = doc.employee_docs_log || [];
//   const docType = doc.documentTypeName?.toLowerCase();

//   // Extract only government API response
//   const govLog = logs.find(
//     (log) =>
//       log.action?.includes("verify") &&
//       log.response &&
//       (log.response.success === true || log.response.status_code === 200)
//   );

//   if (!govLog) {
//     console.log("No Government API response found");
//     return;
//   }

//   // Government APIs return wrapped data
//   const governmentData = govLog.response?.data;

//   if (!governmentData) {
//     console.log("Government response has no data field");
//     return;
//   }

//   console.log("Government API Data:", governmentData);

//   setSelectedGovType(docType as GovernmentDocumentType);
//   setSelectedGovData(
//   normalizeApiData(governmentData, docType as GovernmentDocumentType),
//   );
//   setGovPopupOpen(true);
// };

  // Helper function to check if document has comments
  const hasVerificationHistory = (doc: VerificationDocument): boolean => {
    const verificationHistory = (doc.params as any)?.verification_history;
    return Array.isArray(verificationHistory) && verificationHistory.length > 0;
  };

  // Helper to get "Verified by" employee name using verifiedByEmployeeId
  const getVerifiedByName = (doc: VerificationDocument): string | undefined => {
    // First check if we have verifiedByEmployeeId (new system)
    if (doc.verifiedByEmployeeId && employees.length > 0) {
      const employee = employees.find(emp => emp.id === doc.verifiedByEmployeeId);
      if (employee) {
        const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.name || employee.email;
        return fullName.charAt(0).toUpperCase() + fullName.slice(1);
      }
    }
    
    // Fallback to verification history (old system)
    const history = (doc.params as any)?.verification_history;
    if (!Array.isArray(history) || history.length === 0) return undefined;
    const withUser = history.filter((e: any) => e && e.verified_by);
    if (withUser.length === 0) return undefined;
    withUser.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const verifiedBy = withUser[0].verified_by as string;
    return verifiedBy.charAt(0).toUpperCase() + verifiedBy.slice(1);
  };
  
  // Helper function to get proper document number display
  const getDisplayDocumentNumber = (doc: VerificationDocument): string => {
    const docType = doc.documentTypeName?.toLowerCase();
    
    if (docType === 'manual') {
      // For manual documents, show the proper verification name
      const selected = (doc.params as any)?.selected;
      return getManualVerificationDisplayName(selected) || 'Manual Verification';
    } else if (docType === 'other_documents' || docType === 'other') {
      // For other documents, show the document name provided during upload
      const documentName = (doc.params as any)?.document_name;
      return documentName || 'Other Document';
    } else {
      // For standard documents (Aadhar, PAN, etc.), show the document number
      return doc.documentNumber || '—';
    }
  };
  // Handle delete document
  const handleDeleteDocument = async (documentId: string) => {
    if (isReadOnly) return;
    try {
      setIsDeleting(true);
      await deleteDocument(documentId);
      toast({
        title: 'Document Deleted',
        description: 'The document has been deleted successfully.',
      });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      
      // Trigger document refetch after deletion
      if (onDocumentAction) {
        onDocumentAction();
      }
    } catch (error) {
      console.error("Error in handleDeleteDocument:", error);
      toast({
        title: 'Error',
        description: 'Failed to delete document.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Open delete confirmation dialog
  const openDeleteDialog = (documentId: string) => {
    if (isReadOnly) return;
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };
  
  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Type</TableHead>
              {/* <TableHead>Document #</TableHead> */}
              {/* <TableHead>Uploaded</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead className="w-80">Verified by</TableHead>
              <TableHead className="w-80 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortDocumentsByStatus(documents).map((doc) => {
              const statusName = getDocumentStatusName(doc);
              const hasLogs = !!doc.employee_docs_log && doc.employee_docs_log.length > 0;
              const isGovernanceVerified = doc.verificationStatus === 'verified' && statusName === 'governance';
              const docType = doc.documentTypeName?.toLowerCase();
              const showCommentsIcon = docType === 'other' && hasVerificationHistory(doc);
              const hasVerifyApi =
                onQuickVerify &&
                docType !== 'other' &&
                docType !== 'other_documents' &&
                docType !== 'manual';

              const hasVerifyManual =
                onQuickVerify && docType !== 'manual';
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(doc.documentTypeName || '')}
                      <span className="capitalize flex items-center gap-1 flex-wrap">
                        {(() => {
                          const docType = doc.documentTypeName?.toLowerCase();
                          if (docType === 'driving_license') {
                          const doe = getDrivingLicenseDoe(doc);

                         const today = new Date();
                          today.setHours(0, 0, 0, 0);

                          const expiryDate = parseDoe(doe);

                          const sixMonthsLater = new Date();
                          sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

                          const isExpired =
                            expiryDate ? expiryDate < today : false;

                          const isExpiringSoon =
                            expiryDate
                              ? expiryDate >= today && expiryDate <= sixMonthsLater
                              : false;

                          const isValid =
                            expiryDate ? expiryDate > sixMonthsLater : false;

                          const getMonthDiff = (from: Date, to: Date) =>
                            (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

                          const monthsExpired = isExpired && expiryDate ? getMonthDiff(expiryDate, today) : 0;
                          const monthsUntilExpiry = isExpiringSoon && expiryDate ? getMonthDiff(today, expiryDate) : 0;

                          return (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                                    <span>
                                      {formatDocumentTypeName(doc.documentTypeName || '')}
                                    </span>

                                    {doe && (
                                      <>
                                        {isExpired ? (
                                          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium">
                                            <XCircle className="h-4 w-4" />
                                            Expired
                                          </span>
                                        ) : isExpiringSoon ? (
                                          <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium">
                                            <AlertTriangle className="h-4 w-4" />
                                            Expiring Soon
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                                            <CheckCircle className="h-4 w-4" />
                                            Valid
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </span>
                                </TooltipTrigger>

                                <TooltipContent
                                  side="bottom"
                                  align="start"
                                  sideOffset={4}
                                  collisionPadding={16}
                                  className={`text-xs px-2 py-1 ${
                                    isExpired
                                      ? "bg-red-600 text-white"
                                      : isExpiringSoon
                                      ? "bg-yellow-500 text-white"
                                      : "bg-green-600 text-white"
                                  }`}
                                >
                                  {isExpired
                                    ? `Driving License Expired${monthsExpired > 0 ? ` · ${monthsExpired} month${monthsExpired > 1 ? "s" : ""} ago` : " · less than a month ago"}`
                                    : isExpiringSoon
                                    ? `Driving License Expiring Soon${monthsUntilExpiry > 0 ? ` · ${monthsUntilExpiry} month${monthsUntilExpiry > 1 ? "s" : ""} remaining` : " · less than a month remaining"}`
                                    : "Valid Driving License"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        }
                          // For manual and other document types, show the custom document name
                          if (docType === 'manual' || docType === 'other' || docType === 'other_documents') {
                            const customName = doc.params?.document_name;
                            if (customName) {
                              // For "other" document types, truncate display to 100 chars with tooltip
                              if (docType === 'other' || docType === 'other_documents') {
                                const truncated = customName.length > 100 
                                  ? `${customName.slice(0, 100)}...` 
                                  : customName;
                                return (
                                  <span 
                                    className="inline-block max-w-[380px] truncate align-middle"
                                    title={customName}
                                  >
                                    {truncated}
                                  </span>
                                );
                              }
                              return customName;
                            }
                            // For manual documents, show the verification type if available
                            if (docType === 'manual' && doc.params?.otherType) {
                              return doc.params.otherType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            }
                            // Check for 'selected' field (used in some edge functions)
                            if (docType === 'manual' && doc.params?.selected) {
                              return doc.params.selected.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            }
                            // Debug logging for manual documents
                            if (docType === 'manual') {
                              console.log('Manual document params:', {
                                id: doc.id,
                                params: doc.params,
                                otherType: doc.params?.otherType,
                                selected: doc.params?.selected,
                                hasOtherType: !!doc.params?.otherType,
                                hasSelected: !!doc.params?.selected,
                                valid:doc.audit?.responce.data.doe,
                                // Check all possible fields
                                allParamsKeys: Object.keys(doc.params || {}),
                                documentTypeName: doc.documentTypeName,
                                documentTypeId: doc.documentTypeId
                              });
                            }
                          }
                          // For other document types, show the standard document type name
                          return formatDocumentTypeName(doc.documentTypeName || '');
                        })()}
                      </span>
                    </div>
                  </TableCell>
                  {/* <TableCell>{getDisplayDocumentNumber(doc)}</TableCell> */}
                  {/* <TableCell>
                    {doc.createdAt ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true }) : '—'}
                  </TableCell> */}
                  <TableCell className="w-[260px]">
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Use the actual document_status_id from database to determine the label
                        // statusName comes from getDocumentStatusName which reads from document_status table
                        // This ensures we show what's actually stored in the database
                        
                        // Check if API verification failed with rejection reason
                        const isApiFailedWithReason = doc.verificationStatus === 'failed' && doc.rejectReason;
                        
                        // Determine label based on actual database status
                        let labelOverride: string | undefined;
                        
                        if (isApiFailedWithReason) {
                          labelOverride = 'Verification Rejected';
                        } else if (doc.verificationStatus === 'verified') {
                          // Check the actual status name from database
                          if (statusName === 'governance') {
                            labelOverride = 'Verified by Government';
                          } else if (statusName === 'manual') {
                            labelOverride = 'Verified by Manual';
                          } else if (doc.verifiedByEmployeeId) {
                            // Fallback: if verified_by is set but status name is not available
                            labelOverride = 'Verified by Manual';
                          }
                          // If statusName is undefined or something else, don't override (use default badge)
                        }

                        // Only make badge clickable for "Verified by Government" (governance status)
                        // "Verified by Manual" should not be clickable
                        const shouldBeClickable = doc.verificationStatus !== 'pending' && statusName === 'governance';
                        
                        return (
                          <VerificationStatusBadge 
                            status={doc.verificationStatus} 
                            documentStatusName={statusName}
                            isGovernance={isGovernanceVerified}
                            onClick={
                              shouldBeClickable && onViewGovernment
                                ? () => onViewGovernment(doc)
                                : undefined
                            }
                            documentLogs={doc.employee_docs_log}
                            documentId={doc.id}
                            documentType={docType}
                            rejectReason={doc.rejectReason}
                            labelOverride={labelOverride}
                            truncate={true}
                          />
                        );
                      })()}
                      {/* Show comment icon for manual documents with verification history */}
                      {docType === 'manual' && hasVerificationHistory(doc) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCommentsClick(doc)}
                          title="View comments and verification history"
                          className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
      
                    </div>
                  </TableCell>
                  {/* Verified by Column */}
                  <TableCell>
                    {(() => {
                      // For manual documents, show "SafeSchool - date time" using latest verification history
                      if (docType === 'manual') {
                        const history = (doc.params as any)?.verification_history;
                        if (Array.isArray(history) && history.length > 0) {
                          const latest = [...history].sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                          const ts = latest?.timestamp || doc.updatedAt;
                          return (
                            <span className="text-sm text-gray-900">
                              SafeSchool{ts ? ` - ${formatDate(ts, { isTiming: true })}` : ''}
                            </span>
                          );
                        }
                        // Fallback to updatedAt if no history
                        if (doc.updatedAt) {
                          return (
                            <span className="text-sm text-gray-900">
                              SafeSchool - {formatDate(doc.updatedAt, { isTiming: true })}
                            </span>
                          );
                        }
                        return <span className="text-muted-foreground">—</span>;
                      }
                      const name = getVerifiedByName(doc);
                      const updatedAt = doc.updatedAt;
                      
                      return name ? (
                        <span className="text-sm text-gray-900">
                          {name}{updatedAt && ` on ${formatDate(updatedAt, { isTiming: true })}`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      );
                    })()}
                  </TableCell>
                  
                  {/* Actions Column */}
               <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 w-full whitespace-nowrap">

                      {/* API Verify */}
                      {!isReadOnly && hasVerifyApi  && (
                        <Button
                          variant="verifyApi"
                          size="sm"
                          onClick={() => onQuickVerify(doc.id, 'api')}
                          className="h-8 px-2"
                          title="Government API verification"
                        >
                          <GovernmentEmblemIcon size={18} />
                        </Button>
                      )}

                      {/* Manual Verify */}
                      {!isReadOnly && hasVerifyManual && (
                        <Button
                          variant="verifyManual"
                          size="sm"
                          onClick={() => onQuickVerify(doc.id, 'manual')}
                          className="h-8"
                        >
                          <Wrench className="h-4 w-4" />
                          <span className="ml-1">Verify Manual</span>
                        </Button>
                      )}

                      {/* Files (manual docs only) */}
                      {docType === 'manual' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleFilesClick(
                              doc.id,
                              doc.employeeId,
                              (doc as any).documents_files || []
                            )
                          }
                          className="h-8"
                        >
                          <File className="h-4 w-4 mr-1" />
                          Files
                        </Button>
                      )}

                      {/* Actions menu */}
                      {(!isReadOnly || doc.documentImage || (doc.params as any)?.document_url) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-40">
                          {(doc.documentImage || (doc.params as any)?.document_url) && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewDocument(
                                    (doc.params as any)?.document_url ||
                                      doc.documentImage
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleDownloadDocument(
                                    (doc.params as any)?.document_url ||
                                      doc.documentImage
                                  )
                                }
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                            </>
                          )}

                          {!isReadOnly && (
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(doc.id)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                  )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs for document verification details */}

      <GovernmentVerificationPopup
        open={govPopupOpen}
        onOpenChange={(open) => {
          setGovPopupOpen(open);
          if (!open) setSelectedGovData(null);
        }}
        documentType={selectedGovType}
        data={selectedGovData}
      />
      

      <BankStatementDetailsDialog
        open={bankStatementDialogOpen}
        onOpenChange={setBankStatementDialogOpen}
        statementDetails={selectedBankStatementDetails}
        documentId={selectedDocumentId}
        readOnly
      />

      {/* Comments Dialog */}
      <DocumentCommentsDialog
        open={commentsDialogOpen}
        onOpenChange={setCommentsDialogOpen}
        verificationHistory={selectedVerificationHistory}
        documentId={selectedDocumentId}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen && !isReadOnly} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action will mark the document as deleted, but it can be restored if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                if (documentToDelete) {
                  handleDeleteDocument(documentToDelete);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Files Dialog */}
      {selectedDocumentId && selectedEmployeeId && (
        <FilesDialog
          open={filesDialogOpen}
          onOpenChange={setFilesDialogOpen}
          documentId={selectedDocumentId}
          employeeId={selectedEmployeeId}
          clientId={clientId}
          files={selectedFiles}
          verificationType={selectedVerificationType}
          onRefresh={handleFilesDialogRefresh}
          onCloseWithFilesCount={(count) => handleFilesDialogClosed(selectedDocumentId, count)}
          isReadOnly={isReadOnly}
        />
      )}
    </>
  );
};

export default DocumentsTable;
