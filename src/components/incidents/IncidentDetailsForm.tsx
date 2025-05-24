
import React from 'react';
import { FileItem } from '@/types/fileTypes';
import IncidentTypeSection from './sections/IncidentTypeSection';
import CategorySection from './sections/CategorySection';
import LocationSection from './sections/LocationSection';
import DateTimeSection from './sections/DateTimeSection';
import DescriptionSection from './sections/DescriptionSection';
import AssignmentSection from './sections/AssignmentSection';
import { useIncidentFormData } from '@/hooks/useIncidentFormData';

interface ConfigItem {
  id: string;
  name: string;
}

interface IncidentDetailsFormProps {
  formData: {
    type: string;
    categoryId: string;
    subcategory: string;
    description: string;
    date: string;
    time: string;
    locationId: string;
    facilityId: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    owner: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
  supportingFiles: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  locations?: ConfigItem[];
  facilities?: ConfigItem[];
}

const IncidentDetailsForm: React.FC<IncidentDetailsFormProps> = ({
  formData,
  onChange,
  onSelectChange,
  onDateTimeChange,
  supportingFiles,
  onFilesChange
}) => {
  // Fetch data from database tables
  const { formData: dbFormData, loading } = useIncidentFormData();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Incident Type and Priority Section */}
      <div className="space-y-6">
        <IncidentTypeSection
          type={formData.type}
          priority={formData.priority}
          onSelectChange={onSelectChange}
          reportTypes={dbFormData.reportTypes}
          priorities={dbFormData.priorities}
          loading={loading}
        />
      </div>

      {/* Category and Subcategory Section */}
      <div className="space-y-6">
        <CategorySection
          categoryId={formData.categoryId}
          subcategory={formData.subcategory}
          onSelectChange={onSelectChange}
          categories={dbFormData.categories}
          subcategories={dbFormData.subcategories}
          loading={loading}
        />
      </div>

      {/* Location and Facility Section */}
      <div className="space-y-6">
        <LocationSection
          locationId={formData.locationId}
          facilityId={formData.facilityId}
          onSelectChange={onSelectChange}
          locations={dbFormData.locations}
          facilities={dbFormData.facilities}
          loading={loading}
        />
      </div>

      {/* Date and Time Section */}
      <div className="space-y-6">
        <DateTimeSection
          date={formData.date}
          time={formData.time}
          onDateTimeChange={onDateTimeChange}
        />
      </div>

      {/* Assignment Section */}
      <div className="space-y-6">
        <AssignmentSection 
          owner={formData.owner}
          onSelectChange={onSelectChange}
        />
      </div>

      {/* Empty div to maintain grid alignment */}
      <div></div>

      {/* Description Section - spans full width */}
      <div className="md:col-span-3 space-y-6">
        <DescriptionSection
          description={formData.description}
          supportingFiles={supportingFiles}
          onChange={onChange}
          onFilesChange={onFilesChange}
        />
      </div>
    </div>
  );
};

export default IncidentDetailsForm;
