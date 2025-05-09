
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/AssessmentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Users, Calendar } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const AssignTemplateForm = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const { getTemplateById, createAssignment } = useAssessment();
  const { user } = useAuth();
  
  // In a real app, you would fetch users from the API
  // For now, let's use dummy data
  const [users] = useState<User[]>([
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' },
    { id: 'user3', name: 'Mike Johnson' },
    { id: 'user4', name: 'Sarah Williams' }
  ]);
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [template, setTemplate] = useState<any>(null);
  
  useEffect(() => {
    if (!templateId) {
      toast.error('No template ID provided');
      navigate('/assessments/templates');
      return;
    }
    
    const foundTemplate = getTemplateById(templateId);
    setTemplate(foundTemplate);
    
    if (!foundTemplate) {
      toast.error('Template not found');
      navigate('/assessments/templates');
    }
  }, [templateId, getTemplateById, navigate]);
  
  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  const validateForm = () => {
    if (selectedUsers.length === 0) {
      setFormError('Please select at least one user');
      return false;
    }
    
    if (!dueDate) {
      setFormError('Please set a due date');
      return false;
    }
    
    setFormError(null);
    return true;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !template) return;
    
    // Create assignments for each selected user
    selectedUsers.forEach(userId => {
      const userName = users.find(user => user.id === userId)?.name || 'Unknown User';
      
      createAssignment({
        templateId: template.id,
        userId,
        userName,
        dueDate: new Date(dueDate).toISOString()
      });
    });
    
    // Show success message
    toast.success(`Assessment assigned to ${selectedUsers.length} user(s)`);
    
    // Navigate to assignments list
    navigate('/assessments/assignments');
  };
  
  if (!template) return null;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Assign Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Template Information</h3>
              <p className="text-gray-500 mb-2">You are assigning the following template:</p>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-medium">{template.title}</p>
                <p className="text-sm text-gray-600">{template.description}</p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {template.type}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {template.questions.length} questions
                  </span>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center mb-2">
                <Users className="h-5 w-5 text-gray-500 mr-2" />
                <Label className="text-lg font-medium">Select Users</Label>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Choose the users who should complete this assessment.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md">
                    <Checkbox 
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleUserToggle(user.id)}
                    />
                    <Label htmlFor={`user-${user.id}`}>{user.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center mb-2">
                <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                <Label htmlFor="dueDate" className="text-lg font-medium">Due Date</Label>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Set the deadline for completing this assessment.
              </p>
              <Input 
                id="dueDate" 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="max-w-xs"
              />
            </div>
          </div>
          
          {formError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 rounded-md p-3 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
              <p className="text-sm">{formError}</p>
            </div>
          )}
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

interface User {
  id: string;
  name: string;
}

export default AssignTemplateForm;
