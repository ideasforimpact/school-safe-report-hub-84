import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/incident/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useIncidentFormData } from '@/hooks/incident-form/useIncidentFormData';
import { useIncidentFormValidation } from '@/hooks/incident-form/useIncidentFormValidation';
import { useCategoryOptions } from '@/hooks/incident-form/useCategoryOptions';
import { useLocationOptions } from '@/hooks/incident-form/useLocationOptions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { formatUserFullName } from '@/utils/userUtils';

const ReportIncident: React.FC = () => {
  const navigate = useNavigate();
  const { addIncident } = useIncidents();
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
            <CardTitle>Report an Incident</CardTitle>
            <CardDescription>
              Fill out the form below to report an incident, near miss, or unsafe condition.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-medium">Report Type</label>
                <Select 
                  value={formData.type}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select incident type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Incident">Incident</SelectItem>
                    <SelectItem value="Near Miss">Near Miss</SelectItem>
                    <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-4">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe what happened in detail"
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">{errors.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={formData.categoryId}
                    onValueChange={(value) => handleSelectChange('categoryId', value)}
                  >
                    <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-red-500 text-sm">{errors.categoryId}</p>
                  )}
                </div>
                
                <div className="space-y-4">
                  <label className="text-sm font-medium">Priority</label>
                  <Select 
                    value={formData.priority}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
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
