
import React from 'react';
import { FileItem } from '@/types/incident';
import { Separator } from '@/components/ui/separator';
import TypeStatusSection from './components/TypeStatusSection';
import CategorySubcategorySection from './components/CategorySubcategorySection';
import LocationFacilitySection from './components/LocationFacilitySection';
import DateTimeSection from './components/DateTimeSection';
import DescriptionSection from './components/DescriptionSection';
import PrioritySection from './components/PrioritySection';
import AssignmentSection from './components/AssignmentSection';
import { ConfigItem } from '@/contexts/types';

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
  getCategoriesForType: (type: string) => ConfigItem[];
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
  users,
  getCategoriesForType
}) => {
  return (
    <div className="space-y-8">
      {/* Classification Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Classification & Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First column */}
          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <TypeStatusSection
              type={formData.type}
              status={formData.status}
              onSelectChange={onSelectChange}
              getCategoriesForType={getCategoriesForType}
            />

            <PrioritySection
              priority={formData.priority}
              onSelectChange={onSelectChange}
            />
          </div>

          {/* Second column */}
          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <CategorySubcategorySection
              categoryId={formData.categoryId}
              categories={categories}
              subcategory={formData.subcategory}
              availableSubcategories={availableSubcategories}
              onSelectChange={onSelectChange}
            />
          </div>
        </div>
      </div>

      <Separator className="bg-gray-200" />

      {/* Location & Time Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Location & Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First column */}
          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <LocationFacilitySection
              location={formData.locationId}
              locations={locations}
              facility={formData.facilityId}
              facilities={facilities}
              onSelectChange={onSelectChange}
            />
          </div>

          {/* Second column */}
          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <DateTimeSection
              date={formData.date}
              time={formData.time}
              onChange={onDateTimeChange}
            />
          </div>
        </div>
      </div>

      <Separator className="bg-gray-200" />

      {/* Assignment section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Assignment</h3>
        <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
          <AssignmentSection 
            owner={formData.owner}
            users={users}
            onSelectChange={onSelectChange}
          />
        </div>
      </div>

      <Separator className="bg-gray-200" />

      {/* Description section - full width */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Incident Details</h3>
        <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
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
    </div>
  );
};

export default IncidentDetailsSection;
