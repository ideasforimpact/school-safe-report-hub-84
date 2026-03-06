
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Upload, X, FileText, ThumbsUp, ThumbsDown, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VerificationDocument, Employee } from '@/types/employeeVerification';
import { backofficeDocumentService } from '@/services/employee/backofficeDocumentService';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface CommentEntry {
  id: string;
  text: string;
  attachments: File[];
  sentiment: boolean; // true for positive, false for negative
}

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
  const [addedComments, setAddedComments] = useState<CommentEntry[]>([]);
  const [currentComment, setCurrentComment] = useState<{ text: string; attachments: File[]; sentiment: boolean | null }>({
    text: '',
    attachments: [],
    sentiment: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { toast } = useToast();

  const clientId = employee.clientId || (employee as any).client_id;

  console.log(employee,"employeeId");
  

  const addComment = () => {
    if (!currentComment.text.trim()) {
      toast({
        title: "Comment Required",
        description: "Please enter a comment before adding.",
        variant: "destructive",
      });
      return;
    }

    if (!currentComment.sentiment) {
      toast({
        title: "Sentiment Required",
        description: "Please select a sentiment (positive or negative) before adding.",
        variant: "destructive",
      });
      return;
    }

    const newComment: CommentEntry = {
      id: uuidv4(), // Unique UUID for each comment
      text: currentComment.text.trim(),
      attachments: [...currentComment.attachments],
      sentiment: currentComment.sentiment as boolean // true for positive, false for negative
    };

    setAddedComments(prev => [...prev, newComment]);
    setCurrentComment({ text: '', attachments: [], sentiment: null });
  };

  const removeAddedComment = (commentId: string) => {
    setAddedComments(prev => prev.filter(c => c.id !== commentId));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setCurrentComment(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...Array.from(files)]
      }));
    }
    // Reset input
    if (event.target) event.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setCurrentComment(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
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

    // Validate that we have at least one comment
    if (addedComments.length === 0) {
      setErrorMessage('Please add at least one verification comment before proceeding.');
      toast({
        title: "Comments Required",
        description: "Please add at least one verification comment before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      setErrorMessage('');
      
      const bucketName = 'employee_other_type_statement';
      const basePath = `${clientId}/${employee.id}/${document.id}/comments`;
      
      // Process all comments: store files and prepare comment objects
      const processedComments = await Promise.all(
        addedComments.map(async (comment) => {
          const commentPath = `${basePath}/${comment.id}`;
          const files: Array<{ path: string; fileName: string }> = [];
          
          // Upload each file to storage
          for (const file of comment.attachments) {
            const fileExtension = file.name.split('.').pop() || 'bin';
            const storageFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
            const storagePath = `${commentPath}/${storageFileName}`;
            
            // Convert file to blob for upload
            const { error: uploadError } = await supabase.storage
              .from(bucketName)
              .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
              });
            
            if (uploadError) {
              console.error(`Error uploading file ${file.name}:`, uploadError);
              throw new Error(`Failed to upload file: ${file.name}`);
            }
            
            // Store both storage path and original file name
            files.push({
              path: storagePath,
              fileName: file.name // Original file name
            });
      }

          return {
            id: comment.id,
            text: comment.text.trim(),
            sentiment: comment.sentiment,
            files: files // New structure with path and fileName
          };
        })
      );

      // Start queue process with basic information and file pathsc
      const { data: queueData, error: queueError } = await supabase.functions.invoke('backoffice-document-verification-queue', {
        body: {
          documentId: document.id,
          clientId,
          employeeId: employee.id,
          action,
          comments: processedComments
        }
      });

      if (queueError) throw new Error(queueError.message || 'Queue process failed');

      // Comment out old edge function call
      // const { data, error } = await supabase.functions.invoke('backoffice-document-verification', {
      //   body: {
      //     documentId: document.id,
      //     clientId,
      //     employeeId: employee.id,
      //     action,
      //     comments: processedComments,
      //     verifiedBy: 'SafeSchool'
      //   }
      // });

      // if (error) throw new Error(error.message || 'Verification failed');

      toast({
        title: "Document Verified",
        description: `Document has been ${action === 'completed' ? 'completed' : 'rejected'} successfully.`,
      });

      // Reset form and close dialog
      setAddedComments([]);
      setCurrentComment({ text: '', attachments: [], sentiment: null });
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
    setAddedComments([]);
    setCurrentComment({ text: '', attachments: [], sentiment: null });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Verify Document - {employee.name}
          </DialogTitle>
        </DialogHeader>
        {errorMessage && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex-shrink-0">
            {errorMessage}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto space-y-6 [&::-webkit-scrollbar]:hidden" style={{ maxHeight: 'calc(90vh - 200px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {/* Document Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Document Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Document ID:</span> {document.id.slice(0, 8)}
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

          {/* Current Comment Input Section */}
          <div className="space-y-4 max-w-xl mx-auto">
            <Label className="text-base font-semibold">
              Verification Comments <span className="text-red-500">*</span>
            </Label>
            
            {/* Comment Textarea with Thumbs in Bottom Right */}
            <div className="relative w-full">
            <TextareaWithVoice
                placeholder="Enter your verification comment..."
                value={currentComment.text}
                onChange={(e) => setCurrentComment(prev => ({ ...prev, text: e.target.value }))}
              rows={4}
                className="resize-none pr-20 w-full"
            />
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentComment(prev => ({ ...prev, sentiment: true }))}
                  className={`h-8 w-8 p-0 ${
                    currentComment.sentiment === true 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Positive"
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentComment(prev => ({ ...prev, sentiment: false }))}
                  className={`h-8 w-8 p-0 ${
                    currentComment.sentiment === false 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Negative"
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
              </div>
          </div>

            {/* Supporting Attachments */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Supporting Attachments</Label>
            
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                  <label htmlFor="file-upload-current" className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Click to upload files
                  </span>
                  <input
                      id="file-upload-current"
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
              {currentComment.attachments.length > 0 && (
              <div className="space-y-2">
                  {currentComment.attachments.map((file, fileIndex) => (
                    <div key={fileIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                        type="button"
                      variant="ghost"
                      size="sm"
                        onClick={() => removeAttachment(fileIndex)}
                      className="h-6 w-6 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

            {/* Add Comment Button */}
            <Button
              type="button"
              variant="outline"
              onClick={addComment}
              disabled={!currentComment.text.trim()}
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Comment
            </Button>
          </div>

          {/* Added Comments as Cards - Shown at Bottom */}
          {addedComments.length > 0 && (
            <div className="space-y-3 pt-4 max-w-xl mx-auto">
              {addedComments.map((comment) => (
                <div
                  key={comment.id}
                  className="border-l-4 rounded-lg p-4 bg-white shadow-sm relative w-full"
                  style={{
                    borderLeftColor: comment.sentiment === true ? '#10b981' : '#ef4444'
                  }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAddedComment(comment.id)}
                    className="absolute top-2 left-2 h-6 w-6 p-0 z-10"
                    title="Remove comment"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="space-y-3 pl-6 pr-2">
                    <div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.text}</p>
                    </div>
                    
                    {comment.attachments.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500">Files:</p>
                        {comment.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 break-words">
                            <FileText className="h-3 w-3 flex-shrink-0" />
                            <span className="break-all">{file.name}</span>
                            <span className="text-gray-400 flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex justify-end gap-3 pt-4 border-t mt-4 flex-shrink-0 bg-white">
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
            disabled={isProcessing || addedComments.length === 0}
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
            disabled={isProcessing || addedComments.length === 0}
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
      </DialogContent>
    </Dialog>
  );
};

export default DocumentVerificationDialog;
