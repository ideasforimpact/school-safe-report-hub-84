import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ImageUpload from '@/components/ImageUpload';
import { IncidentType } from '@/types/incident';
import { useIncidents } from '@/contexts/IncidentContext';

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
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSelectChange: (name: string, value: string) => void;
  onImageChange: (imageBase64: string | undefined) => void;
  getCategoriesForType: (type: IncidentType) => string[];
  availableSubcategories: string[];
}

const IncidentDetailsSection: React.FC<IncidentDetailsSectionProps> = ({
  formData,
  onChange,
  onSelectChange,
  onImageChange,
  getCategoriesForType,
  availableSubcategories
}) => {
  const { users } = useIncidents();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium">
          Report Type <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.type}
          onValueChange={(value) => onSelectChange('type', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Incident">Incident</SelectItem>
            <SelectItem value="Near Miss">Near Miss</SelectItem>
            <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium">
          Category <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.category}
          onValueChange={(value) => onSelectChange('category', value)}
          required
          disabled={!formData.type}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {formData.type && getCategoriesForType(formData.type as IncidentType).map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="subcategory" className="text-sm font-medium">
          Subcategory <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.subcategory}
          onValueChange={(value) => onSelectChange('subcategory', value)}
          required
          disabled={availableSubcategories.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {availableSubcategories.map(subcategory => (
              <SelectItem key={subcategory} value={subcategory}>{subcategory}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Status <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.status}
          onValueChange={(value) => onSelectChange('status', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="facility" className="text-sm font-medium">
          School Facility <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.facility}
          onValueChange={(value) => onSelectChange('facility', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select facility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Main Building">Main Building</SelectItem>
            <SelectItem value="Science Block">Science Block</SelectItem>
            <SelectItem value="Sports Complex">Sports Complex</SelectItem>
            <SelectItem value="Cafeteria">Cafeteria</SelectItem>
            <SelectItem value="Library">Library</SelectItem>
            <SelectItem value="Administrative Block">Administrative Block</SelectItem>
            <SelectItem value="Playground">Playground</SelectItem>
            <SelectItem value="Auditorium">Auditorium</SelectItem>
            <SelectItem value="Computer Lab">Computer Lab</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label htmlFor="owner" className="text-sm font-medium">
          Assigned to
        </label>
        <Select 
          value={formData.owner}
          onValueChange={(value) => onSelectChange('owner', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Assign to staff member (optional)" />
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem key={user.id} value={user.id}>{user.name} ({user.role})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="description"
          name="description"
          placeholder="Describe what happened in detail"
          value={formData.description}
          onChange={onChange}
          rows={4}
          required
        />
      </div>

      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium">
          Image Documentation (Optional)
        </label>
        <ImageUpload 
          onImageChange={onImageChange} 
          initialImage={formData.image}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="date" className="text-sm font-medium">
          Date of Occurrence <span className="text-red-500">*</span>
        </label>
        <Input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="time" className="text-sm font-medium">
          Time of Occurrence <span className="text-red-500">*</span>
        </label>
        <Input
          type="time"
          id="time"
          name="time"
          value={formData.time}
          onChange={onChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="location" className="text-sm font-medium">
          Where it Happened <span className="text-red-500">*</span>
        </label>
        <Select 
          value={formData.location}
          onValueChange={(value) => onSelectChange('location', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="On Campus">On Campus</SelectItem>
            <SelectItem value="Off Campus">Off Campus</SelectItem>
            <SelectItem value="In Transit">In Transit</SelectItem>
            <SelectItem value="During Function">During Function</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 md:col-span-2 pt-4">
        <label htmlFor="rootCause" className="text-sm font-medium">
          Root Cause Analysis (Optional)
        </label>
        <Textarea
          id="rootCause"
          name="rootCause"
          placeholder="Describe the underlying factors that contributed to this incident"
          value={formData.rootCause}
          onChange={onChange}
          rows={3}
        />
      </div>
    </div>
  );
};

export default IncidentDetailsSection;
