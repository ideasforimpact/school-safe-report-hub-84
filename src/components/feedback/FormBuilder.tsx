
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  PlusCircle, 
  X, 
  GripVertical, 
  AlignLeft, 
  CheckSquare, 
  CircleDot 
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useFeedback } from '@/contexts/feedback/FeedbackContext';
import { FormQuestion, FormQuestionType } from '@/contexts/feedback/types';
import { FeedbackForm } from '@/types/feedbackTypes';

interface FormBuilderProps {
  formId: string | null;
  onClose: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ formId, onClose }) => {
  const { forms, addForm, updateForm } = useFeedback();
  
  const initialForm: FeedbackForm = {
    id: '',
    title: '',
    description: '',
    questions: [],
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    submissions: 0
  };

  const [form, setForm] = useState<FeedbackForm>(initialForm);
  const isEditing = !!formId;

  useEffect(() => {
    if (formId) {
      const existingForm = forms.find(f => f.id === formId);
      if (existingForm) {
        setForm(existingForm);
      }
    }
  }, [formId, forms]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({...form, title: e.target.value});
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm({...form, description: e.target.value});
  };

  const handleAddQuestion = () => {
    const newQuestion: FormQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'text',
      required: true,
      options: []
    };
    
    setForm({
      ...form, 
      questions: [...form.questions, newQuestion]
    });
  };

  const handleQuestionChange = (questionId: string, field: keyof FormQuestion, value: any) => {
    setForm({
      ...form,
      questions: form.questions.map(q => 
        q.id === questionId ? { ...q, [field]: value } : q
      )
    });
  };

  const handleOptionChange = (questionId: string, index: number, value: string) => {
    setForm({
      ...form,
      questions: form.questions.map(q => {
        if (q.id === questionId) {
          const options = [...q.options];
          options[index] = value;
          return { ...q, options };
        }
        return q;
      })
    });
  };

  const handleAddOption = (questionId: string) => {
    setForm({
      ...form,
      questions: form.questions.map(q => {
        if (q.id === questionId) {
          return { ...q, options: [...q.options, ''] };
        }
        return q;
      })
    });
  };

  const handleRemoveOption = (questionId: string, index: number) => {
    setForm({
      ...form,
      questions: form.questions.map(q => {
        if (q.id === questionId) {
          const options = [...q.options];
          options.splice(index, 1);
          return { ...q, options };
        }
        return q;
      })
    });
  };

  const handleRemoveQuestion = (questionId: string) => {
    setForm({
      ...form,
      questions: form.questions.filter(q => q.id !== questionId)
    });
  };

  const handleSubmit = () => {
    if (isEditing) {
      updateForm({
        ...form,
        updatedAt: new Date().toISOString()
      });
    } else {
      addForm({
        ...form,
        id: `form_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    onClose();
  };

  const getQuestionTypeIcon = (type: FormQuestionType) => {
    switch(type) {
      case 'text':
        return <AlignLeft className="h-4 w-4" />;
      case 'checkbox':
        return <CheckSquare className="h-4 w-4" />;
      case 'radio':
        return <CircleDot className="h-4 w-4" />;
      default:
        return <AlignLeft className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Form' : 'Create New Form'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Form Basics */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title</Label>
              <Input 
                id="title" 
                value={form.title} 
                onChange={handleTitleChange}
                placeholder="Enter form title"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={form.description} 
                onChange={handleDescriptionChange}
                placeholder="Enter form description"
                className="mt-1"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="active" 
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({...form, isActive: checked})} 
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Questions</h3>
              <Button onClick={handleAddQuestion} size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Add Question
              </Button>
            </div>
            
            {form.questions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <p className="text-gray-500">No questions added yet.</p>
                <Button onClick={handleAddQuestion} variant="outline" className="mt-2">
                  Add Your First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {form.questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className="p-4 border rounded-md bg-gray-50"
                  >
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                        <span className="font-medium">Question {index + 1}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveQuestion(question.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`question-${question.id}`}>Question Text</Label>
                        <Input 
                          id={`question-${question.id}`}
                          value={question.text} 
                          onChange={(e) => handleQuestionChange(question.id, 'text', e.target.value)}
                          placeholder="Enter question text"
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-4">
                        <div className="w-full md:w-[calc(50%-0.5rem)]">
                          <Label htmlFor={`type-${question.id}`}>Question Type</Label>
                          <Select 
                            value={question.type} 
                            onValueChange={(value) => handleQuestionChange(
                              question.id, 
                              'type', 
                              value as FormQuestionType
                            )}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">
                                <div className="flex items-center gap-2">
                                  <AlignLeft className="h-4 w-4" />
                                  <span>Text</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="checkbox">
                                <div className="flex items-center gap-2">
                                  <CheckSquare className="h-4 w-4" />
                                  <span>Checkbox</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="radio">
                                <div className="flex items-center gap-2">
                                  <CircleDot className="h-4 w-4" />
                                  <span>Multiple Choice</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-auto">
                          <Switch 
                            id={`required-${question.id}`}
                            checked={question.required}
                            onCheckedChange={(checked) => handleQuestionChange(question.id, 'required', checked)} 
                          />
                          <Label htmlFor={`required-${question.id}`}>Required</Label>
                        </div>
                      </div>
                      
                      {/* Options for checkbox and radio types */}
                      {(question.type === 'checkbox' || question.type === 'radio') && (
                        <div className="space-y-2">
                          <Label>Options</Label>
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-2">
                              {getQuestionTypeIcon(question.type)}
                              <Input 
                                value={option} 
                                onChange={(e) => handleOptionChange(question.id, optIndex, e.target.value)}
                                placeholder={`Option ${optIndex + 1}`}
                              />
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveOption(question.id, optIndex)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAddOption(question.id)} 
                            className="mt-2"
                          >
                            Add Option
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!form.title || form.questions.length === 0}>
            {isEditing ? 'Update' : 'Create'} Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FormBuilder;
