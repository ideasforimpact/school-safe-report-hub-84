
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/incident'; // Fixed import path
import { useAuth } from '@/contexts/auth/AuthContext';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useIncidentForm } from '@/hooks/useIncidentForm';
import IncidentDetailsForm from '@/components/incidents/IncidentDetailsForm';
import PeopleInvolvedSection from '@/components/incidents/PeopleInvolvedSection';
import { IncidentType, IncidentCategory, IncidentLocation } from '@/types/incident';
import { Employee } from '@/contexts/employee/types';
import { getAllEmployeesFromApi } from '@/services/employee/employeeRetrievalService';
import { Student } from '@/types/student';
import { useStudents } from '@/contexts/StudentContext';

const ReportIncident = () => {
  const { addIncident, categories } = useIncidents();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { students } = useStudents();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    nextTicketId,
    formData,
    supportingFiles,
    peopleInvolved,
    handleChange,
    handleSelectChange,
    handleDateTimeChange,
    handlePersonChange,
    addPerson,
    removePerson,
    handleFilesChange,
    getSelectedLocation,
    getSelectedFacility,
    locations,
    facilities,
    users: incidentUsers
  } = useIncidentForm();

  // Fetch employees from the database
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        console.log("Fetching employees from API service...");
        const fetchedEmployees = await getAllEmployeesFromApi();
        console.log(`Fetched ${fetchedEmployees.length} employees successfully:`, fetchedEmployees);
        setEmployees(fetchedEmployees);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toast.error("Could not load staff members");
        setEmployees([]);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      if (!formData.categoryId) {
        toast.error("Please select a category");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.locationId) {
        toast.error("Please select a location");
        setIsSubmitting(false);
        return;
      }
      
      if (!formData.description || formData.description.trim() === '') {
        toast.error("Please provide a description of the incident");
        setIsSubmitting(false);
        return;
      }
      
      // Combine date and time if both are provided
      const dateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`) 
        : new Date();
      
      // Get the actual location and facility names if available
      const locationName = formData.locationId ? getSelectedLocation() : '';
      const facilityName = formData.facilityId ? getSelectedFacility() : '';
      
      // Filter out empty people - now it's optional so we don't need to validate it
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
      let categoryName: IncidentCategory = 'Other';
      
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
      
      // Ensure we have a valid location
      const locationValue = locationName as IncidentLocation; 
      
      await addIncident({
        type: incidentType,
        category: categoryName,
        subcategory: formData.subcategory || '',
        description: formData.description || '',
        date: dateTime,
        location: locationValue,
        peopleInvolved: validPeople,
        facility: facilityName || '',
        priority: formData.priority || 'Medium',
        documents: documents,
        reportedBy: {
          id: user?.id || '',
          name: user?.email || ''
        },
        owner: owner
      });
      
      // Navigation happens after successful submission
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
                students={students}
                employees={employees}
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
