
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/AssessmentContext';
import { AssessmentTemplate } from '@/types/assessment';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
}

export const useAssignTemplateForm = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const { getTemplateById, createAssignment } = useAssessment();
  
  // Mock users - in a real app, these would come from an API
  const [users] = useState<User[]>([
    { id: 'user1', name: 'John Doe' },
    { id: 'user2', name: 'Jane Smith' },
    { id: 'user3', name: 'Mike Johnson' },
    { id: 'user4', name: 'Sarah Williams' }
  ]);
  
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [template, setTemplate] = useState<AssessmentTemplate | null>(null);
  
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

  return {
    users,
    selectedUsers,
    dueDate,
    formError,
    template,
    handleUserToggle,
    setDueDate,
    handleSubmit
  };
};
