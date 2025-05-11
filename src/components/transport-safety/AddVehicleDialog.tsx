
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { Vehicle } from '@/types/transportSafety';
import { toast } from 'sonner';
import { useClient } from '@/contexts/ClientContext';

interface AddVehicleDialogProps {
  open: boolean;
  onClose: () => void;
}

type VehicleFormData = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>;

const AddVehicleDialog: React.FC<AddVehicleDialogProps> = ({ open, onClose }) => {
  const { addVehicle } = useTransportSafety();
  const { client } = useClient();
  
  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, reset } = useForm<VehicleFormData>({
    defaultValues: {
      registrationNumber: '',
      type: 'bus',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      status: 'active',
      driver: '',
      route: '',
      capacity: undefined,
      clientId: client?.id
    }
  });

  const onSubmit: SubmitHandler<VehicleFormData> = async (data) => {
    try {
      if (client) {
        await addVehicle({
          ...data,
          year: Number(data.year),
          clientId: client.id // Always use the current client's ID
        });
        reset();
        onClose();
      } else {
        toast.error('No client selected. Please select a client first.');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      toast.error('Failed to add vehicle. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Add New Vehicle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number*</Label>
              <Input 
                id="registrationNumber" 
                {...register('registrationNumber', { required: "Registration number is required" })}
                placeholder="e.g., KA-01-AB-1234"
              />
              {errors.registrationNumber && 
                <p className="text-red-500 text-sm">{errors.registrationNumber.message}</p>
              }
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Vehicle Type*</Label>
                <Select 
                  defaultValue="bus" 
                  onValueChange={(value) => register('type').onChange({ target: { name: 'type', value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bus">Bus</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status*</Label>
                <Select 
                  defaultValue="active" 
                  onValueChange={(value) => register('status').onChange({ target: { name: 'status', value } })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make*</Label>
                <Input 
                  id="make" 
                  {...register('make', { required: "Make is required" })}
                  placeholder="e.g., TATA"
                />
                {errors.make && 
                  <p className="text-red-500 text-sm">{errors.make.message}</p>
                }
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model*</Label>
                <Input 
                  id="model" 
                  {...register('model', { required: "Model is required" })}
                  placeholder="e.g., Starbus"
                />
                {errors.model && 
                  <p className="text-red-500 text-sm">{errors.model.message}</p>
                }
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year*</Label>
              <Input 
                id="year" 
                type="number"
                {...register('year', { 
                  required: "Year is required",
                  min: { value: 1980, message: "Year must be after 1980" },
                  max: { value: new Date().getFullYear() + 1, message: `Year must be before ${new Date().getFullYear() + 1}` }
                })}
                placeholder="e.g., 2023"
              />
              {errors.year && 
                <p className="text-red-500 text-sm">{errors.year.message}</p>
              }
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver">Driver*</Label>
                <Input 
                  id="driver" 
                  {...register('driver', { required: "Driver name is required" })}
                  placeholder="e.g., John Doe"
                />
                {errors.driver && 
                  <p className="text-red-500 text-sm">{errors.driver.message}</p>
                }
              </div>

              <div className="space-y-2">
                <Label htmlFor="route">Route*</Label>
                <Input 
                  id="route" 
                  {...register('route', { required: "Route is required" })}
                  placeholder="e.g., Main Campus"
                />
                {errors.route && 
                  <p className="text-red-500 text-sm">{errors.route.message}</p>
                }
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (optional)</Label>
              <Input 
                id="capacity" 
                type="number"
                {...register('capacity', { 
                  min: { value: 1, message: "Capacity must be at least 1" }
                })}
                placeholder="e.g., 45"
              />
              {errors.capacity && 
                <p className="text-red-500 text-sm">{errors.capacity.message}</p>
              }
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { reset(); onClose(); }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Vehicle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
