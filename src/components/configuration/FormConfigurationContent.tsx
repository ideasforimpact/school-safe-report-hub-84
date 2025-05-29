import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, EyeOff, FileText, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import SimpleFormBuilder from './SimpleFormBuilder';
import { useCustomForms } from '@/hooks/useCustomForms';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';
import { toast } from '@/hooks/use-toast';

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
  allowMultiple?: boolean;
  maxFiles?: number;
  allowedFileTypes?: string[];
}

interface CustomForm {
  id: string;
  client_id: string;
  title: string;
  description: string;
  fields: FormField[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

const FormConfigurationContent = () => {
  const navigate = useNavigate();
  const { forms, loading, saveForm, updateForm, deleteForm, toggleFormActive } = useCustomForms();
  const { getClientId, getEmployeeId } = useEmployeeAccess();
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<CustomForm | null>(null);

  const handleCreateForm = () => {
    setEditingForm(null);
    setShowBuilder(true);
  };

  const handleEditForm = (form: CustomForm) => {
    setEditingForm(form);
    setShowBuilder(true);
  };

  const handlePreviewForm = (form: CustomForm) => {
    navigate(`/form-preview/${form.id}`);
  };

  const handleCopyFormUrl = async (form: CustomForm) => {
    try {
      const formUrl = `${window.location.origin}/public-form/${form.id}`;
      await navigator.clipboard.writeText(formUrl);
      toast({
        title: "Success",
        description: "Form submission URL copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleSaveForm = async (formData: Omit<CustomForm, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const clientId = getClientId();
      const employeeId = getEmployeeId();
      
      if (!clientId) {
        toast({
          title: "Error",
          description: "Client ID not available. Please ensure you are logged in.",
          variant: "destructive"
        });
        return;
      }

      if (editingForm) {
        // Update existing form - ensure client_id is included
        const updateData = {
          ...formData,
          client_id: clientId
        };
        await updateForm(editingForm.id, updateData);
        toast({
          title: "Success",
          description: "Form updated successfully"
        });
      } else {
        // Create new form - ensure client_id and created_by are included
        const newFormData = {
          ...formData,
          client_id: clientId,
          created_by: employeeId
        };
        await saveForm(newFormData);
        toast({
          title: "Success", 
          description: "Form created successfully"
        });
      }
      setShowBuilder(false);
      setEditingForm(null);
    } catch (error) {
      console.error('Form save error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save form",
        variant: "destructive"
      });
    }
  };

  const handleDeleteClick = (form: CustomForm) => {
    setFormToDelete(form);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (formToDelete) {
      try {
        await deleteForm(formToDelete.id);
        toast({
          title: "Success",
          description: "Form deleted successfully"
        });
        setFormToDelete(null);
        setDeleteDialogOpen(false);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete form",
          variant: "destructive"
        });
      }
    }
  };

  const handleToggleActive = async (form: CustomForm) => {
    try {
      await toggleFormActive(form.id, !form.is_active);
      toast({
        title: "Success",
        description: `Form ${form.is_active ? 'deactivated' : 'activated'} successfully`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update form status",
        variant: "destructive"
      });
    }
  };

  const getFieldTypesDisplay = (fields: FormField[]) => {
    const types = fields.map(field => {
      switch (field.type) {
        case 'file_attachment': return 'File';
        case 'rating': return 'Rating';
        case 'text_area': return 'Text Area';
        case 'dropdown': return 'Dropdown';
        case 'radio_buttons': return 'Radio';
        case 'checkboxes': return 'Checkbox';
        default: return 'Text';
      }
    });
    return [...new Set(types)].join(', ');
  };

  if (showBuilder) {
    return (
      <SimpleFormBuilder
        form={editingForm}
        onSave={handleSaveForm}
        onCancel={() => {
          setShowBuilder(false);
          setEditingForm(null);
        }}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-gray-500">Loading forms...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Custom Forms</h3>
          <p className="text-sm text-gray-500">Create and manage custom forms for data collection</p>
        </div>
        <Button onClick={handleCreateForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Form
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No forms created yet</h3>
              <p className="text-gray-500 mb-6">Create your first custom form to start collecting data</p>
              <Button onClick={handleCreateForm}>Create Form</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{form.description}</TableCell>
                    <TableCell>
                      <Badge variant={form.is_active ? "default" : "secondary"}>
                        {form.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(form.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyFormUrl(form)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewForm(form)}
                          className="gap-1"
                        >
                          <FileText className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(form)}
                          className="gap-1"
                        >
                          {form.is_active ? (
                            <>
                              <EyeOff className="h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditForm(form)}
                          className="gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(form)}
                          className="gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Form</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{formToDelete?.title}"? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormConfigurationContent;
