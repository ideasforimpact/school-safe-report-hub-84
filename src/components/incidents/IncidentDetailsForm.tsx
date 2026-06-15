
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
import ReusableFileUploader from '@/components/common/ReusableFileUploader';
import { DESCRIPTION_MAX_LENGTH } from '../constants';
import Loader from '../common/Loader';
import { Sparkles, X, Loader2, ChevronRight } from 'lucide-react';
import { useIncidentCategorySuggestion } from '@/hooks/useIncidentCategorySuggestion';

interface IncidentDetailsFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onApplySuggestion: (categoryId: string, subcategoryId: string | null) => void;
  onDateTimeChange: (date: Date | undefined, timeString?: string) => void;
  supportingFiles: FileItem[];
  onFilesChange: (files: FileItem[]) => void;
  configData?: any;
  configLoading?: boolean;
}

const IncidentDetailsForm: React.FC<IncidentDetailsFormProps> = ({
  formData,
  onChange,
  onSelectChange,
  onApplySuggestion,
  onDateTimeChange,
  supportingFiles,
  onFilesChange,
  configData: propConfigData,
  configLoading: propConfigLoading
}) => {
  // Get form configuration data from database
  const hookData = useIncidentFormData();
  const configData = propConfigData || hookData.formData;
  const configLoading = propConfigLoading !== undefined ? propConfigLoading : hookData.loading;
  const employees = (hookData.employees || []).map((emp: any) => ({
    id: emp.id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    email: emp.email || '',
  }));
  const { suggestions, loading: suggestionLoading, noMatch, clearSuggestions } = useIncidentCategorySuggestion(
    formData.description ?? '',
    configData.categories,
    configData.subcategories,
  );

  const getFilteredSubcategories = () => {
    if (!formData.categoryId) return [];
    return configData.subcategories.filter(sub => sub.category_id === formData.categoryId);
  };

  // Get filtered facilities based on selected location
  const getFilteredFacilities = () => {
    if (!formData.locationId) return [];
    return configData.facilities.filter(facility => facility.campus_id === formData.locationId);
  };

  const applySuggestion = (categoryId: string, subcategoryId: string | null) => {
    onApplySuggestion(categoryId, subcategoryId);
    clearSuggestions();
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

        {/* AI Suggestions */}
        {suggestionLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Analysing description to suggest category...</span>
          </div>
        )}
        {!suggestionLoading && suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>AI Suggested Categories</span>
                <span className="text-xs font-normal text-blue-500">— click to apply</span>
              </div>
              <button
                type="button"
                onClick={clearSuggestions}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Dismiss suggestions"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={s.categoryId}
                  type="button"
                  onClick={() => applySuggestion(s.categoryId, s.subcategoryId)}
                  className={`flex items-center gap-2 w-full text-left text-sm rounded-lg px-3 py-2 border transition-colors
                    ${i === 0
                      ? 'bg-white border-blue-400 text-blue-800 hover:bg-blue-100 font-medium'
                      : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                    }`}
                >
                  <span className="text-xs text-blue-400 font-normal w-4 shrink-0">#{s.rank}</span>
                  <span>{s.categoryName}</span>
                  {s.subcategoryName && (
                    <>
                      <ChevronRight className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="text-blue-600">{s.subcategoryName}</span>
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
        {!suggestionLoading && noMatch && (
          <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <span className="shrink-0 mt-0.5">ℹ️</span>
            <span>No matching category or subcategory found for this description. Please select them manually from the dropdowns below.</span>
          </div>
        )}

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
            <Select key={formData.categoryId} value={formData.subcategoryId} onValueChange={(value) => onSelectChange('subcategoryId', value)} required>
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

        {/* Assignment Section */}
        <AssignmentSection
          owner={formData.owner || ''}
          onSelectChange={onSelectChange}
          employees={employees}
        />

        {/* Supporting Files */}
        <div className="space-y-4">
          <Label className="text-sm font-medium text-gray-700">Supporting Files</Label>
          <ReusableFileUploader
            onFilesChange={onFilesChange}
            initialFiles={supportingFiles}
            maxFiles={5}
            maxSize={10}
            maxTotalSize={50}
            allowedTypes={['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']}
            accept=".pdf,.jpg,.jpeg,.png"
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default IncidentDetailsForm;
