
import React from 'react';
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageIcon } from 'lucide-react';

interface BasicInfoTabProps {
  formData: {
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    active: boolean;
    logo: string;
  };
  setFormData: (formData: any) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const BasicInfoTab = ({ formData, setFormData, handleLogoUpload }: BasicInfoTabProps) => {
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
        <label htmlFor="name">Client Name</label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          placeholder="Enter client name"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="contactPerson">Contact Person</label>
        <Input
          id="contactPerson"
          value={formData.contactPerson}
          onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
          placeholder="Enter contact person name"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          placeholder="Enter email"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="phone">Phone</label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="Enter phone number"
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
