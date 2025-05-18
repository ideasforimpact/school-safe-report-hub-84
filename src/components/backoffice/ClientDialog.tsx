
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicInfoTab from './tabs/BasicInfoTab';
import ModuleAccessTab, { ModuleInfo } from './tabs/ModuleAccessTab';
import AuthTab from './tabs/AuthTab';
import { OAuthProviderName } from '@/utils/authProviders';
import { ClientFormData } from '@/hooks/useClientManagement';
import { ModulePermissions } from '@/contexts/auth/types';
import { Loader2, Asterisk } from 'lucide-react'; // Import both loading spinner and asterisk

interface ClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ClientFormData;
  setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
}

const ClientDialog: React.FC<ClientDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false,
  isLoading = false
}) => {
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

  const handleModuleAccessChange = (module: keyof ModulePermissions, value: boolean) => {
    setFormData({
      ...formData,
      moduleAccess: {
        ...formData.moduleAccess,
        [module]: value
      }
    });
  };

  const handleModuleInfoChange = (moduleInfoArray: ModuleInfo[]) => {
    setFormData({
      ...formData,
      moduleInfoArray
    });
    
    console.log("Updated moduleInfoArray in formData:", moduleInfoArray);
  };

  const handleAuthProviderChange = (provider: OAuthProviderName, value: boolean) => {
    setFormData({
      ...formData,
      authProviders: {
        ...formData.authProviders,
        [provider]: value
      }
    });
  };

  const addDomain = (domain: string) => {
    setFormData({
      ...formData,
      allowedDomains: [...formData.allowedDomains, domain]
    });
  };

  const removeDomain = (domain: string) => {
    setFormData({
      ...formData,
      allowedDomains: formData.allowedDomains.filter(d => d !== domain)
    });
  };

  const addSuperAdminDomain = (domain: string) => {
    setFormData({
      ...formData,
      superAdminAllowedDomains: [...formData.superAdminAllowedDomains, domain]
    });
  };

  const removeSuperAdminDomain = (domain: string) => {
    setFormData({
      ...formData,
      superAdminAllowedDomains: formData.superAdminAllowedDomains.filter(d => d !== domain)
    });
  };

  // Ensure allowedDomains and superAdminAllowedDomains are always arrays
  const safeFormData = {
    ...formData,
    allowedDomains: formData.allowedDomains || [],
    superAdminAllowedDomains: formData.superAdminAllowedDomains || []
  };

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

          <TabsContent value="basic">
            <BasicInfoTab 
              formData={safeFormData} 
              setFormData={setFormData} 
              handleLogoUpload={handleLogoUpload} 
            />
          </TabsContent>

          <TabsContent value="access">
            <ModuleAccessTab 
              formData={safeFormData} 
              handleModuleAccessChange={handleModuleAccessChange}
              onModuleInfoChange={handleModuleInfoChange}
            />
          </TabsContent>

          <TabsContent value="auth">
            <AuthTab 
              formData={safeFormData}
              onAddDomain={addDomain}
              onRemoveDomain={removeDomain}
              onAddSuperAdminDomain={addSuperAdminDomain}
              onRemoveSuperAdminDomain={removeSuperAdminDomain}
              onProviderChange={handleAuthProviderChange}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEdit ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              isEdit ? 'Update Client' : 'Add Client'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
