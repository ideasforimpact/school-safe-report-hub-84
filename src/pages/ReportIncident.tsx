
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useIncidentForm } from '@/hooks/useIncidentForm';
import IncidentDetailsForm from '@/components/incidents/IncidentDetailsForm';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';
import { IncidentType } from '@/types/incident';

const ReportIncident = () => {
  const { addIncident, users } = useIncidents();
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
    handleDateTimeChange,
    handlePersonChange,
    addPerson,
    removePerson,
    handleFilesChange,
    getSelectedCategory,
    getSelectedLocation,
    getSelectedFacility,
    categories,
    locations,
    facilities,
    users: incidentUsers
  } = useIncidentForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Removed mandatory field validation to allow proceeding with any data
    
    setIsSubmitting(true);
    
    try {
      // Combine date and time if both are provided
      const dateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`) 
        : new Date();
      
      // Get the actual category, location and facility names if available
      const categoryName = formData.categoryId ? getSelectedCategory() : '';
      const locationName = formData.locationId ? getSelectedLocation() : '';
      const facilityName = formData.facilityId ? getSelectedFacility() : '';
      
      // Filter out empty people
      const validPeople = peopleInvolved.filter(p => p.name.trim() !== '');
      
      // Process supporting documents
      const documents = supportingFiles.map(file => ({
        name: file.name,
        type: file.type,
        data: file.base64
      }));
      
      // Get selected owner if any
      const selectedOwner = formData.owner 
        ? users.find(u => u.id === formData.owner) 
        : undefined;
        
      const owner = selectedOwner 
        ? { id: selectedOwner.id, name: selectedOwner.name } 
        : undefined;
      
      addIncident({
        type: (formData.type || 'Incident') as IncidentType,
        category: categoryName as any,
        subcategory: formData.subcategory || '',
        description: formData.description || '',
        date: dateTime,
        location: locationName as any,
        peopleInvolved: validPeople,
        facility: facilityName || '',
        priority: formData.priority || 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical',
        documents: documents,
        reportedBy: {
          id: user?.id || '',
          name: user?.name || ''
        },
        owner: owner
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
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-bold">Report New Incident</h1>
          <p className="text-gray-600 mt-1">
            Document safety incidents, near misses, or unsafe conditions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <Card className="border-none shadow-card pt-6">
            <CardContent className="space-y-6 px-6">
              <IncidentDetailsForm
                formData={formData}
                onChange={handleChange}
                onSelectChange={handleSelectChange}
                onDateTimeChange={handleDateTimeChange}
                supportingFiles={supportingFiles}
                onFilesChange={handleFilesChange}
                categories={categories}
                availableSubcategories={availableSubcategories}
                locations={locations}
                facilities={facilities}
                users={users}
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
