import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClient } from '@/contexts/ClientContext';
import { backofficeFormService } from '@/services/forms/backofficeFormService';
import { FormConfiguration } from '@/components/backoffice/forms/FormConfiguration';
import { CustomForm } from '@/types/formTypes';
import { Edit, Trash2, ExternalLink, FileText, Plus, QrCode, Search, Eye, Filter, X, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/auth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';
import { FileItem } from '@/types/fileTypes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import { formatDate } from "@/lib/Dateformat";

const FormsPage = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isBackoffice = location.pathname.startsWith('/backoffice');

  const { client, clients, loading: clientsLoading } = useClient();
  const { user, employeeData } = useAuth();
  const [selectedClientId, setSelectedClientId] = useState<string>(''); // used only for backoffice
  const authClientId = (employeeData as any)?.clientId || (user as any)?.clientId;
  const effectiveClientId = isBackoffice ? selectedClientId : (authClientId ?? client?.id ?? '');

  const [forms, setForms] = useState<CustomForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFormConfig, setShowFormConfig] = useState(false);
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewSubmission, setViewSubmission] = useState<any | null>(null);
  const [acknowledgeSubmission, setAcknowledgeSubmission] = useState<any | null>(null);
  const [acknowledgeComment, setAcknowledgeComment] = useState('');
  const [isSubmittingAcknowledgment, setIsSubmittingAcknowledgment] = useState(false);
  const [acknowledgementFiles, setAcknowledgementFiles] = useState<FileItem[]>([]);

  // Filter states
  const initialStatusFromQuery = (() => {
    const filterParam = searchParams.get('filter');
    switch (filterParam) {
      case 'open':
        return 'pending';
      case 'acknowledged':
        return 'acknowledged';
      case 'pending':
        return 'pending';
      default:
        return 'all';
    }
  })();
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFromQuery);
  const [formTypeFilter, setFormTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  // Keep status filter in sync when query param changes after mount
  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (!filterParam) return;
    const mapped = filterParam === 'open' ? 'pending' : (filterParam === 'acknowledged' ? 'acknowledged' : (filterParam === 'pending' ? 'pending' : 'all'));
    setStatusFilter(mapped);
  }, [searchParams]);

  // Helpers to extract values from mixed response shapes (array or object)
  const extractFromResponses = (responses: any, keys: string[]) => {
    if (!responses) return null;
    if (Array.isArray(responses)) {
      for (const k of keys) {
        const found = responses.find((r: any) => {
          const candidates = [r.label, r.field_label, r.field_id].map((v: any) => (v || '').toString().toLowerCase());
          return candidates.includes(k);
        });
        if (found) return found.value;
      }
      return null;
    }
    if (typeof responses === 'object') {
      for (const k of keys) {
        if (responses[k] !== undefined && responses[k] !== null) return responses[k];
      }
    }
    return null;
  };

  const getName = (sub: any) => sub.submitter_name || extractFromResponses(sub.responses, ['name','full_name','submitter_name']) || 'Anonymous';
  const getPhone = (sub: any) => sub.submitter_phone || extractFromResponses(sub.responses, ['phone','contact','mobile']) || '';
  const getTitle = (sub: any) => {
    const v = extractFromResponses(sub.responses, ['subject','heading','title']) || '';
    const s = (typeof v === 'string') ? v : (v != null ? JSON.stringify(v) : '');
    return s.length > 30 ? s.slice(0, 30) + '…' : s;
  };

  const getFullTitle = (sub: any) => {
    const v = extractFromResponses(sub.responses, ['subject','heading','title']) || '';
    return (typeof v === 'string') ? v : (v != null ? JSON.stringify(v) : '');
  };

  const getType = (sub: any) => sub.submitter_type || (extractFromResponses(sub.responses, ['submitter_type','type']) || '');

  // Helper function to get status badge with proper formatting and colors
  const getStatusBadge = (status: string) => {
    const statusText = status || 'pending';
    const capitalizedStatus = statusText.charAt(0).toUpperCase() + statusText.slice(1);
    
    switch (statusText.toLowerCase()) {
      case 'acknowledged':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            {capitalizedStatus}
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            {capitalizedStatus}
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            {capitalizedStatus}
          </Badge>
        );
      case 'in progress':
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
            {capitalizedStatus}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {capitalizedStatus}
          </Badge>
        );
    }
  };

  // Submissions hook (normal view)
  const { submissions, loading: submissionsLoading, refetch: refetchSubmissions } = useFormSubmissions(selectedForm?.id || null, effectiveClientId || null);

  // For backoffice, preselect first active client when list loads
  useEffect(() => {
    if (isBackoffice && clients && clients.length > 0 && !selectedClientId) {
      const firstActive = clients.find(c => c.active);
      if (firstActive) setSelectedClientId(firstActive.id);
    }
  }, [isBackoffice, clients, selectedClientId]);

  useEffect(() => {
    if (effectiveClientId) {
      fetchForms(effectiveClientId);
    }
  }, [effectiveClientId]);

  // Do not auto-select a form. Default view shows all forms for the client.
  // User may explicitly choose a specific form elsewhere to scope the results.

  const fetchForms = async (clientId: string) => {
    setLoading(true);
    try {
      const formsData = await backofficeFormService.fetchForms(clientId);
      setForms(formsData);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async (formData: any) => {
    if (!effectiveClientId) {
      toast.error('No client selected');
      return;
    }

    try {
      const newForm = await backofficeFormService.createForm({
        ...formData,
        client_id: effectiveClientId,
        is_active: true
      });
      setForms(prev => [newForm, ...prev]);
      setShowFormConfig(false);
      toast.success('Form created successfully');
    } catch (error) {
      console.error('Error creating form:', error);
      toast.error('Failed to create form');
    }
  };

  const handleUpdateForm = async (formData: any) => {
    if (!editingForm) return;

    try {
      const updatedForm = await backofficeFormService.updateForm(editingForm.id, formData);
      setForms(prev => prev.map(f => f.id === updatedForm.id ? updatedForm : f));
      setEditingForm(null);
      setShowFormConfig(false);
      toast.success('Form updated successfully');
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error('Failed to update form');
    }
  };
  const grievanceStats = useMemo(() => {
    if (!submissions) {
      return {
        open: 0,
        closed: 0,
        acknowledged: 0,
      };
    }

    let open = 0;
    let closed = 0;
    let acknowledged = 0;

    submissions.forEach((sub: any) => {
      const status = (sub.status || 'pending').toLowerCase();

      if (status === 'pending') {
        open += 1;
      } else if (status === 'acknowledged') {
        acknowledged += 1;
      } else if (status === 'resolved' || status === 'closed') {
        closed += 1;
      }
    });

    return { open, closed, acknowledged };
  }, [submissions]);

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      await backofficeFormService.deleteForm(formId);
      setForms(prev => prev.filter(f => f.id !== formId));
      toast.success('Form deleted successfully');
    } catch (error) {
      console.error('Error deleting form:', error);
      toast.error('Failed to delete form');
    }
  };

  const handleOpenCreate = () => {
    setEditingForm(null);
    setShowFormConfig(true);
  };

  const handleSaveFormConfig = async (formConfig: any) => {
    try {
      if (!effectiveClientId) {
        toast.error('No client selected');
        return;
      }

      if (editingForm) {
        const updated = await backofficeFormService.updateForm(editingForm.id, {
          title: formConfig.title,
          description: formConfig.description,
          fields: formConfig.fields,
          excluded_fields: formConfig.excluded_fields
        } as any);
        setForms(prev => prev.map(f => f.id === updated.id ? updated : f));
        toast.success('Form updated successfully');
      } else {
        const created = await backofficeFormService.createForm({
          client_id: effectiveClientId,
          title: formConfig.title,
          description: formConfig.description,
          fields: formConfig.fields,
          is_active: true,
          preview_url: undefined as any
        } as any);
        setForms(prev => [created, ...prev]);
        toast.success('Form created successfully');
      }
      setShowFormConfig(false);
      setEditingForm(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to save form');
    }
  };

  const handleCancelFormConfig = () => {
    setShowFormConfig(false);
    setEditingForm(null);
  };

  const buildPreviewUrl = (form: CustomForm) => {
    return `${window.location.origin}/form-preview/${form.id}`;
  };

  // Filtered submissions with all filters applied
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return [];
    
    let filtered = [...submissions];

    // Search filter
    if (searchTerm.trim()) {
    const s = searchTerm.toLowerCase();
      filtered = filtered.filter((sub: any) =>
        (getName(sub) || '').toLowerCase().includes(s) ||
        (getPhone(sub) || '').toLowerCase().includes(s) ||
        (getTitle(sub) || '').toLowerCase().includes(s) ||
      (sub.status || '').toLowerCase().includes(s)
    );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub: any) => (sub.status || 'pending') === statusFilter);
    }

    // Form type filter
    if (formTypeFilter !== 'all') {
      filtered = filtered.filter((sub: any) => {
        const formId = sub.form_id;
        const form = forms.find(f => f.id === formId);
        return form && form.title === formTypeFilter;
      });
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((sub: any) => {
        const submissionDate = new Date(sub.created_at);
        return submissionDate >= dateFrom;
      });
    }
    if (dateTo) {
      filtered = filtered.filter((sub: any) => {
        const submissionDate = new Date(sub.created_at);
        // Set time to end of day for dateTo
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        return submissionDate <= endOfDay;
      });
    }

    return filtered;
  }, [submissions, searchTerm, statusFilter, formTypeFilter, dateFrom, dateTo, forms]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFormTypeFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || formTypeFilter !== 'all' || dateFrom || dateTo;

  const handleAcknowledgeSubmission = async () => {
    if (!acknowledgeSubmission) {
      toast.error('No submission selected');
      return;
    }

    // Comment remains optional; only trim if provided
    const trimmedComment = acknowledgeComment.trim();
    setIsSubmittingAcknowledgment(true);
    try {
      // 1) Upload evidence files to storage under bucket/clientId/employeeId/submissionId
      const bucketId = 'form_submission_comment_attachements';
      const clientId = effectiveClientId || 'unknown-client';
      const employeeId = (employeeData as any)?.id || (user as any)?.id || 'unknown-employee';

      const filePayload: { path: string; filename: string; size?: number }[] = [];

      if (acknowledgementFiles.length > 0) {
        await Promise.all(
          acknowledgementFiles.map(async (file, index) => {
            try {
              if (!file.base64) return;
              const safeName = (file.name || `file_${Date.now()}`).replace(/[^a-zA-Z0-9.-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
              const fileName = `${Date.now()}_${index}_${safeName}`;
              const path = `${clientId}/${employeeId}/${acknowledgeSubmission.id}/${fileName}`;

              const response = await fetch(file.base64);
              const blob = await response.blob();

              const { error: uploadError } = await supabase.storage
                .from(bucketId)
                .upload(path, blob, {
                  contentType: file.type || 'application/octet-stream',
                  upsert: false,
                });

              if (uploadError) {
                console.error('Error uploading acknowledgement evidence:', uploadError);
                throw uploadError;
              }

              filePayload.push({
                path,
                filename: file.name,
                size: file.size,
              });
            } catch (err) {
              console.error('Error processing acknowledgement file:', err);
              throw err;
            }
          })
        );
      }

      // 2) Update submission status and acknowledgement details synchronously
      const { error: updateError } = await supabase
        .from('form_submissions')
        .update({
          status: 'acknowledged',
          comments: trimmedComment || null,
          acknowledged_by_name:
            (employeeData as any)?.firstName && (employeeData as any)?.lastName
              ? `${(employeeData as any).firstName} ${(employeeData as any).lastName}`
              : (user as any)?.firstName
              ? `${(user as any).firstName} ${((user as any).lastName || '')}`.trim()
              : null,
          acknowledged_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', acknowledgeSubmission.id);

      if (updateError) {
        console.error('Error acknowledging submission:', updateError);
        toast.error('Failed to acknowledge submission');
        return;
      }

      // 3) Enqueue file paths so the consumer can attach them to comments_attachment
      if (filePayload.length > 0) {
        const { error: fnError } = await supabase.functions.invoke('enqueue-form-submission-comment-attachments', {
          body: {
            submission_id: acknowledgeSubmission.id,
            comments: trimmedComment || null,
            files: filePayload,
          },
        } as any);

        if (fnError) {
          console.error('Error queueing acknowledgement attachments:', fnError);
          toast.error('Failed to queue acknowledgement evidence. Please try again.');
          return;
        }
      }

      toast.success('Submission acknowledged successfully');
      
      // Refresh only the submissions data using the refetch function
      await refetchSubmissions();
      
      setAcknowledgeSubmission(null);
      setAcknowledgeComment('');
      setAcknowledgementFiles([]);
    } catch (error) {
      console.error('Error acknowledging submission:', error);
      toast.error('Failed to acknowledge submission');
    } finally {
      setIsSubmittingAcknowledgment(false);
    }
  };
  const handleSubmissionUpdated = () => {
    console.log('realtime enabled for forms');
    refetchSubmissions();
  };


  useRealTimeSubHook({
    channelName: `form-submissions-${effectiveClientId}`,
    table: 'form_submissions',
    events: '*',
    enabled: !!effectiveClientId,
    onPayload: handleSubmissionUpdated,
  });

// Shared header and content wrapper depending on mode
const Content = (
<div className="w-full py-6">
  <div className="mx-6 space-y-6">
  <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
      <div className="flex items-start gap-3">
        <FileText className="h-8 w-8 mt-3 text-blue-600 shrink-0" />
        <div>
          <h1 className="text-2xl font-bold">
            {isBackoffice ? 'Form Management' : 'Grievances'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isBackoffice
              ? 'Configure grievance forms for clients'
              : 'Search and manage grievances'}
          </p>
        </div>
      </div>
      {!isBackoffice && (
        <div className="mt-4 flex gap-96">
          <div className='ms-12'>
            <p className="text-sm text-gray-500">Open Grievances</p>
            <p className="text-3xl font-semibold text-orange-600">
              {grievanceStats.open}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Acknowledged Grievances</p>
            <p className="text-3xl font-semibold text-blue-600">
              {grievanceStats.acknowledged}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Closed Grievances</p>
            <p className="text-3xl font-semibold text-green-600">
              {grievanceStats.closed}
            </p>
          </div>

        </div>
      )}
    </div>

  {/* Client Selection (backoffice only) */}
  {isBackoffice && (
    <Card>
      <CardHeader>
        <CardTitle>Select Client</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Active Client:</span>
            <Select 
              value={selectedClientId} 
              onValueChange={setSelectedClientId}
              disabled={clientsLoading}
            >
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Select an active client" />
              </SelectTrigger>
              <SelectContent>
                {clients
                  .filter(c => c.active)
                  .map((cl) => (
                    <SelectItem key={cl.id} value={cl.id}>
                      {cl.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {selectedClientId && (
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )}

  {/* Content based on mode */}
  {effectiveClientId ? (
    <div className="space-y-6">
      {/* Forms Management (backoffice only) */}
      {isBackoffice && (
        <>
        {showFormConfig ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingForm ? 'Edit Form' : 'Create Form'}</CardTitle>
            </CardHeader>
            <CardContent>
              <FormConfiguration 
                initialForm={editingForm as any}
                onSave={handleSaveFormConfig}
                onCancel={handleCancelFormConfig}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Forms</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading forms...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
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
                      {forms.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                            No forms configured for this client
                          </TableCell>
                        </TableRow>
                      ) : (
                        forms.map((form) => {
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
                              <TableCell>{formatDate(form.created_at, { isTiming: true })}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {/* Edit button */}
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => {
                                      setEditingForm(form);
                                      setShowFormConfig(true);
                                    }}
                                    title="Edit form"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {/* Preview (icon-only) */}
                                  <Button variant="outline" size="icon" onClick={() => window.open(previewUrl, '_blank')} title="Preview form">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                    {/* Backoffice extra actions (QR and Edit hidden) */}
                                      <Button variant="outline" size="icon" onClick={() => handleDeleteForm(form.id)} title="Delete form">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        </>
      )}

  {/* Submissions (normal view) - Show directly without tabs */}
  {!isBackoffice && (
      <Card>
        <CardHeader>
        <CardTitle>Grievance List</CardTitle>
        </CardHeader>
        <CardContent>
        {/* Filters Section */}
        <div className="space-y-4 mb-6">
          {/* Single Row: Search and All Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* 1. Search Box */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search name and title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 2. Status Filter */}
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 3. Form Type Filter */}
            {/* <div className="w-48">
              <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.title}>
                      {form.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}

            {/* 4. Date Range Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Date Range:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFrom ? (
                      dateTo ? (
                        <>
                          {format(dateFrom, "LLL dd, y")} - {format(dateTo, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateFrom, "LLL dd, y")
                      )
                    ) : (
                      "Select date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex p-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">From:</label>
                      <CalendarIcon
                        mode="single"
                        selected={dateFrom}
                        onSelect={(date) => {
                          setDateFrom(date);
                          if (dateTo && date && dateTo < date) {
                            setDateTo(undefined);
                          }
                        }}
                        className="rounded-md border"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">To:</label>
                      <CalendarIcon
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        disabled={(date) =>
                          dateFrom ? date < dateFrom : false
                        }
                        className="rounded-md border"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Info */}
          {hasActiveFilters && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredSubmissions.length} of {submissions.length} grievances
            </div>
          )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading forms...</p>
            </div>
          ) : submissionsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading grievances...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Mobile number</TableHead>
                    <TableHead>Raised by</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Grievance Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.length === 0 ? (
                    <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {hasActiveFilters ? 'No grievances match your filters' : 'No grievances found'}
                    </TableCell>
                    </TableRow>
                  ) : (
                    filteredSubmissions.map((sub: any) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="font-medium">{getName(sub)}</div>
                        </TableCell>
                        <TableCell className="max-w-[360px] truncate" title={getFullTitle(sub) || '-'}>{getTitle(sub) || '-'}</TableCell>
                        <TableCell>{getPhone(sub) || '-'}</TableCell>
                        <TableCell>{getType(sub) || '-'}</TableCell>
                        <TableCell>
                        {getStatusBadge(sub.status)}
                        </TableCell>
                        <TableCell>{formatDate(sub.created_at, { isTiming: true })}</TableCell>
                        <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => setViewSubmission(sub)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {sub.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => setAcknowledgeSubmission(sub)}
                              title="Acknowledge grievance"
                            >
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
        {viewSubmission && (
          <Dialog open={!!viewSubmission} onOpenChange={(open) => { if (!open) setViewSubmission(null); }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Grievance Details</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="details" className="mt-4">
                <TabsList className="w-full justify-start rounded-lg bg-gray-100">
                  <TabsTrigger value="details" className="flex-1">
                    Grievance Details
                  </TabsTrigger>
                  <TabsTrigger value="acknowledgement" className="flex-1">
                    Acknowledgement Details
                  </TabsTrigger>
                  <TabsTrigger value="attachments" className="flex-1">
                    Attachments
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Name</div>
                      <div className="mt-1">
                        {viewSubmission.submitter_name ||
                          (viewSubmission.responses &&
                            (viewSubmission.responses.name ||
                              viewSubmission.responses.full_name ||
                              viewSubmission.responses.submitter_name)) ||
                          'Anonymous'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Phone</div>
                      <div className="mt-1">
                        {viewSubmission.submitter_phone ||
                          (viewSubmission.responses &&
                            (viewSubmission.responses.phone ||
                              viewSubmission.responses.contact ||
                              viewSubmission.responses.mobile)) ||
                          'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Subject</div>
                      <div className="mt-1">
                        {(viewSubmission.responses &&
                          (viewSubmission.responses.subject ||
                            viewSubmission.responses.heading ||
                            viewSubmission.responses.title)) ||
                          'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Type</div>
                      <div className="mt-1">
                        {viewSubmission.submitter_type ||
                          (viewSubmission.responses &&
                            (viewSubmission.responses.submitter_type ||
                              viewSubmission.responses.type)) ||
                          'Not provided'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Submitted</div>
                      <div className="mt-1">
                        {formatDate(viewSubmission.created_at, { isTiming: true })}
                      </div>

                    </div>
                  </div>

                  <div>
                    <div className="space-y-2 mb-2">
                      <div className="text-sm text-gray-600">Description</div>
                      <div className="w-full">
                        <div className="whitespace-pre-wrap break-words bg-gray-50 p-4 rounded-md border">
                          {(viewSubmission.responses &&
                            (viewSubmission.responses.description ||
                              viewSubmission.responses.message ||
                              viewSubmission.responses.details)) ||
                            'Not provided'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Status</div>
                    {getStatusBadge(viewSubmission.status)}
                  </div>
                </TabsContent>

                <TabsContent value="acknowledgement" className="mt-4 space-y-4">
                  {viewSubmission.status === 'acknowledged' ? (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="text-sm font-semibold text-blue-800 mb-2">
                        Acknowledgement
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                        <span className="text-gray-700">Acknowledged by: </span>
                        <span className="font-semibold text-blue-900 capitalize">
                          {viewSubmission.acknowledged_by_name || '—'}
                        </span>
                        </div>
                        {viewSubmission.acknowledged_at && (
                        <div>
                          <span className="text-gray-700">Acknowledged on: </span>
                          <span className="font-semibold text-blue-900">
                            {formatDate(viewSubmission.acknowledged_at, { isTiming: true })}
                          </span>
                        </div>
                        )}
                        {viewSubmission.comments && (
                        <div className="mt-1">
                          <span className="text-gray-700">Comment: </span>
                          <span className="font-semibold text-blue-900 whitespace-pre-wrap">
                            {viewSubmission.comments}
                          </span>
                        </div>
                        )}

                        {Array.isArray((viewSubmission as any).comments_attachment) &&
                        (viewSubmission as any).comments_attachment.length > 0 && (
                        <div className="mt-3">
                          <div className="text-gray-700 font-semibold mb-1">
                            Acknowledgement Evidence
                          </div>
                          <ul className="space-y-2">
                            {(viewSubmission as any).comments_attachment.map(
                            (f: any, idx: number) => (
                              <li
                              key={idx}
                              className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 gap-2"
                              >
                              <span className="text-sm break-words break-all flex-1 min-w-0 mr-3">
                                {f.filename || `Evidence ${idx + 1}`}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                try {
                                  let downloadUrl =
                                  f.url || f.publicUrl;

                                  if (
                                  downloadUrl &&
                                  !downloadUrl.startsWith('http')
                                  ) {
                                  const storagePath: string =
                                    downloadUrl;
                                  const [bucket, ...rest] =
                                    storagePath.split('/');
                                  const objectPath =
                                    rest.join('/');
                                  const { data } = supabase.storage
                                    .from(bucket)
                                    .getPublicUrl(objectPath);
                                  downloadUrl = data.publicUrl;
                                  }

                                  if (!downloadUrl) return;

                                  const response =
                                  await fetch(downloadUrl);
                                  if (!response.ok)
                                  throw new Error(
                                    'Failed to download file'
                                  );
                                  const blob = await response.blob();
                                  const blobUrl =
                                  window.URL.createObjectURL(
                                    blob
                                  );
                                  const link =
                                  document.createElement('a');
                                  link.href = blobUrl;
                                  link.download =
                                  f.filename ||
                                  `evidence-${idx + 1}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(
                                    blobUrl
                                  );
                                } catch (err) {
                                  console.error(
                                  'Error downloading evidence:',
                                  err
                                  );
                                  toast.error(
                                  'Failed to download evidence. Please try again.'
                                  );
                                }
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700 flex-shrink-0"
                              >
                                Download
                              </Button>
                              </li>
                            )
                            )}
                          </ul>
                        </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      This grievance has not been acknowledged yet.
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="attachments" className="mt-4 space-y-3">
                  <div className="text-lg font-semibold">Attachments</div>
                  {(() => {
                    const raw =
                    (viewSubmission as any).attachments ||
                    ((viewSubmission as any).responses &&
                      (viewSubmission as any).responses.attachments);
                    const list = raw
                    ? Array.isArray(raw)
                      ? raw
                      : (Object.values(raw) as any[]).flat()
                    : [];
                    if (!list || list.length === 0) {
                    return (
                      <div className="text-sm text-gray-500">
                      No attachments
                      </div>
                    );
                    }

                    const handleDownloadFile = async (
                    fileUrl: string,
                    fileName: string
                    ) => {
                    try {
                      const response = await fetch(fileUrl);
                      if (!response.ok) {
                      throw new Error('Failed to download file');
                      }
                      const blob = await response.blob();
                      const blobUrl = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = blobUrl;
                      link.download = fileName;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(blobUrl);
                      toast.success(`Downloading ${fileName}`);
                    } catch (error) {
                      console.error('Error downloading file:', error);
                      toast.error(
                      'Failed to download the file. Please try again.'
                      );
                    }
                    };

                    return (
                    <div className="space-y-2">
                      <ul className="space-y-2">
                      {list.map((f: any, idx: number) => {
                        const fileName =
                        f.filename ||
                        f.name ||
                        `Attachment ${idx + 1}`;
                        const fileUrl = f.url || f.publicUrl;
                        return (
                        <li
                          key={idx}
                          className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 gap-2"
                        >
                          <span className="text-sm break-words break-all flex-1 min-w-0 mr-3">
                          {fileName}
                          </span>
                          <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            fileUrl &&
                            handleDownloadFile(fileUrl, fileName)
                          }
                          className="text-sm text-blue-600 hover:text-blue-700 flex-shrink-0"
                          >
                          Download
                          </Button>
                        </li>
                        );
                      })}
                      </ul>
                    </div>
                    );
                  })()}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
            )}
            {acknowledgeSubmission && (
              <Dialog open={!!acknowledgeSubmission} onOpenChange={(open) => { if (!open) setAcknowledgeSubmission(null);setAcknowledgeComment(''); 
              setAcknowledgementFiles([]); }}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Acknowledge Grievance</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Are you sure you want to acknowledge this grievance? This action cannot be undone.
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Comment <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                        </label>
                        <Textarea
                          placeholder="Enter comment (optional)"
                          value={acknowledgeComment}
                          onChange={(e) => setAcknowledgeComment(e.target.value)}
                          className="min-h-[100px]"
                          maxLength={200}
                        />
                        <div className="text-xs text-gray-500 text-right">
                          {acknowledgeComment.length}/200 characters
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Evidence Upload <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                        </label>
                        <ReusableFileUploader
                          onFilesChange={(files) => setAcknowledgementFiles(files)}
                          maxFiles={5}
                          maxSize={10}
                          maxTotalSize={50}
                          allowedTypes={[
                            'application/pdf',
                            'image/jpeg',
                            'image/jpg',
                            'image/png',
                            'application/msword',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          ]}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {
                          setAcknowledgeSubmission(null);
                          setAcknowledgeComment('');
                          setAcknowledgementFiles([]);
                        }}>
                        Cancel
                      </Button>
                      <Button
                        variant="default"
                        onClick={handleAcknowledgeSubmission}
                        disabled={isSubmittingAcknowledgment}
                      >
                        {isSubmittingAcknowledgment ? 'Acknowledging...' : 'Acknowledge'}
                      </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
            </div>
          )}
        </CardContent>
      </Card>
  )}

</div>
        ) : (
          <div className="text-center py-12 text-gray-500">Loading client context...</div>
        )}
      </div>
    </div>
  );

  // Always render within the existing app layout for consistency across modules
  return <Layout>{Content}</Layout>;
};

export default FormsPage;
