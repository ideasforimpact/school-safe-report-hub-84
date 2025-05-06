
import { AssessmentQuestion } from '@/types/assessmentTypes';
import QuestionCard from '@/components/assessments/QuestionCard';
import QuestionForm from '@/components/assessments/QuestionForm';

interface QuestionsListProps {
  questions: AssessmentQuestion[];
  showQuestionForm: boolean;
  onEditQuestion: (id: string) => void;
  onDeleteQuestion: (id: string) => void;
  onAddQuestion: (question: Omit<AssessmentQuestion, 'id'>) => void;
  onCancelAddQuestion: () => void;
}

const QuestionsList = ({
  questions,
  showQuestionForm,
  onEditQuestion,
  onDeleteQuestion,
  onAddQuestion,
  onCancelAddQuestion
}: QuestionsListProps) => {
  return (
    <>
      {/* Questions list */}
      {questions.map(question => (
        <QuestionCard 
          key={question.id}
          question={question}
          onEdit={onEditQuestion}
          onDelete={onDeleteQuestion}
        />
      ))}
      
      {/* Add question form */}
      {showQuestionForm && (
        <QuestionForm 
          onAddQuestion={onAddQuestion} 
          onCancel={onCancelAddQuestion}
        />
      )}
    </>
  );
};

export default QuestionsList;
