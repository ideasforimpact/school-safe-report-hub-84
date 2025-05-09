
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncident } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIncidentFormData } from '@/hooks/incident-form/useIncidentFormData';
import { useIncidentFormValidation } from '@/hooks/incident-form/useIncidentFormValidation';
import { useCategoryOptions } from '@/hooks/incident-form/useCategoryOptions';
import { useLocationOptions } from '@/hooks/incident-form/useLocationOptions';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { formatUserFullName } from '@/utils/userUtils';

// Form sections
import IncidentFormHeader from '@/components/incidents/form-sections/IncidentFormHeader';
import IncidentTypeSection from '@/components/incidents/form-sections/IncidentTypeSection';
import IncidentDescriptionSection from '@/components/incidents/form-sections/IncidentDescriptionSection';
import IncidentDateTimeSection from '@/components/incidents/form-sections/IncidentDateTimeSection';
import IncidentCategorySection from '@/components/incidents/form-sections/IncidentCategorySection';
import IncidentLocationSection from '@/components/incidents/form-sections/IncidentLocationSection';
import IncidentPrioritySection from '@/components/incidents/form-sections/IncidentPrioritySection';

const ReportIncident: React.FC = () => {
  const navigate = useNavigate();
  const { addIncident } = useIncident();
  const { user } = useAuth();
  const { currentClient } = useClient();
  const { formData, setFormData, handleChange, handleSelectChange, handleDateTimeChange } = useIncidentFormData(user);
  const { categoryOptions, subcategoryOptions } = useCategoryOptions();
  const { locationOptions, facilityOptions } = useLocationOptions(formData.locationId);
  const { errors, validateForm } = useIncidentFormValidation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Effect to check if user is authenticated
  useEffect(() => {
    if (!user) {
      toast.error("You must be logged in to report an incident");
      navigate('/login');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm(formData)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format data for submission
      const incident = {
        id: `incident_${Date.now()}`,
        title: `${formData.type}: ${formData.description.substring(0, 50)}${formData.description.length > 50 ? '...' : ''}`,
        description: formData.description,
        rootCause: formData.rootCause,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        dateReported: new Date().toISOString(),
        location: formData.location,
        locationId: formData.locationId,
        facilityId: formData.facilityId, 
        category: categoryOptions.find(cat => cat.value === formData.categoryId)?.label || '',
        categoryId: formData.categoryId,
        subcategory: formData.subcategory,
        priority: formData.priority,
        status: 'Open',
        reportedById: user?.id || '',
        reportedBy: formatUserFullName(user),
        assignedTo: '',
        clientId: currentClient?.id || '',
        attachments: [],
        comments: []
      };
      
      await addIncident(incident);
      
      toast.success("Incident reported successfully");
      navigate('/incidents');
    } catch (error) {
      toast.error("Failed to report incident");
      console.error("Error reporting incident:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <IncidentFormHeader />
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <IncidentTypeSection 
                type={formData.type} 
                onChange={(value) => handleSelectChange('type', value)} 
              />
              
              <IncidentDescriptionSection 
                description={formData.description}
                rootCause={formData.rootCause}
                onChange={handleChange}
                errors={errors}
              />
              
              <IncidentDateTimeSection
                date={formData.date ? new Date(formData.date) : new Date()}
                time={formData.time}
                onChange={handleDateTimeChange}
                errors={errors}
              />
              
              <IncidentCategorySection
                categoryId={formData.categoryId}
                subcategory={formData.subcategory}
                categoryOptions={categoryOptions}
                subcategoryOptions={subcategoryOptions}
                onCategoryChange={(value) => handleSelectChange('categoryId', value)}
                onSubcategoryChange={(value) => handleSelectChange('subcategory', value)}
                errors={errors}
              />
              
              <IncidentLocationSection
                locationId={formData.locationId}
                location={formData.location}
                facilityId={formData.facilityId}
                locationOptions={locationOptions}
                facilityOptions={facilityOptions}
                onLocationIdChange={(value) => handleSelectChange('locationId', value)}
                onLocationChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                onFacilityChange={(value) => handleSelectChange('facilityId', value)}
                errors={errors}
              />
              
              <IncidentPrioritySection
                priority={formData.priority}
                onChange={(value) => handleSelectChange('priority', value)}
                errors={errors}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/incidents')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Incident Report'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default ReportIncident;
