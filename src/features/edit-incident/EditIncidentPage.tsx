
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import EditIncidentForm from './EditIncidentForm';
import { IncidentStatus, Person, IncidentType, IncidentCategory, IncidentLocation } from '@/types/incident';

const EditIncidentPage = () => {
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
    image: undefined as string | undefined
  });

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  // Fetch incident data
  useEffect(() => {
    if (!id) return;

    const incident = getIncident(id);
    if (!incident) {
      toast.error("Incident not found");
      navigate('/incidents');
      return;
    }

    // Check if user has permission to edit this incident
    if (!isAdmin && incident.reportedBy.id !== user?.id) {
      toast.error("You don't have permission to edit this incident");
      navigate('/incidents');
      return;
    }

    const date = new Date(incident.date);
    
    setFormData({
      type: incident.type,
      category: incident.category,
      subcategory: incident.subcategory || '',
      description: incident.description,
      rootCause: incident.rootCause || '',
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().split(' ')[0].slice(0, 5),
      location: incident.location,
      status: incident.status,
      owner: incident.owner?.id || '',
      facility: incident.facility || 'Other',
      image: incident.image
    });

    setPeopleInvolved([...incident.peopleInvolved]);
  }, [id, getIncident, navigate, user, isAdmin]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
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
        type: formData.type as IncidentType,
        category: formData.category as IncidentCategory,
        subcategory: formData.subcategory,
        description: formData.description,
        rootCause: formData.rootCause,
        date: dateTime,
        location: formData.location as IncidentLocation,
        status: formData.status as IncidentStatus,
        peopleInvolved: validPeople,
        owner: selectedOwner ? { id: selectedOwner.id, name: selectedOwner.name } : undefined,
        facility: formData.facility,
        image: formData.image
      });
      
      toast.success("Incident updated successfully");
      navigate(`/incidents/${id}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("An error occurred while updating the incident");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Edit Incident</h1>
          <p className="text-gray-600 mt-1">
            Update incident details
          </p>
        </div>

        <EditIncidentForm
          formData={formData}
          setFormData={setFormData}
          peopleInvolved={peopleInvolved}
          setPeopleInvolved={setPeopleInvolved}
          availableSubcategories={availableSubcategories}
          setAvailableSubcategories={setAvailableSubcategories}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/incidents/${id}`)}
        />
      </div>
    </Layout>
  );
};

export default EditIncidentPage;
