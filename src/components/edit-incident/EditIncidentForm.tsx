
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Incident, Person, IncidentType } from '@/types/incident';
import { useIncidentForm } from '@/hooks/useIncidentForm';

interface EditIncidentFormProps {
  incident: Incident;
  onSuccess: () => void;
  onCancel: () => void;
}

const EditIncidentForm: React.FC<EditIncidentFormProps> = ({
  incident,
  onSuccess,
  onCancel
}) => {
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

  // Form state initialized with incident data
  const [formData, setFormData] = useState({
    type: incident.type,
    typeId: '',
    categoryId: '',
    subcategoryId: '',
    description: incident.description,
    date: new Date(incident.date).toISOString().split('T')[0],
    time: new Date(incident.date).toTimeString().split(' ')[0].slice(0, 5),
    locationId: '',
    status: incident.status,
    owner: incident.owner?.id || '',
    facilityId: '',
    priority: incident.priority || 'Medium',
    priorityId: ''
  });

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>(
    incident.peopleInvolved || []
  );

  // Initialize form data with proper IDs when reference data loads
  useEffect(() => {
    console.log('Populating edit form with incident data:', incident);
    
    // Match and set type ID
    if (reportTypes.length > 0) {
      const typeMatch = reportTypes.find(t => t.name === incident.type);
      if (typeMatch) {
        setFormData(prev => ({ ...prev, typeId: typeMatch.id }));
        console.log('Set type ID:', typeMatch.id, 'for type:', incident.type);
      }
    }

    // Match and set category ID
    if (categories.length > 0) {
      const categoryMatch = categories.find(c => c.name === incident.category);
      if (categoryMatch) {
        setFormData(prev => ({ ...prev, categoryId: categoryMatch.id }));
        console.log('Set category ID:', categoryMatch.id, 'for category:', incident.category);
      }
    }

    // Match and set subcategory ID
    if (subcategories.length > 0 && incident.subcategory) {
      const subcategoryMatch = subcategories.find(s => s.name === incident.subcategory);
      if (subcategoryMatch) {
        setFormData(prev => ({ ...prev, subcategoryId: subcategoryMatch.id }));
        console.log('Set subcategory ID:', subcategoryMatch.id, 'for subcategory:', incident.subcategory);
      }
    }

    // Match and set location ID
    if (locations.length > 0) {
      const locationMatch = locations.find(l => l.name === incident.location);
      if (locationMatch) {
        setFormData(prev => ({ ...prev, locationId: locationMatch.id }));
        console.log('Set location ID:', locationMatch.id, 'for location:', incident.location);
      }
    }

    // Match and set facility ID
    if (facilities.length > 0 && incident.facility) {
      const facilityMatch = facilities.find(f => f.name === incident.facility);
      if (facilityMatch) {
        setFormData(prev => ({ ...prev, facilityId: facilityMatch.id }));
        console.log('Set facility ID:', facilityMatch.id, 'for facility:', incident.facility);
      }
    }

    // Match and set priority ID
    if (priorities.length > 0) {
      const priorityMatch = priorities.find(p => p.name === incident.priority);
      if (priorityMatch) {
        setFormData(prev => ({ ...prev, priorityId: priorityMatch.id }));
        console.log('Set priority ID:', priorityMatch.id, 'for priority:', incident.priority);
      }
    }
  }, [reportTypes, categories, subcategories, locations, facilities, priorities, incident]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear subcategory when category changes
    if (name === 'categoryId') {
      setFormData(prev => ({ ...prev, subcategoryId: '' }));
    }
  };

  const getFilteredSubcategories = () => {
    if (!formData.categoryId) return [];
    return subcategories.filter(sub => sub.category_id === formData.categoryId);
  };

  const getFilteredFacilities = () => {
    if (!formData.locationId) return [];
    return facilities.filter(facility => facility.campus_id === formData.locationId);
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
    
    if (!user) {
      toast.error("You must be logged in to edit incidents");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to edit incidents");
        return;
      }

      // Prepare updates for edge function
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
        people_involved: peopleInvolved.filter(p => p.name.trim() !== ''),
        documents: incident.documents || []
      };

      console.log('Submitting incident update:', { incidentId: incident.id, updates });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('update-incident', {
        body: {
          incidentId: incident.id,
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
      onSuccess();
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error(error.message || "An error occurred while updating the incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="w-full">
        <Card className="border-none shadow-none bg-gray-50">
          <CardContent className="space-y-6 px-8 py-8">
            {/* Debug Info */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900">Editing Incident: {incident.ticketId}</h3>
              <p className="text-sm text-blue-700">Type: {incident.type} | Category: {incident.category} | Location: {incident.location}</p>
            </div>

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
                  Subcategory <span className="text-red-500">*</span>
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
              onClick={onCancel}
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
