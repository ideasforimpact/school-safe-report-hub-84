
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useIncidents, 
  IncidentType, 
  IncidentCategory, 
  IncidentLocation, 
  Person,
  subcategories,
  nearMissSubcategories,
  unsafeConditionSubcategories
} from '@/contexts/IncidentContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
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
import { X, Plus } from 'lucide-react';

const ReportIncident = () => {
  const { addIncident } = useIncidents();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type: '' as IncidentType,
    category: '' as IncidentCategory,
    subcategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    location: '' as IncidentLocation,
  });

  // State to store available subcategories based on type and category
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([]);

  // Update available subcategories when type or category changes
  useEffect(() => {
    if (!formData.type || !formData.category) {
      setAvailableSubcategories([]);
      return;
    }

    if (formData.type === 'Incident') {
      setAvailableSubcategories(subcategories[formData.category as IncidentCategory] || []);
    } else if (formData.type === 'Near Miss') {
      // For near miss, we need to show specific subcategories based on selected category
      const nearMissCategory = formData.category;
      const subcats = nearMissSubcategories[nearMissCategory] || [];
      setAvailableSubcategories(subcats);
    } else if (formData.type === 'Unsafe Condition') {
      // For unsafe condition, show specific subcategories
      const unsafeCategory = formData.category;
      const subcats = unsafeConditionSubcategories[unsafeCategory] || [];
      setAvailableSubcategories(subcats);
    }
  }, [formData.type, formData.category]);

  // Reset subcategory when available subcategories change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      subcategory: ''
    }));
  }, [availableSubcategories]);

  const [peopleInvolved, setPeopleInvolved] = useState<Person[]>([
    { name: '', role: 'Student' as const, notes: '' }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get categories based on selected type
  const getCategoriesForType = (type: IncidentType): string[] => {
    if (type === 'Incident') {
      return Object.keys(subcategories);
    } else if (type === 'Near Miss') {
      return Object.keys(nearMissSubcategories);
    } else if (type === 'Unsafe Condition') {
      return Object.keys(unsafeConditionSubcategories);
    }
    return [];
  };

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
    setPeopleInvolved([...peopleInvolved, { name: '', role: 'Student', notes: '' }]);
  };

  const removePerson = (index: number) => {
    const updatedPeople = [...peopleInvolved];
    updatedPeople.splice(index, 1);
    setPeopleInvolved(updatedPeople);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.type || !formData.category || !formData.subcategory || !formData.description || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    // Filter out empty people
    const validPeople = peopleInvolved.filter(p => p.name.trim() !== '');
    
    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      
      addIncident({
        type: formData.type as IncidentType,
        category: formData.category as IncidentCategory,
        subcategory: formData.subcategory,
        description: formData.description,
        date: dateTime,
        location: formData.location as IncidentLocation,
        peopleInvolved: validPeople,
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

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Incident Details</CardTitle>
              <CardDescription>Provide information about what occurred</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('category', value)}
                    required
                    disabled={!formData.type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type && getCategoriesForType(formData.type as IncidentType).map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
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
                        <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium">
                    Where it Happened <span className="text-red-500">*</span>
                  </label>
                  <Select 
                    onValueChange={(value) => handleSelectChange('location', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="On Campus">On Campus</SelectItem>
                      <SelectItem value="Off Campus">Off Campus</SelectItem>
                      <SelectItem value="In Transit">In Transit</SelectItem>
                      <SelectItem value="During Function">During Function</SelectItem>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
