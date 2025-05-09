
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssessment } from '@/contexts/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from '@/components/ui/date-picker';
import { addDays } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth/AuthContext';
import { User } from '@/contexts/auth/types';
import { formatUserFullName } from '@/utils/userUtils';

const BulkAssignForm = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const { templates, createAssignment, getTemplateById } = useAssessment();
  const { users } = useAuth();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(addDays(new Date(), 7));
  const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({});
  const [selectAll, setSelectAll] = useState(false);
  
  // Filter out users from the auth context (mock for now)
  const availableUsers = users?.filter(user => user.role === 'user' || user.role === 'admin') || [];
  
  // Set template from URL parameter if available
  useEffect(() => {
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        setSelectedTemplateId(templateId);
      } else {
        toast.error('Template not found');
        navigate('/assessments/templates');
      }
    }
  }, [templateId, getTemplateById, navigate]);
  
  // Handle template selection
  const handleTemplateChange = (value: string) => {
    setSelectedTemplateId(value);
  };
  
  // Handle user selection
  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev => ({
      ...prev,
      [userId]: checked
    }));
    
    // Update selectAll state if all users are now selected or not
    const updatedSelection = { ...selectedUsers, [userId]: checked };
    const allSelected = availableUsers.every(user => updatedSelection[user.id]);
    setSelectAll(allSelected);
  };
  
  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    
    const newSelection: Record<string, boolean> = {};
    availableUsers.forEach(user => {
      newSelection[user.id] = checked;
    });
    
    setSelectedUsers(newSelection);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }
    
    if (!dueDate) {
      toast.error('Please select a due date');
      return;
    }
    
    const selectedUserIds = Object.entries(selectedUsers)
      .filter(([_, selected]) => selected)
      .map(([userId]) => userId);
      
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one user');
      return;
    }
    
    // Create assignments for each selected user
    let assignedCount = 0;
    
    selectedUserIds.forEach(userId => {
      const user = availableUsers.find(u => u.id === userId);
      if (user) {
        createAssignment({
          templateId: selectedTemplateId,
          userId: user.id,
          userName: formatUserFullName(user),
          dueDate: dueDate.toISOString()
        });
        assignedCount++;
      }
    });
    
    toast.success(`Assessment assigned to ${assignedCount} users`);
    navigate('/assessments/assignments');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bulk Assign Assessment</h2>
        <Button variant="outline" onClick={() => navigate('/assessments/templates')}>
          Cancel
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>Select a template and users to assign</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Template Selection */}
            <div className="space-y-2">
              <Label htmlFor="template">Assessment Template</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Due Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <DatePicker
                date={dueDate}
                onChange={setDueDate}
              />
            </div>
            
            {/* Users Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Users</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all"
                    checked={selectAll}
                    onCheckedChange={(checked) => 
                      handleSelectAll(checked === true)
                    }
                  />
                  <Label htmlFor="select-all" className="text-sm">Select All</Label>
                </div>
              </div>
              
              <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                {availableUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No users available</p>
                ) : (
                  availableUsers.map(user => (
                    <div key={user.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`user-${user.id}`} 
                        checked={selectedUsers[user.id] || false}
                        onCheckedChange={(checked) => 
                          handleSelectUser(user.id, checked === true)
                        }
                      />
                      <Label 
                        htmlFor={`user-${user.id}`} 
                        className="flex-grow"
                      >
                        {formatUserFullName(user)}
                      </Label>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full">
                Assign Assessment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkAssignForm;
