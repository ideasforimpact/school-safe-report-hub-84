
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
  const { user } = useAuth();
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
        // Store the employees with verification type
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
    
    if (isSubmitting) return; // Prevent duplicate submissions
    
    // Validate form including people involved
    const isValid = validateForm(formData, peopleInvolved);
    
    if (!isValid) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.categoryId) {
        toast.error("Please select a category");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.locationId) {
        toast.error("Please select a location");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.description || formData.description.trim() === '') {
        toast.error("Please provide a description of the incident");
        setIsSubmitting(false);
        return;
      }
      
      // Get employee ID from Redux store
      const createdBy = employeeState.employeeData?.id;
      if (!createdBy) {
        toast.error("Unable to identify the reporting employee. Please refresh and try again.");
        setIsSubmitting(false);
        return;
      }

      // Get client ID from Redux store
      const clientId = employeeState.employeeData?.clientId;
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
        const hasAnyValue = p.name.trim() !== '' || p.role !== 'Student' || p.notes?.trim() !== '';
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
        peopleInvolved: validPeople, // Send as array of objects
        documents: documents,
        createdBy: createdBy,
        assignedTo: formData.owner || null,
        clientId: clientId // Include client_id
      };
      
      console.log("Submitting incident with data:", incidentData);
      
      // Call the edge function to create the incident
      const { data, error } = await supabase.functions.invoke('create-incident', {
        body: incidentData
      });
      
      if (error) {
        console.error('Error creating incident:', error);
        throw new Error(error.message || 'Failed to create incident');
      }
      
      console.log('Incident created successfully:', data);
      toast.success("Incident reported successfully!");
      
      // Navigation happens after successful submission
      navigate('/incidents');
    } catch (error) {
      console.error('Error submitting form:', error);
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
                employees={mappedEmployees} // Pass the simplified user objects
                errors={errors} // Pass validation errors
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
