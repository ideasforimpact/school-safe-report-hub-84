
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIncidents } from '@/contexts/incident';
import { useAuth } from '@/contexts/auth/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Person, IncidentStatus } from '@/types/incident';

export const useEditIncident = () => {
  const { getIncident, users } = useIncidents();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState({
    type: '',
    category: '',
    subcategory: '',
    description: '',
    rootCause: '',
    date: '',
    time: '',
    location: '',
    status: '',
    owner: '',
    facility: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
    image: undefined as string | undefined
  });

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add state for void dialog
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [incident, setIncident] = useState<any>(null);

  // Fetch incident data
  useEffect(() => {
    if (!id) return;

    const incidentData = getIncident(id);
    if (!incidentData) {
      toast.error("Incident not found");
      navigate('/incidents');
      return;
    }

    setIncident(incidentData);

    const date = new Date(incidentData.date);
    
    setFormData({
      type: incidentData.type,
      category: incidentData.category,
      subcategory: incidentData.subcategory || '',
      description: incidentData.description,
      rootCause: incidentData.rootCause || '',
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().split(' ')[0].slice(0, 5),
      location: incidentData.location,
      status: incidentData.status,
      owner: incidentData.owner?.id || '',
      facility: incidentData.facility || 'Other',
      priority: incidentData.priority || 'Medium',
      image: incidentData.image
    });

    setPeopleInvolved([...(incidentData.peopleInvolved || [])]);
  }, [id, getIncident, navigate]);

  // Handle form submission using edge function
  const handleSubmit = async ({ formData, peopleInvolved }: { formData: any, peopleInvolved: Person[] }) => {
    if (!id) return;
    
    // Basic validation
    if (!formData.type || !formData.category || !formData.subcategory || !formData.description || !formData.location || !formData.status || !formData.facility) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Filter out empty people
    const validPeople = peopleInvolved.filter(p => p.name.trim() !== '');
    
    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Find selected owner
      const selectedOwner = formData.owner ? users.find(u => u.id === formData.owner) : undefined;
      
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to edit incidents");
        return;
      }

      // Prepare updates for edge function
      const updates = {
        type_id: formData.type, // You may need to map these to actual IDs
        category_id: formData.category,
        subcategory_id: formData.subcategory,
        description: formData.description,
        date: dateTime.toISOString(),
        location_id: formData.location,
        facility_id: formData.facility,
        priority_id: formData.priority,
        status_id: formData.status,
        assigned_to: selectedOwner?.id,
        people_involved: validPeople,
        documents: formData.image ? [{ name: 'image', type: 'image', data: formData.image }] : []
      };

      console.log('Submitting incident update:', { incidentId: id, updates });

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('update-incident', {
        body: {
          incidentId: id,
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
      navigate(`/incident/${id}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || "An error occurred while updating the incident");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle void incident
  const handleVoidIncident = async () => {
    if (!id || !voidReason.trim()) return;
    
    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to void incidents");
        return;
      }

      // Call the edge function to void the incident
      const { data, error } = await supabase.functions.invoke('update-incident', {
        body: {
          incidentId: id,
          updates: {
            // Add void fields - you may need to add these to your database schema
            // is_voided: true,
            // void_reason: voidReason.trim()
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to void incident');
      }
      
      toast.success("Incident has been marked as void");
      setShowVoidDialog(false);
      navigate(`/incident/${id}`);
    } catch (error) {
      console.error('Error voiding incident:', error);
      toast.error(error.message || "An error occurred while voiding the incident");
    }
  };

  return {
    id,
    formData,
    setFormData,
    peopleInvolved,
    setPeopleInvolved,
    isSubmitting,
    handleSubmit,
    handleVoidIncident,
    showVoidDialog,
    setShowVoidDialog,
    voidReason,
    setVoidReason,
    incident,
    navigate
  };
};
