import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useIncidentForm } from '@/hooks/useIncidentForm';
import { useIncidentFormValidation } from '@/hooks/incident-form/useIncidentFormValidation';
import IncidentDetailsForm from '@/components/incidents/IncidentDetailsForm';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';
import { IncidentType } from '@/types/incident';
import { Employee } from '@/types/employeeVerification';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import { Student } from '@/types/student';
import { useStudents } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useIncidentDetail } from '@/hooks/incident/useIncidentDetail';
import { useIncidentData } from '@/hooks/useIncidentData';
import { FileItem } from '@/types/fileTypes';

// Define a user type that has only the properties needed by the components
interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

// Helper function to calculate file size from base64 string
const calculateBase64FileSize = (base64String: string): number => {
  if (!base64String) return 0;
  
  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const base64Data = base64String.includes(',') 
    ? base64String.split(',')[1] 
    : base64String;
  
  // Calculate approximate file size from base64
  // Base64 encoding increases size by ~33%, so we reverse that calculation
  const padding = (base64Data.match(/=/g) || []).length;
  const approximateSize = (base64Data.length * 3) / 4 - padding;
  
  return Math.round(approximateSize);
};

const ReportIncident = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { id: incidentId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { state: employeeState } = useEmployeeStore();
  const { refetchIncidents } = useIncidentData();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFormPopulated, setIsFormPopulated] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);
  
  // Use the incident detail hook
  const { incident: existingIncident, isLoading: isLoadingIncident, error: incidentError, getFormData } = useIncidentDetail(incidentId);
  
  // Add validation hook
  const { errors, validateForm } = useIncidentFormValidation();
  
  const {
    nextTicketId,
    formData,
    supportingFiles,
    peopleInvolved,
    handleChange: formHandleChange,
    handleSelectChange: formHandleSelectChange,
    handleDateTimeChange: formHandleDateTimeChange,
    handlePersonChange,
    addPerson,
    removePerson,
    handleFilesChange,
    getSelectedLocation,
    getSelectedFacility,
    locations,
    facilities,
    reportTypes,
    categories: formCategories,
    subcategories,
    priorities,
    users: incidentUsers,
    setFormData,
    setPeopleInvolved
  } = useIncidentForm();

  // Set edit mode based on incidentId
  useEffect(() => {
    setIsEditMode(!!incidentId);
    setIsFormPopulated(false);
    setIsFormReady(false);
  }, [incidentId]);

  // Populate form data when incident is loaded - memoized to prevent infinite loops
  const populateFormData = useCallback(() => {
    if (existingIncident && !isLoadingIncident && !isFormPopulated && isEditMode) {
      console.log('Populating form data with incident:', existingIncident);
      const mappedFormData = getFormData();
      if (mappedFormData) {
        setFormData(mappedFormData);
        setPeopleInvolved(existingIncident.people_involved || []);
        
        // Convert documents to FileItem format for the supporting files
        if (existingIncident.documents && Array.isArray(existingIncident.documents)) {
          const convertedFiles: FileItem[] = existingIncident.documents.map((doc: any, index: number) => {
            const fileSize = calculateBase64FileSize(doc.data || '');
            
            return {
              id: `existing-${index}`,
              name: doc.name || `Document ${index + 1}`,
              type: doc.type || 'application/octet-stream',
              size: fileSize,
              base64: doc.data || ''
            };
          });
          handleFilesChange(convertedFiles);
          console.log('Converted documents to FileItems with proper sizes:', convertedFiles);
        }
        
        setIsFormPopulated(true);
        console.log('Form data populated successfully');
      }
    }
  }, [existingIncident, isLoadingIncident, isFormPopulated, isEditMode, getFormData, setFormData, setPeopleInvolved, handleFilesChange]);

  useEffect(() => {
    populateFormData();
  }, [populateFormData]);

  // Check if form is ready (all data loaded and populated)
  useEffect(() => {
    const isDataReady = !isLoadingEmployees && (!isEditMode || (!isLoadingIncident && isFormPopulated));
    setIsFormReady(isDataReady);
    console.log('Form ready status:', isDataReady, {
      isLoadingEmployees,
      isEditMode,
      isLoadingIncident,
      isFormPopulated
    });
  }, [isLoadingEmployees, isEditMode, isLoadingIncident, isFormPopulated]);

  // Handle incident loading error
  useEffect(() => {
    if (incidentError && isEditMode) {
      toast.error(incidentError);
      navigate('/incidents');
    }
  }, [incidentError, isEditMode, navigate]);

  // Fetch employees from the database
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        console.log('Fetching employees...');
        const fetchedEmployees = await getAllEmployeesFromApi();
        setEmployees(fetchedEmployees);
        console.log('Employees fetched successfully:', fetchedEmployees.length);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toast.error("Could not load staff members");
        setEmployees([]);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // Helper function to create a valid date from form data
  const createDateFromFormData = (dateString: string, timeString: string) => {
    try {
      // If no date is provided, use current date
      if (!dateString) {
        console.log('No date provided, using current date');
        return new Date();
      }

      // If no time is provided, use current time
      if (!timeString) {
        console.log('No time provided, using current time');
        const currentTime = new Date().toTimeString().split(' ')[0].slice(0, 5);
        timeString = currentTime;
      }

      // Create date from date and time strings
      const dateTimeString = `${dateString}T${timeString}:00`;
      console.log('Creating date from:', dateTimeString);
      
      const date = new Date(dateTimeString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date created:', dateTimeString);
        throw new Error('Invalid date');
      }

      return date;
    } catch (error) {
      console.error('Error creating date:', error);
      // Return current date as fallback
      return new Date();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Validate form including people involved
    const isValid = validateForm(formData, peopleInvolved);

    console.log(formData,"formData", errors)

    
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError || "Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && incidentId) {
        // Handle edit mode
        const dateTime = createDateFromFormData(formData.date, formData.time);
        
        const validPeople = peopleInvolved.filter(p => {
          const hasName = p.name && p.name.trim() !== '';
          const hasRole = p.role && p.role.trim() !== '';
          const hasNotes = p.notes && p.notes.trim() !== '';
          const hasAnyValue = hasName || hasRole || hasNotes;
          return hasAnyValue;
        });
        
        const documents = supportingFiles.map(file => ({
          name: file.name,
          type: file.type,
          data: file.base64
        }));
        
        const updates = {
          type_id: formData.typeId,
          category_id: formData.categoryId,
          subcategory_id: formData.subcategoryId,
          description: formData.description,
          date: dateTime.toISOString(),
          location_id: formData.locationId,
          facility_id: formData.facilityId,
          priority_id: formData.priorityId,
          status_id: formData.status,
          assigned_to: formData.owner || null,
          people_involved: validPeople,
          documents: documents
        };

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("You must be logged in to edit incidents");
          return;
        }

        const { data, error } = await supabase.functions.invoke('update-incident', {
          body: {
            incidentId: incidentId,
            updates
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Failed to update incident');
        }

        toast.success("Incident updated successfully");
        
        // Wait for refetch to complete before navigating
        console.log('Refetching incidents after edit...');
        await refetchIncidents();
        console.log('Incidents refetched successfully');
        
        // Navigate to incidents list
        navigate('/incidents');
        
      } else {
        // Handle create mode
        let employeeId = employeeState.employeeData?.id || authEmployeeData?.id;
        let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
        
        if (!employeeId && user?.email) {
          const { data: empData, error: empError } = await supabase
            .from('employees')
            .select('id, client_id')
            .eq('email', user.email.toLowerCase())
            .single();
            
          if (empData && !empError) {
            employeeId = empData.id;
            clientId = empData.client_id;
          } else {
            console.error("Failed to fetch employee data:", empError);
          }
        }
        
        if (!employeeId) {
          toast.error("Unable to identify the reporting employee. Please refresh and try again.");
          setIsSubmitting(false);
          return;
        }

        if (!clientId) {
          toast.error("Unable to identify client. Please refresh and try again.");
          setIsSubmitting(false);
          return;
        }
        
        const dateTime = createDateFromFormData(formData.date, formData.time);
        
        const validPeople = peopleInvolved.filter(p => {
          const hasName = p.name && p.name.trim() !== '';
          const hasRole = p.role && p.role.trim() !== '';
          const hasNotes = p.notes && p.notes.trim() !== '';
          const hasAnyValue = hasName || hasRole || hasNotes;
          return hasAnyValue;
        });
        
        const documents = supportingFiles.map(file => ({
          name: file.name,
          type: file.type,
          data: file.base64
        }));
        
        const incidentData = {
          typeId: formData.typeId,
          categoryId: formData.categoryId,
          subcategoryId: formData.subcategoryId || null,
          description: formData.description,
          date: dateTime.toISOString(),
          locationId: formData.locationId,
          facilityId: formData.facilityId,
          priorityId: formData.priorityId,
          peopleInvolved: validPeople,
          documents: documents,
          createdBy: employeeId,
          assignedTo: formData.owner || null,
          clientId: clientId
        };
        
        console.log('Creating new incident...');
        const { data, error } = await supabase.functions.invoke('create-incident', {
          body: incidentData
        });
        
        if (error) {
          console.error('Error from create-incident function:', error);
          throw new Error(error.message || 'Failed to create incident');
        }
        
        if (!data || !data.success) {
          console.error('Create incident function returned error:', data);
          throw new Error(data?.error || 'Failed to create incident');
        }
        
        console.log('Incident created successfully:', data);
        toast.success(`Incident reported successfully! Ticket ID: ${data.ticketId}`);
        
        // Wait for refetch to complete before navigating
        console.log('Refetching incidents after creation...');
        await refetchIncidents();
        console.log('Incidents refetched successfully');
        
        // Navigate to incidents list
        navigate('/incidents');
      }
    } catch (error) {
      console.error('Error submitting incident report:', error);
      toast.error("An error occurred while submitting the report: " + (error.message || "Please try again"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create adapter functions to handle type differences
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e && e.target) {
      formHandleChange(e.target.name, e.target.value);
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    formHandleSelectChange(name, value);
  };
  
  const handleDateTimeChange = (date: Date | undefined, timeString?: string) => {
    if (date) {
      formHandleDateTimeChange('date', date);
    }
    if (timeString) {
      formHandleDateTimeChange('time', timeString);
    }
  };

  // Map employees to the simplified UserBasicInfo type
  const mappedEmployees: UserBasicInfo[] = employees.map(employee => ({
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    name: `${employee.firstName} ${employee.lastName}`
  }));

  // Helper function to get priority name from ID
  const getPriorityName = (priorityId: string): 'Low' | 'Medium' | 'High' | 'Critical' => {
    const priority = priorities.find(p => p.id === priorityId);
    return (priority?.name as 'Low' | 'Medium' | 'High' | 'Critical') || 'Medium';
  };

  // Create a safe formData object for the component that ensures all fields are properly mapped
  const safeFormData = {
    typeId: formData.typeId,
    categoryId: formData.categoryId,
    subcategoryId: formData.subcategoryId,
    description: formData.description,
    date: formData.date,
    time: formData.time,
    locationId: formData.locationId,
    facilityId: formData.facilityId,
    priorityId: formData.priorityId,
    owner: formData.owner,
    // Legacy fields for backward compatibility - these should be derived from ID fields
    type: formData.typeId,
    subcategory: formData.subcategoryId,
    priority: getPriorityName(formData.priorityId)
  };

  // Show loading state until form is completely ready
  if (!isFormReady) {
    const loadingMessage = isEditMode 
      ? (isLoadingIncident ? 'Loading incident details...' : 'Populating form data...') 
      : 'Loading form data...';

    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden bg-gray-50 min-h-screen">
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Incident' : 'Report New Incident'}
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                {loadingMessage}
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  {loadingMessage}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden bg-gray-50 min-h-screen">
        {/* Header section matching the design */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Incident' : 'Report New Incident'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Document safety incidents, near misses, or unsafe conditions
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="w-full">
            <Card className="border-none shadow-none bg-gray-50">
              <CardContent className="space-y-6 px-8 py-8">
                <IncidentDetailsForm
                  formData={safeFormData}
                  onChange={handleChange}
                  onSelectChange={handleSelectChange} 
                  onDateTimeChange={handleDateTimeChange}
                  supportingFiles={supportingFiles}
                  onFilesChange={handleFilesChange}
                />

                <PeopleInvolvedSection
                  peopleInvolved={peopleInvolved}
                  onPersonChange={handlePersonChange}
                  onAddPerson={addPerson}
                  onRemovePerson={removePerson}
                  students={students}
                  employees={mappedEmployees}
                  errors={errors}
                />
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-white px-8 py-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate(isEditMode ? `/incident/${incidentId}` : '/dashboard')}
                  className="px-6 border-gray-300"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (isEditMode ? "Saving..." : "Submitting...") : (isEditMode ? "Save Changes" : "Submit Report")}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ReportIncident;
