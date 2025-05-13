
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
      
      <FormError error={formError} />
      
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate('/assessments/templates')}
        >
          Cancel
        </Button>
        <Button type="submit">
          Save Template
        </Button>
      </div>
    </form>
  );
};

export default CreateTemplateForm;
