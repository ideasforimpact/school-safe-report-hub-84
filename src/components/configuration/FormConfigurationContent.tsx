import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ExternalLink, QrCode, Search, X } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import SimpleFormBuilder from './SimpleFormBuilder';
import { useCustomForms } from '@/hooks/useCustomForms';
import { useEmployeeAccess } from '@/contexts/auth/hooks/useEmployeeAccess';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredForms = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return (forms || []).filter(f => {
      const matchesSearch = !query ||
        f.title.toLowerCase().includes(query) ||
        (f.description || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? f.is_active : !f.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [forms, search, statusFilter]);

  const handleCreateForm = () => {
    setEditingForm(null);
    setShowBuilder(true);
  };

  const handleEditForm = (form: CustomForm) => {
    setEditingForm(form);
    setShowBuilder(true);
  };

  const handlePreviewForm = (form: CustomForm) => {
    const formUrl = `${window.location.origin}/public-form/${form.id}`;
    window.open(formUrl, '_blank');
  };

  const buildPreviewUrl = (form: CustomForm) => {
    const clientId = getClientId();
    const base = `${window.location.origin}/form/${form.id}`;
    const qs = `?clientId=${encodeURIComponent(clientId || '')}&formId=${encodeURIComponent(form.id)}`;
    return `${base}${qs}`;
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
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-72">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search forms..."
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <Select onValueChange={(value) => setStatusFilter(value as any)} defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(search || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { setSearch(''); setStatusFilter('all'); }}
                  className="text-sm text-blue-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[320px]">Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => {
                    const previewUrl = buildPreviewUrl(form);
                    return (
                      <TableRow key={form.id}>
                        <TableCell>
                          <div className="font-medium">{form.title}</div>
                          {form.description && (
                            <div className="text-sm text-gray-500 truncate max-w-[520px]">
                              {form.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={form.is_active ? 'default' : 'secondary'}>
                            {form.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(form.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Preview */}
                            <Button variant="outline" size="icon" onClick={() => window.open(previewUrl, '_blank')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {/* QR */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <QrCode className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Form QR Code</DialogTitle>
                                </DialogHeader>
                                <div ref={qrCodeRef} className="flex flex-col items-center justify-center p-4">
                                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                    <QRCodeSVG value={previewUrl} size={220} />
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {/* Edit */}
                            <Button variant="outline" size="icon" onClick={() => handleEditForm(form)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {/* Delete */}
                            <Button variant="outline" size="icon" onClick={() => handleDeleteClick(form)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
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
