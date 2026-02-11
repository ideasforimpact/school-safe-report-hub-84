import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, ExternalLink, QrCode, X, ToggleLeft, ToggleRight, Download, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';

interface FormField {
  id: string;
  type: "select" | "textarea" | "text" | "email" | "phone" | "file" | "captcha";
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
  client_logo?: string | null;
  preview_url?: string;
}

const FormConfigurationContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isBackoffice = location.pathname.startsWith('/backoffice');
  const { forms, loading, saveForm, updateForm, deleteForm, toggleFormActive, refetch } = useCustomForms();
  const { getClientId, getEmployeeId } = useEmployeeAccess();
  
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState<CustomForm | null>(null);
  const [confirmToggleOpen, setConfirmToggleOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<CustomForm | null>(null);
  const [isToggling, setIsToggling] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [formTypeFilter, setFormTypeFilter] = useState<string>('all');

  // Get unique form titles for the dropdown
  const formTitles = React.useMemo(() => {
    const titles = (forms || []).map(f => f.title);
    return ['all', ...Array.from(new Set(titles))];
  }, [forms]);

  const downloadQrPng = (fileName: string) => {
    const svg = qrCodeRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${fileName}.png`;
        a.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const filteredForms = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return (forms || []).filter(f => {
      const matchesSearch = !query ||
        f.title.toLowerCase().includes(query) ||
        (f.description || '').toLowerCase().includes(query);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? f.is_active : !f.is_active);
      
      // Form type filtering
      const formTitle = f.title.toLowerCase();
      const formDescription = (f.description || '').toLowerCase();
      let matchesFormType = true;
      
      if (formTypeFilter !== 'all') {
        matchesFormType = formTitle.includes(formTypeFilter.toLowerCase()) || formDescription.includes(formTypeFilter.toLowerCase());
      }
      
      return matchesSearch && matchesStatus && matchesFormType;
    });
  }, [forms, search, statusFilter, formTypeFilter]);

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

  const handleSaveForm = async (formData: any) => {
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

      // Resolve client logo from clients table
      let clientLogo: string | null = null;
      try {
        const { data: clientRow } = await supabase
          .from('clients')
          .select('logo')
          .eq('id', clientId)
          .maybeSingle();
        clientLogo = (clientRow as any)?.logo || null;
      } catch {}

      if (editingForm) {
        // Update existing form - ensure client_id and client_logo are included
        const updateData = {
          ...formData,
          client_id: clientId,
          client_logo: formData.client_logo ?? clientLogo,
        } as any;
        await updateForm(editingForm.id, updateData);
        toast({
          title: "Success",
          description: "Form updated successfully"
        });
      } else {
        // Create new form - include client_logo
        const newFormData = {
          ...formData,
          client_id: clientId,
          created_by: employeeId,
          client_logo: formData.client_logo ?? clientLogo,
        } as any;
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

  const requestToggle = (form: CustomForm) => {
    setToggleTarget(form);
    setConfirmToggleOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      setIsToggling(true);
      setIsPageLoading(true);
      await toggleFormActive(toggleTarget.id, !toggleTarget.is_active);
      await refetch();
      toast({ title: 'Success', description: `Form ${toggleTarget.is_active ? 'deactivated' : 'activated'} successfully` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update form status', variant: 'destructive' });
    } finally {
      setIsToggling(false);
      setIsPageLoading(false);
      setConfirmToggleOpen(false);
      setToggleTarget(null);
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
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {isPageLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600 font-medium">Updating form status...</p>
          </div>
        </div>
      )}
      
      {forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {isBackoffice ? 'No forms created yet' : 'No forms available'}
              </h3>
              <p className="text-gray-500 mb-6">
                {isBackoffice 
                  ? 'Create your first custom form to start collecting data'
                  : 'There are no forms configured for your organisation yet.'}
              </p>
              {isBackoffice && (
                <Button onClick={handleCreateForm} disabled={isPageLoading}>Create Form</Button>
              )}
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
                  disabled={isPageLoading}
                />
              </div>
              <div>
                <Select onValueChange={(value) => setStatusFilter(value as any)} defaultValue="all">
                  <SelectTrigger className="w-[180px]" disabled={isPageLoading}>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Form type filter hidden */}
              {(search || statusFilter !== 'all' || formTypeFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSearch(''); setStatusFilter('all'); setFormTypeFilter('all'); }}
                  className="text-sm text-blue-600"
                  disabled={isPageLoading}
                >
                  <X className="h-4 w-4" />
                  Clear Filter
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
                          {form.is_active ? (
                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Inactive</Badge>
                          )}
                    </TableCell>
                    <TableCell>{new Date(form.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                            {form.is_active && (
                              <>
                            {/* Preview */}
                            <Button variant="outline" size="icon" onClick={() => window.open(previewUrl, '_blank')} disabled={isPageLoading}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {/* QR */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="icon" disabled={isPageLoading}>
                                  <QrCode className="h-4 w-4" />
                        </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>{form.title} - QR Code</DialogTitle>
                                </DialogHeader>
                                <div ref={qrCodeRef} className="flex flex-col items-center justify-center p-4">
                                  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                    <QRCodeSVG value={previewUrl} size={220} />
                                  </div>
                                  <Button onClick={() => downloadQrPng(`form-${form.id}-qr`)} className="mt-4" variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download QR Code
                        </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                              </>
                            )}
                            {/* Activate/Deactivate */}
                        <Button
                          variant="outline"
                              size="icon"
                              onClick={() => requestToggle(form)}
                              title={form.is_active ? 'Deactivate' : 'Activate'}
                              disabled={isPageLoading}
                        >
                          {form.is_active ? (
                                <ToggleLeft className="h-4 w-4 text-red-600" />
                          ) : (
                                <ToggleRight className="h-4 w-4 text-green-600" />
                          )}
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

      {/* Confirm Activate/Deactivate */}
      <AlertDialog open={confirmToggleOpen} onOpenChange={setConfirmToggleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toggleTarget?.is_active ? 'Deactivate form?' : 'Activate form?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.is_active
                ? 'This form will be unavailable for new submissions until reactivated.'
                : 'This form will be available for new submissions.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isToggling}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggle} disabled={isToggling}>
              {isToggling ? 'Processing...' : (toggleTarget?.is_active ? 'Deactivate' : 'Activate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormConfigurationContent;
