
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Define a user type that has only the properties needed by the components
interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

const ReportIncident = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { state: employeeState } = useEmployeeStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
    users: incidentUsers
  } = useIncidentForm();

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
      // Get employee data - prioritize Redux store, then auth context, then fetch from DB
      let employeeId = employeeState.employeeData?.id || authEmployeeData?.id;
      let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
      
      // If we don't have employee data, try to fetch it from database
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
      
      // Combine date and time if both are provided
      const dateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`) 
        : new Date();
      
      // Filter out empty people and validate that if people are added, they are complete
      const validPeople = peopleInvolved.filter(p => {
        const hasName = p.name && p.name.trim() !== '';
        const hasRole = p.role && p.role.trim() !== '';
        const hasNotes = p.notes && p.notes.trim() !== '';
        const hasAnyValue = hasName || hasRole || hasNotes;
        return hasAnyValue;
      });
      
      // Process supporting documents
      const documents = supportingFiles.map(file => ({
        name: file.name,
        type: file.type,
        data: file.base64
      }));
      
      // Prepare incident data for the edge function
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
      
      // Call the create-incident edge function directly
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
      
      // Navigate to incidents page
      navigate('/incidents');
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

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-bold">Report New Incident</h1>
          <p className="text-gray-600 mt-1">
            Document safety incidents, near misses, or unsafe conditions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <Card className="border-none shadow-card pt-6">
            <CardContent className="space-y-6 px-6">
              <IncidentDetailsForm
                formData={formData}
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
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

export default ReportIncident;
