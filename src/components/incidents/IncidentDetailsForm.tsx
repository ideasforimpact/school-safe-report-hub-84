
import React from 'react';
import { FileItem } from '@/types/fileTypes';
import IncidentTypeSection from './IncidentTypeSection';
import CategorySection from './CategorySection';
import LocationSection from './LocationSection';
import DateTimeSection from './DateTimeSection';
import DescriptionSection from './DescriptionSection';

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
    rootCause: string;
    date: string;
    time: string;
    locationId: string;
    facilityId: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
  supportingFiles: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  categories: ConfigItem[];
  availableSubcategories: {id: string, name: string}[];
  locations: ConfigItem[];
  facilities: ConfigItem[];
}

const IncidentDetailsForm: React.FC<IncidentDetailsFormProps> = ({
  formData,
  onChange,
  onSelectChange,
  onDateTimeChange,
  supportingFiles,
  onFilesChange,
  categories,
  availableSubcategories,
  locations,
  facilities
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Incident Type and Priority Section - Status removed */}
      <IncidentTypeSection
        type={formData.type}
        priority={formData.priority}
        onSelectChange={onSelectChange}
      />

      {/* Category and Subcategory Section */}
      <CategorySection
        categoryId={formData.categoryId}
        categories={categories}
        subcategory={formData.subcategory}
        availableSubcategories={availableSubcategories}
        onSelectChange={onSelectChange}
      />

      {/* Location and Facility Section */}
      <LocationSection
        locationId={formData.locationId}
        locations={locations}
        facilityId={formData.facilityId}
        facilities={facilities}
        onSelectChange={onSelectChange}
      />

      {/* Description and Supporting Documents Section */}
      <DescriptionSection
        description={formData.description}
        rootCause={formData.rootCause}
        supportingFiles={supportingFiles}
        onChange={onChange}
        onFilesChange={onFilesChange}
      />

      {/* Date and Time Section */}
      <DateTimeSection
        date={formData.date}
        time={formData.time}
        onDateTimeChange={onDateTimeChange}
      />
    </div>
  );
};

export default IncidentDetailsForm;
