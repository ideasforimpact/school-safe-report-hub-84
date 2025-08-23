
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useTransportSafety } from '@/contexts/transport-safety/TransportSafetyContext';
import { Vehicle } from '@/types/transportSafety';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AddVehicleDialogProps {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle; // Optional vehicle for edit mode
}

type VehicleFormData = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>;

const AddVehicleDialog: React.FC<AddVehicleDialogProps> = ({ open, onClose, vehicle }) => {
  const { addVehicle, updateVehicle, vehicles } = useTransportSafety();
  const { employeeData } = useAuth();
  const [error, setError] = useState<string | null>(null);
  
  const isEditMode = !!vehicle;
  
  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, reset, setValue, watch } = useForm<VehicleFormData>({
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
      clientId: employeeData?.clientId,
      employeeId: employeeData?.id
    }
  });

  // Populate form when vehicle is provided (edit mode)
  useEffect(() => {
    if (vehicle && open) {
      setValue('registrationNumber', vehicle.registrationNumber);
      setValue('type', vehicle.type);
      setValue('make', vehicle.make);
      setValue('model', vehicle.model);
      setValue('year', vehicle.year);
      setValue('status', vehicle.status);
      setValue('driver', vehicle.driver);
      setValue('route', vehicle.route);
      setValue('capacity', vehicle.capacity);
      setValue('clientId', vehicle.clientId);
      setValue('employeeId', vehicle.employeeId);
    }
  }, [vehicle, open, setValue]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      reset();
      setError(null);
    }
  }, [open, reset]);

  const onSubmit: SubmitHandler<VehicleFormData> = async (data) => {
    setError(null); // Clear any previous errors
    
    try {
      if (!employeeData?.clientId) {
        setError('No client selected. Please select a client first.');
        return;
      }

      // Check for duplicate registration number
      const isDuplicate = vehicles.some(vehicle => 
        vehicle.registrationNumber.toLowerCase() === data.registrationNumber?.toLowerCase() &&
        (!isEditMode || vehicle.id !== vehicle?.id)
      );
      
      if (isDuplicate) {
        setError('A vehicle with this registration number already exists');
        return;
      }

      // Validate required fields
      if (!data.registrationNumber?.trim()) {
        setError('Registration number is required');
        return;
      }

      if (!data.make?.trim()) {
        setError('Make is required');
        return;
      }

      if (!data.model?.trim()) {
        setError('Model is required');
        return;
      }

      if (!data.driver?.trim()) {
        setError('Driver name is required');
        return;
      }

      if (!data.route?.trim()) {
        setError('Route is required');
        return;
      }

        // Ensure numeric values are properly converted from strings or set to null if empty
        const yearValue = data.year ? Number(data.year) : null;
        const capacityValue = data.capacity ? Number(data.capacity) : null;
        
      if (!yearValue || yearValue < 1980 || yearValue > new Date().getFullYear() + 1) {
        setError('Year is required and must be between 1980 and ' + (new Date().getFullYear() + 1));
          return;
        }

      // Prepare the payload with proper data transformation
      const vehicleData = {
        registrationNumber: data.registrationNumber.trim(),
        type: data.type,
        make: data.make.trim(),
        model: data.model.trim(),
          year: yearValue,
        driver: data.driver.trim(),
        route: data.route.trim(),
          capacity: capacityValue,
        status: data.status,
          clientId: employeeData.clientId, // Always use the current client's ID
          employeeId: employeeData?.id // Use logged-in employee's ID
      };

      console.log('Sending vehicle data:', {
        mode: isEditMode ? 'UPDATE' : 'CREATE',
        vehicleId: isEditMode ? vehicle?.id : 'NEW',
        payload: vehicleData,
        employeeData: {
          clientId: employeeData.clientId,
          employeeId: employeeData?.id
        }
      });

      if (isEditMode && vehicle) {
        console.log('Updating vehicle with ID:', vehicle.id);
        await updateVehicle(vehicle.id, vehicleData);
        toast.success('Vehicle updated successfully');
      } else {
        console.log('Creating new vehicle');
        await addVehicle(vehicleData);
        toast.success('Vehicle added successfully');
      }
      
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setError(`Failed to ${isEditMode ? 'update' : 'add'} vehicle. Please try again.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number<span className="text-red-500">*</span></Label>
              <Input 
                id="registrationNumber" 
                {...register('registrationNumber', { 
                  required: "Registration number is required",
                  maxLength: { value: 10, message: "Registration number cannot exceed 10 characters" }
                })}
                placeholder="e.g., KA-01-AB-1234"
                maxLength={10}
                disabled={isSubmitting || isEditMode}
                className={isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}
              />
              {errors.registrationNumber && 
                <p className="text-red-500 text-sm">{errors.registrationNumber.message}</p>
              }
              {isEditMode && (
                <p className="text-gray-500 text-xs mt-1">
                  Registration number cannot be changed after vehicle creation
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Vehicle Type<span className="text-red-500">*</span></Label>
                <Select 
                  value={watch('type')} 
                  onValueChange={(value) => setValue('type', value as any)}
                  disabled={isSubmitting}
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
                <Label htmlFor="status">Status<span className="text-red-500">*</span></Label>
                <Select 
                  value={watch('status')} 
                  onValueChange={(value) => setValue('status', value as any)}
                  disabled={isSubmitting}
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
                <Label htmlFor="make">Make<span className="text-red-500">*</span></Label>
                <Input 
                  id="make" 
                  {...register('make', { 
                    required: "Make is required",
                    maxLength: { value: 10, message: "Make cannot exceed 10 characters" }
                  })}
                  placeholder="e.g., TATA"
                  maxLength={10}
                  disabled={isSubmitting}
                />
                {errors.make && 
                  <p className="text-red-500 text-sm">{errors.make.message}</p>
                }
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model<span className="text-red-500">*</span></Label>
                <Input 
                  id="model" 
                  {...register('model', { 
                    required: "Model is required",
                    maxLength: { value: 10, message: "Model cannot exceed 10 characters" }
                  })}
                  placeholder="e.g., Starbus"
                  maxLength={10}
                  disabled={isSubmitting}
                />
                {errors.model && 
                  <p className="text-red-500 text-sm">{errors.model.message}</p>
                }
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Year<span className="text-red-500">*</span></Label>
              <Input 
                id="year" 
                type="number"
                {...register('year', { 
                  required: "Year is required",
                  min: { value: 1980, message: "Year must be after 1980" },
                  max: { value: new Date().getFullYear() + 1, message: `Year must be before ${new Date().getFullYear() + 1}` }
                })}
                placeholder="e.g., 2023"
                disabled={isSubmitting}
              />
              {errors.year && 
                <p className="text-red-500 text-sm">{errors.year.message}</p>
              }
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver">Driver<span className="text-red-500">*</span></Label>
                <Input 
                  id="driver" 
                  {...register('driver', { 
                    required: "Driver name is required",
                    maxLength: { value: 16, message: "Driver name cannot exceed 16 characters" }
                  })}
                  placeholder="e.g., John Doe"
                  maxLength={16}
                  disabled={isSubmitting}
                />
                {errors.driver && 
                  <p className="text-red-500 text-sm">{errors.driver.message}</p>
                }
              </div>

              <div className="space-y-2">
                <Label htmlFor="route">Route<span className="text-red-500">*</span></Label>
                <Input 
                  id="route" 
                  {...register('route', { 
                    required: "Route is required",
                    maxLength: { value: 16, message: "Route cannot exceed 16 characters" }
                  })}
                  placeholder="e.g., Main Campus"
                  maxLength={16}
                  disabled={isSubmitting}
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
                  min: { value: 1, message: "Capacity must be at least 1" },
                  max: { value: 99, message: "Capacity cannot exceed 99" }
                })}
                placeholder="e.g., 45"
                maxLength={2}
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Vehicle' : 'Add Vehicle')}
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVehicleDialog;
