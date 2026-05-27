
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Person } from '@/types/incident';
import { useIncidentFormData } from '@/hooks/useIncidentFormData';
import { EditIncidentData } from '@/services/incident/editIncidentService';
import { useIncidentDocuments } from '@/hooks/useIncidentDocuments';
import { useIncidentFormValidation } from '@/hooks/incident-form/useIncidentFormValidation';
import AssignmentSection from './AssignmentSection';
import DragDropFileUpload from '@/components/file/DragDropFileUpload';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';
import { Student } from '@/types/student';
import { formatFileSize } from '@/utils/fileUtils';
import { incidentNotificationService } from '@/services/notification/incidentNotificationService';
import { DESCRIPTION_MAX_LENGTH } from '../constants';
import Loader from '../common/Loader';
import { Sparkles, X, Loader2, ChevronRight } from 'lucide-react';
import { useIncidentCategorySuggestion } from '@/hooks/useIncidentCategorySuggestion';

interface EditIncidentFormProps {
  incidentData: EditIncidentData;
}

interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

const EditIncidentForm: React.FC<EditIncidentFormProps> = ({ incidentData }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, employeeData } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get form configuration data from the new hook
  const { formData: configData, loading: configLoading } = useIncidentFormData();

  // Use the document management hook
  const {
    supportingFiles,
    documents,
    isUploading,
    handleFilesChange,
    uploadAndSaveDocuments,
    loadDocuments,
  } = useIncidentDocuments(id);

  // Add validation hook
  const { validateForm } = useIncidentFormValidation();

  // Log all incident information for debugging
  useEffect(() => {
    console.log('=== EDIT INCIDENT FORM DEBUG ===');
    console.log('Incident data received:', incidentData);
    console.log('=== FORM CONFIG DATA ===');
    console.log('Report Types:', configData.reportTypes);
    console.log('Categories:', configData.categories);
    console.log('Subcategories:', configData.subcategories);
    console.log('Locations:', configData.locations);
    console.log('Facilities:', configData.facilities);
    console.log('Priorities:', configData.priorities);
  }, [incidentData, configData]);

  // Load existing documents when component mounts
  useEffect(() => {
    if (id) {
      loadDocuments(id);
    }
  }, [id, loadDocuments]);

  // Form state - initialize with incident data
  const [formData, setFormData] = useState(() => ({
    type: incidentData.type,
    typeId: incidentData.typeId,
    categoryId: incidentData.categoryId,
    subcategoryId: incidentData.subcategoryId,
    description: incidentData.description,
    date: incidentData.date,
    time: incidentData.time,
    locationId: incidentData.locationId,
    status: incidentData.status,
    owner: incidentData.ownerId,
    facilityId: incidentData.facilityId,
    priority: incidentData.priority,
    priorityId: incidentData.priorityId
  }));

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>(incidentData.peopleInvolved || []);

  // Log form data changes
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    console.log('Input change:', name, '=', value);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log('Select change:', name, '=', value);
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear subcategory when category changes
    if (name === 'categoryId') {
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
    }
  };

  const getFilteredSubcategories = () => {
    if (!formData.categoryId) return [];
    return configData.subcategories.filter(sub => sub.category_id === formData.categoryId);
  };

  const getFilteredFacilities = () => {
    if (!formData.locationId) return [];
    return configData.facilities.filter(facility => facility.campus_id === formData.locationId);
  };

  const { suggestions, loading: suggestionLoading, noMatch, clearSuggestions } = useIncidentCategorySuggestion(
    formData.description ?? '',
    configData.categories,
    configData.subcategories,
  );

  const applySuggestion = (categoryId: string, subcategoryId: string | null) => {
    setFormData(prev => ({ ...prev, categoryId, subcategoryId: subcategoryId ?? '' }));
    clearSuggestions();
  };

  const handlePersonChange = (index: number, field: string, value: string, additionalFields?: Record<string, string>) => {
    const updatedPeople = [...peopleInvolved];
    if (field === 'role' && value !== updatedPeople[index].role) {
      // Clear name when role changes
      updatedPeople[index] = { ...updatedPeople[index], [field]: value as 'Student' | 'Staff' | 'Other', name: '' };
    } else {
      // Update the main field
      updatedPeople[index] = { ...updatedPeople[index], [field]: value };
      // If additional fields are provided, update them atomically
      if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, val]) => {
          updatedPeople[index] = { ...updatedPeople[index], [key]: val };
        });
      }
    }
    setPeopleInvolved(updatedPeople);
  };

  const handleAddPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', notes: '' }]);
  };

  const handleRemovePerson = (index: number) => {
    const updatedPeople = peopleInvolved.filter((_, i) => i !== index);
    setPeopleInvolved(updatedPeople);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) {
      toast.error("You must be logged in to edit incidents");
      return;
    }

    // Early validation: Check if clientId is available before proceeding
    const clientId = employeeData?.clientId;
    if (!clientId) {
      toast.error("Unable to identify client information. Please contact your administrator or refresh the page and try again.");
      return;
    }

    console.log('=== SUBMITTING FORM ===');
    console.log('Form data:', formData);

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
      // First, upload any new files if there are any - clientId is already validated above
      if (supportingFiles.length > 0) {
        console.log('Uploading new supporting files:', supportingFiles.length);
        await uploadAndSaveDocuments(id, clientId, supportingFiles);
      }

      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Prepare updates - convert Person[] to Json for Supabase
      const filteredPeople = peopleInvolved.filter(p => p.name.trim() !== '');

      console.log(filteredPeople,"filteredPeople");
      
      // ========== VALIDATE EXTERNAL STUDENTS BEFORE INCIDENT UPDATE ==========
      // Filter external students from filteredPeople
      const externalStudents = filteredPeople.filter((person: any) => 
        person.role === 'Student' && (person.is_external === true)
      );

      // Validate external students before updating incident
      if (externalStudents.length > 0) {
        console.log(`Validating ${externalStudents.length} external student(s) before incident update...`);
        
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
      
      const updates = {
        type_id: formData.typeId,
        category_id: formData.categoryId,
        subcategory_id: formData.subcategoryId,
        description: formData.description,
        date: dateTime.toISOString(),
        location_id: formData.locationId,
        facility_id: formData.facilityId,
        priority_id: formData.priorityId,
        assigned_to: formData.owner || null,
        people_involved: filteredPeople as any, // Cast to any to satisfy Json type
        updated_at: new Date().toISOString()
      };

      console.log('Updating incident:', { incidentId: id, updates });

      const { error } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating incident:', error);
        throw new Error(error.message || 'Failed to update incident');
      }

      console.log('Incident updated successfully');

      // ========== HANDLE EXTERNAL STUDENTS (UPDATE) ==========
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
            client_id: externalStudentData.client_id || null
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

      // ========== REMOVE UNLINKED EXTERNAL STUDENTS ==========
      // Function to remove external student links that are no longer in peopleInvolved
      const removeUnlinkedExternalStudents = async (
        incidentId: string,
        currentExternalStudentIds: string[],
        applicationClientId: string
      ): Promise<void> => {
        try {
          // Get all current links for this incident and client_id
          const { data: currentLinks, error: fetchError } = await supabase
            .from('incident_external_students' as any)
            .select('id, external_student_id')
            .eq('incident_id', incidentId)
            .eq('client_id', applicationClientId);

          if (fetchError) {
            console.error('Error fetching current external student links:', fetchError);
            return;
          }

          if (!currentLinks || currentLinks.length === 0) {
            return;
          }

          // For each link, get the external_students record to find external_student_id
          const linksToRemove: any[] = [];

          for (const link of currentLinks) {
            const { data: externalStudent, error: studentError } = await supabase
              .from('external_students' as any)
              .select('external_student_id')
              .eq('id', (link as any).external_student_id)
              .maybeSingle();

            if (studentError || !externalStudent) {
              console.warn('Could not fetch external student for link:', (link as any).id);
              continue;
            }

            const externalStudentId = (externalStudent as any).external_student_id;
            
            // If this external_student_id is not in the current list, mark for removal
            if (externalStudentId && !currentExternalStudentIds.includes(externalStudentId)) {
              linksToRemove.push(link);
            }
          }

          // Remove links that are no longer needed
          for (const link of linksToRemove) {
            const { error: deleteError } = await supabase
              .from('incident_external_students' as any)
              .delete()
              .eq('id', (link as any).id)
              .eq('incident_id', incidentId)
              .eq('client_id', applicationClientId);

            if (deleteError) {
              console.error('Error removing external student link:', deleteError);
            } else {
              console.log('Removed external student link:', (link as any).id);
            }
          }
        } catch (error) {
          console.error('Error in removeUnlinkedExternalStudents:', error);
        }
      };

      // Process external students from peopleInvolved (already validated above)
      // Get current external student IDs from peopleInvolved
      const currentExternalStudentIds = externalStudents
        .map((student: any) => (student as any).external_student_id || student.id)
        .filter((id: any) => id);

      // Remove links for external students that are no longer in peopleInvolved
      if (id) {
        await removeUnlinkedExternalStudents(id, currentExternalStudentIds, clientId);
      }

      if (externalStudents.length > 0) {
        // All validations passed, proceed with processing
        console.log(`Processing ${externalStudents.length} external student(s)...`);

        for (const externalStudent of externalStudents) {
          try {
            // Create or update external student
            const externalStudentTableId = await createOrUpdateExternalStudent(externalStudent);

            if (externalStudentTableId && id) {
              // Get external_client_id from the external student data (already validated above)
              const externalClientId = (externalStudent as any).external_client_id;
              
              // Link incident with external student (pass application client_id)
              await createOrUpdateIncidentExternalStudent(id, externalStudentTableId, externalClientId, clientId);
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
      
      // Handle notifications for updates and reassignments
      try {
        console.log('=== STARTING NOTIFICATION LOGIC ===');
        console.log('User ID:', user.id);
        console.log('Form data owner (assigned_to):', formData.owner);
        console.log('Original owner (ownerId):', incidentData.ownerId);
        
        // Get updater details
        console.log('Fetching updater details for user ID:', user.id);
        const { data: updater } = await supabase
          .from('employees')
          .select('id, email, first_name, last_name')
          .eq('id', incidentData.created_by)
          .limit(1)
          .maybeSingle();
        
        console.log('Updater data:', updater);

        if (updater) {
          const incidentForNotification = {
            id: id,
            ticket_id: incidentData.ticket_id,
            description: formData.description || 'Incident',
            created_at: incidentData.createdAt,
            created_by: incidentData.created_by,
            assigned_to: formData.owner,
            client_id: clientId
          };

          // Check if assignment changed (reassignment)
          const wasReassigned = incidentData.ownerId !== formData.owner && formData.owner;
          console.log('Checking reassignment:', {
            originalOwner: incidentData.ownerId,
            newOwner: formData.owner,
            wasReassigned
          });
          
          if (wasReassigned) {
            // Send assignment notification to new assignee
            console.log('=== INCIDENT WAS REASSIGNED ===');
            console.log('Sending assignment notification to new assignee:', formData.owner);
            const { data: newAssignee } = await supabase
              .from('employees')
              .select('id, email, first_name, last_name')
              .eq('id', formData.owner)
              .single();

            if (newAssignee) {
              await incidentNotificationService.queueIncidentAssignedNotification(
                incidentForNotification,
                newAssignee,
                employeeData
              );
              console.log('Incident reassignment notification sent to new assignee');
            }
          }

          // Send update notification to current assignee (if different from updater)

          let ownerOfIncident = incidentData.created_by == employeeData.id
        
          if (ownerOfIncident && formData.owner && formData.owner !== updater.id && !wasReassigned) {
            console.log('=== SENDING UPDATE NOTIFICATION ===');
            const { data: assignee } = await supabase
              .from('employees')
              .select('id, email, first_name, last_name')
              .eq('id', formData.owner)
              .single();

            console.log('Assignee data for update notification:', assignee);

            if (assignee) {
              console.log('Calling queueIncidentUpdatedNotification...');
              const result = await incidentNotificationService.queueIncidentUpdatedNotification(
                incidentForNotification,
                updater,
                'Incident details have been updated',
                employeeData
              );
              console.log('Update notification result:', result);
            } else {
              console.log('No assignee found for update notification');
            }
          } else {
            console.log('Skipping update notification - same user or no assignee');
          }
        }
      } catch (notificationError) {
        console.error('Error sending incident notifications:', notificationError);
        // Don't fail the update if notification fails
      }
      
      toast.success("Incident updated successfully");
      
      // Navigate to incidents list instead of incident detail
      navigate('/incidents');
    } catch (error: any) {
      console.error('Error updating incident:', error);
      toast.error(error.message || "An error occurred while updating the incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/incident/${id}`);
  };

  if (configLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Loader text="Loading form configuration..." />
      </div>
    );
  }

  // Create empty arrays for students and employees - they will be fetched inside the component
  const students: Student[] = [];
  const employees: UserBasicInfo[] = [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="w-full">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="space-y-6 p-6">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </Label>
              <TextareaWithVoice
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what happened..."
                className="min-h-[120px] bg-white border-gray-300"
                required
                maxLength={DESCRIPTION_MAX_LENGTH}
              />
              <p className="text-xs text-gray-500 text-right">
                {(formData.description ?? '').length}/{DESCRIPTION_MAX_LENGTH} characters
              </p>
            </div>

            {/* AI Suggestions */}
            {suggestionLoading && (
              <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Analysing description to suggest category...</span>
              </div>
            )}
            {!suggestionLoading && suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>AI Suggested Categories</span>
                    <span className="text-xs font-normal text-blue-500">— click to apply</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearSuggestions}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Dismiss suggestions"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={s.categoryId}
                      type="button"
                      onClick={() => applySuggestion(s.categoryId, s.subcategoryId)}
                      className={`flex items-center gap-2 w-full text-left text-sm rounded-lg px-3 py-2 border transition-colors
                        ${i === 0
                          ? 'bg-white border-blue-400 text-blue-800 hover:bg-blue-100 font-medium'
                          : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                        }`}
                    >
                      <span className="text-xs text-blue-400 font-normal w-4 shrink-0">#{s.rank}</span>
                      <span>{s.categoryName}</span>
                      {s.subcategoryName && (
                        <>
                          <ChevronRight className="w-3 h-3 text-blue-400 shrink-0" />
                          <span className="text-blue-600">{s.subcategoryName}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!suggestionLoading && noMatch && (
              <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <span className="shrink-0 mt-0.5">ℹ️</span>
                <span>No matching category or subcategory found for this description. Please select them manually from the dropdowns below.</span>
              </div>
            )}

            {/* First Row - Report Type, Category, Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                  Report Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.typeId} onValueChange={(value) => handleSelectChange('typeId', value)}>
                  <SelectTrigger className="h-11 bg-white border-gray-300">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {configData.reportTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleSelectChange('categoryId', value)}>
                  <SelectTrigger className="h-11 bg-white border-gray-300">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {configData.categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
                  Subcategory <span className="text-red-500">*</span>
                </Label>
                <Select key={formData.categoryId} value={formData.subcategoryId} onValueChange={(value) => handleSelectChange('subcategoryId', value)} required>
                  <SelectTrigger className="h-11 bg-white border-gray-300">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {getFilteredSubcategories().map((subcategory) => (
                      <SelectItem key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Second Row - Location, Facility, Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.locationId} onValueChange={(value) => handleSelectChange('locationId', value)}>
                  <SelectTrigger className="h-11 bg-white border-gray-300">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {configData.locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility" className="text-sm font-medium text-gray-700">
                  Facility <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.facilityId} onValueChange={(value) => handleSelectChange('facilityId', value)} required>
                  <SelectTrigger className="h-11 bg-white border-gray-300">
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {getFilteredFacilities().map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.priorityId} onValueChange={(value) => handleSelectChange('priorityId', value)}>
                  <SelectTrigger className="h-11 bg-white border-gray-300">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    {configData.priorities.map((priority) => (
                      <SelectItem key={priority.id} value={priority.id}>
                        {priority.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="h-11 bg-white border-gray-300"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-sm font-medium text-gray-700">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  max={
                      formData.date === new Date().toISOString().substring(0, 10)
                        ? (() => {
                            const now = new Date();
                            const pad = (n) => n.toString().padStart(2, "0");
                            return `${pad(now.getHours())}:${pad(now.getMinutes())}`; 
                          })()
                        : undefined
                  }
                  className="h-11 bg-white border-gray-300"
                  required
                />
              </div>
            </div>

            {/* Assign To - Using the AssignmentSection component */}
            <AssignmentSection
              owner={formData.owner}
              onSelectChange={handleSelectChange}
            />

            {/* Supporting Files Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Supporting Files</Label>
              <DragDropFileUpload
                onFilesChange={handleFilesChange}
                initialFiles={supportingFiles}
                maxFiles={5}
                className="w-full"
              />
              
              {/* Show existing documents */}
              {documents.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Existing Documents</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{doc.name}</p>
                            <p className="text-gray-500">{formatFileSize(doc.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.url, '_blank')}
                            className="h-8 px-3 text-blue-600 hover:text-blue-700"
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {isUploading && (
                <div className="text-sm text-gray-500">Uploading files...</div>
              )}
            </div>

            {/* People Involved - Now using the same component as the report form */}
            <PeopleInvolvedSection
              peopleInvolved={peopleInvolved}
              onPersonChange={handlePersonChange}
              onAddPerson={handleAddPerson}
              onRemovePerson={handleRemovePerson}
              students={students}
              employees={employees}
            />
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-white px-6 py-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default EditIncidentForm;
