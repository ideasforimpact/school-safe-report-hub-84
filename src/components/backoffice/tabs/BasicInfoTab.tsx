
import React from 'react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon, Asterisk } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { InstitutionType } from '@/contexts/ClientContext';

interface BasicInfoTabProps {
  formData: {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    active: boolean;
    logo: string;
    institutionType: InstitutionType;
    superAdminEmail?: string;
    website?: string;
  };
  setFormData: (formData: any) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BasicInfoTab = ({ formData, setFormData, handleLogoUpload }: BasicInfoTabProps) => {
  const institutionTypes: InstitutionType[] = [
    'CBSE', 'IB', 'IGCSE', 'ICSE', 'Matric', 'Combined Campus', 'Other'
  ];

  // Component for required field label
  const RequiredFieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-1">
      {children}
      <Asterisk className="h-3 w-3 text-red-500" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Logo Upload */}
      <div className="space-y-2">
        <label className="font-medium">Client Logo</label>
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 border rounded flex items-center justify-center overflow-hidden">
            {formData.logo ? (
              <img 
                src={formData.logo} 
                alt="Client logo" 
                className="h-full w-full object-contain" 
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-gray-300" />
            )}
          </div>
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a logo image (PNG or JPG)
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <RequiredFieldLabel>
          <label htmlFor="name">Client Name</label>
        </RequiredFieldLabel>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Enter client name"
          required
        />
      </div>
      
      <div className="space-y-2">
        <RequiredFieldLabel>
          <label htmlFor="institutionType">Institution Type</label>
        </RequiredFieldLabel>
        <Select
          value={formData.institutionType}
          onValueChange={(value) => setFormData({...formData, institutionType: value as InstitutionType})}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select institution type" />
          </SelectTrigger>
          <SelectContent>
            {institutionTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <RequiredFieldLabel>
          <label htmlFor="superAdminEmail">Super Admin Email</label>
        </RequiredFieldLabel>
        <Input
          id="superAdminEmail"
          type="email"
          value={formData.superAdminEmail || ''}
          onChange={(e) => setFormData({...formData, superAdminEmail: e.target.value})}
          placeholder="Enter super admin email"
          required
        />
      </div>
      
      <div className="space-y-2">
        <RequiredFieldLabel>
          <label htmlFor="contactPerson">Contact Person</label>
        </RequiredFieldLabel>
        <Input
          id="contactPerson"
          value={formData.contactPerson}
          onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
          placeholder="Enter contact person name"
          required
        />
      </div>
      <div className="space-y-2">
        <RequiredFieldLabel>
          <label htmlFor="email">Email</label>
        </RequiredFieldLabel>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Enter email"
          required
        />
      </div>
      <div className="space-y-2">
        <RequiredFieldLabel>
          <label htmlFor="phone">Phone</label>
        </RequiredFieldLabel>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="Enter phone number"
          required
        />
      </div>
      
      {/* New Website field added before Active Client checkbox */}
      <div className="space-y-2">
        <label htmlFor="website">Website</label>
        <Input
          id="website"
          value={formData.website || ''}
          onChange={(e) => setFormData({...formData, website: e.target.value})}
          placeholder="Enter website URL"
        />
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox 
          id="active-status"
          checked={formData.active}
          onCheckedChange={(checked) => 
            setFormData({...formData, active: checked === true})
          }
        />
        <label 
          htmlFor="active-status"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Active Client
        </label>
      </div>
    </div>
  );
};

export default BasicInfoTab;
