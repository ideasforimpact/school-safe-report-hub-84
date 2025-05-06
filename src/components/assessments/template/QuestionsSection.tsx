
import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { AssessmentQuestion, AssessmentTemplate } from '@/types/assessmentTypes';
import EmptyQuestionState from './questions/EmptyQuestionState';
import QuestionsList from './questions/QuestionsList';
import QuestionsHeader from './questions/QuestionsHeader';
import { Plus } from 'lucide-react';

interface QuestionsSectionProps {
  template: AssessmentTemplate;
  onAddQuestion: (question: Omit<AssessmentQuestion, 'id'>) => void;
  onEditQuestion: (questionId: string) => void;
  onDeleteQuestion: (questionId: string) => void;
}

const QuestionsSection = ({ 
  template, 
  onAddQuestion, 
  onEditQuestion, 
  onDeleteQuestion 
}: QuestionsSectionProps) => {
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  
  const handleAddQuestion = (question: Omit<AssessmentQuestion, 'id'>) => {
    onAddQuestion(question);
    setShowQuestionForm(false);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <QuestionsHeader 
          questionsCount={template.questions.length}
          onAddQuestion={() => setShowQuestionForm(true)}
          showQuestionForm={showQuestionForm}
        />
      </CardHeader>
      <CardContent>
        {template.questions.length === 0 && !showQuestionForm ? (
          <EmptyQuestionState 
            onAddFirstQuestion={() => setShowQuestionForm(true)} 
          />
        ) : (
          <QuestionsList 
            questions={template.questions}
            showQuestionForm={showQuestionForm}
            onEditQuestion={onEditQuestion}
            onDeleteQuestion={onDeleteQuestion}
            onAddQuestion={handleAddQuestion}
            onCancelAddQuestion={() => setShowQuestionForm(false)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionsSection;
