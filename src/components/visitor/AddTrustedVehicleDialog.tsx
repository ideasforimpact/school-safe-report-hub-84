import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  getTrustedVehicleNameMaxLength,
  getTrustedVehicleNameMinLength,
  getTrustedVehicleTypeMaxLength,
  getTrustedVehicleTypeMinLength,
} from '@/constant/trustedVehicleConstant';

interface TrustedVehicleFormData {
  name: string;
  type: string;
  vehicle_no: string;
  validity_from: Date | null;
  validity_to: Date | null;
  comments: string;
}

interface AddTrustedVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveSuccess: () => void;
  clientId: string | null;
  employeeId: string | null;
  /**
   * Existing vehicle numbers for the client (used to prevent duplicates).
   * Raw values from backend; they will be normalised internally.
   */
  existingVehicleNumbers?: string[];
  /**
   * Mode controls whether we're creating new trusted vehicles (default)
   * or editing an existing one.
   */
  mode?: 'create' | 'edit';
  /**
   * When in edit mode, initial data for the vehicle being edited.
   * id is required so the edge function can update the correct record.
   */
  initialVehicle?: {
    id: string;
    name: string;
    type: string;
    vehicle_no: string;
    validity_from: string | null;
    validity_to: string | null;
    comments: string | null;
  } | null;
}

