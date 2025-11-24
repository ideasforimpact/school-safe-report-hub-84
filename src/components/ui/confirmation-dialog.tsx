import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  itemName: string;
  action: 'delete' | 'activate' | 'deactivate';
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  itemName,
  action,
  onConfirm,
  isLoading = false,
  error = null,
}: ConfirmationDialogProps) {
  const getActionText = () => {
    switch (action) {
      case 'delete':
        return 'Delete';
      case 'activate':
        return 'Activate';
      case 'deactivate':
        return 'Deactivate';
      default:
        return 'Confirm';
    }
  };

  const getActionColor = () => {
    switch (action) {
      case 'delete':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'activate':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'deactivate':
        return 'bg-orange-600 hover:bg-orange-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  const getIcon = () => {
    switch (action) {
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      case 'activate':
        return <AlertTriangle className="h-4 w-4" />;
      case 'deactivate':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getUserFriendlyErrorMessage = (error: string) => {
    // First, check if the error message is already user-friendly (from our services)
    // These are the specific error messages we want to show as-is
    if (error.includes('Cannot delete') && error.includes('because it is currently linked to')) {
      return error; // Return the specific error message as-is
    }
    
    // Handle common database constraint errors
    if (error.includes('foreign key constraint')) {
      if (error.includes('incidents_type_id_fkey')) {
        return 'This report type cannot be deleted because it is currently being used by existing incidents. Please deactivate it instead or remove all associated incidents first.';
      }
      if (error.includes('incidents_priority_id_fkey')) {
        return 'This priority cannot be deleted because it is currently being used by existing incidents. Please deactivate it instead or remove all associated incidents first.';
      }
      return 'This item cannot be deleted because it is currently being used by other records. Please deactivate it instead or remove all associated data first.';
    }
    
    if (error.includes('duplicate key')) {
      return 'An item with this name already exists. Please use a different name.';
    }
    
    if (error.includes('permission denied')) {
      return 'You do not have permission to perform this action. Please contact your administrator.';
    }
    
    // Default user-friendly message
    return 'An error occurred while processing your request. Please try again or contact support if the problem persists.';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <X className="h-4 w-4" />
              <AlertDescription>
                {getUserFriendlyErrorMessage(error)}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Description */}
          <DialogDescription className="text-sm text-gray-600">
            {description}
          </DialogDescription>
        </div>
        
        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            className={getActionColor()}
            onClick={onConfirm}
            disabled={isLoading || !!error}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              getIcon()
            )}
            Yes, {getActionText()} {action === 'delete' ? 'Item' : 'Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 