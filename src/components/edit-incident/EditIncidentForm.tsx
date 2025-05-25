import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar, Search, FileText, Plus, Trash2 } from 'lucide-react';
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

// Extended facility type with campus_id
interface FacilityWithCampus {
  id: string;
  name: string;
  campus_id: string;
}

// Subcategory type with category_id
interface SubcategoryItem {
  id: string;
  name: string;
  category_id: string;
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
    facilities: basicFacilities,
    reportTypes,
    categories,
    subcategories: rawSubcategories,
    priorities,
    users: incidentUsers
  } = useIncidentForm();

  // Cast facilities to the extended type for campus_id access
  const facilities = basicFacilities as FacilityWithCampus[];
  
  // Cast subcategories to include category_id
  const subcategories = rawSubcategories as SubcategoryItem[];
  
  // Form state initialized with incident data
  const [formData, setFormData] = useState({
    type: incident.type,
    typeId: '',
    categoryId: '',
    subcategoryId: '',
    subcategory: incident.subcategory || '',
    description: incident.description,
    rootCause: incident.rootCause || '',
    date: new Date(incident.date).toISOString().split('T')[0],
    time: new Date(incident.date).toTimeString().split(' ')[0].slice(0, 5),
    locationId: '',
    location: incident.location,
    status: incident.status,
    owner: incident.owner?.id || '',
    facilityId: '',
    facility: incident.facility || '',
    priority: incident.priority || 'Medium',
    priorityId: ''
  });

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>(
    incident.peopleInvolved || []
  );

  // Initialize form data with proper IDs when reference data loads
  useEffect(() => {
    if (reportTypes.length > 0) {
      const typeMatch = reportTypes.find(t => t.name === incident.type);
      if (typeMatch) {
        setFormData(prev => ({ ...prev, typeId: typeMatch.id }));
      }
    }

    if (categories.length > 0) {
      const categoryMatch = categories.find(c => c.name === incident.category);
      if (categoryMatch) {
        setFormData(prev => ({ ...prev, categoryId: categoryMatch.id }));
      }
    }

    if (subcategories.length > 0 && incident.subcategory) {
      const subcategoryMatch = subcategories.find(s => s.name === incident.subcategory);
      if (subcategoryMatch) {
        setFormData(prev => ({ ...prev, subcategoryId: subcategoryMatch.id }));
      }
    }

    if (locations.length > 0) {
      const locationMatch = locations.find(l => l.name === incident.location);
      if (locationMatch) {
        setFormData(prev => ({ ...prev, locationId: locationMatch.id }));
      }
    }

    if (facilities.length > 0 && incident.facility) {
      const facilityMatch = facilities.find(f => f.name === incident.facility);
      if (facilityMatch) {
        setFormData(prev => ({ ...prev, facilityId: facilityMatch.id }));
      }
    }

    if (priorities.length > 0) {
      const priorityMatch = priorities.find(p => p.name === incident.priority);
      if (priorityMatch) {
        setFormData(prev => ({ ...prev, priorityId: priorityMatch.id }));
      }
    }
  }, [reportTypes, categories, subcategories, locations, facilities, priorities, incident]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Handle related field updates
    if (name === 'categoryId') {
      setFormData(prev => ({ ...prev, subcategoryId: '', subcategory: '' }));
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
        status_id: formData.status,
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
            {/* First Row - Report Type, Category, Where it Happened */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                  Report Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.typeId} onValueChange={(value) => {
                  handleSelectChange('typeId', value);
                  const selectedType = reportTypes.find(t => t.id === value);
                  if (selectedType) {
                    setFormData(prev => ({ 
                      ...prev, 
                      type: selectedType.name as IncidentType,
                      typeId: selectedType.id
                    }));
                  }
                }}>
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
                  Where it Happened <span className="text-red-500">*</span>
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

            {/* Second Row - Subcategory, Facility */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  Facility <span className="text-red-500">*</span>
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
            </div>

            {/* Third Row - Priority */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Fourth Row - Date and Time, Assigned to */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="datetime" className="text-sm font-medium text-gray-700">
                  Date and Time of Occurrence <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={`${formData.date}T${formData.time}`}
                    onChange={(e) => {
                      const [date, time] = e.target.value.split('T');
                      setFormData(prev => ({ ...prev, date, time }));
                    }}
                    className="h-11 pl-10 bg-white border-gray-300"
                    required
                  />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner" className="text-sm font-medium text-gray-700">
                  Assigned to <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Select value={formData.owner} onValueChange={(value) => handleSelectChange('owner', value)}>
                    <SelectTrigger className="h-11 pl-10 bg-white border-gray-300">
                      <SelectValue placeholder="Search by name or email..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      {incidentUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what happened in detail"
                rows={4}
                className="resize-none bg-white border-gray-300"
                required
              />
              <div className="text-right text-sm text-gray-500">
                {formData.description.length}/250 characters
              </div>
            </div>

            {/* Supporting Documents - Matching design */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">Supporting Documents</Label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg bg-white">
                <div className="text-center py-12">
                  <FileText className="mx-auto h-8 w-8 text-gray-400 mb-4" />
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add a file
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    Images, videos, documents up to 25MB
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <p>Upload up to 5 files (images, videos, documents) to support this incident report</p>
                <p>0 of 5 files added</p>
              </div>
            </div>

            {/* People Involved - Matching design */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium text-gray-700">People Involved</Label>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-medium"
                  onClick={addPerson}
                >
                  + Add Person
                </Button>
              </div>

              {peopleInvolved.map((person, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select 
                        value={person.role} 
                        onValueChange={(value) => handlePersonChange(index, 'role', value as 'Student' | 'Staff' | 'Other')}
                      >
                        <SelectTrigger className="h-11 bg-white border-gray-300">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Staff">Staff</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          value={person.name}
                          onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                          placeholder={`Search by ${person.role.toLowerCase()} name...`}
                          className="h-11 pl-10 bg-white border-gray-300"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Notes</Label>
                      <div className="flex gap-2">
                        <Input
                          value={person.notes || ''}
                          onChange={(e) => handlePersonChange(index, 'notes', e.target.value)}
                          placeholder="Additional notes"
                          className="h-11 bg-white border-gray-300"
                        />
                        {peopleInvolved.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removePerson(index)}
                            className="shrink-0 h-11 w-11 p-0 border-gray-300"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between border-t bg-white px-8 py-4">
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              className="px-6 border-gray-300"
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
