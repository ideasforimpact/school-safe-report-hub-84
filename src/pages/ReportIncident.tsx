import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useIncidentForm } from '@/hooks/useIncidentForm';
import { useIncidentFormData } from '@/hooks/useIncidentFormData';
import { useIncidentFormValidation } from '@/hooks/incident-form/useIncidentFormValidation';
import IncidentDetailsForm from '@/components/incidents/IncidentDetailsForm';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';
import { IncidentType, Person } from '@/types/incident';
import { Student } from '@/types/student';
import { useStudents } from '@/contexts/StudentContext';
import { supabase } from '@/integrations/supabase/client';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { useIncidentDetail } from '@/hooks/incident/useIncidentDetail';
import { incidentDataService } from '@/services/incident/incidentDataService';
import { FileItem } from '@/types/fileTypes';
import IncidentCreationOverlay from '@/components/incident/IncidentCreationOverlay';
import { incidentNotificationService } from '@/services/notification/incidentNotificationService';
import { ArrowLeft } from 'lucide-react';
import Loader from '@/components/common/Loader';
import { DemoIncidentButton } from '@/components/incidents/DemoIncidentButton';
import { resolveScenarioForReport } from '@/demo_client/incident/demoScenarios';

// Define a user type that has only the properties needed by the components
interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email?: string;
}

// Person as it appears once a student has been selected via the external-student
// search (see PeopleInvolvedSection's StudentInfo) — these fields aren't part of
// the base Person type but are attached as additionalFields when present.
interface ExternalStudentPerson extends Person {
  is_external?: boolean;
  external_student_id?: string | null;
  external_client_id?: string | null;
  student_id?: string | null;
  gender?: string | null;
  email?: string | null;
  status?: string | null;
  grade_id?: string | null;
  section_id?: string | null;
  grades?: unknown;
  sections?: unknown;
  client_id?: string | null;
}

// external_students / incident_external_students aren't in the generated Supabase
// types yet, so `.from()` needs an escape hatch for the table name.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromUntypedTable = (table: 'external_students' | 'incident_external_students') => supabase.from(table as any);

// Supabase can't infer a result shape for these untyped tables, so query results
// come back as SelectQueryError. Cast through `unknown` (not `any`) to the shape
// these queries actually select.
type IdRowResult = { data: { id: string } | null; error: { code?: string; message?: string } | null };

