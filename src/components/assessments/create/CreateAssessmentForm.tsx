
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '@/contexts/assessment/AssessmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader, AlertCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';
import { assessmentNotificationService } from '@/services/notification/assessmentNotificationService';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { useRef } from 'react';
interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department: {
    department_name: string;
  }| null;
}

interface CreateAssessmentFormProps { 
  onCancel?: () => void;
}

const CreateAssessmentForm: React.FC<CreateAssessmentFormProps> = ({
  onCancel
}) => {
  const navigate = useNavigate();
  const { user, employeeData } = useAuth();
  const { templates } = useAssessment();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Employee management state
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    templateId: '',
    assignedTo: '',
    targetCompletionDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [existingAssessments, setExistingAssessments] = useState<string[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(true);

  // Get client_id from either employeeData or user context
  const clientId = employeeData?.clientId || user?.clientId;

  // Fetch employees filtered by client_id
  const fetchEmployees = useCallback(async () => {
    if (!clientId) {
        console.log('No client ID available for fetching employees');
        setEmployeesLoading(false);
        return;
      }

      try {
        setEmployeesLoading(true);
        console.log('Fetching employees for client:', clientId);

        const { data: employeesData, error } = await supabase
          .from('employees')
          .select(`
          id,
          first_name,
          last_name,
          email,
          department (
              department_name
            )
        `)
          .eq('client_id', clientId)
          .eq('status', true)
          .order('first_name');

        if (error) {
          console.error('Error fetching employees:', error);
          toast.error('Failed to load employees');
          return;
        }

        console.log('Fetched employees:', employeesData);
        setEmployees(employeesData || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setEmployeesLoading(false);
      }
  }, [clientId]);


    useEffect(() => {
      fetchEmployees();
    }, [fetchEmployees]);

  // Fetch existing assessment names for duplicate validation
  const fetchExistingAssessments = useCallback(async () => {
    if (!clientId) {
      setAssessmentsLoading(false);
      return;
    }

    try {
      setAssessmentsLoading(true);
      console.log('Fetching existing assessments for client:', clientId);

      const { data: assessmentsData, error } = await supabase
        .from('assessments')
        .select('name')
        .eq('client_id', clientId);

      if (error) {
        console.error('Error fetching existing assessments:', error);
        return;
      }

      const assessmentNames = assessmentsData?.map(assessment => assessment.name.toLowerCase()) || [];
      console.log('Existing assessment names:', assessmentNames);
      setExistingAssessments(assessmentNames);
    } catch (error) {
      console.error('Error fetching existing assessments:', error);
    } finally {
      setAssessmentsLoading(false);
    }

  }, [clientId]);

    useEffect(() => {
      fetchExistingAssessments();
    }, [fetchExistingAssessments]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsDropdownOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    // Find the selected employee
    const selectedEmployee = employees.find(emp => emp.id === formData.assignedTo);
    const selectedEmployeeDisplay = selectedEmployee 
      ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} (${selectedEmployee.email})` 
      : '';

  // Validation function for assessment name (no special characters allowed)
  const isValidAssessmentName = (value: string) => {
    return /^[a-zA-Z0-9\s]{1,25}$/.test(value);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Validate assessment name
    if (field === 'name') {
      if (value === '') {
        setNameError(null);
      } else if (!isValidAssessmentName(value)) {
        setNameError('Assessment name can only contain letters, numbers, and spaces (max 25 characters)');
      } else if (existingAssessments.includes(value.toLowerCase().trim())) {
        setNameError('An assessment with this name already exists. Please choose a different name.');
      } else {
        setNameError(null);
      }
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
  handleInputChange('assignedTo', employee.id);
  setSearchQuery(
    `${employee.first_name} ${employee.last_name} (${employee.email})`
  );
  setIsDropdownOpen(false);
};


  // Filter employees based on search query
 const filteredEmployees = searchQuery
  ? employees.filter(employee => {
      const fullName = `${employee.first_name} ${employee.last_name}`;
      const searchTerm = searchQuery.toLowerCase();

      return (
        fullName.toLowerCase().includes(searchTerm) ||
        employee.email.toLowerCase().includes(searchTerm) ||
        employee.department?.department_name
          ?.toLowerCase()
          .includes(searchTerm)
      );
    })
  : employees;


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
    if (nameError) {
      toast.error('Please fix the assessment name validation errors');
      return;
    }
    
    // Check for duplicate assessment name
    if (existingAssessments.includes(formData.name.toLowerCase().trim())) {
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

      console.log('Assessment created with client_id:', data);

      // Send notification if assigned to someone (and not self-assigned)
      if (formData.assignedTo && formData.assignedTo !== employeeData?.id) {
        console.log('Sending assessment assigned notification...');
        
        try {
          // Get assignee details
          const { data: assignee, error: assigneeError } = await supabase
            .from('employees')
            .select('id, email, first_name, last_name')
            .eq('id', formData.assignedTo)
            .single();

          if (assigneeError) {
            console.error('Error fetching assignee:', assigneeError);
          } else if (assignee) {
            const notificationResult = await assessmentNotificationService.queueAssessmentAssignedNotification(
              {
                id: data.id,
                title: data.name,
                target_completion_date: data.target_completion_date,
                assigned_to: data.assigned_to,
                created_by: data.created_by,
                client_id: data.client_id
              },
              assignee,
              employeeData
            );
            
            console.log('Assessment assignment notification queued:', notificationResult);
          }
        } catch (notificationError) {
          console.error('Error queueing assessment assignment notification:', notificationError);
          // Don't fail the assessment creation if notification fails
        }
      }

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
  const handleAssessmentUpdate = useCallback(async () => {
    await fetchExistingAssessments();
  }, [fetchExistingAssessments]);
  const handleEmployeeUpdate = useCallback(async () => {
    await fetchEmployees();
  }, [fetchEmployees]);

  useRealTimeSubHook({
    channelName: `employees-${clientId}`,
    events: "*",
    table: "employees",
    enabled: !!clientId,
    onPayload: handleEmployeeUpdate,
  });

  useRealTimeSubHook({
    channelName: `assessment-${clientId}`,
    events: "*",
    table: "assessments",
    enabled: !!clientId,
    onPayload: handleAssessmentUpdate,
  });
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCancel} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          Create Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
              {/* Assessment Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Assessment Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="name" 
                  type="text" 
                  value={formData.name} 
                  onChange={e => handleInputChange('name', e.target.value)} 
                  placeholder="Enter assessment name" 
                  required 
                  maxLength={25}
                  className={nameError ? 'border-red-500' : ''}
                />
                {nameError && (
                  <p className="text-sm text-red-500 mt-1">{nameError}</p>
                )}
                <p className="text-xs text-gray-500 text-right">
                  {formData.name.length}/25 characters
                </p>
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
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 text-right">
                  {formData.description.length}/200 characters
                </p>
              </div>

              {/* Template Selection */}
              <div className="space-y-2">
                <Label htmlFor="template">Select Template <span className="text-red-500">*</span></Label>
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

              {/* Assigned To with Search */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To <span className="text-red-500">*</span></Label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Search by name, email, or department..."
                      className="w-full pr-8"
                      required
                    />
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>

                  {isDropdownOpen && filteredEmployees.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      <ul className="py-1 text-sm">
                        {filteredEmployees.map((employee) => (
                          <li
                            key={employee.id}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSelectEmployee(employee)}
                          >
                            <div className="font-medium">
                              {employee.first_name} {employee.last_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {employee.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {employee.department?.department_name || 'No department'}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {isDropdownOpen && searchQuery && filteredEmployees.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                      <p className="p-3 text-sm text-gray-500">No employees found</p>
                    </div>
                  )}
                </div>

                {employees.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No staff members available for this client.
                  </p>
                )}
              </div>

              {/* Target Completion Date */}
              <div className="space-y-2">
                <Label htmlFor="targetDate">Target Completion Date <span className="text-red-500">*</span></Label>
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
              <Button
                type="submit" disabled={
                  isSubmitting ||
                  templates.length === 0 ||
                  employees.length === 0 ||
                  !!nameError ||
                  !formData.name.trim() ||
                  !formData.templateId ||
                  !formData.assignedTo ||
                  !formData.targetCompletionDate
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Assessment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
  );
};

export default CreateAssessmentForm;
