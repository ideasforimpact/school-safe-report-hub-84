
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Person } from '@/types/incident';
import IncidentDetailsSection from './IncidentDetailsSection';
import PeopleInvolvedSection from './PeopleInvolvedSection';
import { useEditIncidentForm } from './hooks/useEditIncidentForm';

interface EditIncidentFormProps {
  initialFormData: {
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
  initialPeopleInvolved: Person[];
  isSubmitting: boolean;
  onSubmit: (updatedFormData: any, updatedPeople: Person[]) => void;
  onCancel: () => void;
}

const EditIncidentForm: React.FC<EditIncidentFormProps> = ({
  initialFormData,
  initialPeopleInvolved,
  isSubmitting,
  onSubmit,
  onCancel
}) => {
  const {
    formData,
    peopleInvolved,
    setPeopleInvolved,
    availableSubcategories,
    supportingFiles,
    handleChange,
    handleSelectChange,
    handleImageChange,
    handleFilesChange,
    getCategoriesForType
  } = useEditIncidentForm(initialFormData, initialPeopleInvolved);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, peopleInvolved);
  };

  return (
    <form onSubmit={handleFormSubmit} className="w-full">
      <Card className="border-none shadow-card">
        <CardHeader>
          <CardTitle>Incident Details</CardTitle>
          <CardDescription>Update information about what occurred</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <IncidentDetailsSection
            formData={formData}
            supportingFiles={supportingFiles}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
            onImageChange={handleImageChange}
            onFilesChange={handleFilesChange}
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