const ReportIncident = () => {
  const { user, employeeData: authEmployeeData } = useAuth();
  const { id: incidentId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { students } = useStudents();
  const { state: employeeState } = useEmployeeStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hasAttachmentError, setHasAttachmentError] = useState(false);
  
  // Use the incident detail hook for edit mode
  const { incident: existingIncident, isLoading: isLoadingIncident, error: incidentError, getFormData } = useIncidentDetail(incidentId);
  
  // Add validation hook
  const { errors, validateForm, setErrors } = useIncidentFormValidation();
  
  const {
    nextTicketId,
    formData,
    supportingFiles,
    peopleInvolved,
    handleChange: formHandleChange,
    handleSelectChange: formHandleSelectChange,
    handleMultiSelectChange,
    handleDateTimeChange: formHandleDateTimeChange,
    handlePersonChange,
    addPerson,
    removePerson,
    handleFilesChange,
    setFormData,
    setPeopleInvolved
  } = useIncidentForm();

  const { formData: configData, employees: configEmployees, loading: employeesLoading } = useIncidentFormData();
  const priorities = configData.priorities;

  // Mirrors IncidentsList's showLoader pattern: hides the header/form until
  // the reference-data fetch settles, then never re-fires again.
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    if (!employeesLoading) {
      const timer = setTimeout(() => setShowLoader(false), 300);
      return () => clearTimeout(timer);
    }
  }, [employeesLoading]);

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
      const externalStudents = (validPeople as ExternalStudentPerson[]).filter((person) =>
        person.role === 'Student' && (person.is_external === true)
      );

      // Validate external students before creating incident
      if (externalStudents.length > 0) {
        console.log(`Validating ${externalStudents.length} external student(s) before incident creation...`);

        for (const externalStudent of externalStudents) {
          const externalStudentId = externalStudent.external_student_id || externalStudent.id;
          const externalClientId = externalStudent.external_client_id;

          if (!externalStudentId) {
            console.error('Validation failed: external_student_id is missing for external student:', externalStudent);
            toast.error(`External student "${externalStudent.name}" is missing required information (external_student_id). Please reselect the student.`);
            throw new Error(`External student "${externalStudent.name}" is missing external_student_id`);
          }

          if (!externalClientId) {
            console.error('Validation failed: external_client_id is missing for external student:', externalStudent);
            toast.error(`External student "${externalStudent.name}" is missing required information (external_client_id). Please reselect the student.`);
            throw new Error(`External student "${externalStudent.name}" is missing external_client_id`);
          }
        }

        console.log('All external students validated successfully');
      }
      
      console.log('Creating incident via create-incident edge function...');
      console.log(validPeople,"validPeople");

      // Create the incident record server-side: the edge function resolves the
      // 'Open' status id, generates the next ticket id for this client, and
      // inserts the row in one round trip.
      const { data: createResult, error: createError } = await supabase.functions.invoke('create-incident', {
        body: {
          typeId: formData.typeId || null,
          categoryId: formData.categoryId || null,
          subcategoryId: formData.subcategoryId || null,
          description: formData.description || '',
          date: dateTime.toISOString(),
          locationId: formData.locationId || null,
          facilityId: formData.facilityId || null,
          priorityId: formData.priorityId || null,
          peopleInvolved: validPeople,
          createdBy: employeeId,
          assignedTo: formData.owner || null,
          clientId,
        },
      });

      if (createError || !createResult?.success) {
        console.error('Error creating incident:', createError || createResult);
        throw new Error(createError?.message || 'Failed to create incident');
      }

      const incidentData = createResult.incident as { id: string; ticket_id: string };
      
      console.log('Incident created successfully:', incidentData);

      // ========== HANDLE EXTERNAL STUDENTS ==========
      // Function to create or update external student in external_students table
      const createOrUpdateExternalStudent = async (externalStudentData: ExternalStudentPerson): Promise<string | null> => {
        try {
          // Get external_student_id - prefer external_student_id field, fallback to id
          const externalStudentId = externalStudentData.external_student_id || externalStudentData.id;

          if (!externalStudentId) {
            console.error('Error: external_student_id is missing in externalStudentData:', externalStudentData);
            return null;
          }

          // Check if external student already exists for this client
          const { data: existingExternalStudent, error: checkError } = await fromUntypedTable('external_students')
            .select('id')
            .eq('external_student_id', externalStudentId)
            .eq('client_id', clientId)
            .maybeSingle() as unknown as IdRowResult;

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
            const { data: updatedExternalStudent, error: updateError } = await fromUntypedTable('external_students')
              .update(externalStudentRecord)
              .eq('id', existingExternalStudent.id)
              .select('id')
              .single() as unknown as IdRowResult;

            if (updateError || !updatedExternalStudent) {
              console.error('Error updating external student:', updateError);
              return null;
            }

            externalStudentTableId = updatedExternalStudent.id;
            console.log('Updated external student:', externalStudentTableId);
          } else {
            // Insert new record
            const { data: newExternalStudent, error: insertError } = await fromUntypedTable('external_students')
              .insert({
                ...externalStudentRecord,
                created_at: new Date().toISOString()
              })
              .select('id')
              .single() as unknown as IdRowResult;

            if (insertError || !newExternalStudent) {
              console.error('Error inserting external student:', insertError);
              return null;
            }

            externalStudentTableId = newExternalStudent.id;
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
          const { data: existingLink, error: checkError } = await fromUntypedTable('incident_external_students')
            .select('id')
            .eq('incident_id', incidentId)
            .eq('external_student_id', externalStudentTableId)
            .maybeSingle() as unknown as IdRowResult;

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error checking existing incident-external student link:', checkError);
            return false;
          }

          if (existingLink) {
            // Link already exists, update timestamp, external_client_id, and client_id
            const { error: updateError } = await fromUntypedTable('incident_external_students')
              .update({
                updated_at: new Date().toISOString(),
                external_client_id: externalClientId,
                client_id: applicationClientId
              })
              .eq('id', existingLink.id);

            if (updateError) {
              console.error('Error updating incident-external student link:', updateError);
              return false;
            }

            console.log('Updated incident-external student link');
          } else {
            // Create new link
            const { error: insertError } = await fromUntypedTable('incident_external_students')
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
              const externalClientId = externalStudent.external_client_id ?? null;

              // Link incident with external student (pass application client_id)
              await createOrUpdateIncidentExternalStudent(incidentData.id, externalStudentTableId, externalClientId, clientId);
            } else {
              console.warn('Failed to create/update external student, skipping link creation');
              toast.warning(`Failed to save external student "${externalStudent.name}"`);
            }
          } catch (error) {
            console.error('Error processing external student:', error);
            toast.error(`Error processing external student "${externalStudent.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            // Continue processing other external students even if one fails
          }
        }

        console.log('External students processing completed');
      }

      // Send notification if incident is assigned to someone
      if (formData.owner) {
        console.log('Attempting to send notification for assigned incident:', {
          owner: formData.owner,
          incidentId: incidentData.id,
          ticketId: incidentData.ticket_id
        });
        
        try {
          console.log('Notification service available, preparing to send notification');
          
          // Get assignee details from the already-loaded employee list (the same
          // list the "Assigned To" dropdown was populated from)
          const assignee = configEmployees.find(
            (emp) => (emp as { id: string }).id === formData.owner
          ) as { id: string; email: string; first_name: string; last_name: string } | undefined;

          if (!assignee) {
            console.error('Assignee not found in loaded employee list:', formData.owner);
          } else {
            console.log('Assignee found:', assignee);

            // Create the incident object with the correct structure
            const incidentDataForNotification = {
              id: incidentData.id,
              ticket_id: incidentData.ticket_id,
              description: formData.description || 'Incident',
              created_at: new Date().toISOString(),
              created_by: employeeId,
              assigned_to: formData.owner,
              client_id: clientId
            };

            // Create the employee object with the correct structure
            const assignedEmployee = {
              id: assignee.id,
              email: assignee.email,
              first_name: assignee.first_name || '',
              last_name: assignee.last_name || ''
            };

            console.log('Calling notification service with:', {
              incident: incidentDataForNotification,
              employee: assignedEmployee
            });

            const notificationResult = await incidentNotificationService.queueIncidentAssignedNotification(
              incidentDataForNotification,
              assignedEmployee,
              authEmployeeData
            );

            console.log('Notification service result:', notificationResult);
            console.log('Incident assignment notification queued');
          }
        } catch (notificationError) {
          console.error('Error queueing incident assignment notification:', notificationError);
          // Don't fail the incident creation if notification fails
        }
      } else {
        console.log('No owner assigned, skipping notification');
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

  const handlePersonChangeWithClear = (index: number, field: string, value: string, additionalFields?: Record<string, string>) => {
    handlePersonChange(index, field as keyof Person, value, additionalFields);
    if (value && value.trim() !== '') {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[`peopleInvolved.${index}.${field}`];
        return updated;
      });
    }
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
  const mappedEmployees: UserBasicInfo[] = configEmployees.map((employee) => {
    const emp = employee as { id: string; first_name: string; last_name: string; email?: string };
    return {
      id: emp.id,
      firstName: emp.first_name,
      lastName: emp.last_name,
      name: `${emp.first_name} ${emp.last_name}`,
      email: emp.email || ''
    };
  });

  // Helper function to get priority name from ID
  const getPriorityName = (priorityId: string): 'Low' | 'Medium' | 'High' | 'Critical' => {
    const priority = priorities.find(p => p.id === priorityId);
    return (priority?.name as 'Low' | 'Medium' | 'High' | 'Critical') || 'Medium';
  };

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
    subcategory: formData.subcategoryId,
    priority: getPriorityName(formData.priorityId)
  };

  if (showLoader) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <Loader text="Loading form data..." />
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
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Report New Incident
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Document safety incidents, near misses, or unsafe conditions
                </p>
              </div>
              <DemoIncidentButton
                onApply={({ scenario, index }) => {
                  const partial = resolveScenarioForReport(
                    scenario,
                    {
                      reportTypes: configData.reportTypes,
                      categories: configData.categories,
                      subcategories: configData.subcategories,
                      priorities: configData.priorities,
                    },
                    employeeState.employeeData?.id || authEmployeeData?.id || '',
                    index,
                  );
                  setFormData(partial);
                }}
              />
            </div>
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
                  onApplySuggestion={(categoryId, subcategoryId) =>
                    handleMultiSelectChange({ categoryId, subcategoryId: subcategoryId ?? '' })
                  }
                  onDateTimeChange={handleDateTimeChange}
                  supportingFiles={supportingFiles}
                  onFilesChange={handleFilesChange}
                  onAttachmentValidationChange={setHasAttachmentError}
                  configData={configData}
                />

                <PeopleInvolvedSection
                  peopleInvolved={peopleInvolved}
                  onPersonChange={handlePersonChangeWithClear}
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
                  onClick={() => navigate(-1)}
                  className="px-6 border-gray-300"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || hasAttachmentError}
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
