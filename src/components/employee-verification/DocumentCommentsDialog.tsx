
import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FileText, ThumbsUp, ThumbsDown, Download, Edit2, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employeeVerification';

interface CommentFile {
  path: string; // Storage path
  fileName: string; // Original file name
}

interface CommentEntry {
  id: string;
  text: string;
  sentiment: boolean; // true for positive, false for negative
  filePaths?: string[]; // Legacy: Array of storage paths (for backward compatibility)
  files?: CommentFile[]; // New: Array of file objects with path and fileName
}

interface DocumentCommentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments?: CommentEntry[] | null | undefined;
  documentId?: string;
  employee?: Employee;
  onCommentsUpdated?: () => void;
  mode?: 'client' | 'backoffice';
  isReadOnly?: boolean;
}

const DocumentCommentsDialog: React.FC<DocumentCommentsDialogProps> = ({
  open,
  onOpenChange,
  comments,
  documentId,
  employee,
  onCommentsUpdated,
  mode = 'client',
  isReadOnly = false
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'positive' | 'negative'>('positive');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [editedSentiment, setEditedSentiment] = useState<boolean | null>(null);
  const [editedFiles, setEditedFiles] = useState<File[]>([]);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadedComments, setLoadedComments] = useState<CommentEntry[] | null>(null);

  // Client view: if comments not provided, fetch from employee_documents by documentId
  React.useEffect(() => {
    const fetchComments = async () => {
      if (!comments && documentId) {
        const { data, error } = await supabase
          .from('employee_documents')
          .select('comments')
          .eq('id', documentId)
          .maybeSingle();
        if (!error) {
          const arr = Array.isArray((data as any)?.comments) ? (data as any).comments as CommentEntry[] : [];
          setLoadedComments(arr);
        }
      }
    };
    fetchComments();
  }, [comments, documentId]);

  // Normalize comments from comments column or loaded
  const sourceComments = comments ?? loadedComments ?? [];
  const normalizedComments: CommentEntry[] = Array.isArray(sourceComments)
    ? sourceComments.filter((comment): comment is CommentEntry =>
        comment && typeof comment === 'object' && 'id' in comment && 'text' in comment
      )
    : [];

  // Filter comments by sentiment
  const positiveComments = useMemo(() => 
    normalizedComments.filter(comment => comment.sentiment === true),
    [normalizedComments]
  );

  const negativeComments = useMemo(() => 
    normalizedComments.filter(comment => comment.sentiment === false),
    [normalizedComments]
  );

  // Get file name from comment file entry (supports both old and new structure)
  const getFileName = (file: CommentFile | string): string => {
    if (typeof file === 'string') {
      // Legacy: extract from path
      const parts = file.split('/');
      return parts[parts.length - 1] || 'file';
    }
    // New structure: use fileName
    return file.fileName || 'file';
  };

  // Get file path from comment file entry (supports both old and new structure)
  const getFilePath = (file: CommentFile | string): string => {
    if (typeof file === 'string') {
      return file;
    }
    return file.path;
  };

  // Get all files from comment (supports both old and new structure)
  const getCommentFiles = (comment: CommentEntry): (CommentFile | string)[] => {
    if (comment.files && Array.isArray(comment.files)) {
      return comment.files;
    }
    // Legacy: convert filePaths to array
    if (comment.filePaths && Array.isArray(comment.filePaths)) {
      return comment.filePaths;
    }
    return [];
  };

  // Handle download file
  const handleDownloadFile = async (file: CommentFile | string, fileName?: string) => {
    try {
      const filePath = typeof file === 'string' ? file : file.path;
      const originalFileName = fileName || (typeof file === 'object' ? file.fileName : undefined);
      
      // Generate signed URL for the file
      const { data, error } = await supabase.storage
        .from('employee_other_type_statement')
        .createSignedUrl(filePath, 300); // 5 minutes expiry

      if (error || !data?.signedUrl) {
        throw new Error('Failed to generate file URL');
      }

      // Fetch the file
      const response = await fetch(data.signedUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Create download link with original filename
      const link = document.createElement('a');
      link.href = url;
      link.download = originalFileName || (() => {
        // Fallback: extract from path
        const parts = filePath.split('/');
        return parts[parts.length - 1] || 'file';
      })();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "File download has been initiated.",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Backoffice-only editing helpers
  const handleEditComment = (comment: CommentEntry) => {
    if (mode !== 'backoffice' || isReadOnly) return;
    setEditingCommentId(comment.id);
    setEditedText(comment.text);
    setEditedSentiment(comment.sentiment);
    setEditedFiles([]);
    setFilesToDelete([]);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditedText('');
    setEditedSentiment(null);
    setEditedFiles([]);
    setFilesToDelete([]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const files = Array.from(event.target.files || []);
    setEditedFiles(files);
  };

  const markFileForDeletion = (file: CommentFile | string) => {
    if (isReadOnly) return;
    const path = getFilePath(file);
    setFilesToDelete(prev => prev.includes(path) ? prev : [...prev, path]);
  };

  const handleSaveEdit = async () => {
    if (isReadOnly) return;
    if (!editingCommentId || !documentId) return;
    if (!editedText.trim() || editedSentiment === null) return;
    setIsProcessing(true);
    try {
      const bucketName = 'employee_other_type_statement';
      const basePath = `${(employee as any)?.clientId || (employee as any)?.client_id || ''}/${employee?.id || ''}/${documentId}/comments/${editingCommentId}`;

      // Find original comment
      const original = normalizedComments.find(c => c.id === editingCommentId);
      if (!original) throw new Error('Comment not found');

      const originalFilesArr = getCommentFiles(original);
      const existingPaths = originalFilesArr.map(getFilePath);

      // Build a map from path to original filename (for remaining files)
      const originalNameByPath: Record<string, string> = {};
      originalFilesArr.forEach(f => {
        const p = getFilePath(f);
        const n = typeof f === 'object' ? f.fileName : getFileName(f);
        originalNameByPath[p] = n;
      });

      let resultingFiles: CommentFile[] = [];

      if (editedFiles.length > 0) {
        // Replace all existing files with the newly uploaded set
        filesToDelete.push(...existingPaths);
        const uploaded: CommentFile[] = [];
        for (const file of editedFiles) {
          const ext = file.name.split('.').pop() || 'bin';
          const storageFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
          const storagePath = `${basePath}/${storageFileName}`;
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, file, { contentType: file.type, upsert: false });
          if (uploadError) throw uploadError;
          uploaded.push({ path: storagePath, fileName: file.name });
        }
        resultingFiles = uploaded;
      } else {
        // No new files: keep existing except those marked for deletion
        const remainingPaths = existingPaths.filter(p => !filesToDelete.includes(p));
        resultingFiles = remainingPaths.map(p => ({ path: p, fileName: originalNameByPath[p] || p.split('/').pop() || 'file' }));
      }

      // Enqueue update via queue function
      await supabase.functions.invoke('document-comment-operation-queue', {
        body: {
          operation: 'update',
          documentId,
          clientId: (employee as any)?.clientId || (employee as any)?.client_id,
          employeeId: employee?.id,
          commentId: editingCommentId,
          comment: {
            text: editedText.trim(),
            sentiment: editedSentiment,
            files: resultingFiles
          },
          filesToDelete: filesToDelete
        }
      });

      handleCancelEdit();
      onCommentsUpdated?.();
    } catch (err) {
      console.error(err);
      toast({ title: 'Save failed', description: 'Could not save comment changes', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteComment = async (comment: CommentEntry) => {
    if (mode !== 'backoffice' || isReadOnly || !documentId) return;
    try {
      const paths = getCommentFiles(comment).map(getFilePath);
      await supabase.functions.invoke('document-comment-operation-queue', {
        body: {
          operation: 'delete',
          documentId,
          clientId: (employee as any)?.clientId || (employee as any)?.client_id,
          employeeId: employee?.id,
          commentId: comment.id,
          filesToDelete: paths
        }
      });
      onCommentsUpdated?.();
    } catch (err) {
      console.error(err);
      toast({ title: 'Delete failed', description: 'Could not delete comment', variant: 'destructive' });
    }
  };

  // Render comment card
  const renderCommentCard = (comment: CommentEntry) => (
    <div
      key={comment.id}
      className="border-l-4 rounded-lg p-4 bg-white shadow-sm"
      style={{
        borderLeftColor: comment.sentiment === true ? '#10b981' : '#ef4444'
      }}
    >
      {editingCommentId === comment.id ? (
        <div className="space-y-3">
          {mode === 'backoffice' && !isReadOnly && (
            <div className="flex items-center justify-end mb-1">
              <Button variant="ghost" size="sm" onClick={handleCancelEdit} title="Cancel edit">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <textarea value={editedText} onChange={(e)=>setEditedText(e.target.value)} className="w-full min-h-[100px] border rounded p-2" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sentiment:</span>
            <Button variant="ghost" size="sm" onClick={()=>setEditedSentiment(true)} className={editedSentiment===true? 'bg-green-100 text-green-700':''}><ThumbsUp className="h-4 w-4"/></Button>
            <Button variant="ghost" size="sm" onClick={()=>setEditedSentiment(false)} className={editedSentiment===false? 'bg-red-100 text-red-700':''}><ThumbsDown className="h-4 w-4"/></Button>
          </div>
          {(() => {
            const files = getCommentFiles(comment);
            return files.length>0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500">Existing Files:</p>
                {files.map((file, idx)=>{
                  const path = getFilePath(file);
                  const name = getFileName(file);
                  const marked = filesToDelete.includes(path);
                  return (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded border ${marked? 'bg-red-50 border-red-200':'bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500"/>
                        <span className="text-sm">{name}</span>
                        {marked && <span className="text-xs text-red-600">(Will be deleted)</span>}
                      </div>
                      {!isReadOnly && !marked && <Button variant="ghost" size="sm" onClick={()=>markFileForDeletion(file)} className="text-red-600">✕</Button>}
                    </div>
                  )
                })}
              </div>
            )
          })()}
          {!isReadOnly && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Add New Files:</p>
              <input type="file" multiple onChange={handleFileSelect} className="w-full" />
            </div>
          )}
        </div>
      ) : (
        <>
      <div className="flex items-start gap-2 mb-3">
        {comment.sentiment === true ? (
          <ThumbsUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
        ) : (
          <ThumbsDown className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.text}</p>
        </div>
        {mode === 'backoffice' && !isReadOnly && (
          <div className="ml-2 flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleEditComment(comment)} title="Edit">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDeleteComment(comment)} title="Delete" className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Files for this comment */}
      {(() => {
        const files = getCommentFiles(comment);
        return files.length > 0 && (
          <div className="space-y-2 mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-gray-500 mb-2">Files:</p>
            {files.map((file, fileIndex) => {
              const filePath = getFilePath(file);
              const fileName = getFileName(file);
              return (
                <div
                  key={fileIndex}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded border hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {fileName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadFile(file, fileName)}
                    className="h-8 w-8 p-0"
                    title="Download file"
                  >
                    <Download className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              );
            })}
          </div>
        );
      })()}
        </>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Comments
          </DialogTitle>
          <DialogDescription>
            View comments for this document organized by sentiment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {normalizedComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No comments available for this document.</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'positive' | 'negative')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="positive" className="flex items-center gap-2">
                  <ThumbsUp className="h-4 w-4" />
                  Positive ({positiveComments.length})
                </TabsTrigger>
                <TabsTrigger value="negative" className="flex items-center gap-2">
                  <ThumbsDown className="h-4 w-4" />
                  Negative ({negativeComments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="positive" className="space-y-3">
                {positiveComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ThumbsUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No positive comments available.</p>
                  </div>
                ) : (
                  positiveComments.map(comment => renderCommentCard(comment))
                )}
              </TabsContent>

              <TabsContent value="negative" className="space-y-3">
                {negativeComments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ThumbsDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No negative comments available.</p>
                  </div>
                ) : (
                  negativeComments.map(comment => renderCommentCard(comment))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Bottom Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {mode === 'backoffice' && editingCommentId && !isReadOnly ? (
            <>
              <Button onClick={handleSaveEdit} disabled={isProcessing || !editedText.trim() || editedSentiment===null}>Save</Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentCommentsDialog;
