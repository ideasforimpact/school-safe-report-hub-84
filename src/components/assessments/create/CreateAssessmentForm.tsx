
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

interface CreateAssessmentFormProps {
  onCancel?: () => void;
}

const CreateAssessmentForm: React.FC<CreateAssessmentFormProps> = ({
  onCancel
}) => {
  const navigate = useNavigate();
  const { user, employeeData } = useAuth();
  const {
    templates
  } = useAssessment();
  const {
    employees,
    loading: employeesLoading
  } = useEmployees();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    assignedTo: '',
    targetCompletionDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error('Client ID is required to create assessments');
      return;
    }
    
    if (!formData.name.trim()) {
      toast.error('Assessment name is required');
      return;
    }
    if (!formData.templateId) {
      toast.error('Please select a template');
      return;
    }
    if (!formData.assignedTo) {
      toast.error('Please assign the assessment to a staff member');
      return;
    }
    if (!formData.targetCompletionDate) {
      toast.error('Please set a target completion date');
      return;
    }

    setIsSubmitting(true);
    try {
      // Insert assessment into database with client_id
      const {
        data,
        error
      } = await supabase.from('assessments').insert({
        name: formData.name,
        description: formData.description || null,
        template_id: formData.templateId,
        assigned_to: formData.assignedTo,
        target_completion_date: formData.targetCompletionDate,
        status: 'New',
        client_id: clientId,
        created_by: employeeData?.id || user?.id
      }).select().single();

      if (error) throw error;

      //console.log('Assessment created with client_id:', data);
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

  if (!clientId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h2 className="text-2xl font-semibold">Create Assessment</h2>
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Client Context Required</h3>
              <p className="text-gray-500">Please ensure you are logged in with a valid client context to create assessments.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (employeesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleCancel}>
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
                  onChange={e => handleInputChange('name', e.target.value)} 
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
                  onChange={e => handleInputChange('description', e.target.value)} 
                  placeholder="Enter assessment description" 
                  rows={3} 
                />
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Select Template *</Label>
                <Select value={formData.templateId} onValueChange={value => handleInputChange('templateId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
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

              {/* Assigned To */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To *</Label>
                <Select value={formData.assignedTo} onValueChange={value => handleInputChange('assignedTo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} - {employee.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {employees.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No staff members available.
                  </p>
                )}
              </div>

              {/* Target Completion Date */}
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Completion Date *</Label>
                <Input 
                  id="targetDate" 
                  type="date" 
                  value={formData.targetCompletionDate} 
                  onChange={e => handleInputChange('targetCompletionDate', e.target.value)} 
                  min={new Date().toISOString().split('T')[0]} 
                  required 
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || templates.length === 0 || employees.length === 0}>
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
