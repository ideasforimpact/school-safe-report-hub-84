
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IncidentStatus, IncidentType, Person } from '@/types/incident';
import { subcategories, nearMissSubcategories, unsafeConditionSubcategories } from '@/contexts/IncidentContext';
import IncidentDetailsSection from './IncidentDetailsSection';
import PeopleInvolvedSection from './PeopleInvolvedSection';

interface EditIncidentFormProps {
  formData: {
    type: string;
    category: string;
    subcategory: string;
    description: string;
    rootCause: string;
    date: string;
    time: string;
    location: string;
    status: string;
    owner: string;
    facility: string;
    image: string | undefined;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    type: string;
    category: string;
    subcategory: string;
    description: string;
    rootCause: string;
    date: string;
    time: string;
    location: string;
    status: string;
    owner: string;
    facility: string;
    image: string | undefined;
  }>>;
  peopleInvolved: Person[];
  setPeopleInvolved: React.Dispatch<React.SetStateAction<Person[]>>;
  availableSubcategories: string[];
  setAvailableSubcategories: React.Dispatch<React.SetStateAction<string[]>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const EditIncidentForm: React.FC<EditIncidentFormProps> = ({
  formData,
  setFormData,
  peopleInvolved,
  setPeopleInvolved,
  availableSubcategories,
  setAvailableSubcategories,
  isSubmitting,
  onSubmit,
  onCancel
}) => {
  // Update available subcategories when type or category changes
  useEffect(() => {
    if (!formData.type || !formData.category) {
      setAvailableSubcategories([]);
      return;
    }

    if (formData.type === 'Incident') {
      setAvailableSubcategories(subcategories[formData.category as keyof typeof subcategories] || []);
    } else if (formData.type === 'Near Miss') {
      const nearMissCategory = formData.category;
      const subcats = nearMissSubcategories[nearMissCategory as keyof typeof nearMissSubcategories] || [];
      setAvailableSubcategories(subcats);
    } else if (formData.type === 'Unsafe Condition') {
      const unsafeCategory = formData.category;
      const subcats = unsafeConditionSubcategories[unsafeCategory as keyof typeof unsafeConditionSubcategories] || [];
      setAvailableSubcategories(subcats);
    }
  }, [formData.type, formData.category, setAvailableSubcategories]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (imageBase64: string | undefined) => {
    setFormData(prev => ({ ...prev, image: imageBase64 }));
  };

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

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>Update information about what occurred</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <IncidentDetailsSection
            formData={formData}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
            onImageChange={handleImageChange}
            getCategoriesForType={getCategoriesForType}
            availableSubcategories={availableSubcategories}
          />

          <PeopleInvolvedSection
            peopleInvolved={peopleInvolved}
            setPeopleInvolved={setPeopleInvolved}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            type="button" 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default EditIncidentForm;
