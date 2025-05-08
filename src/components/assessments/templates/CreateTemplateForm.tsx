
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import TemplateBasicInfo from './TemplateBasicInfo';
import QuestionsSection from './QuestionsSection';
import FormError from './FormError';
import { useCreateTemplate } from '@/hooks/useCreateTemplate';

const CreateTemplateForm = () => {
  const navigate = useNavigate();
  const {
    title,
    setTitle,
    description,
    setDescription,
    type,
    setType,
    questions,
    formError,
    isSubmitting,
    handleAddQuestion,
    handleUpdateQuestion,
    handleRemoveQuestion,
    handleSubmit
  } = useCreateTemplate();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <TemplateBasicInfo
        title={title}
        setTitle={setTitle}
        description={description}
        setDescription={setDescription}
        type={type}
        setType={setType}
      />
      
      <QuestionsSection
        questions={questions}
        onAddQuestion={handleAddQuestion}
        onUpdateQuestion={handleUpdateQuestion}
        onRemoveQuestion={handleRemoveQuestion}
      />
      
      {formError && <FormError error={formError} />}
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/assessments/templates')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[100px]"
        >
          {isSubmitting ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : 'Save Template'}
        </Button>
      </div>
    </form>
  );
};

export default CreateTemplateForm;
