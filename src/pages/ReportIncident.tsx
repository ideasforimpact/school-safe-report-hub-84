import { useState, useEffect } from 'react';
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
import { IncidentType, IncidentCategory, IncidentLocation } from '@/types/incident';
import { Employee } from '@/types/employeeVerification';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import { Student } from '@/types/student';
import { useStudents } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useIncidents } from '@/contexts/incident';

// Define a user type that has only the properties needed by the components
interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

const ReportIncident = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { id: incidentId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { state: employeeState } = useEmployeeStore();
  const { getIncident } = useIncidents();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingIncident, setExistingIncident] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
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

  // Check if we're in edit mode and load existing incident
  useEffect(() => {
    if (incidentId) {
      setIsEditMode(true);
      console.log('=== EDIT MODE INITIALIZATION ===');
      console.log('Incident ID:', incidentId);
      console.log('Available reference data:', {
        reportTypes: reportTypes.length,
        categories: formCategories.length,
        subcategories: subcategories.length,
        locations: locations.length,
        facilities: facilities.length,
        priorities: priorities.length
      });
      
      // Only try to get incident if we have reference data loaded
      if (reportTypes.length > 0 && formCategories.length > 0 && locations.length > 0 && !isDataLoaded) {
        try {
          const incident = getIncident(incidentId);
          console.log('=== INCIDENT DATA RETRIEVED ===');
          console.log('Full incident object:', incident);
          
          if (incident) {
            setExistingIncident(incident);
            
            // Populate form with existing data
            const incidentDate = new Date(incident.date);
            const dateString = incidentDate.toISOString().split('T')[0];
            const timeString = incidentDate.toTimeString().split(' ')[0].slice(0, 5);
            
            console.log('=== MAPPING INCIDENT DATA TO FORM ===');
            console.log('Incident type:', incident.type);
            console.log('Incident category:', incident.category);
            console.log('Incident subcategory:', incident.subcategory);
            console.log('Incident location:', incident.location);
            console.log('Incident facility:', incident.facility);
            console.log('Incident priority:', incident.priority);
            
            // Find matching IDs from the reference data
            const typeMatch = reportTypes.find(t => t.name === incident.type);
            const categoryMatch = formCategories.find(c => c.name === incident.category);
            const subcategoryMatch = subcategories.find(s => s.name === incident.subcategory);
            const locationMatch = locations.find(l => l.name === incident.location);
            const facilityMatch = facilities.find(f => f.name === incident.facility);
            const priorityMatch = priorities.find(p => p.name === incident.priority);
            
            console.log('=== REFERENCE DATA MATCHES ===');
            console.log('Type match:', typeMatch);
            console.log('Category match:', categoryMatch);
            console.log('Subcategory match:', subcategoryMatch);
            console.log('Location match:', locationMatch);
            console.log('Facility match:', facilityMatch);
            console.log('Priority match:', priorityMatch);
            
            const updatedFormData = {
              type: (incident.type || '') as IncidentType | '',
              typeId: typeMatch?.id || '',
              categoryId: categoryMatch?.id || '',
              subcategory: incident.subcategory || '',
              subcategoryId: subcategoryMatch?.id || '',
              description: incident.description || '',
              date: dateString,
              time: timeString,
              locationId: locationMatch?.id || '',
              facilityId: facilityMatch?.id || '',
              priority: (incident.priority as 'Low' | 'Medium' | 'High' | 'Critical') || 'Medium',
              priorityId: priorityMatch?.id || '',
              owner: incident.owner?.id || '',
              status: incident.status || 'Open'
            };
            
            console.log('=== FINAL FORM DATA ===');
            console.log('Updated form data:', updatedFormData);
            
            setFormData(updatedFormData);
            setPeopleInvolved(incident.peopleInvolved || []);
            setIsDataLoaded(true);
            console.log('Form data populated successfully');
          } else {
            console.log('No incident found with ID:', incidentId);
            toast.error('Incident not found');
            navigate('/incidents');
          }
        } catch (error) {
          console.error('Error loading incident:', error);
          toast.error('Failed to load incident data');
        }
      }
    }
  }, [incidentId, getIncident, reportTypes, formCategories, subcategories, locations, facilities, priorities, setFormData, setPeopleInvolved, navigate, isDataLoaded]);

  // Log form data changes to debug
  useEffect(() => {
    if (isEditMode) {
      console.log('=== FORM DATA CHANGE DEBUG ===');
      console.log('Current form data:', formData);
      console.log('Type ID:', formData.typeId, 'Type:', formData.type);
      console.log('Category ID:', formData.categoryId);
      console.log('Subcategory ID:', formData.subcategoryId, 'Subcategory:', formData.subcategory);
      console.log('Location ID:', formData.locationId);
      console.log('Facility ID:', formData.facilityId);
      console.log('Priority ID:', formData.priorityId, 'Priority:', formData.priority);
    }
  }, [formData, isEditMode]);

  // Fetch employees from the database
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        console.log("Fetching employees from API service...");
        const fetchedEmployees = await getAllEmployeesFromApi();
        console.log(`Fetched ${fetchedEmployees.length} employees successfully:`, fetchedEmployees);
        setEmployees(fetchedEmployees);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Validate form including people involved
    const isValid = validateForm(formData, peopleInvolved);
    
    if (!isValid) {
      const firstError = Object.values(errors)[0];
      toast.error(firstError || "Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode && incidentId) {
        // Handle edit mode
        const dateTime = formData.date && formData.time 
          ? new Date(`${formData.date}T${formData.time}`) 
          : new Date();
        
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

        console.log('Submitting incident update:', { incidentId, updates });

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

        console.log('Incident updated successfully:', data);
        toast.success("Incident updated successfully");
        navigate(`/incident/${incidentId}`);
        
      } else {
        // Handle create mode (existing logic)
        let employeeId = employeeState.employeeData?.id || authEmployeeData?.id;
        let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
        
        if (!employeeId && user?.email) {
          console.log("Fetching employee data from database for email:", user.email);
          const { data: empData, error: empError } = await supabase
            .from('employees')
            .select('id, client_id')
            .eq('email', user.email.toLowerCase())
            .single();
            
          if (empData && !empError) {
            employeeId = empData.id;
            clientId = empData.client_id;
            console.log("Found employee data:", { employeeId, clientId });
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
        
        const dateTime = formData.date && formData.time 
          ? new Date(`${formData.date}T${formData.time}`) 
          : new Date();
        
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
        
        console.log("Calling create-incident edge function with data:", incidentData);
        
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
    console.log('=== SELECT CHANGE DEBUG ===');
    console.log('Field:', name, 'Value:', value);
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

  // Create a safe formData object for the component that ensures priority is never empty
  const safeFormData = {
    ...formData,
    priority: formData.priority || 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical'
  };

  console.log('=== RENDER DEBUG ===');
  console.log('Is edit mode:', isEditMode);
  console.log('Is data loaded:', isDataLoaded);
  console.log('Safe form data for rendering:', safeFormData);

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
