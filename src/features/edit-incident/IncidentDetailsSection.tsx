
import React from 'react';
import { IncidentType, FileItem } from '@/types/incident';
import { useIncidents } from '@/contexts/IncidentContext';

// Import our component sections
import TypeStatusSection from './components/TypeStatusSection';
import CategorySubcategorySection from './components/CategorySubcategorySection';
import LocationFacilitySection from './components/LocationFacilitySection';
import AssignmentSection from './components/AssignmentSection';
import DescriptionSection from './components/DescriptionSection';
import DateTimeSection from './components/DateTimeSection';
import PrioritySection from './components/PrioritySection';

interface IncidentDetailsSectionProps {
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
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  };
  supportingFiles: FileItem[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onImageChange: (imageBase64: string | undefined) => void;
  onFilesChange: (files: FileItem[]) => void;
  getCategoriesForType: (type: IncidentType) => string[];
  availableSubcategories: string[];
}

const IncidentDetailsSection: React.FC<IncidentDetailsSectionProps> = ({
  formData,
  supportingFiles,
  onChange,
  onSelectChange,
  onImageChange,
  onFilesChange,
  getCategoriesForType,
  availableSubcategories
}) => {
  const { users } = useIncidents();
  const categoriesForType = getCategoriesForType(formData.type as IncidentType);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Report Type and Status */}
      <TypeStatusSection
        type={formData.type}
        status={formData.status}
        onSelectChange={onSelectChange}
        getCategoriesForType={getCategoriesForType}
      />

      {/* Priority */}
      <PrioritySection
        priority={formData.priority || 'Medium'}
        onSelectChange={onSelectChange}
      />

      {/* Category and Subcategory */}
      <CategorySubcategorySection
        category={formData.category}
        subcategory={formData.subcategory}
        availableSubcategories={availableSubcategories}
        onSelectChange={onSelectChange}
        categoriesForType={categoriesForType}
      />
      
      {/* Location and Facility */}
      <LocationFacilitySection
        location={formData.location}
        facility={formData.facility}
        onSelectChange={onSelectChange}
      />

      {/* Assigned To */}
      <AssignmentSection
        owner={formData.owner}
        users={users}
        onSelectChange={onSelectChange}
      />

      {/* Date and Time */}
      <DateTimeSection
        date={formData.date}
        time={formData.time}
        onChange={onChange}
      />

      {/* Description, Root Cause and Supporting Files */}
      <div className="md:col-span-2">
        <DescriptionSection
          description={formData.description}
          rootCause={formData.rootCause}
          image={formData.image}
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
