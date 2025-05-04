
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { ImageIcon, Plus, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClientFormData {
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  moduleAccess: {
    incidentReporting: boolean;
    allIncidents: boolean;
    insights: boolean;
    benchmarking: boolean;
  };
  active: boolean;
  logo: string;
  allowedDomains: string[];
  authProviders: {
    google: boolean;
    microsoft: boolean;
    zoho: boolean;
  };
}

interface ClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ClientFormData;
  setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}

const ClientDialog: React.FC<ClientDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const [newDomain, setNewDomain] = useState('');

  const handleModuleAccessChange = (module: keyof typeof formData.moduleAccess, value: boolean) => {
    setFormData({
      ...formData,
      moduleAccess: {
        ...formData.moduleAccess,
        [module]: value
      }
    });
  };

  const handleAuthProviderChange = (provider: keyof typeof formData.authProviders, value: boolean) => {
    setFormData({
      ...formData,
      authProviders: {
        ...formData.authProviders,
        [provider]: value
      }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({...formData, logo: reader.result as string});
      };
      reader.readAsDataURL(file);
    }
  };

  const addDomain = () => {
    if (newDomain && !formData.allowedDomains.includes(newDomain)) {
      setFormData({
        ...formData,
        allowedDomains: [...formData.allowedDomains, newDomain]
      });
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    setFormData({
      ...formData,
      allowedDomains: formData.allowedDomains.filter(d => d !== domain)
    });
  };

  // Ensure allowedDomains is always an array
  const safeAllowedDomains = formData.allowedDomains || [];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update client information' : 'Quickly onboard a new client to the platform'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="access">Module Access</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <div className="space-y-2">
              <label className="font-medium">Module Access</label>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="incident-reporting"
                    checked={formData.moduleAccess.incidentReporting}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('incidentReporting', checked === true)
                    }
                  />
                  <label 
                    htmlFor="incident-reporting"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Incident Reporting
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="all-incidents"
                    checked={formData.moduleAccess.allIncidents}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('allIncidents', checked === true)
                    }
                  />
                  <label 
                    htmlFor="all-incidents"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    All Incidents
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="insights"
                    checked={formData.moduleAccess.insights}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('insights', checked === true)
                    }
                  />
                  <label 
                    htmlFor="insights"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Insights
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="benchmarking"
                    checked={formData.moduleAccess.benchmarking}
                    onCheckedChange={(checked) => 
                      handleModuleAccessChange('benchmarking', checked === true)
                    }
                  />
                  <label 
                    htmlFor="benchmarking"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Benchmarking
                  </label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            {/* Allowed Domains Section */}
            <div className="space-y-2">
              <label className="font-medium">Allowed Email Domains</label>
              <p className="text-sm text-gray-500">
                Only users with email addresses from these domains can access this client's portal
              </p>
              
              <div className="flex gap-2 mb-2">
                <Input 
                  placeholder="e.g. example.com" 
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                />
                <Button type="button" onClick={addDomain} size="sm">
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {safeAllowedDomains.map((domain) => (
                  <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                    {domain}
                    <button 
                      onClick={() => removeDomain(domain)} 
                      className="ml-1 hover:text-destructive focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {domain}</span>
                    </button>
                  </Badge>
                ))}
                {safeAllowedDomains.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No domains added yet</p>
                )}
              </div>
            </div>
            
            {/* Authentication Providers */}
            <div className="space-y-2 border-t pt-4 mt-4">
              <label className="font-medium">Authentication Providers</label>
              <p className="text-sm text-gray-500">
                Select which authentication providers this client can use for login
              </p>
              
              <div className="grid grid-cols-1 gap-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="google-auth"
                    checked={formData.authProviders.google}
                    onCheckedChange={(checked) => 
                      handleAuthProviderChange('google', checked === true)
                    }
                  />
                  <label 
                    htmlFor="google-auth"
                    className="text-sm font-medium leading-none"
                  >
                    Google
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="microsoft-auth"
                    checked={formData.authProviders.microsoft}
                    onCheckedChange={(checked) => 
                      handleAuthProviderChange('microsoft', checked === true)
                    }
                  />
                  <label 
                    htmlFor="microsoft-auth"
                    className="text-sm font-medium leading-none"
                  >
                    Microsoft
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="zoho-auth"
                    checked={formData.authProviders.zoho}
                    onCheckedChange={(checked) => 
                      handleAuthProviderChange('zoho', checked === true)
                    }
                  />
                  <label 
                    htmlFor="zoho-auth"
                    className="text-sm font-medium leading-none"
                  >
                    Zoho
                  </label>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mt-4">
                Note: You will need to configure OAuth credentials for each provider in the system settings.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{isEdit ? 'Update Client' : 'Add Client'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
