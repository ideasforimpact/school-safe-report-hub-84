import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { buildClientLogoUrl } from '@/lib/utils';

interface ClientType {
  id: string;
  key: string;
  name: string;
}

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
    clientTypeId?: string;
  };
  setFormData: (formData: any) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  showErrors?: boolean;
}

const BasicInfoTab = ({ formData, setFormData, handleLogoUpload, showErrors = false }: BasicInfoTabProps) => {
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [loading, setLoading] = useState(true);

  const institutionTypes: InstitutionType[] = [
    'CBSE', 'IB', 'IGCSE', 'ICSE', 'Matric', 'Combined Campus', 'Other'
  ];

  useEffect(() => {
    fetchClientTypes();
  }, []);

  const fetchClientTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('client_type')
        .select('id, key, name')
        .order('name');

      if (error) {
        console.error('Error fetching client types:', error);
        return;
      }

      setClientTypes(data || []);
    } catch (error) {
      console.error('Error fetching client types:', error);
    } finally {
      setLoading(false);
    }
  };

  // Component for required field label
  const RequiredFieldLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-1">
      {children}
      <Asterisk className="h-3 w-3 text-red-500" />
    </div>
  );

  // Enhanced logo upload handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        setFormData({
          ...formData, 
          logo: base64String
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Logo Upload */}
      <div className="space-y-2">
        <label className="font-medium">Client Logo</label>
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 border rounded flex items-center justify-center overflow-hidden">
            {formData.logo ? (
              <img 
                key={formData.logo} // Force re-render when logo changes
                src={buildClientLogoUrl(formData.logo) || formData.logo} 
                alt="Client logo" 
                className="h-full w-full object-contain" 
                onError={(e) => {
                  console.error('Logo preview failed to load:', formData.logo);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <ImageIcon className="h-10 w-10 text-gray-300" />
            )}
          </div>
          <div className="flex-1">
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload a logo image (PNG, JPG, GIF up to 5MB)
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
          maxLength={50}
          required
        />
        {showErrors && !formData.name && (
          <p className="text-xs text-red-600">Client name is required.</p>
        )}
      </div>

      <div className="space-y-2">
        <RequiredFieldLabel>
          <label htmlFor="clientType">Client Type</label>
        </RequiredFieldLabel>
        <Select
          value={formData.clientTypeId || ''}
          onValueChange={(value) => setFormData({...formData, clientTypeId: value})}
          required
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loading ? "Loading..." : "Select client type"} />
          </SelectTrigger>
          <SelectContent>
            {clientTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showErrors && !formData.clientTypeId && (
          <p className="text-xs text-red-600">Client type is required.</p>
        )}
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
        {showErrors && !formData.institutionType && (
          <p className="text-xs text-red-600">Institution type is required.</p>
        )}
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
          inputMode="email"
          required
        />
        {showErrors && !formData.superAdminEmail && (
          <p className="text-xs text-red-600">Super admin email is required.</p>
        )}
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
          maxLength={20}
          required
        />
        {showErrors && !formData.contactPerson && (
          <p className="text-xs text-red-600">Contact person is required.</p>
        )}
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
          inputMode="email"
          required
        />
        {showErrors && !formData.email && (
          <p className="text-xs text-red-600">Email is required.</p>
        )}
      </div>
      <div className="space-y-2">
        <RequiredFieldLabel>
          <label htmlFor="phone">Phone</label>
        </RequiredFieldLabel>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          pattern="[0-9+()\-\s]{7,20}"
          title="Enter a valid phone number"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="Enter phone number"
          required
        />
        {showErrors && !formData.phone && (
          <p className="text-xs text-red-600">Phone is required.</p>
        )}
      </div>

      {/* Active Client checkbox hidden for backoffice */}
      {/* <div className="flex items-center space-x-2 pt-2">
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
      </div> */}
    </div>
  );
};

export default BasicInfoTab;
