import React, { useEffect, useState } from 'react';
import { Eye, Download, MessageCircle, FileSearch, MoreVertical, Trash, Loader2, Cpu, Wrench, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerificationDocument } from '@/types/employeeVerification';
import { Badge } from '@/components/ui/badge';
import VerificationStatusBadge from '../VerificationStatusBadge';
import { getDocumentIcon, formatDocumentTypeName, getManualVerificationDisplayName } from '../utils/documentUtils';
import { useEmployeeVerification } from '@/contexts/employee-verification';

interface DocumentsTableProps {
  documents: VerificationDocument[];
  employeeId: string;
  onView: (documentId: string) => void;
  onDownload: (documentId: string) => void;
  onEditNotes: (documentId: string) => void;
  onDelete: (documentId: string) => void;
  loading?: boolean;
  documentTypeName?: string;
  documentNumber?: string;
  verificationStatus?: string;
  onFiltersChange?: (filters: {
    documentTypeName?: string;
    documentNumber?: string;
    verificationStatus?: string;
  }) => void;
}

const DocumentsTable: React.FC<any> = (props) => {
  const {
    documents,
    employeeId,
    onView,
    onDownload,
    onEditNotes,
    onDelete,
    loading,
    documentTypeName: initialDocumentTypeName,
    documentNumber: initialDocumentNumber,
    verificationStatus: initialVerificationStatus,
    onFiltersChange,
  } = props;

  const [documentTypeName, setDocumentTypeName] = useState(initialDocumentTypeName || '');
  const [documentNumber, setDocumentNumber] = useState(initialDocumentNumber || '');
  const [verificationStatus, setVerificationStatus] = useState(initialVerificationStatus || '');

  useEffect(() => {
    setDocumentTypeName(initialDocumentTypeName || '');
    setDocumentNumber(initialDocumentNumber || '');
    setVerificationStatus(initialVerificationStatus || '');
  }, [initialDocumentTypeName, initialDocumentNumber, initialVerificationStatus]);

  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        documentTypeName,
        documentNumber,
        verificationStatus,
      });
    }
  }, [documentTypeName, documentNumber, verificationStatus, onFiltersChange]);

  const getDisplayDocumentNumber = (doc: VerificationDocument): string => {
    return doc.documentNumber || '—';
  };

  const { employees } = useEmployeeVerification();

  const getVerifiedByName = (doc: VerificationDocument): string | undefined => {
    const verifierId = doc.verifiedByEmployeeId;
    if (!verifierId) return undefined;
    const emp = employees.find(e => e.id === verifierId);
    if (emp) {
      if (emp.name) return emp.name;
      const full = `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
      return full || emp.email || verifierId;
    }
    return undefined;
  };

  const handleDocumentTypeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentTypeName(e.target.value);
  };

  const handleDocumentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocumentNumber(e.target.value);
  };

  const handleVerificationStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVerificationStatus(e.target.value);
  };

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <TableCaption>
          Employee Documents for employee ID: {employeeId}
        </TableCaption>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Verified by</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getDocumentIcon(doc.documentTypeName)}
                      <span>{formatDocumentTypeName(doc.documentTypeName)}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getDisplayDocumentNumber(doc)}</TableCell>
                  <TableCell>
                    <VerificationStatusBadge status={doc.verificationStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    {(() => {
                      const name = getVerifiedByName(doc);
                      return name ? (
                        <div className="flex justify-end">
                          <Badge variant="softAmber" className="gap-1">
                            <User className="h-3.5 w-3.5" />
                            <span className="truncate max-w-[160px]">{name}</span>
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onView(doc.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload(doc.id)}>
                          <Download className="mr-2 h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditNotes(doc.id)}>
                          <MessageCircle className="mr-2 h-4 w-4" /> Edit Notes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete(doc.id)}>
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default DocumentsTable;
