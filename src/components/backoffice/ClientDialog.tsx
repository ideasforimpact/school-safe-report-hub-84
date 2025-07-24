import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter,
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import BasicInfoTab from './tabs/BasicInfoTab';
import ModuleAccessTab, { ModuleInfo } from './tabs/ModuleAccessTab';
import AuthTab from './tabs/AuthTab';
import WizardProgress from '@/components/ui/wizard-progress';
import { useStepValidation } from '@/hooks/useStepValidation';
import { OAuthProviderName } from '@/utils/authProviders';
import { ClientFormData } from '@/hooks/useClientManagement';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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

const steps = ['Basic Information', 'Module Access', 'Authentication'];

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
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { isStepValid, getCompletedSteps, canProceedToNext, canSubmit } = useStepValidation(formData);

  // Reset step when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (isSubmitting || isLoading || !canSubmit) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canProceedToNext(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    const completedSteps = getCompletedSteps();
    
    // Allow navigation to completed steps or the next valid step
    if (completedSteps.includes(stepIndex) || 
        stepIndex === currentStep || 
        (stepIndex === currentStep + 1 && canProceedToNext(currentStep))) {
      setCurrentStep(stepIndex);
    }
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

  const safeFormData = {
    ...formData,
    allowedDomains: formData.allowedDomains || [],
    superAdminAllowedDomains: formData.superAdminAllowedDomains || []
  };

  const isProcessing = isSubmitting || isLoading || modulesLoading;

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoTab 
            formData={safeFormData} 
            setFormData={setFormData} 
            handleLogoUpload={() => {}}
          />
        );
      case 1:
        return (
          <ModuleAccessTab 
            formData={safeFormData}
            onModuleInfoChange={handleModuleInfoChange}
            isEdit={isEdit}
            preloadedModules={!isEdit && formData.moduleInfoArray ? formData.moduleInfoArray : undefined}
          />
        );
      case 2:
        return (
          <AuthTab 
            formData={safeFormData}
            onAddDomain={addDomain}
            onRemoveDomain={removeDomain}
            onAddSuperAdminDomain={addSuperAdminDomain}
            onRemoveSuperAdminDomain={removeSuperAdminDomain}
            onProviderChange={handleAuthProviderChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Client' : 'Add New Client'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update client information' : 'Complete all steps to onboard a new client to the platform'}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <WizardProgress 
          steps={steps}
          currentStep={currentStep}
          completedSteps={getCompletedSteps()}
          onStepClick={handleStepClick}
        />

        {/* Show loading message when modules are loading for new client */}
        {!isEdit && modulesLoading && currentStep === 1 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <span>Loading modules for client setup...</span>
          </div>
        )}

        {/* Step Content - No form wrapper to prevent auto-submission */}
        <div className="min-h-[400px] py-4">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        <DialogFooter className="flex flex-row justify-between items-center mt-6 gap-2">
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              disabled={isProcessing}
            >
              Cancel
            </Button>
          </div>

          <div className="flex gap-2">
            {/* Previous Button */}
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isProcessing}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
            )}

            {/* Next Button */}
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isProcessing || !canProceedToNext(currentStep) || (currentStep === 1 && modulesLoading)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              /* Submit Button - Only this button should trigger submission */
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing || !canSubmit}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {modulesLoading ? 'Loading modules...' : (isEdit ? 'Updating...' : 'Creating...')}
                  </>
                ) : (
                  isEdit ? 'Update Client' : 'Create Client'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
