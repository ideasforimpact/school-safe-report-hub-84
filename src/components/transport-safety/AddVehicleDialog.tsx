
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
import { getLatestVerificationLog, findVerificationField } from '@/utils/transport-safety/documentStatusUtils';
import { useVehicleTypes } from '@/hooks/useVehicleTypes';

interface AddVehicleDialogProps {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle; // Optional vehicle for edit mode
}

type VehicleFormData = Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'documents'>;

const AddVehicleDialog: React.FC<AddVehicleDialogProps> = ({ open, onClose, vehicle }) => {
  const { addVehicle, updateVehicle, vehicles } = useTransportSafety();
  const { employeeData } = useAuth();
  const { vehicleTypes, loading: vehicleTypesLoading } = useVehicleTypes();
  const [error, setError] = useState<string | null>(null);
  const [registrationNumberError, setRegistrationNumberError] = useState<string | null>(null);
  
  const isEditMode = !!vehicle;
  
  const { register, handleSubmit, formState: { errors, isValid, isSubmitting }, reset, setValue, watch } = useForm<VehicleFormData>({
    defaultValues: {
      registrationNumber: '',
      type: 'other',
      typeId: undefined,
      internalVehicleName: '',
      make: '',
      model: '',
      year: null,
      status: 'active',
      driver: '',
      route: '',
      capacity: undefined,
      clientId: employeeData?.clientId,
      employeeId: employeeData?.id
    },
    mode: 'onSubmit' // Only validate on submit to prevent showing errors initially
  });

  // Populate form when vehicle is provided (edit mode)
  useEffect(() => {
    if (vehicle && open) {
      setValue('registrationNumber', vehicle.registrationNumber);
      setValue('type', vehicle.type);
      setValue('typeId', vehicle.typeId);
      setValue('internalVehicleName', vehicle.internalVehicleName || '');
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
      reset({
        registrationNumber: '',
        type: 'other',
        typeId: undefined,
        internalVehicleName: '',
        make: '',
        model: '',
        year: null, // Explicitly reset to null
        status: 'active',
        driver: '',
        route: '',
        capacity: undefined,
        clientId: employeeData?.clientId,
        employeeId: employeeData?.id
      });
      setError(null);
      setRegistrationNumberError(null);
    }
  }, [open, reset, employeeData]);

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
      if (!data.internalVehicleName?.trim()) {
        setError('Internal vehicle name is required');
        return;
      }
      if (!data.typeId) {
        setError('Vehicle type is required');
        return;
      }
      // Ensure numeric values are properly converted from strings or set to null if empty
      // For add mode, we only require registration number. Use defaults for the rest.
      // Handle null, undefined, or falsy values as null
      const yearValue = null
      const capacityValue = data.capacity ? Number(data.capacity) : null;

      // Prepare the payload with proper data transformation
      const vehicleData = {
        registrationNumber: data.registrationNumber.trim(),
        type: data.type || 'other',
        typeId: data.typeId,
        internalVehicleName: (data.internalVehicleName || '').trim(),
        make: (data.make || '').trim(),
        model: (data.model || '').trim(),
        year: null,
        driver: (data.driver || '').trim(),
        route: (data.route || '').trim(),
        capacity: capacityValue,
        status: data.status || 'active',
        clientId: employeeData.clientId, // Always use the current client's ID
        employeeId: employeeData?.id // Use logged-in employee's ID
      };

      console.log('Sending vehicle data:', {
        mode: isEditMode ? 'UPDATE' : 'CREATE',
        vehicleId: isEditMode ? vehicle?.id : 'NEW',
        payload: vehicleData,
        rawFormData: data,
        yearValue: yearValue,
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
        // toast.success('Vehicle added successfully');
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
                  maxLength: { value: 10, message: "Registration number cannot exceed 10 characters" },
                  pattern: {
                    value: /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/,
                    message: "Please enter a valid vehicle registration number (e.g., TN01AB1234)"
                  }
                })}
                placeholder="e.g., TN01AB1234"
                maxLength={10}
                disabled={isSubmitting || isEditMode}
                className={isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}
                onChange={(e) => {
                  const value = e.target.value;
                  // Remove special characters except letters, numbers, and hyphens
                  const cleanedValue = value.replace(/[^A-Za-z0-9-]/g, '');     
                  if (value !== cleanedValue) {
                    setRegistrationNumberError("Special characters are not allowed. Only letters, numbers are permitted.");
                  } else {
                    setRegistrationNumberError(null);
                  }
                  
                  // Update the form value
                  setValue('registrationNumber', cleanedValue);
                }}
              />
              {(errors.registrationNumber || registrationNumberError) && 
                <p className="text-red-500 text-sm">{errors.registrationNumber?.message || registrationNumberError}</p>
              }
              {isEditMode && (
                <p className="text-gray-500 text-xs mt-1">
                  Registration number cannot be changed after vehicle creation
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalVehicleName">Internal Vehicle Name<span className="text-red-500">*</span></Label>
              <Input 
                id="internalVehicleName" 
                {...register('internalVehicleName', { 
                  required: "Internal vehicle name is required",
                  maxLength: { value: 50, message: "Internal vehicle name cannot exceed 100 characters" },
                  validate: (value) => {
                    if (!value || value.trim() === '') {
                      return "Internal vehicle name is required";
                    }
                    return true;
                  }
                })}
                placeholder="e.g., School Bus 1"
                maxLength={100}
                disabled={isSubmitting}
              />
              {errors.internalVehicleName && (
                <p className="text-red-500 text-sm">{errors.internalVehicleName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeId">Vehicle Type<span className="text-red-500">*</span></Label>
              <Select 
                value={watch('typeId') || ''} 
                onValueChange={(value) => {
                  setValue('typeId', value, { shouldValidate: true });
                }}
                disabled={isSubmitting || vehicleTypesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={vehicleTypesLoading ? "Loading..." : "Select vehicle type"} />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypesLoading ? (
                    <SelectItem value="" disabled>Loading...</SelectItem>
                  ) : (
                    vehicleTypes.map((vehicleType) => (
                      <SelectItem key={vehicleType.id} value={vehicleType.id}>
                        {vehicleType.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register('typeId', {
                  required: "Vehicle type is required",
                  validate: (value) => {
                    if (!value) {
                      return "Vehicle type is required";
                    }
                    return true;
                  }
                })}
              />
              {errors.typeId && (
                <p className="text-red-500 text-sm">{errors.typeId.message}</p>
              )}
            </div>
            {/* Legacy input fields removed per new UX requirement */}

            {/* Verified details shown as input boxes (disabled) from latest verification log */}
            {vehicle?.verificationData && vehicle.verificationData.length > 0 && (() => {
              const latest = getLatestVerificationLog(vehicle);
              const getVal = (key: string) => findVerificationField(latest, key)?.value || '-';
              const model = getVal('maker_model');
              const makerDesc = getVal('maker_description');
              return (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>First Owner Name</Label>
                    <Input disabled value={getVal('owner_name')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Category</Label>
                    <Input disabled value={getVal('vehicle_category')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Vehicle Engine Number</Label>
                    <Input disabled value={getVal('vehicle_engine_number')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input disabled value={`${model}${makerDesc && model !== '-' ? ` (${makerDesc})` : ''}`} />
                  </div>
                  <div className="space-y-2">
                    <Label>Body Type</Label>
                    <Input disabled value={getVal('body_type')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Input disabled value={getVal('manufacturing_date')} />
                  </div>
                </div>
              );
            })()}
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
