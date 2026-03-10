import React, { useState, useEffect, useMemo } from 'react';
import { AlertDialog, AlertDialogContent, 
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle } 
from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEmployeeStore } from '@/store/EmployeeContext';
import { getEmployeeData } from '@/store/employeeSelectors';
import { useClient } from '@/contexts/ClientContext';
import { SOP_VALIDATION } from '@/constant/sopValidation';

interface ProcedureStep {
  id: string;
  step: string;
}

interface SOPCategory {
  id: string;
  category_name: string;
}

interface SOP {
  id: string;
  title: string;
  category_id: string;
  category_name?: string;
  description: string | null;
  status: boolean;
  procedure_steps: string[];
  important_notes: string | null;
  client_id: string | null;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AddSOPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editingSOP?: SOP | null;
}

const AddSOPDialog: React.FC<AddSOPDialogProps> = ({ open, onOpenChange, onSuccess, editingSOP }) => {
  const { state } = useEmployeeStore();
  const employeeData = getEmployeeData(state);
  const { client } = useClient();
  
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<boolean>(false); // false = inactive, true = active
  const [procedureSteps, setProcedureSteps] = useState<ProcedureStep[]>([
    { id: '1', step: '' },
  ]);
  const [importantNotes, setImportantNotes] = useState('');
  const [categories, setCategories] = useState<SOPCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (open && editingSOP) {
      setTitle(editingSOP.title || '');
      setCategoryId(editingSOP.category_id || '');
      setDescription(editingSOP.description || '');
      setStatus(editingSOP.status || false);
      setImportantNotes(editingSOP.important_notes || '');
      
      // Convert procedure steps array to ProcedureStep format
      if (editingSOP.procedure_steps && editingSOP.procedure_steps.length > 0) {
        setProcedureSteps(
          editingSOP.procedure_steps.map((step, index) => ({
            id: String(index + 1),
            step: step,
          }))
        );
      } else {
        setProcedureSteps([{ id: '1', step: '' }]);
      }
    } else if (open && !editingSOP) {
      // Reset form for new SOP
      setTitle('');
      setCategoryId('');
      setDescription('');
      setStatus(true);
      setProcedureSteps([{ id: '1', step: '' }]);
      setImportantNotes('');
    }
  }, [open, editingSOP]);

  // Fetch categories when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('sop_categories' as any)
        .select('id, category_name')
        .order('category_name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
        return;
      }

      setCategories((data || []) as unknown as SOPCategory[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleAddStep = () => {
    const newId = String(Date.now());
    setProcedureSteps([...procedureSteps, { id: newId, step: '' }]);
  };

  const handleRemoveStep = (id: string) => {
    if (procedureSteps.length > 1) {
      setProcedureSteps(procedureSteps.filter(step => step.id !== id));
    }
  };

  const handleStepChange = (id: string, value: string) => {
    setProcedureSteps(
      procedureSteps.map(step => (step.id === id ? { ...step, step: value } : step))
    );
  };

  // Helper function to check for special characters (allows alphanumeric, spaces, and basic punctuation)
  const hasSpecialCharacters = (text: string): boolean => {
    // Allow: letters, numbers, spaces, hyphens, underscores, periods, commas, apostrophes, parentheses
    // Disallow: other special characters like @, #, $, %, ^, &, *, etc.
    const allowedPattern = /^[a-zA-Z0-9\s\-_.,'()]+$/;
    return !allowedPattern.test(text);
  };

  // Validation for form fields
  const isFormValid = useMemo(() => {
    // Title validation
    const titleValid = title.trim().length >= SOP_VALIDATION.title.min && 
                       title.trim().length <= SOP_VALIDATION.title.max &&
                       !hasSpecialCharacters(title.trim());
    
    // Category validation
    const categoryValid = categoryId !== '';
    
    // Description validation
    const descriptionValid = description.trim().length >= SOP_VALIDATION.description.min && 
                             description.trim().length <= SOP_VALIDATION.description.max &&
                             !hasSpecialCharacters(description.trim());
    
    // Procedure steps validation - at least one step with valid length and no special characters
    const stepsValid = procedureSteps.some(step => {
      const trimmed = step.step.trim();
      return trimmed.length >= SOP_VALIDATION.procedureStep.min && 
             trimmed.length <= SOP_VALIDATION.procedureStep.max &&
             !hasSpecialCharacters(trimmed);
    });
    
    return titleValid && categoryValid && descriptionValid && stepsValid;
  }, [title, categoryId, description, procedureSteps]);

  // Validation for important notes (optional but if filled, must be valid)
  const importantNotesValid = useMemo(() => {
    if (!importantNotes.trim()) return true; // Optional field
    return importantNotes.trim().length >= SOP_VALIDATION.importantNotes.min && 
           importantNotes.trim().length <= SOP_VALIDATION.importantNotes.max;
  }, [importantNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate title
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < SOP_VALIDATION.title.min) {
      toast.error(`Title must be at least ${SOP_VALIDATION.title.min} characters`);
      return;
    }
    if (trimmedTitle.length > SOP_VALIDATION.title.max) {
      toast.error(`Title must not exceed ${SOP_VALIDATION.title.max} characters`);
      return;
    }
    if (hasSpecialCharacters(trimmedTitle)) {
      toast.error('Title cannot contain special characters. Only letters, numbers, spaces, and basic punctuation (.,-_\'()) are allowed.');
      return;
    }

    // Validate category
    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    // Validate description
    const trimmedDescription = description.trim();
    if (trimmedDescription.length < SOP_VALIDATION.description.min) {
      toast.error(`Description must be at least ${SOP_VALIDATION.description.min} characters`);
      return;
    }
    if (trimmedDescription.length > SOP_VALIDATION.description.max) {
      toast.error(`Description must not exceed ${SOP_VALIDATION.description.max} characters`);
      return;
    }
    if (hasSpecialCharacters(trimmedDescription)) {
      toast.error('Description cannot contain special characters. Only letters, numbers, spaces, and basic punctuation (.,-_\'()) are allowed.');
      return;
    }

    // Validate procedure steps
    const validSteps = procedureSteps
      .filter(step => {
        const trimmed = step.step.trim();
        if (trimmed.length < SOP_VALIDATION.procedureStep.min || 
            trimmed.length > SOP_VALIDATION.procedureStep.max) {
          return false;
        }
        if (hasSpecialCharacters(trimmed)) {
          toast.error('Procedure steps cannot contain special characters. Only letters, numbers, spaces, and basic punctuation (.,-_\'()) are allowed.');
          return false;
        }
        return true;
      })
      .map(step => step.step.trim());

    if (validSteps.length === 0) {
      toast.error(`Please add at least one procedure step (${SOP_VALIDATION.procedureStep.min}-${SOP_VALIDATION.procedureStep.max} characters)`);
      return;
    }

    // Validate important notes if provided
    if (importantNotes.trim()) {
      if (importantNotes.trim().length < SOP_VALIDATION.importantNotes.min) {
        toast.error(`Important notes must be at least ${SOP_VALIDATION.importantNotes.min} characters`);
        return;
      }
      if (importantNotes.trim().length > SOP_VALIDATION.importantNotes.max) {
        toast.error(`Important notes must not exceed ${SOP_VALIDATION.importantNotes.max} characters`);
        return;
      }
    }

    setLoading(true);

    try {
      // Get client_id and employee_id (both mandatory)
      const clientId = employeeData?.clientId || employeeData?.client?.id || client?.id || null;
      const employeeId = employeeData?.id || null;

      if (!clientId) {
        toast.error('Missing client information. Please refresh and try again.');
        setLoading(false);
        return;
      }

      if (!employeeId) {
        toast.error('Missing employee information. Please re-login and try again.');
        setLoading(false);
        return;
      }

      // Check for duplicate SOP title (case-insensitive, within same client)
      const { data: existingSOPs, error: checkError } = await supabase
        .from('sop' as any)
        .select('id, title')
        .eq('client_id', clientId)
        .ilike('title', trimmedTitle);

      if (checkError) {
        console.error('Error checking for duplicate SOP:', checkError);
      } else if (existingSOPs && existingSOPs.length > 0) {
        // If editing, allow if it's the same SOP
        if (editingSOP && existingSOPs && existingSOPs.some((s: any) => s.id === editingSOP.id)) {
          // Same SOP, allow update
        } else {
          // Duplicate found
          toast.error(`An SOP with the title "${trimmedTitle}" already exists`);
          setLoading(false);
          return;
        }
      }

      // Call edge function to create or update SOP
      const functionName = editingSOP ? 'update-sop' : 'create-sop';
      const requestBody: any = {
        title: trimmedTitle,
        category_id: categoryId,
        description: trimmedDescription || null,
        status: status,
        procedure_steps: validSteps,
        important_notes: importantNotes.trim() || null,
        client_id: clientId,
        employee_id: employeeId,
      };

      // Add sop_id for update
      if (editingSOP) {
        requestBody.sop_id = editingSOP.id;
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: requestBody,
      });

      if (error) {
        console.error('Error creating SOP:', error);
        toast.error('Failed to create SOP');
        return;
      }

      if (data && data.error) {
        toast.error(data.error || 'Failed to create SOP');
        return;
      }

      toast.success(editingSOP ? 'SOP updated successfully' : 'SOP created successfully');
      
      // Reset form
      setTitle('');
      setCategoryId('');
      setDescription('');
      setStatus(false);
      setProcedureSteps([{ id: '1', step: '' }]);
      setImportantNotes('');
      
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating SOP:', error);
      toast.error('Failed to create SOP');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setCategoryId('');
    setDescription('');
    setStatus(false);
    setProcedureSteps([{ id: '1', step: '' }]);
    setImportantNotes('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto no-scrollbar">
        <AlertDialogHeader>
          <AlertDialogTitle>{editingSOP ? 'Edit SOP' : 'Add New SOP'}</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                const value = e.target.value;
                // Allow only alphanumeric, spaces, and basic punctuation
                if (value === '' || /^[a-zA-Z0-9\s\-_.,'()]*$/.test(value)) {
                  setTitle(value);
                }
              }}
              placeholder="Enter SOP title"
              maxLength={SOP_VALIDATION.title.max}
              required
            />
            {title && (title.trim().length < SOP_VALIDATION.title.min || title.trim().length > SOP_VALIDATION.title.max) && (
              <p className="text-xs text-red-500">
                Title must be between {SOP_VALIDATION.title.min} and {SOP_VALIDATION.title.max} characters
              </p>
            )}
            {title && hasSpecialCharacters(title.trim()) && (
              <p className="text-xs text-red-500">
                Title cannot contain special characters. Only letters, numbers, spaces, and basic punctuation (.,-_\'()) are allowed.
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.category_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
<TextareaWithVoice
            id="description"
            value={description}
            onChange={(e) => {
                const value = e.target.value;
                // Allow only alphanumeric, spaces, and basic punctuation
                if (value === '' || /^[a-zA-Z0-9\s\-_.,'()]*$/.test(value)) {
                  setDescription(value);
                }
              }}
              placeholder="Brief description of the procedure"
              rows={3}
              maxLength={SOP_VALIDATION.description.max}
              required
            />
            {description && (description.trim().length < SOP_VALIDATION.description.min || description.trim().length > SOP_VALIDATION.description.max) && (
              <p className="text-xs text-red-500">
                Description must be between {SOP_VALIDATION.description.min} and {SOP_VALIDATION.description.max} characters
              </p>
            )}
            {description && hasSpecialCharacters(description.trim()) && (
              <p className="text-xs text-red-500">
                Description cannot contain special characters. Only letters, numbers, spaces, and basic punctuation (.,-_\'()) are allowed.
              </p>
            )}
          </div>

          {/* Procedure Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>
                Procedure Steps <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddStep}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Step
              </Button>
            </div>
            <div className="space-y-2">
              {procedureSteps.map((step, index) => {
                const stepValue = step.step.trim();
                const stepValid = stepValue.length >= SOP_VALIDATION.procedureStep.min && 
                                 stepValue.length <= SOP_VALIDATION.procedureStep.max;
                const showStepError = stepValue.length > 0 && !stepValid;
                
                return (
                  <div key={step.id} className="flex items-start gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white font-semibold text-sm flex-shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <Input
                        value={step.step}
                        onChange={(e) => {
                          let value = e.target.value;
                          value = value.replace(/^\s+/, '');
                          if (value === '' || /^[a-zA-Z0-9\s\-_.,'()]*$/.test(value)) {
                            handleStepChange(step.id, value);
                          }
                        }}
                        placeholder={`Step ${index + 1}`}
                        maxLength={SOP_VALIDATION.procedureStep.max}
                        className={showStepError ? 'border-red-500' : ''}
                      />
                      {showStepError && (
                        <p className="text-xs text-red-500 mt-1">
                          Step must be between {SOP_VALIDATION.procedureStep.min} and {SOP_VALIDATION.procedureStep.max} characters
                        </p>
                      )}
                      {step.step.trim() && hasSpecialCharacters(step.step.trim()) && (
                        <p className="text-xs text-red-500 mt-1">
                          Step cannot contain special characters. Only letters, numbers, spaces, and basic punctuation (.,-_\'()) are allowed.
                        </p>
                      )}
                    </div>
                    {procedureSteps.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStep(step.id)}
                        className="text-red-500 hover:text-red-700 flex-shrink-0 mt-1"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Important Notes */}
          <div className="space-y-2">
            <Label htmlFor="importantNotes">Important Notes (Optional)</Label>
            <TextareaWithVoice
              id="importantNotes"
              value={importantNotes}
              onChange={(e) => setImportantNotes(e.target.value)}
              placeholder="Any important notes or warnings"
              rows={3}
              maxLength={SOP_VALIDATION.importantNotes.max}
            />
            {importantNotes && !importantNotesValid && (
              <p className="text-xs text-red-500">
                Important notes must be between {SOP_VALIDATION.importantNotes.min} and {SOP_VALIDATION.importantNotes.max} characters
              </p>
            )}
          </div>

          {/* Status Toggle - Only show in edit mode */}
          {editingSOP && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="status"
                    checked={status}
                    onCheckedChange={setStatus}
                  />
                  <span className={`text-sm ${status ? 'text-gray-600' : 'text-gray-400'}`}>
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !isFormValid || !importantNotesValid}
            >
              {loading ? (editingSOP ? 'Updating...' : 'Creating...') : (editingSOP ? 'Update SOP' : 'Create SOP')}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddSOPDialog;

