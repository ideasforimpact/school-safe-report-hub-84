
import React from 'react';
import { ConfigItem } from '@/contexts/types';
import { FileItem, User } from '@/types/incident';
import TypeStatusSection from './components/TypeStatusSection';
import CategorySubcategorySection from './components/CategorySubcategorySection';
import LocationFacilitySection from './components/LocationFacilitySection';
import DateTimeSection from './components/DateTimeSection';
import DescriptionSection from './components/DescriptionSection';
import AssignmentSection from './components/AssignmentSection';
import PrioritySection from './components/PrioritySection';

interface IncidentDetailsSectionProps {
  formData: {
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
  onImageChange: (image: string | undefined) => void;
  categories: ConfigItem[];
  availableSubcategories: {id: string, name: string}[];
  locations: ConfigItem[];
  facilities: ConfigItem[];
  users: User[];
  getCategoriesForType?: (type: string) => ConfigItem[];
}

const IncidentDetailsSection: React.FC<IncidentDetailsSectionProps> = ({
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
  users,
  getCategoriesForType
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Type and Status Section */}
      <div className="space-y-6">
        <TypeStatusSection
          type={formData.type}
          status={formData.status}
          onSelectChange={onSelectChange}
          getCategoriesForType={getCategoriesForType}
        />
      </div>

      {/* Category and Subcategory Section */}
      <div className="space-y-6">
        <CategorySubcategorySection
          categoryId={formData.categoryId}
          subcategory={formData.subcategory}
          categories={categories}
          availableSubcategories={availableSubcategories}
          onSelectChange={onSelectChange}
        />
      </div>

      {/* Location and Facility Section */}
      <div className="space-y-6">
        <LocationFacilitySection
          locationId={formData.locationId}
          facilityId={formData.facilityId}
          locations={locations}
          facilities={facilities}
          onSelectChange={onSelectChange}
        />
      </div>

      {/* Date and Time Section */}
      <div className="space-y-6">
        <DateTimeSection
          date={formData.date}
          time={formData.time}
          onChange={onDateTimeChange}
        />
      </div>

      {/* Priority Section */}
      <div className="space-y-6">
        <PrioritySection
          priority={formData.priority}
          onSelectChange={onSelectChange}
        />
      </div>

      {/* Assignment Section */}
      <div className="space-y-6">
        <AssignmentSection 
          owner={formData.owner}
          users={users}
          onSelectChange={onSelectChange}
        />
      </div>

      {/* Description Section - spans full width */}
      <div className="md:col-span-3 space-y-6">
        <DescriptionSection
          description={formData.description}
          image={image}
          supportingFiles={supportingFiles}
          onChange={onChange}
          onFilesChange={onFilesChange}
          onImageChange={onImageChange}
        />
      </div>
    </div>
  );
};

export default IncidentDetailsSection;
