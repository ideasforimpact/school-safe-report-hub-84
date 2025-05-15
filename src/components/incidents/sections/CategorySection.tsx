import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';

interface CategorySectionProps {
  categoryId: string;
  subcategory: string;
  onSelectChange: (name: string, value: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  categoryId,
  subcategory,
  onSelectChange
}) => {
  return (
    <div className="space-y-4 text-left">
      <div>
        <label htmlFor="categoryId" className="text-sm font-medium block">
          Category <span className="text-red-500">*</span>
        </label>
        <Select 
          value={categoryId} 
          onValueChange={(value) => onSelectChange('categoryId', value)}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Physical Injury</SelectItem>
            <SelectItem value="2">Bullying</SelectItem>
            <SelectItem value="3">Property Damage</SelectItem>
            <SelectItem value="4">Security Breach</SelectItem>
            <SelectItem value="5">Health Concern</SelectItem>
            <SelectItem value="6">Tech Misuse</SelectItem>
            <SelectItem value="7">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="subcategory" className="text-sm font-medium block">
          Subcategory <span className="text-red-500">*</span>
        </label>
        <Select 
          value={subcategory} 
          onValueChange={(value) => onSelectChange('subcategory', value)}
          disabled={!categoryId}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select subcategory" />
          </SelectTrigger>
          <SelectContent>
            {categoryId === '1' && (
              <>
                <SelectItem value="minor_injury">Minor Injury</SelectItem>
                <SelectItem value="major_injury">Major Injury</SelectItem>
                <SelectItem value="first_aid">First Aid Required</SelectItem>
              </>
            )}
            {categoryId === '2' && (
              <>
                <SelectItem value="verbal">Verbal Bullying</SelectItem>
                <SelectItem value="physical">Physical Bullying</SelectItem>
                <SelectItem value="cyber">Cyberbullying</SelectItem>
              </>
            )}
            {categoryId === '3' && (
              <>
                <SelectItem value="vandalism">Vandalism</SelectItem>
                <SelectItem value="accidental">Accidental</SelectItem>
                <SelectItem value="natural">Natural Causes</SelectItem>
              </>
            )}
            {/* Add other subcategories based on selected category */}
            {!['1', '2', '3'].includes(categoryId) && categoryId && (
              <SelectItem value="general">General</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CategorySection;
