
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Upload, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument, Employee } from '@/types/employeeVerification';
import { backofficeDocumentService } from '@/services/employee/backofficeDocumentService';
import { supabase } from '@/integrations/supabase/client';

interface DocumentVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: VerificationDocument;
  employee: Employee;
  onDocumentUpdated: () => void;
}

const DocumentVerificationDialog: React.FC<DocumentVerificationDialogProps> = ({
  open,
  onOpenChange,
  document,
  employee,
  onDocumentUpdated
}) => {
  const [comments, setComments] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const clientId = employee.clientId || (employee as any).client_id;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAttachments(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleVerificationAction = async (action: 'completed' | 'rejected') => {
    if (!clientId) {
      setErrorMessage('Client ID not found. Please check employee data.');
      toast({
        title: "Error",
        description: "Client ID not found. Please check employee data.",
        variant: "destructive",
      });
      return;
    }

    if (!comments.trim()) {
      setErrorMessage('Please provide verification comments before proceeding.');
      toast({
        title: "Comments Required",
        description: "Please provide verification comments before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      setErrorMessage('');
      // Build single optional attachment (no loop). If multiple selected, take the first one
      let attachment: { name: string; type: string; size: number; base64: string } | null = null;
      if (attachments.length > 0) {
        const file = attachments[0];
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });
        attachment = { name: file.name, type: file.type, size: file.size, base64 };
      }

      // Invoke edge function to perform upload+verification atomically
      const { data, error } = await supabase.functions.invoke('backoffice-document-verification', {
        body: {
          documentId: document.id,
          clientId,
          employeeId: employee.id,
          action,
          comments: comments.trim(),
          attachment,
          verifiedBy: 'SafeSchool'
        }
      });

      if (error) throw new Error(error.message || 'Verification failed');

      toast({
        title: "Document Verified",
        description: `Document has been ${action === 'completed' ? 'completed' : 'rejected'} successfully.`,
      });

      // Reset form and close dialog
      setComments('');
      setAttachments([]);
      onOpenChange(false);
      onDocumentUpdated();

    } catch (error) {
      console.error('Error verifying document:', error);
      const message = error instanceof Error ? error.message : 'Failed to verify document. Please try again.';
      setErrorMessage(message);
      toast({
        title: "Verification Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setComments('');
    setAttachments([]);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verify Document - {employee.name}
          </DialogTitle>
        </DialogHeader>
        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        
        <div className="space-y-6">
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Document Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Document ID:</span> {document.id.slice(0, 8)}...
              </div>
              <div>
                <span className="font-medium">Status:</span> {document.verificationStatus}
              </div>
              {document.documentNumber && (
                <div className="col-span-2">
                  <span className="font-medium">Document Number:</span> {document.documentNumber}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-2">
            <Label htmlFor="comments">Verification Comments *</Label>
            <Textarea
              id="comments"
              placeholder="Enter your verification comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-3">
            <Label>Supporting Attachments</Label>
            
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Click to upload files
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, PDF, DOC up to 10MB each
                </p>
              </div>
            </div>

            {/* Selected Files */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Selected Files:</p>
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleVerificationAction('rejected')}
              disabled={isProcessing || !comments.trim()}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Reject
            </Button>
            <Button
              onClick={() => handleVerificationAction('completed')}
              disabled={isProcessing || !comments.trim()}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Complete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentVerificationDialog;
