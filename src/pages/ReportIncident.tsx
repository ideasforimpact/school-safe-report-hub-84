import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useIncidentFormData } from '@/hooks/useIncidentFormData';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useIncidentDetail } from '@/hooks/incident/useIncidentDetail';
import { incidentDataService } from '@/services/incident/incidentDataService';
import { FileItem } from '@/types/fileTypes';
import IncidentCreationOverlay from '@/components/incident/IncidentCreationOverlay';
import { ArrowLeft } from 'lucide-react';
import Loader from '@/components/common/Loader';

// Define a user type that has only the properties needed by the components
interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

const ReportIncident = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { state: employeeState } = useEmployeeStore();
  const { id: incidentId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { 
    formData: configData, 
    employees: configEmployees, 
    statuses: configStatuses,
    students: configStudents,
    loading: configLoading,
    error: configError 
  } = useIncidentFormData();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Use the incident detail hook for edit mode
  const { incident: existingIncident, isLoading: isLoadingIncident, error: incidentError, getFormData } = useIncidentDetail(incidentId);
  
  // Add validation hook
  const { errors, validateForm } = useIncidentFormValidation();
  
  const {
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
    setFormData,
    setPeopleInvolved
  } = useIncidentForm();

  // Set edit mode based on incidentId
  useEffect(() => {
    setIsEditMode(!!incidentId);
  }, [incidentId]);

  // Handle incident loading error
  useEffect(() => {
    if (incidentError && isEditMode) {
      toast.error(incidentError);
      navigate('/incidents');
    }
  }, [incidentError, isEditMode, navigate]);

  // Employees are now fetched via useIncidentFormData combined call

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;

    // Get employee and client data early
    let employeeId = employeeState.employeeData?.id || authEmployeeData?.id;
    let clientId = employeeState.employeeData?.clientId || authEmployeeData?.clientId;
    
    // Early validation: Check if clientId is available before proceeding
    if (!clientId) {
      toast.error("Unable to identify client information. Please contact your administrator or refresh the page and try again.");
      return;
    }

    // Only fetch employee data if not available - use maybeSingle
    if (!employeeId && user?.email) {
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select('id, client_id')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();
        
      if (empData && !empError) {
        employeeId = empData.id;
        clientId = empData.client_id;
      }
    }
    
    // Final validation after potential database fetch
    if (!employeeId || !clientId) {
      toast.error("Unable to identify user or client. Please refresh and try again.");
      return;
    }

    // Validate form including people involved
    const validationResult = validateForm(formData, peopleInvolved);
    
    if (!validationResult.isValid) {
      // Prioritize description error if it exists, otherwise show first error
      const descriptionError = validationResult.errors.description;
      const firstError = Object.values(validationResult.errors)[0];
      const errorMessage = descriptionError || firstError || "Please fill in all required fields";
      toast.error(errorMessage);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a safe date with comprehensive validation
      const createSafeDate = () => {
        try {
          // Use current date/time as fallback if form data is invalid
          if (!formData.date) {
            console.log('No date provided, using current date');
            return new Date();
          }
          
          // Parse the date string safely
          const dateStr = formData.date;
          const timeStr = formData.time || '12:00';
          
          console.log('Processing date:', dateStr, 'time:', timeStr);
          
          // Validate date format (YYYY-MM-DD)
          if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            console.log('Invalid date format, using current date');
            return new Date();
          }
          
          // Validate time format (HH:MM)
          if (!/^\d{2}:\d{2}$/.test(timeStr)) {
            console.log('Invalid time format, using current time');
            return new Date();
          }
          
          // Parse date components to ensure they're valid
          const [year, month, day] = dateStr.split('-').map(Number);
          const [hour, minute] = timeStr.split(':').map(Number);
          
          // Additional validation for date/time ranges
          if (year < 1900 || year > 2100 || 
              month < 1 || month > 12 || 
              day < 1 || day > 31 ||
              hour < 0 || hour > 23 ||
              minute < 0 || minute > 59) {
            console.log('Date/time values out of range, using current date');
            return new Date();
          }
          
          // Create date using Date constructor with individual components
          // Note: Month is 0-based in JavaScript Date constructor
          const date = new Date(year, month - 1, day, hour, minute, 0, 0);
          
          // Final validation - check if the date is valid
          if (isNaN(date.getTime()) || 
              date.getFullYear() !== year ||
              date.getMonth() !== (month - 1) ||
              date.getDate() !== day) {
            console.log('Invalid date created (likely invalid day for month), using current date');
            return new Date();
          }
          
          console.log('Created valid date:', date);
          return date;
        } catch (error) {
          console.error('Error creating date:', error);
          return new Date();
        }
      };

      const dateTime = createSafeDate();
      
      const validPeople = peopleInvolved.filter(p => 
        p.name?.trim() || p.role?.trim() || p.notes?.trim()
      );
      
      // ========== VALIDATE EXTERNAL STUDENTS BEFORE INCIDENT CREATION ==========
      // Filter external students from validPeople
      const externalStudents = validPeople.filter((person: any) => 
        person.role === 'Student' && (person.is_external === true)
      );

      // Validate external students before creating incident
      if (externalStudents.length > 0) {
        console.log(`Validating ${externalStudents.length} external student(s) before incident creation...`);
        
        for (const externalStudent of externalStudents) {
          const externalStudentId = (externalStudent as any).external_student_id || (externalStudent as any).id;
          const externalClientId = (externalStudent as any).external_client_id;
          
          if (!externalStudentId) {
            console.error('Validation failed: external_student_id is missing for external student:', externalStudent);
            toast.error(`External student "${(externalStudent as any).name}" is missing required information (external_student_id). Please reselect the student.`);
            throw new Error(`External student "${(externalStudent as any).name}" is missing external_student_id`);
          }
          
          if (!externalClientId) {
            console.error('Validation failed: external_client_id is missing for external student:', externalStudent);
            toast.error(`External student "${(externalStudent as any).name}" is missing required information (external_client_id). Please reselect the student.`);
            throw new Error(`External student "${(externalStudent as any).name}" is missing external_client_id`);
          }
        }
        
        console.log('All external students validated successfully');
      }
      
      // Get the 'Open' status ID from the combined config data if available, otherwise fetch it
      let openStatusId = configStatuses.find(s => s.name === 'Open')?.id;
      
      if (!openStatusId) {
        const { data: statusData } = await supabase
          .from('incident_status')
          .select('id')
          .eq('name', 'Open')
          .maybeSingle();
        openStatusId = statusData?.id;
      }

      // Build the incident record (without ticket_id — the edge function generates it)
      const clientName = authEmployeeData?.client?.name || 'Unknown Client';
      const incidentRecord = {
        type_id: formData.typeId || null,
        category_id: formData.categoryId || null,
        subcategory_id: formData.subcategoryId || null,
        description: formData.description || '',
        date: dateTime.toISOString(),
        location_id: formData.locationId || null,
        facility_id: formData.facilityId || null,
        priority_id: formData.priorityId || null,
        people_involved: JSON.parse(JSON.stringify(validPeople)),
        documents: [],
        created_by: employeeId,
        assigned_to: formData.owner || null,
        client_id: clientId,
        status_id: openStatusId || null
      };

      // Look up assignee from already-loaded configEmployees (no extra DB call)
      const assigneeFromConfig = formData.owner
        ? configEmployees.find((e: any) => e.id === formData.owner)
        : null;
      const assigneeForEdge = assigneeFromConfig
        ? { id: assigneeFromConfig.id, email: assigneeFromConfig.email, first_name: assigneeFromConfig.first_name, last_name: assigneeFromConfig.last_name }
        : null;

      // Single edge function call: generates ticket ID + inserts incident + queues notification
      console.log('Creating incident via edge function...');
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-incident', {
        body: {
          clientId,
          clientName,
          employeeId,
          incidentRecord,
          assignee: assigneeForEdge,
          notificationBaseUrl: window.location.origin,
        },
      });

      if (createError) {
        console.error('Error creating incident:', createError);
        throw new Error(createError.message);
      }
      if (!createResult?.success) {
        throw new Error(createResult?.error || 'Failed to create incident');
      }

      const incidentData = { id: createResult.incidentId, ticket_id: createResult.ticketId };
      console.log('Incident created successfully:', incidentData);

      // ========== HANDLE EXTERNAL STUDENTS ==========
      // Function to create or update external student in external_students table
      const createOrUpdateExternalStudent = async (externalStudentData: any): Promise<string | null> => {
        try {
          // Get external_student_id - prefer external_student_id field, fallback to id
          const externalStudentId = externalStudentData.external_student_id || externalStudentData.id;
          
          if (!externalStudentId) {
            console.error('Error: external_student_id is missing in externalStudentData:', externalStudentData);
            return null;
          }

          // Check if external student already exists for this client
          const { data: existingExternalStudent, error: checkError } = await supabase
            .from('external_students' as any)
            .select('id')
            .eq('external_student_id', externalStudentId)
            .eq('client_id', clientId)
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error checking existing external student:', checkError);
            return null;
          }

          // Prepare student_info JSONB with all student information
          const studentInfo = {
            gender: externalStudentData.gender || null,
            email: externalStudentData.email || null,
            status: externalStudentData.status || null,
            grade_id: externalStudentData.grade_id || null,
            section_id: externalStudentData.section_id || null,
            grades: externalStudentData.grades || null,
            sections: externalStudentData.sections || null,
            client_id: externalStudentData.client_id || null,
            external_client_id : externalStudentData.external_client_id
          };

          // Prepare data for insert/update
          const externalStudentRecord = {
            client_id: clientId, // This is the current client's ID (application client)
            external_client_id: externalStudentData.external_client_id,
            external_student_id: externalStudentId,
            student_id: externalStudentData.student_id,
            name: externalStudentData.name,
            is_external: true,
            is_active: true,
            student_info: studentInfo,
            updated_at: new Date().toISOString()
          };

          let externalStudentTableId: string;

          if (existingExternalStudent) {
            // Update existing record
            const { data: updatedExternalStudent, error: updateError } = await supabase
              .from('external_students' as any)
              .update(externalStudentRecord)
              .eq('id', (existingExternalStudent as any).id)
              .select('id')
              .single();

            if (updateError || !updatedExternalStudent) {
              console.error('Error updating external student:', updateError);
              return null;
            }

            externalStudentTableId = (updatedExternalStudent as any).id;
            console.log('Updated external student:', externalStudentTableId);
          } else {
            // Insert new record
            const { data: newExternalStudent, error: insertError } = await supabase
              .from('external_students' as any)
              .insert({
                ...externalStudentRecord,
                created_at: new Date().toISOString()
              })
              .select('id')
              .single();

            if (insertError || !newExternalStudent) {
              console.error('Error inserting external student:', insertError);
              return null;
            }

            externalStudentTableId = (newExternalStudent as any).id;
            console.log('Created external student:', externalStudentTableId);
          }

          return externalStudentTableId;
        } catch (error) {
          console.error('Error in createOrUpdateExternalStudent:', error);
          return null;
        }
      };

      // Function to create or update incident_external_students link
      const createOrUpdateIncidentExternalStudent = async (
        incidentId: string,
        externalStudentTableId: string,
        externalClientId: string | null,
        applicationClientId: string
      ): Promise<boolean> => {
        try {
          // Check if link already exists
          const { data: existingLink, error: checkError } = await supabase
            .from('incident_external_students' as any)
            .select('id')
            .eq('incident_id', incidentId)
            .eq('external_student_id', externalStudentTableId)
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing incident-external student link:', checkError);
            return false;
          }

          if (existingLink) {
            // Link already exists, update timestamp, external_client_id, and client_id
            const { error: updateError } = await supabase
              .from('incident_external_students' as any)
              .update({ 
                updated_at: new Date().toISOString(),
                external_client_id: externalClientId,
                client_id: applicationClientId
              })
              .eq('id', (existingLink as any).id);

            if (updateError) {
              console.error('Error updating incident-external student link:', updateError);
              return false;
            }

            console.log('Updated incident-external student link');
          } else {
            // Create new link
            const { error: insertError } = await supabase
              .from('incident_external_students' as any)
              .insert({
                incident_id: incidentId,
                external_student_id: externalStudentTableId,
                external_client_id: externalClientId,
                client_id: applicationClientId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('Error inserting incident-external student link:', insertError);
              return false;
            }

            console.log('Created incident-external student link');
          }

          return true;
        } catch (error) {
          console.error('Error in createOrUpdateIncidentExternalStudent:', error);
          return false;
        }
      };

      // Process external students from peopleInvolved (already validated above)
      if (externalStudents.length > 0) {
        console.log(`Processing ${externalStudents.length} external student(s)...`);

        // All validations passed, proceed with processing
        for (const externalStudent of externalStudents) {
          try {
            // Create or update external student
            const externalStudentTableId = await createOrUpdateExternalStudent(externalStudent);

            if (externalStudentTableId) {
              // Get external_client_id from the external student data (already validated above)
              const externalClientId = (externalStudent as any).external_client_id;
              
              // Link incident with external student (pass application client_id)
              await createOrUpdateIncidentExternalStudent(incidentData.id, externalStudentTableId, externalClientId, clientId);
            } else {
              console.warn('Failed to create/update external student, skipping link creation');
              toast.warning(`Failed to save external student "${(externalStudent as any).name}"`);
            }
          } catch (error) {
            console.error('Error processing external student:', error);
            toast.error(`Error processing external student "${(externalStudent as any).name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Continue processing other external students even if one fails
          }
        }

        console.log('External students processing completed');
      }

      // Upload supporting files if any exist - clientId is already validated above
      if (supportingFiles && supportingFiles.length > 0) {
        console.log('Uploading supporting files...');
        try {
          // Import the document service here to avoid circular imports
          const { incidentDocumentService } = await import('@/services/incident/incidentDocumentService');
          
          // Upload files and update incident in one operation using edge function
          const uploadedDocuments = await incidentDocumentService.uploadFilesAndUpdateIncident(incidentData.id, clientId, supportingFiles);
          
          console.log('Supporting files uploaded successfully');
          toast.success(`${uploadedDocuments.length} supporting document(s) uploaded`);
        } catch (uploadError) {
          console.error('Error uploading supporting files:', uploadError);
          // Don't fail the entire incident creation if file upload fails
          toast.warning('Incident created but some files failed to upload');
        }
      }
      
      toast.success(`Incident reported successfully! Ticket ID: ${incidentData.ticket_id}`);
      
      // Clear cache for incidents and navigate immediately
      console.log('Clearing incident cache and navigating to incidents list...');
      incidentDataService.clearCache(clientId, employeeId);
      
      // Navigate immediately without delay
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
  const mappedEmployees: UserBasicInfo[] = configEmployees.map((employee: any) => ({
    id: employee.id,
    firstName: employee.first_name,
    lastName: employee.last_name,
    name: `${employee.first_name} ${employee.last_name}`,
    email: employee.email
  }));

  // Helper function to get priority name from ID
  // Create a safe formData object for the component
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
    type: formData.typeId,
    subcategory: formData.subcategoryId
  };

  // Show loading state for config data
  if (configLoading) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden bg-gray-50 min-h-screen">
          <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-semibold text-gray-900">
                Report New Incident
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Loading form data...
              </p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center min-h-[400px]">
                
              <Loader text= "Loading..."/>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <>
      {/* Incident Creation Overlay */}
      <IncidentCreationOverlay isVisible={isSubmitting} />
      
      <Layout>
        {/* Header section */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <Button 
              variant="ghost" 
              className="flex items-center -ml-4 mb-4"
              onClick={() => navigate(`/incidents`)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Incident Details
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Report New Incident
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
                  configData={configData}
                  configLoading={configLoading}
                />

                <PeopleInvolvedSection
                  peopleInvolved={peopleInvolved}
                  onPersonChange={handlePersonChange}
                  onAddPerson={addPerson}
                  onRemovePerson={removePerson}
                  students={configStudents}
                  employees={mappedEmployees}
                  errors={errors}
                />
              </CardContent>
              <CardFooter className="flex justify-between border-t bg-white px-8 py-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="px-6 border-gray-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Creating..." : "Submit Report"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </Layout>
    </>
  );
};

export default ReportIncident;