const AddTrustedVehicleDialog: React.FC<AddTrustedVehicleDialogProps> = ({
  open,
  onOpenChange,
  onSaveSuccess,
  clientId,
  employeeId,
  existingVehicleNumbers = [],
  mode = 'create',
  initialVehicle,
}) => {
  const [forms, setForms] = useState<TrustedVehicleFormData[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<number, Partial<Record<keyof TrustedVehicleFormData, string>>>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const normalizeVehicleNo = (value: string): string =>
    (value || '').toUpperCase().trim();

  const existingVehicleNumbersNormalized = useMemo(() => {
    return new Set(
      (existingVehicleNumbers || [])
        .filter(Boolean)
        .map((v) => normalizeVehicleNo(v))
    );
  }, [existingVehicleNumbers]);

  // Initialize / reset forms based on mode and initialVehicle
  useEffect(() => {
    if (mode === 'edit' && initialVehicle) {
      setForms([
        {
          name: initialVehicle.name || '',
          type: initialVehicle.type || '',
          vehicle_no: initialVehicle.vehicle_no || '',
          validity_from: initialVehicle.validity_from ? new Date(initialVehicle.validity_from) : null,
          validity_to: initialVehicle.validity_to ? new Date(initialVehicle.validity_to) : null,
          comments: initialVehicle.comments || '',
        },
      ]);
      setErrors({});
    } else if (mode === 'create') {
      setForms([
    {
      name: '',
      type: '',
      vehicle_no: '',
      validity_from: null,
      validity_to: null,
      comments: '',
    },
  ]);
      setErrors({});
    }
  }, [mode, initialVehicle, open]);

  // Vehicle number validation - align with AddVehicleDialog behaviour
  // Rules:
  // - Required
  // - Only letters, numbers, and hyphens
  // - Max length 10
  // - Must roughly match Indian registration pattern e.g. TN01AB1234
  const validateVehicleNumber = (value: string): string | null => {
    const cleaned = (value || '').toUpperCase().trim();

    if (!cleaned) {
      return 'Vehicle number is required';
    }

    // Only allow letters, numbers and hyphens
    if (!/^[A-Z0-9-]+$/.test(cleaned)) {
      return 'Vehicle number can only contain letters, numbers, and hyphens';
    }

    if (cleaned.length > 10) {
      return 'Vehicle number cannot exceed 10 characters';
    }

    // Basic Indian registration format validation (e.g. TN01AB1234)
    const registrationPattern = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/;
    if (!registrationPattern.test(cleaned)) {
      return 'Please enter a valid vehicle registration number (e.g., TN01AB1234)';
    }

    return null;
  };

  const getFormErrors = (
    form: TrustedVehicleFormData,
    index: number
  ): Partial<Record<keyof TrustedVehicleFormData, string>> => {
    const formErrors: Partial<Record<keyof TrustedVehicleFormData, string>> = {};

    if (!form.name.trim()) {
      formErrors.name = 'Name is required';
    } else if (form.name.trim().length < getTrustedVehicleNameMinLength()) {
      formErrors.name = `Name must be at least ${getTrustedVehicleNameMinLength()} characters`;
    } else if (form.name.length > getTrustedVehicleNameMaxLength()) {
      formErrors.name = `Name must be ${getTrustedVehicleNameMaxLength()} characters or less`;
    }

    if (!form.type.trim()) {
      formErrors.type = 'Type is required';
    } else if (form.type.trim().length < getTrustedVehicleTypeMinLength()) {
      formErrors.type = `Type must be at least ${getTrustedVehicleTypeMinLength()} characters`;
    } else if (form.type.length > getTrustedVehicleTypeMaxLength()) {
      formErrors.type = `Type must be ${getTrustedVehicleTypeMaxLength()} characters or less`;
    }

    const currentVehicleNoNormalized = normalizeVehicleNo(form.vehicle_no);

    if (!currentVehicleNoNormalized) {
      formErrors.vehicle_no = 'Vehicle number is required';
    } else {
      const vehicleNoError = validateVehicleNumber(currentVehicleNoNormalized);
      if (vehicleNoError) {
        formErrors.vehicle_no = vehicleNoError;
      }
    }

    // Duplicate vehicle number check against:
    // - Existing vehicles from backend
    // - Other forms in this dialog
    if (!formErrors.vehicle_no && currentVehicleNoNormalized) {
      // Check against existing records
      if (existingVehicleNumbersNormalized.has(currentVehicleNoNormalized)) {
        formErrors.vehicle_no = 'This vehicle number is already registered';
      } else {
        // Check against other forms in the same dialog
        const hasDuplicateInForms = forms.some((f, i) => {
          if (i === index) return false;
          return normalizeVehicleNo(f.vehicle_no) === currentVehicleNoNormalized;
        });

        if (hasDuplicateInForms) {
          formErrors.vehicle_no = 'Duplicate vehicle number in the list';
        }
      }
    }

    if (!form.validity_from) {
      formErrors.validity_from = 'Validity from date is required';
    } else if (mode === 'create') {
      // For new trusted vehicles, prevent selecting a from date in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const fromDate = new Date(form.validity_from);
      fromDate.setHours(0, 0, 0, 0);
      
      if (fromDate < today) {
        formErrors.validity_from = 'From date cannot be in the past';
      }
    }

    if (!form.validity_to) {
      formErrors.validity_to = 'Validity to date is required';
    } else if (form.validity_from && form.validity_to < form.validity_from) {
      formErrors.validity_to = 'To date must be after from date';
    }

    if (form.comments && form.comments.length > 100) {
      formErrors.comments = 'Comments must be 100 characters or less';
    }

    return formErrors;
  };

  const validateForm = (form: TrustedVehicleFormData, index: number): boolean => {
    const formErrors = getFormErrors(form, index);

    if (Object.keys(formErrors).length > 0) {
      setErrors(prev => ({ ...prev, [index]: formErrors }));
      return false;
    }

    return true;
  };

  const addForm = () => {
    setForms(prev => [
      ...prev,
      {
        name: '',
        type: '',
        vehicle_no: '',
        validity_from: null,
        validity_to: null,
        comments: '',
      },
    ]);

    // After React commits the new card, smoothly scroll to the bottom
    // so the user immediately sees the newly added vehicle.
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
      }
    });
  };

  const removeForm = (index: number) => {
    if (forms.length > 1) {
      setForms(forms.filter((_, i) => i !== index));
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        // Reindex errors
        const reindexed: typeof errors = {};
        Object.keys(newErrors).forEach(key => {
          const oldIndex = parseInt(key);
          if (oldIndex > index) {
            reindexed[oldIndex - 1] = newErrors[oldIndex];
          } else if (oldIndex < index) {
            reindexed[oldIndex] = newErrors[oldIndex];
          }
        });
        return reindexed;
      });
    }
  };

  const updateForm = (index: number, field: keyof TrustedVehicleFormData, value: any) => {
    const updatedForms = forms.map((form, i) =>
      i === index ? { ...form, [field]: value } : form
    );
    setForms(updatedForms);

    const updatedForm = updatedForms[index];
    const formErrors = getFormErrors(updatedForm, index);
    const fieldError = formErrors[field];

    // Live validation: update only the changed field's error
    setErrors(prev => {
      const next: typeof errors = { ...(prev || {}) };
      const currentFormErrors = { ...(next[index] || {}) };

      if (fieldError) {
        currentFormErrors[field] = fieldError;
      } else {
        delete currentFormErrors[field];
      }

      if (Object.keys(currentFormErrors).length === 0) {
        delete next[index];
      } else {
        next[index] = currentFormErrors;
      }

      return next;
    });

    // Special case: when vehicle number changes, we also need to update
    // duplicate errors for other vehicle_no fields.
    if (field === 'vehicle_no') {
      const updatedVehicleNoNormalized = normalizeVehicleNo(updatedForm.vehicle_no);

      setErrors(prev => {
        const next: typeof errors = { ...(prev || {}) };

        updatedForms.forEach((form, i) => {
          const allErrors = getFormErrors(form, i);
          const vehicleError = allErrors.vehicle_no;
          const formEntry = { ...(next[i] || {}) };

          if (vehicleError) {
            formEntry.vehicle_no = vehicleError;
          } else {
            delete formEntry.vehicle_no;
          }

          if (Object.keys(formEntry).length === 0) {
            delete next[i];
          } else {
            next[i] = formEntry;
          }
        });

        return next;
      });
    }
  };

  const updateDateRange = (index: number, dateRange: DateRange | undefined) => {
    setForms(forms.map((form, i) => 
      i === index 
        ? { 
            ...form, 
            validity_from: dateRange?.from || null,
            validity_to: dateRange?.to || null,
          } 
        : form
    ));
    // Re-validate dates for this form
    const updatedForm =
      forms[index]
        ? {
            ...forms[index],
            validity_from: dateRange?.from || null,
            validity_to: dateRange?.to || null,
          }
        : null;

    if (updatedForm) {
      const dateErrors = getFormErrors(updatedForm, index);
      setErrors(prev => {
        const next = { ...(prev || {}) };
        if (Object.keys(dateErrors).length === 0) {
          if (next[index]) {
            delete next[index].validity_from;
            delete next[index].validity_to;
            if (Object.keys(next[index]).length === 0) {
              delete next[index];
            }
          }
        } else {
          next[index] = {
            ...(next[index] || {}),
            validity_from: dateErrors.validity_from,
            validity_to: dateErrors.validity_to,
          };
        }
        return next;
      });
    }
  };

  const isSaveDisabled = useMemo(() => {
    if (loading) return true;
    if (!clientId || !employeeId) return true;

    // Basic required fields and validation for each form
    const hasInvalidForm = forms.some((form, index) => {
      const basicMissing =
        !form.name.trim() ||
        !form.type.trim() ||
        !normalizeVehicleNo(form.vehicle_no) ||
        !form.validity_from ||
        !form.validity_to;

      if (basicMissing) return true;

      const formErrors = getFormErrors(form, index);
      return Object.keys(formErrors).length > 0;
    });

    if (hasInvalidForm) return true;

    // Also respect any errors already stored in state (e.g., from live validation)
    const hasStoredErrors =
      Object.keys(errors).length > 0;

    return hasStoredErrors;
  }, [loading, clientId, employeeId, forms, errors, existingVehicleNumbersNormalized, mode]);

  const handleSave = async () => {
    if (!clientId || !employeeId) {
      toast.error('Client ID and Employee ID are required');
      return;
    }

    // Validate all forms (or the single form in edit mode)
    let isValid = true;
    forms.forEach((form, index) => {
      if (!validateForm(form, index)) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast.error('Please fix all validation errors');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for bulk insert / update
      const vehiclesToInsert = forms.map(form => ({
        vehicle_name: form.name,
        type: form.type,
        vehicle_no: form.vehicle_no,
        name: form.name,
        // Store dates as local date strings (YYYY-MM-DD) to avoid timezone shifts
        validity_from: form.validity_from ? format(form.validity_from, 'yyyy-MM-dd') : null,
        validity_to: form.validity_to ? format(form.validity_to, 'yyyy-MM-dd') : null,
        comments: form.comments || null,
      }));

      // Call edge function to save bulk trusted vehicles
      if (mode === 'edit' && initialVehicle) {
        // First update the existing vehicle (index 0)
        const [vehicleToUpdate, ...additionalVehicles] = vehiclesToInsert;

        const { data, error } = await supabase.functions.invoke('trusted-vehicle-management', {
          body: {
            action: 'update',
            clientId: clientId,
            vehicle: {
              id: initialVehicle.id,
              ...vehicleToUpdate,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        // If user added new vehicles in edit mode, create them as well
        if (additionalVehicles.length > 0) {
          const { data: createData, error: createError } = await supabase.functions.invoke('trusted-vehicle-management', {
            body: {
              action: 'create_bulk',
              clientId: clientId,
              employee_id: employeeId,
              vehicles: additionalVehicles,
            },
          });

          if (createError) {
            throw createError;
          }

          if (createData?.error) {
            throw new Error(createData.error);
          }
        }
      } else {
        // Create bulk trusted vehicles (default behaviour)
      const { data, error } = await supabase.functions.invoke('trusted-vehicle-management', {
        body: {
          action: 'create_bulk',
          clientId: clientId,
          employee_id: employeeId,
          vehicles: vehiclesToInsert,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
        }
      }

      if (mode === 'edit') {
        toast.success('Trusted vehicle updated successfully');
      } else {
      toast.success(`Successfully added ${vehiclesToInsert.length} trusted vehicle(s)`);
      }
      onSaveSuccess();
      
      // Reset forms only in create mode – in edit mode the dialog will be closed by caller
      if (mode === 'create') {
      setForms([
        {
          name: '',
          type: '',
          vehicle_no: '',
          validity_from: null,
          validity_to: null,
          comments: '',
        },
      ]);
      setErrors({});
      }
    } catch (error: any) {
      console.error('Error saving trusted vehicles:', error);
      toast.error(error?.message || 'Failed to save trusted vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset state when closing in create mode. In edit mode, parent will manage selected vehicle.
    if (mode === 'create') {
    setForms([
      {
        name: '',
        type: '',
        vehicle_no: '',
        validity_from: null,
        validity_to: null,
        comments: '',
      },
    ]);
    setErrors({});
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Trusted Vehicle' : 'Add Trusted Vehicle'}
          </DialogTitle>
        </DialogHeader>

        {/* Fixed-height scrollable content area */}
        <div
          ref={scrollContainerRef}
          className="mt-3 h-[420px] overflow-y-auto pr-2 no-scrollbar"
        >
          {/* Top add button, only visible in create mode */}
          <div className="flex items-center justify-between mb-3 pr-1">
            <span className="text-sm font-medium text-gray-600">Trusted Vehicles</span>
            {mode === 'create' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addForm}
                className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Vehicle
              </Button>
            )}
          </div>

          <div className="space-y-6 pb-4">
          {forms.map((form, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Vehicle {index + 1}</span>
              {forms.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeForm(index)}
                      aria-label="Remove vehicle"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`name-${index}`}
                    value={form.name}
                    onChange={(e) => updateForm(index, 'name', e.target.value)}
                    maxLength={getTrustedVehicleNameMaxLength()}
                    placeholder="Enter name"
                    className={errors[index]?.name ? 'border-red-500' : ''}
                  />
                  {errors[index]?.name && (
                    <p className="text-sm text-red-500">{errors[index].name}</p>
                  )}
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <Label htmlFor={`type-${index}`}>
                    Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`type-${index}`}
                    value={form.type}
                    onChange={(e) => updateForm(index, 'type', e.target.value)}
                    maxLength={getTrustedVehicleTypeMaxLength()}
                    placeholder="Enter type"
                    className={errors[index]?.type ? 'border-red-500' : ''}
                  />
                  {errors[index]?.type && (
                    <p className="text-sm text-red-500">{errors[index].type}</p>
                  )}
                </div>

                {/* Vehicle Number */}
                <div className="space-y-2">
                  <Label htmlFor={`vehicle_no-${index}`}>
                    Vehicle Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`vehicle_no-${index}`}
                    value={form.vehicle_no}
                    onChange={(e) => {
                      const raw = e.target.value.toUpperCase();
                      // Remove all characters except letters, numbers and hyphens
                      const cleaned = raw.replace(/[^A-Z0-9-]/g, '');
                      updateForm(index, 'vehicle_no', cleaned);

                      // Live validation for vehicle number, including duplicate checks
                      const normalized = normalizeVehicleNo(cleaned);
                      let errorMessage: string | null = null;

                      if (!normalized) {
                        errorMessage = 'Vehicle number is required';
                      } else {
                        errorMessage = validateVehicleNumber(normalized);

                        if (!errorMessage) {
                          if (existingVehicleNumbersNormalized.has(normalized)) {
                            errorMessage = 'This vehicle number is already registered';
                          } else {
                            const hasDuplicateInForms = forms.some((f, i) => {
                              if (i === index) return false;
                              return normalizeVehicleNo(f.vehicle_no) === normalized;
                            });

                            if (hasDuplicateInForms) {
                              errorMessage = 'Duplicate vehicle number in the list';
                            }
                          }
                        }
                      }
                      setErrors(prev => {
                        const current = { ...(prev[index] || {}) };
                        if (errorMessage) {
                          current.vehicle_no = errorMessage;
                        } else {
                          delete current.vehicle_no;
                        }

                        const next = { ...prev };
                        if (Object.keys(current).length === 0) {
                          delete next[index];
                        } else {
                          next[index] = current;
                        }
                        return next;
                      });
                    }}
                    placeholder="e.g., TN01AB1234"
                    maxLength={10}
                    className={errors[index]?.vehicle_no ? 'border-red-500' : ''}
                  />
                  {errors[index]?.vehicle_no && (
                    <p className="text-sm text-red-500">{errors[index].vehicle_no}</p>
                  )}
                </div>

                {/* Validity Date Range */}
                <div className="space-y-2">
                  <Label>
                    Validity Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                            'w-full justify-start text-left font-normal',
                            !form.validity_from && 'text-muted-foreground',
                            (errors[index]?.validity_from || errors[index]?.validity_to) &&
                              'border-red-500',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.validity_from ? (
                          form.validity_to ? (
                            <>
                                {format(form.validity_from, 'LLL dd, y')} -{' '}
                                {format(form.validity_to, 'LLL dd, y')}
                            </>
                          ) : (
                              format(form.validity_from, 'LLL dd, y')
                          )
                        ) : (
                          <span>Select validity date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={new Date()}
                        selected={{
                          from: form.validity_from || undefined,
                          to: form.validity_to || undefined,
                        }}
                        onSelect={(range) => updateDateRange(index, range)}
                        numberOfMonths={2}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  {(errors[index]?.validity_from || errors[index]?.validity_to) && (
                    <p className="text-sm text-red-500">
                      {errors[index].validity_from || errors[index].validity_to}
                    </p>
                  )}
                </div>

                {/* Comments */}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor={`comments-${index}`}>
                    Comments <span className="text-gray-400 text-xs">(Optional)</span>
                  </Label>
                  <Textarea
                    id={`comments-${index}`}
                    value={form.comments}
                    onChange={(e) => updateForm(index, 'comments', e.target.value)}
                    maxLength={100}
                    placeholder="Enter comments"
                    rows={3}
                    className={errors[index]?.comments ? 'border-red-500' : ''}
                  />
                  {errors[index]?.comments && (
                    <p className="text-sm text-red-500">{errors[index].comments}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaveDisabled}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              mode === 'edit' ? 'Update' : 'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTrustedVehicleDialog;

