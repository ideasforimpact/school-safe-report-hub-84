
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

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submission triggered');
    
    try {
      await handleSubmit(e);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Assessment Template</h1>
        <p className="text-gray-500 mt-1">
          Create a new template for conducting assessments.
        </p>
      </div>
      
      <form onSubmit={onFormSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
    </div>
  );
};

export default CreateTemplateForm;
