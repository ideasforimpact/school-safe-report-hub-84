
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentForm } from '@/hooks/useIncidentForm';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IncidentLocationSection from '@/components/incidents/IncidentLocationSection';
import IncidentCategorySection from '@/components/incidents/IncidentCategorySection';
import IncidentDateTimeSection from '@/components/incidents/IncidentDateTimeSection';
import IncidentDescriptionSection from '@/components/incidents/form-sections/IncidentDescriptionSection';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';

const IncidentReport = () => {
  const navigate = useNavigate();
  const { 
    nextTicketId,
    formData, 
    supportingFiles,
    availableSubcategories,
    isSubmitting, 
    setIsSubmitting,
    handleChange, 
    handleSelectChange, 
    handleDateTimeChange,
    handleFilesChange,
    categories,
    locations,
    facilities
  } = useIncidentForm();
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.type) {
      newErrors.type = 'Please select an incident type';
    }
    
    if (!formData.description) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = 'Please select a category';
    }
    
    if (!formData.locationId) {
      newErrors.locationId = 'Please select a location';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // In a real app, you would submit the data to the API
      console.log('Submitting incident report:', {
        ...formData,
        supportingFiles,
        ticketId: nextTicketId
      });
      
      toast.success('Incident reported successfully!');
      navigate('/incidents');
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast.error('Failed to submit incident report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Report an Incident</CardTitle>
            <p className="text-muted-foreground">
              Fill in the details below to report a new incident
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Incident Details</TabsTrigger>
                  <TabsTrigger value="attachments">Supporting Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-6 pt-4">
                  {/* Incident Type */}
                  <div className="space-y-2">
                    <label htmlFor="type" className="text-sm font-medium block">
                      Incident Type*
                    </label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleSelectChange('type', value)}
                    >
                      <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Incident">Incident</SelectItem>
                        <SelectItem value="Near Miss">Near Miss</SelectItem>
                        <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
                  </div>
                  
                  {/* Description */}
                  <IncidentDescriptionSection 
                    description={formData.description}
                    onChange={(e) => handleChange(e.target.name, e.target.value)}
                    errors={errors}
                  />
                  
                  {/* Category and Subcategory */}
                  <IncidentCategorySection
                    categoryId={formData.categoryId}
                    subcategory={formData.subcategory}
                    categories={categories}
                    availableSubcategories={availableSubcategories}
                    onSelectChange={handleSelectChange}
                    errors={errors}
                  />
                  
                  {/* Location and Facility */}
                  <IncidentLocationSection
                    locationId={formData.locationId}
                    facilityId={formData.facilityId}
                    locations={locations}
                    facilities={facilities}
                    onSelectChange={handleSelectChange}
                    errors={errors}
                  />
                  
                  {/* Date and Time */}
                  <IncidentDateTimeSection
                    date={formData.date}
                    time={formData.time}
                    onDateTimeChange={(date, timeString) => {
                      if (date) {
                        handleDateTimeChange('date', date);
                      }
                      if (timeString) {
                        handleDateTimeChange('time', timeString);
                      }
                    }}
                    errors={errors}
                  />
                  
                  {/* Priority */}
                  <div className="space-y-2">
                    <label htmlFor="priority" className="text-sm font-medium block">
                      Priority
                    </label>
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
                </TabsContent>
                
                <TabsContent value="attachments" className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Supporting Documents</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload any photos, videos, or documents that support this incident report
                    </p>
                    
                    <MultipleFilesUpload
                      initialFiles={supportingFiles}
                      onFilesChange={handleFilesChange}
                      maxFiles={5}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/incidents')}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
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
        </Card>
      </div>
    </Layout>
  );
};

export default IncidentReport;
