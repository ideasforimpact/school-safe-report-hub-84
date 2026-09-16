
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
import { Json } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Person } from '@/types/incident';
import { useIncidentFormData } from '@/hooks/useIncidentFormData';
import { EditIncidentData } from '@/services/incident/editIncidentService';
import { useIncidentDocuments } from '@/hooks/useIncidentDocuments';
import { useIncidentFormValidation } from '@/hooks/incident-form/useIncidentFormValidation';
import AssignmentSection from './AssignmentSection';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';
import { useStudents } from '@/contexts/StudentContext';
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

interface ConfigEmployee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
}

interface ExternalPerson extends Person {
  is_external?: boolean;
  external_student_id?: string;
  external_client_id?: string;
}

const EditIncidentForm: React.FC<EditIncidentFormProps> = ({ incidentData }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, employeeData } = useAuth();
  const { students } = useStudents();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAttachmentError, setHasAttachmentError] = useState(false);

  // Get form configuration data from the new hook
  const { formData: configData, employees: configEmployees, loading: configLoading } = useIncidentFormData();
  const mappedEmployees = (configEmployees as ConfigEmployee[] || []).map((emp) => ({
    id: emp.id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    email: emp.email || '',
  }));

  // Use the document management hook — seed with already-loaded documents (no extra DB call)
  const {
    supportingFiles,
    documents,
    isUploading,
    handleFilesChange,
    uploadAndSaveDocuments,
  } = useIncidentDocuments(id, incidentData.documents);
  const existingDocumentsSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);

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
      const externalStudents = (filteredPeople as ExternalPerson[]).filter((person) =>
        person.role === 'Student' && (person.is_external === true)
      );

      // Validate external students before updating incident
      if (externalStudents.length > 0) {
        console.log(`Validating ${externalStudents.length} external student(s) before incident update...`);

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
        people_involved: filteredPeople as unknown as Json,
      };

      // People involved always includes an externalStudents field (even when
      // empty) so the edge function reconciles stale incident_external_students
      // links whenever people involved could have changed.
      const externalStudentsPayload = externalStudents.map((student) => ({
        external_student_id: student.external_student_id || student.id,
        external_client_id: student.external_client_id ?? null,
        name: student.name,
        student_id: (student as Record<string, unknown>).student_id ?? null,
        gender: (student as Record<string, unknown>).gender ?? null,
        email: (student as Record<string, unknown>).email ?? null,
        status: (student as Record<string, unknown>).status ?? null,
        grade_id: (student as Record<string, unknown>).grade_id ?? null,
        section_id: (student as Record<string, unknown>).section_id ?? null,
        grades: (student as Record<string, unknown>).grades ?? null,
        sections: (student as Record<string, unknown>).sections ?? null,
        client_id: (student as Record<string, unknown>).client_id ?? null,
      }));

      console.log('Updating incident:', { incidentId: id, updates });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to edit incidents');
      }

      const { data: updateResult, error } = await supabase.functions.invoke('update-incident', {
        body: { incidentId: id, updates, externalStudents: externalStudentsPayload },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        console.error('Error updating incident:', error);
        throw new Error(error.message || 'Failed to update incident');
      }

      console.log('Incident updated successfully');

      const externalStudentFailures: string[] = updateResult?.externalStudentFailures || [];
      for (const failedName of externalStudentFailures) {
        toast.warning(`Failed to save external student "${failedName}"`);
      }

      // Handle notifications for updates and reassignments
      try {
        console.log('=== STARTING NOTIFICATION LOGIC ===');
        console.log('User ID:', user.id);
        console.log('Form data owner (assigned_to):', formData.owner);
        console.log('Original owner (ownerId):', incidentData.ownerId);
        
        // Get updater from already-loaded config employees (no extra DB call)
        const updaterRaw = configEmployees.find((e: ConfigEmployee) => e.id === incidentData.created_by);
        const updater = updaterRaw
          ? { id: updaterRaw.id, email: updaterRaw.email, first_name: updaterRaw.first_name, last_name: updaterRaw.last_name }
          : null;

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
            // Get new assignee from already-loaded config employees (no extra DB call)
            console.log('=== INCIDENT WAS REASSIGNED ===');
            const newAssigneeRaw = configEmployees.find((e: ConfigEmployee) => e.id === formData.owner);
            const newAssignee = newAssigneeRaw
              ? { id: newAssigneeRaw.id, email: newAssigneeRaw.email, first_name: newAssigneeRaw.first_name, last_name: newAssigneeRaw.last_name }
              : null;

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

          const ownerOfIncident = incidentData.created_by == employeeData.id
        
          if (ownerOfIncident && formData.owner && formData.owner !== updater.id && !wasReassigned) {
            console.log('=== SENDING UPDATE NOTIFICATION ===');
            const assigneeRaw = configEmployees.find((e: ConfigEmployee) => e.id === formData.owner);
            const assignee = assigneeRaw
              ? { id: assigneeRaw.id, email: assigneeRaw.email, first_name: assigneeRaw.first_name, last_name: assigneeRaw.last_name }
              : null;

            if (assignee) {
              console.log('Calling queueIncidentUpdatedNotification...');
              const result = await incidentNotificationService.queueIncidentUpdatedNotification(
                incidentForNotification,
                updater,
                'Incident details have been updated',
                employeeData,
                assignee
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
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error(error instanceof Error ? error.message : "An error occurred while updating the incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/incidents');
  };

  if (configLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Loader text="Loading form configuration..." />
      </div>
    );
  }

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
              employees={mappedEmployees}
            />

            {/* Supporting Files Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Supporting Files</Label>
              <ReusableFileUploader
                onFilesChange={handleFilesChange}
                onValidationChange={setHasAttachmentError}
                initialFiles={supportingFiles}
                maxFiles={5}
                maxSize={10}
                maxTotalSize={50}
                reservedSize={existingDocumentsSize}
                reservedCount={documents.length}
                allowedTypes={['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']}
                accept=".pdf,.jpg,.jpeg,.png"
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
              employees={mappedEmployees}
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
              disabled={isSubmitting || hasAttachmentError}
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
