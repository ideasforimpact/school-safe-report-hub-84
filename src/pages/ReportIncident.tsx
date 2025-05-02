
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useIncidentForm } from '@/hooks/useIncidentForm';
import TicketInfoBanner from '@/components/incidents/TicketInfoBanner';
import IncidentDetailsForm from '@/components/incidents/IncidentDetailsForm';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';

const ReportIncident = () => {
  const { addIncident } = useIncidents();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    nextTicketId,
    formData,
    supportingFiles,
    availableSubcategories,
    peopleInvolved,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleSelectChange,
    handlePersonChange,
    addPerson,
    removePerson,
    handleFilesChange,
    getSelectedCategory,
    getSelectedLocation,
    getSelectedFacility,
    categories,
    locations,
    facilities
  } = useIncidentForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.type || !formData.categoryId || !formData.subcategory || !formData.description || !formData.locationId || !formData.facilityId) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Filter out empty people
    const validPeople = peopleInvolved.filter(p => p.name.trim() !== '');
    
    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      // Get the actual category, location and facility names
      const categoryName = getSelectedCategory();
      const locationName = getSelectedLocation();
      const facilityName = getSelectedFacility();
      
      // Process supporting documents
      const documents = supportingFiles.map(file => ({
        name: file.name,
        type: file.type,
        data: file.base64
      }));
      
      addIncident({
        type: formData.type,
        category: categoryName as any, // Type cast needed because we're using dynamic categories
        subcategory: formData.subcategory,
        description: formData.description,
        rootCause: formData.rootCause,
        date: dateTime,
        location: locationName as any, // Type cast needed because we're using dynamic locations
        peopleInvolved: validPeople,
        facility: facilityName,
        priority: formData.priority,
        documents: documents,
        reportedBy: {
          id: user?.id || '',
          name: user?.name || ''
        }
      });
      
      navigate('/incidents');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("An error occurred while submitting the report");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Report New Incident</h1>
          <p className="text-gray-600 mt-1">
            Document safety incidents, near misses, or unsafe conditions
          </p>
        </div>

        <TicketInfoBanner ticketId={nextTicketId} />

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
              <CardDescription>Provide information about what occurred</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <IncidentDetailsForm
                formData={formData}
                onChange={handleChange}
                onSelectChange={handleSelectChange}
                supportingFiles={supportingFiles}
                onFilesChange={handleFilesChange}
                categories={categories}
                availableSubcategories={availableSubcategories}
                locations={locations}
                facilities={facilities}
              />

              <PeopleInvolvedSection
                peopleInvolved={peopleInvolved}
                onPersonChange={handlePersonChange}
                onAddPerson={addPerson}
                onRemovePerson={removePerson}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </Layout>
  );
};

export default ReportIncident;
