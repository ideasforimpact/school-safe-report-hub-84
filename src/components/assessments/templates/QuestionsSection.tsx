
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import QuestionEditor from './QuestionEditor';
import { AssessmentQuestion } from '@/types/assessment';

interface PendingFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending';
}

interface QuestionsSectionProps {
  questions: AssessmentQuestion[];
  onAddQuestion: () => void;
  onUpdateQuestion: (index: number, question: AssessmentQuestion) => void;
  onRemoveQuestion: (index: number) => void;
  pendingFiles: Record<string, PendingFile[]>;
  onPendingFilesChange: (pendingFiles: Record<string, PendingFile[]>) => void;
}

const QuestionsSection: React.FC<QuestionsSectionProps> = ({
  questions,
  onAddQuestion,
  onUpdateQuestion,
  onRemoveQuestion,
  pendingFiles,
  onPendingFilesChange
}) => {
  
  const handlePendingFilesChange = (questionId: string, files: PendingFile[]) => {
    if (!questionId) {
      console.error('[QuestionsSection] Attempted to update pending files with undefined questionId');
      return;
    }
    
    console.log(`[QuestionsSection] Updating pendingFiles for questionId: ${questionId}`, {
      questionId,
      filesCount: files.length,
      currentPendingFiles: pendingFiles,
      newPendingFiles: { ...pendingFiles, [questionId]: files }
    });
    
    onPendingFilesChange({
      ...pendingFiles,
      [questionId]: files
    });
  };

  // Clean up pending files for removed questions
  React.useEffect(() => {
    const questionIds = new Set(questions.map(q => q.id).filter(Boolean));
    const pendingFileKeys = Object.keys(pendingFiles);
    const orphanedKeys = pendingFileKeys.filter(key => !questionIds.has(key));
    
    if (orphanedKeys.length > 0) {
      const cleanedPendingFiles = { ...pendingFiles };
      orphanedKeys.forEach(key => delete cleanedPendingFiles[key]);
      onPendingFilesChange(cleanedPendingFiles);
    }
  }, [questions, pendingFiles, onPendingFilesChange]);

  return (
    <div className="border-t border-gray-200 pt-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Questions (Yes/No)</h3>
      </div>
      
      {questions.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-gray-500 text-center">No questions added yet.</p>
            <Button 
              type="button" 
              onClick={onAddQuestion} 
              variant="secondary"
              className="mt-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Question
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => {
            // Ensure question has a valid ID - use question.id if available, otherwise generate stable fallback
            // The fallback uses index which is stable across re-renders
            const questionId = question.id || `temp_question_${index}`;
            
            if (!question.id) {
              console.warn(`[QuestionsSection] Question at index ${index} is missing an ID, using fallback: ${questionId}`);
            }
            
            // Use questionId for pendingFiles lookup - this ensures each question gets its own files
            // Always use question.id if it exists, otherwise use the stable fallback
            const lookupId = question.id || questionId;
            const questionPendingFiles = pendingFiles[lookupId] || [];
            
            // Debug logging to help identify issues
            console.log(`[QuestionsSection] Rendering question ${index + 1}`, {
              questionId: question.id,
              fallbackId: questionId,
              lookupId,
              pendingFilesKeys: Object.keys(pendingFiles),
              questionPendingFilesCount: questionPendingFiles.length
            });
            
            return (
            <QuestionEditor
                key={questionId}
              question={question}
              index={index}
              onChange={updatedQuestion => onUpdateQuestion(index, updatedQuestion)}
              onRemove={() => onRemoveQuestion(index)}
                pendingFiles={questionPendingFiles}
                onPendingFilesChange={(files) => {
                  // Always use question.id if it exists, otherwise use the stable fallback
                  const idToUse = question.id || questionId;
                  console.log(`[QuestionsSection] Updating pending files for question ${index + 1} with ID: ${idToUse}`, files);
                  handlePendingFilesChange(idToUse, files);
                }}
            />
            );
          })}
          <Button 
            type="button" 
            onClick={onAddQuestion}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionsSection;
