
import React from 'react';
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
import { ImageIcon } from 'lucide-react';

interface AddClientFormData {
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
  logo?: string;
}

interface AddClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: AddClientFormData;
  setFormData: React.Dispatch<React.SetStateAction<AddClientFormData>>;
  onAddClient: () => void;
  onCancel: () => void;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onAddClient,
  onCancel
}) => {
  const handleModuleAccessChange = (module: keyof typeof formData.moduleAccess, value: boolean) => {
    setFormData({
      ...formData,
      moduleAccess: {
        ...formData.moduleAccess,
        [module]: value
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Quickly onboard a new client to the platform
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onAddClient}>Add Client</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
