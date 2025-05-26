
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { assessmentTypes } from '../data/assessmentTypes';
import { toast } from 'sonner';

interface CreateAssessmentFormProps {
  onCancel?: () => void;
}

const CreateAssessmentForm: React.FC<CreateAssessmentFormProps> = ({ onCancel }) => {
  const navigate = useNavigate();
  const { templates } = useAssessment();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    assessmentType: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Assessment name is required');
      return;
    }
    
    if (!formData.templateId) {
      toast.error('Please select a template');
      return;
    }
    
    if (!formData.assessmentType) {
      toast.error('Please select an assessment type');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Here you would typically call an API to create the assessment
      // For now, we'll just show success and navigate back
      console.log('Creating assessment:', formData);
      
      toast.success('Assessment created successfully');
      
      if (onCancel) {
        onCancel();
      } else {
        navigate('/assessments');
      }
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Failed to create assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/assessments');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">Create Assessment</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Assessment Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Assessment Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter assessment name"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter assessment description"
                  rows={3}
                />
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Select Template *</Label>
                <Select 
                  value={formData.templateId} 
                  onValueChange={(value) => handleInputChange('templateId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No templates available. Please create a template first.
                  </p>
                )}
              </div>

              {/* Assessment Type */}
              <div className="space-y-2">
                <Label htmlFor="assessmentType">Assessment Type *</Label>
                <Select 
                  value={formData.assessmentType} 
                  onValueChange={(value) => handleInputChange('assessmentType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose assessment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessmentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || templates.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Assessment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAssessmentForm;
