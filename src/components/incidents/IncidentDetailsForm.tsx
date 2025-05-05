
import React from 'react';
import { FileItem } from '@/types/fileTypes';
import { User } from '@/types/incident';
import IncidentTypeSection from './sections/IncidentTypeSection';
import CategorySection from './sections/CategorySection';
import LocationSection from './sections/LocationSection';
import DateTimeSection from './sections/DateTimeSection';
import DescriptionSection from './sections/DescriptionSection';
import AssignmentSection from './sections/AssignmentSection';

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
  categories: ConfigItem[];
  availableSubcategories: {id: string, name: string}[];
  locations: ConfigItem[];
  facilities: ConfigItem[];
  users: User[];
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
  facilities,
  users
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Incident Type and Priority Section */}
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

      {/* Date and Time Section */}
      <DateTimeSection
        date={formData.date}
        time={formData.time}
        onDateTimeChange={onDateTimeChange}
      />

      {/* Assignment Section */}
      <AssignmentSection 
        owner={formData.owner}
        users={users}
        onSelectChange={onSelectChange}
      />

      {/* Description Section */}
      <div className="md:col-span-1">
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
