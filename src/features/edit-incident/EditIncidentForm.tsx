
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
      <Card className="border-none shadow-md">
        <CardContent className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-700 mb-1">Incident Details</h2>
            <p className="text-sm text-gray-500">Edit incident information and details</p>
            <Separator className="mt-2 bg-gray-200" />
          </div>

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

          <div className="flex justify-end space-x-2 pt-8 mt-6 border-t border-gray-100">
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default EditIncidentForm;
