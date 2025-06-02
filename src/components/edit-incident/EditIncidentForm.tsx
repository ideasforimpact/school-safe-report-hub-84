
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Person } from '@/types/incident';
import { useIncidentForm } from '@/hooks/useIncidentForm';
import { IncidentRecord } from '@/services/incidentService';

interface EditIncidentFormProps {
  incident: IncidentRecord;
}

const EditIncidentForm: React.FC<EditIncidentFormProps> = ({ incident }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get form configuration data
  const {
    locations,
    facilities,
    reportTypes,
    categories,
    subcategories,
    priorities,
    users: incidentUsers
  } = useIncidentForm();

  // Log all incident information for debugging
  useEffect(() => {
    console.log('=== EDIT INCIDENT FORM DEBUG ===');
    console.log('Incident received:', incident);
    console.log('Incident ID:', incident?.id);
    console.log('Ticket ID:', incident?.ticket_id);
    console.log('Type:', incident?.type);
    console.log('Category:', incident?.category);
    console.log('Subcategory:', incident?.subcategory);
    console.log('Location:', incident?.location);
    console.log('Facility:', incident?.facility);
    console.log('Priority:', incident?.priority);
    console.log('Owner:', incident?.owner);
    console.log('Status:', incident?.status);
    console.log('Date:', incident?.date);
    console.log('Description:', incident?.description);
    console.log('=== FORM CONFIG DATA ===');
    console.log('Report Types:', reportTypes);
    console.log('Categories:', categories);
    console.log('Subcategories:', subcategories);
    console.log('Locations:', locations);
    console.log('Facilities:', facilities);
    console.log('Priorities:', priorities);
    console.log('Users:', incidentUsers);
  }, [incident, reportTypes, categories, subcategories, locations, facilities, priorities, incidentUsers]);

  // Form state - initialize with incident data
  const [formData, setFormData] = useState(() => {
    if (!incident) return {
      type: '',
      typeId: '',
      categoryId: '',
      subcategoryId: '',
      description: '',
      date: '',
      time: '',
      locationId: '',
      status: 'Open',
      owner: '',
      facilityId: '',
      priority: 'Medium',
      priorityId: ''
    };

    // Parse the date to get date and time
    const incidentDate = new Date(incident.date);
    const dateString = incidentDate.toISOString().split('T')[0];
    const timeString = incidentDate.toTimeString().split(' ')[0].slice(0, 5);

    return {
      type: incident.type,
      typeId: '',
      categoryId: '',
      subcategoryId: '',
      description: incident.description || '',
      date: dateString,
      time: timeString,
      locationId: '',
      status: incident.status,
      owner: incident.owner || '',
      facilityId: '',
      priority: incident.priority || 'Medium',
      priorityId: ''
    };
  });

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([]);

  // Update form data when configuration data loads and map incident values to IDs
  useEffect(() => {
    if (incident && reportTypes.length > 0 && categories.length > 0 && locations.length > 0) {
      console.log('=== MAPPING INCIDENT VALUES TO IDs ===');
      
      const typeId = reportTypes.find(t => t.name === incident.type)?.id || '';
      const categoryId = categories.find(c => c.name === incident.category)?.id || '';
      const subcategoryId = subcategories.find(s => s.name === incident.subcategory)?.id || '';
      const locationId = locations.find(l => l.name === incident.location)?.id || '';
      const facilityId = facilities.find(f => f.name === incident.facility)?.id || '';
      const priorityId = priorities.find(p => p.name === incident.priority)?.id || '';

      console.log('Type mapping:', incident.type, '->', typeId);
      console.log('Category mapping:', incident.category, '->', categoryId);
      console.log('Subcategory mapping:', incident.subcategory, '->', subcategoryId);
      console.log('Location mapping:', incident.location, '->', locationId);
      console.log('Facility mapping:', incident.facility, '->', facilityId);
      console.log('Priority mapping:', incident.priority, '->', priorityId);

      setFormData(prev => ({
        ...prev,
        typeId,
        categoryId,
        subcategoryId,
        locationId,
        facilityId,
        priorityId
      }));

      console.log('Form data updated with IDs');
    }
  }, [reportTypes, categories, subcategories, locations, facilities, priorities, incident]);

  // Initialize people involved if available in the incident record
  useEffect(() => {
    // Check if incident has people involved data
    // This would depend on your incident record structure
    // For now, initialize as empty array
    setPeopleInvolved([]);
  }, [incident]);

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
    return subcategories.filter(sub => {
      // For now, return all subcategories
      // In a real implementation, you'd filter by category_id
      return true;
    });
  };

  const getFilteredFacilities = () => {
    if (!formData.locationId) return [];
    return facilities.filter(facility => {
      // For now, return all facilities
      // In a real implementation, you'd filter by location_id
      return true;
    });
  };

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    setPeopleInvolved(updatedPeople);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = peopleInvolved.filter((_, i) => i !== index);
    setPeopleInvolved(updatedPeople);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) {
      toast.error("You must be logged in to edit incidents");
      return;
    }

    console.log('=== SUBMITTING FORM ===');
    console.log('Form data:', formData);

    setIsSubmitting(true);
    
    try {
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
      navigate(`/incident/${id}`);
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error(error.message || "An error occurred while updating the incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/incident/${id}`);
  };

  // Log current form state for debugging
  console.log('Current form data state:', formData);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center -ml-4 mb-4"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Incident Details
        </Button>
        
        <h1 className="text-2xl font-semibold text-gray-900">Edit Incident</h1>
        <p className="text-gray-600 text-sm mt-1">
          Update incident information and details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full">
        <Card className="border-none shadow-none bg-gray-50">
          <CardContent className="space-y-6 px-8 py-8">
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
                    {reportTypes.map((type) => (
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
                    {categories.map((category) => (
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
                    {locations.map((location) => (
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
                    {priorities.map((priority) => (
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

            {/* People Involved */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">People Involved</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPerson}
                  className="h-8 px-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Person
                </Button>
              </div>

              {peopleInvolved.map((person, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Name</Label>
                    <Input
                      placeholder="Full name"
                      value={person.name}
                      onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Role</Label>
                    <Select 
                      value={person.role} 
                      onValueChange={(value) => handlePersonChange(index, 'role', value as 'Student' | 'Staff' | 'Other')}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-600">Notes</Label>
                    <Input
                      placeholder="Additional notes"
                      value={person.notes || ''}
                      onChange={(e) => handlePersonChange(index, 'notes', e.target.value)}
                      className="h-9"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePerson(index)}
                      className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Owner Assignment */}
            <div className="space-y-2">
              <Label htmlFor="owner" className="text-sm font-medium text-gray-700">
                Assign To
              </Label>
              <Select value={formData.owner} onValueChange={(value) => handleSelectChange('owner', value)}>
                <SelectTrigger className="h-11 bg-white border-gray-300">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {incidentUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-white px-8 py-4">
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
