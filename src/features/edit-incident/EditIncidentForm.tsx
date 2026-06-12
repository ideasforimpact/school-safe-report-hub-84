
import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import IncidentDetailsSection from './IncidentDetailsSection';
import { useEditIncidentForm } from './hooks/useEditIncidentForm';
import {
  resolveScenarioForEdit,
  type NextScenarioResult,
} from '@/demo_client/incident/demoScenarios';

interface EditIncidentFormProps {
  /** Demo Setup pipe: when the header's demo icon is clicked, the page
   *  parent stashes the chosen scenario here. This component watches
   *  the prop in a useEffect, applies the partial form patch, then
   *  calls onDemoConsumed so the parent clears the slot (one apply
   *  per click). When VITE_IS_DEMO_SETUP is off the header doesn't
   *  render the button, so this prop stays null. */
  pendingDemo?: NextScenarioResult | null;
  onDemoConsumed?: () => void;
}

const EditIncidentForm: React.FC<EditIncidentFormProps> = ({
  pendingDemo,
  onDemoConsumed,
}) => {
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
    getCategoriesForType,
    setFormData,
    categories,
  } = useEditIncidentForm();

  // Watch the demo-fill pipe from the page. When a scenario lands here
  // from the header, apply it via setFormData (the Edit form's name-
  // based shape: type / subcategory / priority enum) then signal
  // consumption upward.
  useEffect(() => {
    if (!pendingDemo) return;
    const partial = resolveScenarioForEdit(
      pendingDemo.scenario,
      { categories },
      pendingDemo.index,
    );
    setFormData(prev => ({ ...prev, ...partial }));
    onDemoConsumed?.();
    // We intentionally depend only on `pendingDemo` so the effect fires
    // exactly once per header click. The other refs are stable from
    // the hook for the lifetime of this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDemo]);

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
