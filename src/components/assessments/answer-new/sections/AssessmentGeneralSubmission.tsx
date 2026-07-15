
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { MessageSquare, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { FileItem } from '@/types/fileTypes';

interface AssessmentGeneralSubmissionProps {
  generalComment: string;
  onGeneralCommentChange: (value: string) => void;
  generalAttachments: FileItem[];
  onGeneralAttachmentsChange: (files: FileItem[]) => void;
}

const AssessmentGeneralSubmission = ({
  generalComment,
  onGeneralCommentChange,
  generalAttachments,
  onGeneralAttachmentsChange
}: AssessmentGeneralSubmissionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <Card className="bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle>General Comment & Attachment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="general-comment" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Comment <span className="text-red-500">*</span>
            </Label>
            <TextareaWithVoice
              id="general-comment"
              value={generalComment}
              onChange={(e) => onGeneralCommentChange(e.target.value)}
              placeholder="Provide an overall comment for this assessment..."
              className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white"
              rows={5}
              required
            />
            {!generalComment.trim() && (
              <p className="text-xs text-red-500">A general comment is required</p>
            )}
          </div>

          <div className="space-y-3 p-4 bg-purple-50/50 rounded-lg border border-purple-200">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-purple-600" />
              Attachment <span className="text-red-500">*</span>
            </Label>
            <div className="text-xs text-gray-500 mb-2">
              Upload any supporting documents, images, or files for this assessment.
            </div>
            <MultipleFilesUpload
              onFilesChange={onGeneralAttachmentsChange}
              initialFiles={generalAttachments}
              maxFiles={5}
              className="border-gray-200 bg-white"
              required
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AssessmentGeneralSubmission;
