import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import AssignmentSection from './AssignmentSection';
import DragDropFileUpload from '@/components/file/DragDropFileUpload';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';
import { Student } from '@/types/student';

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
    loadDocuments
  } = useIncidentDocuments(id);

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

  const handlePersonChange = (index: number, field: string, value: string) => {
    const updatedPeople = [...peopleInvolved];
    if (field === 'role' && value !== updatedPeople[index].role) {
      // Clear name when role changes
      updatedPeople[index] = { ...updatedPeople[index], [field]: value as 'Student' | 'Staff' | 'Other', name: '' };
    } else {
      updatedPeople[index] = { ...updatedPeople[index], [field]: value };
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
        <div className="text-center py-8">Loading form configuration...</div>
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
            {/* First Row - Report Type, Category, Location */}
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
            </div>

            {/* Second Row - Subcategory, Facility, Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
                  Subcategory
                </Label>
                <Select value={formData.subcategoryId} onValueChange={(value) => handleSelectChange('subcategoryId', value)}>
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

              <div className="space-y-2">
                <Label htmlFor="facility" className="text-sm font-medium text-gray-700">
                  Facility
                </Label>
                <Select value={formData.facilityId} onValueChange={(value) => handleSelectChange('facilityId', value)}>
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
                  className="h-11 bg-white border-gray-300"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what happened..."
                className="min-h-[120px] bg-white border-gray-300"
                required
              />
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
                            <p className="text-gray-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</p>
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
