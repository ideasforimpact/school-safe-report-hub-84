import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIncidents } from '@/contexts/incident';
import { useAuth } from '@/contexts/auth/AuthContext';
import { toast } from 'sonner';
import { Person } from '@/types/incident';
import { IncidentStatus } from '@/types/incident';

export const useEditIncident = () => {
  const { getIncident, updateIncident, users } = useIncidents();
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

    // Check if user has permission to edit this incident
    if (!isAdmin && incidentData.reportedBy.id !== user?.id) {
      toast.error("You don't have permission to edit this incident");
      navigate('/incidents');
      return;
    }

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
  }, [id, getIncident, navigate, user, isAdmin]);

  // Handle form submission
  const handleSubmit = ({ formData, peopleInvolved }: { formData: any, peopleInvolved: Person[] }) => {
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
      
      updateIncident(id, {
        type: formData.type as any,
        category: formData.category as any,
        subcategory: formData.subcategory,
        description: formData.description,
        rootCause: formData.rootCause,
        date: dateTime,
        location: formData.location as any,
        status: formData.status as IncidentStatus,
        priority: formData.priority,
        peopleInvolved: validPeople,
        owner: selectedOwner ? { id: selectedOwner.id, name: selectedOwner.name } : undefined,
        facility: formData.facility,
        image: formData.image
      });
      
      toast.success("Incident updated successfully");
      navigate(`/incident/${id}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("An error occurred while updating the incident");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle void incident
  const handleVoidIncident = () => {
    if (!id || !voidReason.trim()) return;
    
    try {
      updateIncident(id, {
        isVoided: true,
        voidReason: voidReason.trim()
      });
      
      toast.success("Incident has been marked as void");
      setShowVoidDialog(false);
      navigate(`/incident/${id}`);
    } catch (error) {
      console.error('Error voiding incident:', error);
      toast.error("An error occurred while voiding the incident");
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
