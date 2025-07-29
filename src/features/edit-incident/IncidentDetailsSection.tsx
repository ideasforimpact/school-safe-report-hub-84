
import React from 'react';
import { FileItem } from '@/types/incident';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import TypeSection from './components/TypeSection';
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
      {/* Classification & Location Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Incident Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First row - Report Type, Category, Location */}
          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <TypeSection
              type={formData.type}
              onSelectChange={onSelectChange}
              getCategoriesForType={getCategoriesForType}
            />
          </div>

          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <div className="space-y-2">
              <label htmlFor="categoryId" className="text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </label>
              <Select 
                value={formData.categoryId}
                onValueChange={(value) => onSelectChange('categoryId', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <div className="space-y-2">
              <label htmlFor="locationId" className="text-sm font-medium">
                Location <span className="text-red-500">*</span>
              </label>
              <Select 
                value={formData.locationId}
                onValueChange={(value) => onSelectChange('locationId', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second row - Subcategory, Facility, Priority */}
          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <div className="space-y-2">
              <label htmlFor="subcategory" className="text-sm font-medium">
                Subcategory
              </label>
              <Select 
                value={formData.subcategory}
                onValueChange={(value) => onSelectChange('subcategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map(sub => (
                    <SelectItem key={sub.id} value={sub.name}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <div className="space-y-2">
              <label htmlFor="facilityId" className="text-sm font-medium">
                Facility
              </label>
              <Select 
                value={formData.facilityId}
                onValueChange={(value) => onSelectChange('facilityId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map(facility => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6 p-4 bg-gray-50 rounded-md border border-gray-100">
            <PrioritySection
              priority={formData.priority}
              onSelectChange={onSelectChange}
            />
          </div>
        </div>
      </div>

      <Separator className="bg-gray-200" />

      {/* Date & Time Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline</h3>
        <div className="p-4 bg-gray-50 rounded-md border border-gray-100">
          <DateTimeSection
            date={formData.date}
            time={formData.time}
            onChange={onDateTimeChange}
          />
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
