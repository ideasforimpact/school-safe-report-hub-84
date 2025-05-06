
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '@/contexts/AssessmentContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, AlertTriangle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import QuestionEditor from './QuestionEditor';
import { AssessmentQuestion } from '@/types/assessment';
import { toast } from 'sonner';

const CreateTemplateForm = () => {
  const navigate = useNavigate();
  const { createTemplate, addQuestion } = useAssessment();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Safety');
  const [questions, setQuestions] = useState<Omit<AssessmentQuestion, 'id'>[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        allowComments: false,
        allowAttachments: false,
        required: true
      }
    ]);
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: Omit<AssessmentQuestion, 'id'>) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!title.trim()) {
      setFormError('Template title is required');
      return false;
    }
    
    if (questions.length === 0) {
      setFormError('At least one question is required');
      return false;
    }
    
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        setFormError(`Question ${i + 1} text is required`);
        return false;
      }
    }
    
    setFormError(null);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    // Create template
    const templateId = createTemplate({
      title,
      description,
      type,
      questions: []
    });
    
    // Add questions to template
    questions.forEach(question => {
      addQuestion(templateId, question);
    });
    
    toast.success('Template created successfully');
    
    // Navigate to templates list
    navigate('/assessments/templates');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Template Title</Label>
          <Input 
            id="title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter template title"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of this assessment template"
            className="mt-1"
            rows={3}
          />
        </div>
        
        <div>
          <Label>Template Type</Label>
          <RadioGroup 
            value={type} 
            onValueChange={setType}
            className="flex space-x-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Safety" id="safety" />
              <Label htmlFor="safety">Safety</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Compliance" id="compliance" />
              <Label htmlFor="compliance">Compliance</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Risk" id="risk" />
              <Label htmlFor="risk">Risk</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Questions (Yes/No)</h3>
          <Button 
            type="button" 
            onClick={handleAddQuestion}
            variant="outline"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
        
        {questions.length === 0 ? (
          <Card className="bg-gray-50">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <p className="text-gray-500 text-center">No questions added yet.</p>
              <Button 
                type="button" 
                onClick={handleAddQuestion} 
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
            {questions.map((question, index) => (
              <QuestionEditor
                key={index}
                question={question}
                index={index}
                onChange={updatedQuestion => handleUpdateQuestion(index, updatedQuestion)}
                onRemove={() => handleRemoveQuestion(index)}
              />
            ))}
          </div>
        )}
      </div>
      
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
          <p className="text-sm">{formError}</p>
        </div>
      )}
      
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
