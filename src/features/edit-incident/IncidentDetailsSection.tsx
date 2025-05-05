
import React from 'react';
import { FileItem } from '@/types/incident';
import TypeStatusSection from './components/TypeStatusSection';
import CategorySubcategorySection from './components/CategorySubcategorySection';
import LocationFacilitySection from './components/LocationFacilitySection';
import DateTimeSection from './components/DateTimeSection';
import DescriptionSection from './components/DescriptionSection';
import PrioritySection from './components/PrioritySection';
import AssignmentSection from './components/AssignmentSection';

interface ConfigItem {
  id: string;
  name: string;
}

interface IncidentDetailsProps {
  formData: {
    id: string;
    ticketId: string;
    type: string;
    status: string;
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
  image?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
  supportingFiles: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  onImageChange: (imageBase64: string | undefined) => void;
  categories: ConfigItem[];
  availableSubcategories: {id: string, name: string}[];
  locations: ConfigItem[];
  facilities: ConfigItem[];
  users: any[];
}

const IncidentDetailsSection: React.FC<IncidentDetailsProps> = ({
  formData,
  image,
  onChange,
  onSelectChange,
  onDateTimeChange,
  supportingFiles,
  onFilesChange,
  onImageChange,
  categories,
  availableSubcategories,
  locations,
  facilities,
  users
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Type and Status Section */}
      <TypeStatusSection
        type={formData.type}
        status={formData.status}
        onSelectChange={onSelectChange}
      />

      {/* Priority Section */}
      <PrioritySection
        priority={formData.priority}
        onSelectChange={onSelectChange}
      />

      {/* Category and Subcategory Section */}
      <CategorySubcategorySection
        categoryId={formData.categoryId}
        categories={categories}
        subcategory={formData.subcategory}
        availableSubcategories={availableSubcategories}
        onSelectChange={onSelectChange}
      />

      {/* Location and Facility Section */}
      <LocationFacilitySection
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

      {/* Description, Image, and Supporting Documents Section */}
      <div className="md:col-span-3">
        <DescriptionSection
          description={formData.description}
          image={image}
          supportingFiles={supportingFiles}
          onChange={onChange}
          onImageChange={onImageChange}
          onFilesChange={onFilesChange}
        />
      </div>
    </div>
  );
};

export default IncidentDetailsSection;
