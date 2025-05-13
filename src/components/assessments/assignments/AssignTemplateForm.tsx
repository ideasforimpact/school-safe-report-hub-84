
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssignTemplateForm } from './form/useAssignTemplateForm';
import TemplateInfoSection from './form/TemplateInfoSection';
import UserSelectionSection from './form/UserSelectionSection';
import DueDateSection from './form/DueDateSection';
import FormError from './form/FormError';

const AssignTemplateForm = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const {
    users,
    selectedUsers,
    dueDate,
    formError,
    template,
    handleUserToggle,
    setDueDate,
    handleSubmit
  } = useAssignTemplateForm();
  
  if (!template) return null;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Assign Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <TemplateInfoSection template={template} />
            
            <UserSelectionSection 
              users={users}
              selectedUsers={selectedUsers}
              onUserToggle={handleUserToggle}
            />
            
            <DueDateSection 
              dueDate={dueDate}
              onChange={setDueDate}
            />
          </div>
          
          <FormError message={formError} />
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => navigate(`/assessments/templates/${templateId}`)}
        >
          Cancel
        </Button>
        <Button type="submit">
          Assign Assessment
        </Button>
      </div>
    </form>
  );
};

export default AssignTemplateForm;
