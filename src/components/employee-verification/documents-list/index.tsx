import React, { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Document, File, Copy, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useEmployeeVerification } from '@/contexts/employee-verification';
import { VerificationDocument } from '@/types/employeeVerification';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import OtpVerificationDialog from './OtpVerificationDialog';

interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  open,
  onOpenChange,
  documentId
}) => {
  const { getDocument, verifyDocument } = useEmployeeVerification();
  const document = getDocument(documentId);
  const [notes, setNotes] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!document) {
      toast({
        title: 'Error',
        description: 'Document not found.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsVerifying(true);
      await verifyDocument(document.id, notes);
      toast({
        title: 'Document Verified',
        description: 'The document has been verified successfully.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error in handleVerify:", error);
      toast({
        title: 'Error',
        description: 'Failed to verify document.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!document) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>
              Document not found.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Document</DialogTitle>
          <DialogDescription>
            Are you sure you want to verify this document?
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="documentType" className="text-right">
              Document Type
            </Label>
            <Input type="text" id="documentType" value={document.documentTypeName || 'N/A'} className="col-span-3" disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="documentNumber" className="text-right">
              Document Number
            </Label>
            <Input type="text" id="documentNumber" value={document.documentNumber || 'N/A'} className="col-span-3" disabled />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="notes" className="text-right mt-2">
              Verification Notes
            </Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="col-span-3" placeholder="Add any relevant notes here" />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isVerifying}>
            Cancel
          </Button>
          <Button type="button" onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface Props {
  documents: VerificationDocument[];
  isLoading: boolean;
  isError: boolean;
}

const DocumentsList: React.FC<Props> = ({ documents, isLoading, isError }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDocument, setSelectedDocument] = useState<VerificationDocument | null>(null);
  const [verifyDialogDocument, setVerifyDialogDocument] = useState<VerificationDocument | null>(null);
	const [selectedAadharForOtp, setSelectedAadharForOtp] = useState<VerificationDocument | null>(null);
  const { deleteDocument } = useEmployeeVerification();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDocuments = documents?.filter((document) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      document.documentTypeName?.toLowerCase().includes(searchTerm) ||
      document.documentNumber?.toLowerCase().includes(searchTerm)
    );
  }) || [];

  const handleViewDocument = (document: VerificationDocument) => {
    setSelectedDocument(document);
  };

  const handleCloseDialog = () => {
    setSelectedDocument(null);
  };

  const handleDelete = async (documentId: string) => {
    try {
      setIsDeleting(true);
      await deleteDocument(documentId);
      toast({
        title: 'Document Deleted',
        description: 'The document has been deleted successfully.',
      });
    } catch (error) {
      console.error("Error in handleDelete:", error);
      toast({
        title: 'Error',
        description: 'Failed to delete document.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

	const handleVerificationComplete = useCallback(() => {
    setSelectedAadharForOtp(null);
  }, [setSelectedAadharForOtp]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Verification Documents</h1>
      <Input
        type="text"
        placeholder="Search documents..."
        className="mb-4"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {isLoading && <p>Loading documents...</p>}
      {isError && <p>Error fetching documents.</p>}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Document Type</TableHead>
              <TableHead>Document Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.map((document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium">{document.documentTypeName}</TableCell>
                <TableCell>{document.documentNumber}</TableCell>
                <TableCell>
                  {document.verificationStatus === 'pending' && (
                    <Badge variant="outline">Pending</Badge>
                  )}
                  {document.verificationStatus === 'verified' && (
                    <Badge variant="success">Verified</Badge>
                  )}
                  {document.verificationStatus === 'failed' && (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                </TableCell>
                <TableCell>{format(new Date(document.createdAt), 'PPP')}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <DotsHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => handleViewDocument(document)}
                      >
                        <File className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (document.documentTypeName === 'aadhar') {
                            setSelectedAadharForOtp(document);
                          } else {
                            setVerifyDialogDocument(document);
                          }
                        }}
                        disabled={document.verificationStatus === 'verified'}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> Verify
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(document.id)}
                        disabled={isDeleting}
                      >
                        <XCircle className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <AlertTriangle className="mr-2 h-4 w-4" /> Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => handleCloseDialog()}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>
                View the details of the selected document.
              </DialogDescription>
            </DialogHeader>
            <Card>
              <CardHeader>
                <CardTitle>{selectedDocument.documentTypeName}</CardTitle>
                <CardDescription>
                  Uploaded on {format(new Date(selectedDocument.createdAt), 'PPP')}
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <img
                  src={selectedDocument.documentImage}
                  alt={selectedDocument.documentTypeName}
                  className="w-full h-auto rounded-md"
                />
                <Button
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedDocument.documentImage);
                    toast({
                      title: "Copied!",
                      description: "Document URL copied to clipboard.",
                    })
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy URL
                </Button>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button onClick={() => handleCloseDialog()}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {verifyDialogDocument && (
        <VerificationDialog 
          open={!!verifyDialogDocument}
          onOpenChange={(open) => !open && setVerifyDialogDocument(null)}
          documentId={verifyDialogDocument.id} // Use documentId instead of document
        />
      )}

      {selectedAadharForOtp && (
        <OtpVerificationDialog
          isOpen={!!selectedAadharForOtp} // Use isOpen for OtpVerificationDialog since it's expecting that prop
          onClose={() => setSelectedAadharForOtp(null)}
          documentId={selectedAadharForOtp.id}
          documentNumber={selectedAadharForOtp.documentNumber || ''}
          onVerificationComplete={handleVerificationComplete}
        />
      )}
    </div>
  );
};

export default DocumentsList;
