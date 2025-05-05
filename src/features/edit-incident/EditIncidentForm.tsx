
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import IncidentDetailsSection from './IncidentDetailsSection';
import { useEditIncidentForm } from './hooks/useEditIncidentForm';

const EditIncidentForm = () => {
  const {
    formData,
    image,
    supportingFiles,
    peopleInvolved,
    availableSubcategories,
    handleChange,
    handleSelectChange,
    handleDateTimeChange,
    handleFilesChange,
    onImageChange,
    isSubmitting,
    handleSubmit,
    getCategories,
    getLocations,
    getFacilities,
    getUsers,
    getCategoriesForType
  } = useEditIncidentForm();

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border-none shadow-card">
        <CardContent className="space-y-6 pt-6">
          {/* Incident Details Section */}
          <IncidentDetailsSection
            formData={formData}
            image={image}
            onChange={handleChange}
            onSelectChange={handleSelectChange}
            onDateTimeChange={handleDateTimeChange}
            supportingFiles={supportingFiles}
            onFilesChange={handleFilesChange}
            onImageChange={onImageChange}
            categories={getCategories()}
            availableSubcategories={availableSubcategories}
            locations={getLocations()}
            facilities={getFacilities()}
            users={getUsers()}
            getCategoriesForType={getCategoriesForType}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default EditIncidentForm;
