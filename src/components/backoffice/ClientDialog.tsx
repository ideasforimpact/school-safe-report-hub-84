
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
import { Loader2 } from 'lucide-react';

interface ClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ClientFormData;
  setFormData: React.Dispatch<React.SetStateAction<ClientFormData>>;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
  isLoading?: boolean;
  modulesLoading?: boolean;
}

const ClientDialog: React.FC<ClientDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit = false,
  isLoading = false,
  modulesLoading = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSubmit();
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

  const isProcessing = isSubmitting || isLoading || modulesLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update client information' : 'Quickly onboard a new client to the platform'}
          </DialogDescription>
        </DialogHeader>

        {/* Show loading message when modules are loading for new client */}
        {!isEdit && modulesLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span>Loading modules for client setup...</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="access" disabled={!isEdit && modulesLoading}>
                Module Access
              </TabsTrigger>
              <TabsTrigger value="auth">Authentication</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <BasicInfoTab 
                formData={safeFormData} 
                setFormData={setFormData} 
                handleLogoUpload={() => {}} // This is now handled within BasicInfoTab
              />
            </TabsContent>

            <TabsContent value="access">
              <ModuleAccessTab 
                formData={safeFormData}
                onModuleInfoChange={handleModuleInfoChange}
                isEdit={isEdit}
                preloadedModules={!isEdit && formData.moduleInfoArray ? formData.moduleInfoArray : undefined}
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
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {modulesLoading ? 'Loading modules...' : (isEdit ? 'Updating...' : 'Adding...')}
                </>
              ) : (
                isEdit ? 'Update Client' : 'Add Client'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
