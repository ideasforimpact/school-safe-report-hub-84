
import React from 'react';
import { Input } from '@/components/ui/input';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileItem } from '@/types/fileTypes';
import { useIncidentFormData } from '@/hooks/useIncidentFormData';
import AssignmentSection from './sections/AssignmentSection';
import DragDropFileUpload from '@/components/file/DragDropFileUpload';
import { DESCRIPTION_MAX_LENGTH } from '../constants';
import Loader from '../common/Loader';

interface IncidentDetailsFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
  supportingFiles: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
}

const IncidentDetailsForm: React.FC<IncidentDetailsFormProps> = ({
  formData,
  onChange,
  onSelectChange,
  onDateTimeChange,
  supportingFiles,
  onFilesChange,
}) => {
  // Get form configuration data from database
  const { formData: configData, loading: configLoading } = useIncidentFormData();

  // Get filtered subcategories based on selected category
  const getFilteredSubcategories = () => {
    if (!formData.categoryId) return [];
    return configData.subcategories.filter(sub => sub.category_id === formData.categoryId);
  };

  // Get filtered facilities based on selected location
  const getFilteredFacilities = () => {
    if (!formData.locationId) return [];
    return configData.facilities.filter(facility => facility.campus_id === formData.locationId);
  };

  if (configLoading) {
    return (
      <Card className="border-none shadow-none bg-white">
        <CardContent className="space-y-6 p-6">
          
            <Loader text="Loading form configuration..." />
          
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none bg-white">
      <CardContent className="space-y-6 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-1">Incident Details</h2>
          <p className="text-sm text-gray-500">Provide detailed information about the incident</p>
          <Separator className="mt-2 bg-gray-200" />
        </div>

        {/* First Row - Report Type, Category, Subcategory */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium text-gray-700">
              Report Type <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.typeId} onValueChange={(value) => onSelectChange('typeId', value)}>
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {configData.reportTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.categoryId} onValueChange={(value) => onSelectChange('categoryId', value)}>
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {configData.categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
              Subcategory <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.subcategoryId} onValueChange={(value) => onSelectChange('subcategoryId', value)} required>
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {getFilteredSubcategories().map((subcategory) => (
                  <SelectItem key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Second Row - Location, Facility, Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-gray-700">
              Location <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.locationId} onValueChange={(value) => onSelectChange('locationId', value)}>
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {configData.locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility" className="text-sm font-medium text-gray-700">
              Facility <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.facilityId} onValueChange={(value) => onSelectChange('facilityId', value)} required>
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {getFilteredFacilities().map((facility) => (
                  <SelectItem key={facility.id} value={facility.id}>
                    {facility.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
              Priority <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.priorityId} onValueChange={(value) => onSelectChange('priorityId', value)}>
              <SelectTrigger className="h-11 bg-white border-gray-300">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                {configData.priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id}>
                    {priority.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              name="date"
              value={formData.date}
              onChange={onChange}
              max={new Date().toISOString().split('T')[0]}
              className="h-11 bg-white border-gray-300"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium text-gray-700">
              Time <span className="text-red-500">*</span>
            </Label>
            <Input
              type="time"
              name="time"
              value={formData.time}
              onChange={onChange}
              max={
                formData.date === new Date().toISOString().substring(0, 10)
                  ? (() => {
                      const now = new Date();
                      const pad = (n) => n.toString().padStart(2, "0");
                      return `${pad(now.getHours())}:${pad(now.getMinutes())}`; // local time HH:MM
                    })()
                  : undefined
              }
              className="h-11 bg-white border-gray-300"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </Label>
          <TextareaWithVoice
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Describe what happened..."
            className="min-h-[120px] bg-white border-gray-300"
            required
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
          <p className="text-xs text-gray-500 text-right">
            {(formData.description ?? '').length}/{DESCRIPTION_MAX_LENGTH} characters
          </p>
        </div>

        {/* Assignment Section */}
        <AssignmentSection
          owner={formData.owner || ''}
          onSelectChange={onSelectChange}
        />

        {/* Supporting Files - Updated to use DragDropFileUpload */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Supporting Files</Label>
          <DragDropFileUpload
            onFilesChange={onFilesChange}
            initialFiles={supportingFiles}
            maxFiles={5}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentDetailsForm;
