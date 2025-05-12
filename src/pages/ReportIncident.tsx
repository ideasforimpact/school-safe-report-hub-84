
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidents } from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useClient } from '@/contexts/ClientContext';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIncidentFormData } from '@/hooks/incident-form/useIncidentFormData';
import { useIncidentFormValidation } from '@/hooks/incident-form/useIncidentFormValidation';
import { useCategoryOptions } from '@/hooks/incident-form/useCategoryOptions';
import { useLocationOptions } from '@/hooks/incident-form/useLocationOptions';
import { toast } from '@/components/ui/use-toast';
import { Loader2, CalendarIcon } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { formatUserFullName } from '@/utils/userUtils';
import { IncidentType, IncidentCategory, IncidentLocation } from '@/types/incident';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { useForm } from "react-hook-form";

const ReportIncident = () => {
  const navigate = useNavigate();
  const { addIncident } = useIncidents();
  const { user } = useAuth();
  const { client } = useClient();
  const { formData, setFormData, handleChange, handleSelectChange, handleDateTimeChange } = useIncidentFormData(user || undefined);
  const { categoryOptions, subcategoryOptions } = useCategoryOptions();
  const { locationOptions, facilityOptions } = useLocationOptions(formData.locationId);
  const { errors, validateForm } = useIncidentFormValidation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Effect to check if user is authenticated
  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to report an incident",
        variant: "destructive"
      });
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm(formData)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Get category label (which should be an IncidentCategory)
      const categoryLabel = categoryOptions.find((cat) => cat.value === formData.categoryId)?.label || '';
      
      // Format data for submission
      const incident = {
        title: `${formData.type}: ${formData.description.substring(0, 50)}${formData.description.length > 50 ? '...' : ''}`,
        description: formData.description,
        rootCause: formData.rootCause,
        type: formData.type as IncidentType,
        date: new Date(formData.date),
        time: formData.time,
        dateReported: new Date(),
        location: formData.location as IncidentLocation,
        locationId: formData.locationId,
        facilityId: formData.facilityId,
        category: categoryLabel as IncidentCategory, 
        categoryId: formData.categoryId,
        subcategory: formData.subcategory,
        priority: formData.priority,
        reportedById: user?.id || '',
        reportedBy: {
          id: user?.id || '',
          name: user ? formatUserFullName(user) : ''
        },
        assignedToId: '',
        clientId: client?.id || '',
        peopleInvolved: []
      };
      
      await addIncident(incident);
      toast({
        title: "Success",
        description: "Incident reported successfully"
      });
      navigate('/incidents');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report incident",
        variant: "destructive"
      });
      console.error("Error reporting incident:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Report an Incident</h2>
            <p className="text-gray-500">Please fill out the form below to report an incident.</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                {/* Incident Type */}
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Incident Type
                  </label>
                  <Select onValueChange={(value) => handleSelectChange('type', value)} defaultValue={formData.type}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an incident type" />
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
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Description
                  </label>
                  <Textarea
                    placeholder="Detailed description of the incident"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                  {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                </div>

                {/* Date and Time */}
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.date ? format(new Date(formData.date), "PPP") : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date ? new Date(formData.date) : undefined}
                          onSelect={(date) => handleDateTimeChange('date', date)}
                          disabled={(date) =>
                            date > new Date()
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date && <p className="text-red-500 text-sm">{errors.date}</p>}
                  </div>
                  <div className="w-1/2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Time
                    </label>
                    <Input
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleChange('time', e.target.value)}
                    />
                    {errors.time && <p className="text-red-500 text-sm">{errors.time}</p>}
                  </div>
                </div>

                {/* Category and Subcategory */}
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Category
                    </label>
                    <Select onValueChange={(value) => handleSelectChange('categoryId', value)} defaultValue={formData.categoryId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && <p className="text-red-500 text-sm">{errors.categoryId}</p>}
                  </div>
                  <div className="w-1/2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Subcategory
                    </label>
                    <Select onValueChange={(value) => handleSelectChange('subcategory', value)} defaultValue={formData.subcategory} disabled={!formData.categoryId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {subcategoryOptions.map((subcategory) => (
                          <SelectItem key={subcategory.value} value={subcategory.value}>
                            {subcategory.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.subcategory && <p className="text-red-500 text-sm">{errors.subcategory}</p>}
                  </div>
                </div>

                {/* Location and Facility */}
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Location
                    </label>
                    <Select onValueChange={(value) => handleSelectChange('locationId', value)} defaultValue={formData.locationId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locationOptions.map((location) => (
                          <SelectItem key={location.value} value={location.value}>
                            {location.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.locationId && <p className="text-red-500 text-sm">{errors.locationId}</p>}
                  </div>
                  <div className="w-1/2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Facility
                    </label>
                    <Select onValueChange={(value) => handleSelectChange('facilityId', value)} defaultValue={formData.facilityId} disabled={!formData.locationId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a facility" />
                      </SelectTrigger>
                      <SelectContent>
                        {facilityOptions.map((facility) => (
                          <SelectItem key={facility.value} value={facility.value}>
                            {facility.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Priority
                  </label>
                  <Select onValueChange={(value) => handleSelectChange('priority', value)} defaultValue={formData.priority}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && <p className="text-red-500 text-sm">{errors.priority}</p>}
                </div>

                {/* Root Cause */}
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Root Cause (Optional)
                  </label>
                  <Textarea
                    placeholder="Enter the root cause of the incident"
                    value={formData.rootCause}
                    onChange={(e) => handleChange('rootCause', e.target.value)}
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reporting...
                </>
              ) : (
                "Report Incident"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default ReportIncident;
