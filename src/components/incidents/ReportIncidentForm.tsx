
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/incident/IncidentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useIncidentForm } from '@/hooks/useIncidentForm';
import IncidentDetailsForm from '@/components/incidents/IncidentDetailsForm';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';
import { IncidentType, IncidentCategory } from '@/types/incident';
import { Employee } from '@/contexts/employee/types';

interface ReportIncidentFormProps {
  employees: Employee[];
  isLoadingEmployees: boolean;
}

const ReportIncidentForm: React.FC<ReportIncidentFormProps> = ({ 
  employees,
  isLoadingEmployees
}) => {
  const { addIncident, categories } = useIncidents();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const {
    nextTicketId,
    formData,
    supportingFiles,
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
    getSelectedLocation,
    getSelectedFacility,
  } = useIncidentForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Combine date and time if both are provided
      const dateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`) 
        : new Date();
      
      // Get the actual location and facility names if available
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
        ? employees.find(e => e.id === formData.owner) 
        : undefined;
        
      const owner = selectedOwner 
        ? { id: selectedOwner.id, name: `${selectedOwner.firstName} ${selectedOwner.lastName}` } 
        : undefined;
      
      // Find the selected category to get its name for IncidentCategory mapping
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      let categoryName: IncidentCategory = 'Other' as IncidentCategory; // Default to 'Other'
      
      if (selectedCategory) {
        // Try to map the category name to the IncidentCategory type
        switch(selectedCategory.name) {
          case 'Physical Injury':
            categoryName = 'Physical Injury';
            break;
          case 'Bullying':
            categoryName = 'Bullying';
            break;
          case 'Tech Misuse':
            categoryName = 'Tech Misuse';
            break;
          case 'Property Damage':
            categoryName = 'Property Damage';
            break;
          case 'Health Concern':
            categoryName = 'Health Concern';
            break;
          case 'Security Breach':
            categoryName = 'Security Breach';
            break;
          default:
            categoryName = 'Other';
        }
      }
      
      // Ensure we have a valid type
      const incidentType = (formData.type || 'Incident') as IncidentType;
      
      addIncident({
        type: incidentType,
        category: categoryName,
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
          name: user?.id || ''
        },
        owner: owner
      });
      
      toast.success("Incident reported successfully");
      navigate('/incidents');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error("An error occurred while submitting the report");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create adapter functions to handle type differences
  const handleChangeAdapter = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e && e.target) {
      handleChange(e.target.name, e.target.value);
    }
  };
  
  const handleDateTimeAdapter = (date: Date | undefined, timeString?: string) => {
    if (date) {
      handleDateTimeChange('date', date);
    }
    if (timeString) {
      handleDateTimeChange('time', timeString);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Card className="border-none shadow-card pt-6">
        <CardContent className="space-y-6 px-6">
          <IncidentDetailsForm
            formData={formData}
            onChange={handleChangeAdapter}
            onSelectChange={handleSelectChange} 
            onDateTimeChange={handleDateTimeAdapter}
            supportingFiles={supportingFiles}
            onFilesChange={handleFilesChange}
            users={employees}
            isLoadingUsers={isLoadingEmployees}
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
  );
};

export default ReportIncidentForm;
