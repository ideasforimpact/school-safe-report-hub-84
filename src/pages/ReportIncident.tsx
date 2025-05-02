
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useIncidents,
  IncidentType,
  IncidentStatus
} from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import MultipleFilesUpload from '@/components/MultipleFilesUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Ticket } from 'lucide-react';
import { Person } from '@/types/incident';

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  base64: string;
}

const ReportIncident = () => {
  const { 
    addIncident, 
    users, 
    generateTicketId,
    categories,
    subcategoryMappings,
    locations,
    facilities
  } = useIncidents();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nextTicketId, setNextTicketId] = useState('');

  useEffect(() => {
    // Generate a preview of the next ticket ID
    setNextTicketId(generateTicketId());
  }, [generateTicketId]);

  const [formData, setFormData] = useState({
    type: '' as IncidentType,
    categoryId: '',
    subcategory: '',
    description: '',
    rootCause: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    locationId: '',
    facilityId: '',
    status: 'Open' as IncidentStatus,
    priority: 'Medium' as 'Low' | 'Medium' | 'High' | 'Critical'
  });

  const [supportingFiles, setSupportingFiles] = useState<FileItem[]>([]);

  // State to store available subcategories based on selected category
  const [availableSubcategories, setAvailableSubcategories] = useState<{id: string, name: string}[]>([]);

  // Update available subcategories when category changes
  useEffect(() => {
    if (!formData.categoryId) {
      setAvailableSubcategories([]);
      return;
    }

    // Get subcategories for this category
    const subcats = subcategoryMappings[formData.categoryId] || [];
    setAvailableSubcategories(subcats);
  }, [formData.categoryId, subcategoryMappings]);

  // Reset subcategory when available subcategories change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subcategory: ''
    }));
  }, [availableSubcategories]);

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([
    { name: '', role: 'Student' as const, id: '', notes: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePersonChange = (index: number, field: keyof Person, value: string) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople[index] = { ...updatedPeople[index], [field]: value };
    setPeopleInvolved(updatedPeople);
  };

  const addPerson = () => {
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', id: '', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople.splice(index, 1);
    setPeopleInvolved(updatedPeople);
  };

  const handleFilesChange = (files: FileItem[]) => {
    setSupportingFiles(files);
  };

  const getSelectedCategory = () => {
    const category = categories.find(cat => cat.id === formData.categoryId);
    return category ? category.name : '';
  };

  const getSelectedLocation = () => {
    const location = locations.find(loc => loc.id === formData.locationId);
    return location ? location.name : '';
  };

  const getSelectedFacility = () => {
    const facility = facilities.find(fac => fac.id === formData.facilityId);
    return facility ? facility.name : '';
  };

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
        type: formData.type as IncidentType,
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

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 flex items-start">
          <Ticket className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Ticket Information</h3>
            <p className="text-sm text-blue-600 mt-1">
              This incident will be assigned ticket ID: <strong>{nextTicketId}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
              <CardDescription>Provide information about what occurred</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">
                    Report Type <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('type', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Incident">Incident</SelectItem>
                      <SelectItem value="Near Miss">Near Miss</SelectItem>
                      <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="status" className="text-sm font-medium">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="priority" className="text-sm font-medium">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    value={formData.priority}
                    onValueChange={(value) => handleSelectChange('priority', value)}
                    required
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

                <div className="space-y-2">
                  <label htmlFor="categoryId" className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('categoryId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="subcategory" className="text-sm font-medium">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('subcategory', value)}
                    required
                    disabled={availableSubcategories.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubcategories.map(subcategory => (
                        <SelectItem key={subcategory.id} value={subcategory.name}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="locationId" className="text-sm font-medium">
                    Where it Happened <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('locationId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="facilityId" className="text-sm font-medium">
                    School Facility <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('facilityId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities.map(facility => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what happened in detail"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">
                    Supporting Documents (Optional)
                  </label>
                  <MultipleFilesUpload
                    onFilesChange={handleFilesChange}
                    initialFiles={supportingFiles}
                    maxFiles={5}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload up to 5 files (images, videos, documents) to support this incident report
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium">
                    Date of Occurrence <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="time" className="text-sm font-medium">
                    Time of Occurrence <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium">People Involved</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addPerson}>
                    <Plus className="h-4 w-4 mr-2" /> Add Person
                  </Button>
                </div>

                {peopleInvolved.map((person, index) => (
                  <div key={index} className="border rounded-md p-4 mb-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-sm">Person {index + 1}</h4>
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePerson(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input
                          value={person.name}
                          onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                          placeholder="Full name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Role</label>
                        <Select
                          value={person.role}
                          onValueChange={(value) => handlePersonChange(index, 'role', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Staff">Staff</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {person.role === 'Student' ? 'Student ID' : person.role === 'Staff' ? 'Staff ID' : 'ID'} 
                          {person.role !== 'Other' && <span className="text-red-500">*</span>}
                        </label>
                        <Input
                          value={person.id || ''}
                          onChange={(e) => handlePersonChange(index, 'id', e.target.value)}
                          placeholder={`${person.role} ID`}
                          required={person.role !== 'Other'}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Notes (Optional)</label>
                        <Input
                          value={person.notes || ''}
                          onChange={(e) => handlePersonChange(index, 'notes', e.target.value)}
                          placeholder="Additional details"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2 md:col-span-2 pt-4">
                <label htmlFor="rootCause" className="text-sm font-medium">
                  Root Cause Analysis (Optional)
                </label>
                <Textarea
                  id="rootCause"
                  name="rootCause"
                  placeholder="Describe the underlying factors that contributed to this incident"
                  value={formData.rootCause}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
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

