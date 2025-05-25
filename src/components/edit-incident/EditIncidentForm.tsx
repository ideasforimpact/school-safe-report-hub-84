
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Incident, Person } from '@/types/incident';
import PeopleInvolvedSection from '@/components/incident-form/PeopleInvolvedSection';
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
  
  // Form state
  const [formData, setFormData] = useState({
    type: incident.type,
    category: incident.category,
    subcategory: incident.subcategory || '',
    description: incident.description,
    rootCause: incident.rootCause || '',
    date: new Date(incident.date).toISOString().split('T')[0],
    time: new Date(incident.date).toTimeString().split(' ')[0].slice(0, 5),
    location: incident.location,
    status: incident.status,
    owner: incident.owner?.id || '',
    facility: incident.facility || '',
    priority: incident.priority || 'Medium'
  });

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>(
    incident.peopleInvolved || []
  );

  // Reference data
  const [types] = useState(['Incident', 'Near Miss', 'Unsafe Condition']);
  const [statuses] = useState(['New', 'Open', 'In Progress', 'Resolved', 'Closed']);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
        type_id: formData.type,
        category_id: formData.category,
        subcategory_id: formData.subcategory,
        description: formData.description,
        date: dateTime.toISOString(),
        location_id: formData.location,
        facility_id: formData.facility,
        priority_id: formData.priority,
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
    <form id="edit-incident-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Type and Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category} onValueChange={(value) => handleSelectChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status and Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              {priorities.map((priority) => (
                <SelectItem key={priority.id} value={priority.name}>
                  {priority.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location and Facility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Select value={formData.location} onValueChange={(value) => handleSelectChange('location', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.name}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="facility">Facility</Label>
          <Input
            id="facility"
            name="facility"
            value={formData.facility}
            onChange={handleChange}
            placeholder="Enter facility"
          />
        </div>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            name="time"
            type="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the incident in detail..."
          rows={4}
          required
        />
      </div>

      {/* Root Cause */}
      <div className="space-y-2">
        <Label htmlFor="rootCause">Root Cause</Label>
        <Textarea
          id="rootCause"
          name="rootCause"
          value={formData.rootCause}
          onChange={handleChange}
          placeholder="Describe the root cause (optional)..."
          rows={3}
        />
      </div>

      {/* People Involved */}
      <div className="space-y-2">
        <Label>People Involved</Label>
        <PeopleInvolvedSection
          peopleInvolved={peopleInvolved}
          setPeopleInvolved={setPeopleInvolved}
        />
      </div>
    </form>
  );
};

export default EditIncidentForm;
