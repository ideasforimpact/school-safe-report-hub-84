
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BasicInfoTab from './tabs/BasicInfoTab';
import AuthTab from './tabs/AuthTab';
import ModuleAccessTab from './tabs/ModuleAccessTab';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { fetchClientDetails, ClientDetailsResponse } from '@/services/client/clientService';

interface ClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit: boolean;
  isLoading: boolean;
}

const ClientDialog = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isEdit,
  isLoading
}: ClientDialogProps) => {
  const [clientDetails, setClientDetails] = useState<ClientDetailsResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    if (isEdit && formData.id && isOpen) {
      loadClientDetails();
    }
  }, [isEdit, formData.id, isOpen]);

  const loadClientDetails = async () => {
    if (!formData.id) return;
    
    setLoadingDetails(true);
    try {
      const details = await fetchClientDetails(formData.id);
      setClientDetails(details);
    } catch (error) {
      console.error('Error loading client details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleModulesUpdate = () => {
    if (formData.id) {
      loadClientDetails();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="modules" disabled={!isEdit}>
              Module Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <BasicInfoTab
              formData={formData}
              setFormData={setFormData}
            />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <AuthTab
              formData={formData}
              setFormData={setFormData}
            />
          </TabsContent>

          <TabsContent value="modules" className="space-y-4">
            {loadingDetails ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">Loading modules...</span>
              </div>
            ) : clientDetails ? (
              <ModuleAccessTab
                client={clientDetails.client}
                modules={clientDetails.modules}
                availableModules={clientDetails.availableModules}
                onModulesUpdate={handleModulesUpdate}
              />
            ) : isEdit ? (
              <div className="text-center py-8 text-gray-500">
                Unable to load module information
              </div>
            ) : null}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Update Client' : 'Create Client'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
