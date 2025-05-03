
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import EditIncidentForm from './EditIncidentForm';
import { IncidentStatus, Person, IncidentType, IncidentCategory, IncidentLocation } from '@/types/incident';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
      image: incidentData.image
    });

    setPeopleInvolved([...incidentData.peopleInvolved]);
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
      navigate(`/incidents/${id}`);
    } catch (error) {
      console.error('Error voiding incident:', error);
      toast.error("An error occurred while voiding the incident");
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

        {/* Void button */}
        <div className="flex justify-end">
          <Button 
            variant="destructive" 
            onClick={() => setShowVoidDialog(true)}
            disabled={incident?.isVoided}
          >
            {incident?.isVoided ? 'Incident Voided' : 'Void Incident'}
          </Button>
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
        
        {/* Void Incident Dialog */}
        <AlertDialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Void This Incident</AlertDialogTitle>
              <AlertDialogDescription>
                This will mark the incident as voided but will keep it in the system for record-keeping purposes. 
                Voided incidents cannot be edited further.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <Label htmlFor="void-reason" className="text-sm font-medium">
                Reason for voiding (required)
              </Label>
              <Textarea
                id="void-reason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Please provide a reason why this incident is being voided"
                className="mt-1"
                rows={3}
              />
            </div>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleVoidIncident}
                disabled={!voidReason.trim()}
              >
                Confirm Void
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default EditIncidentPage;
