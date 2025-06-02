
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { FileItem } from '@/types/fileTypes';
import { useIncidentFormData } from '@/hooks/useIncidentFormData';
import AssignmentSection from './sections/AssignmentSection';

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles: FileItem[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const fileItem: FileItem = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          base64: e.target?.result as string,
        };
        newFiles.push(fileItem);
        
        if (newFiles.length === Array.from(files).length) {
          onFilesChange([...supportingFiles, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset the input
    event.target.value = '';
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = supportingFiles.filter(file => file.id !== fileId);
    onFilesChange(updatedFiles);
  };

  if (configLoading) {
    return (
      <Card className="border-none shadow-none bg-white">
        <CardContent className="space-y-6 p-6">
          <div className="text-center py-8">Loading form configuration...</div>
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

        {/* First Row - Report Type, Category, Location */}
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
        </div>

        {/* Second Row - Subcategory, Facility, Priority */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="subcategory" className="text-sm font-medium text-gray-700">
              Subcategory
            </Label>
            <Select value={formData.subcategoryId} onValueChange={(value) => onSelectChange('subcategoryId', value)}>
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

          <div className="space-y-2">
            <Label htmlFor="facility" className="text-sm font-medium text-gray-700">
              Facility
            </Label>
            <Select value={formData.facilityId} onValueChange={(value) => onSelectChange('facilityId', value)}>
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
          <Textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            placeholder="Describe what happened..."
            className="min-h-[120px] bg-white border-gray-300"
            required
          />
        </div>

        {/* Assignment Section */}
        <AssignmentSection
          owner={formData.owner || ''}
          onSelectChange={onSelectChange}
        />

        {/* Supporting Files */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700">Supporting Files</Label>
            <div>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('file-upload')?.click()}
                className="h-8 px-3"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload Files
              </Button>
            </div>
          </div>

          {supportingFiles.length > 0 && (
            <div className="grid grid-cols-1 gap-2">
              {supportingFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentDetailsForm;
