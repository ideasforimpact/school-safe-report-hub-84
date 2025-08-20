import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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

const FormsPage = () => {
  const location = useLocation();
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

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

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
  const getDescription = (sub: any) => {
    const v = extractFromResponses(sub.responses, ['description','message','details']) || '';
    const s = (typeof v === 'string') ? v : (v != null ? JSON.stringify(v) : '');
    return s.length > 80 ? s.slice(0, 80) + '…' : s;
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
  const { submissions, loading: submissionsLoading, refetch: refetchSubmissions } = useFormSubmissions(selectedForm?.id || null);

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

  useEffect(() => {
    // Auto-select first form for submissions (normal view)
    if (!isBackoffice && forms && forms.length > 0 && !selectedForm) {
      setSelectedForm(forms[0]);
    }
  }, [isBackoffice, forms, selectedForm]);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        (getDescription(sub) || '').toLowerCase().includes(s) ||
      (sub.status || '').toLowerCase().includes(s)
    );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((sub: any) => (sub.status || 'pending') === statusFilter);
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
  }, [submissions, searchTerm, statusFilter, dateFrom, dateTo]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || dateFrom || dateTo;

  const handleAcknowledgeSubmission = async () => {
    if (!acknowledgeSubmission || !acknowledgeComment.trim()) {
      toast.error('Please enter a comment before acknowledging');
      return;
    }

    setIsSubmittingAcknowledgment(true);
    try {
      const { error } = await supabase
        .from('form_submissions')
        .update({
          status: 'acknowledged',
          comments: acknowledgeComment.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', acknowledgeSubmission.id);

      if (error) {
        console.error('Error acknowledging submission:', error);
        toast.error('Failed to acknowledge submission');
        return;
      }

      toast.success('Submission acknowledged successfully');
      
      // Refresh only the submissions data using the refetch function
      await refetchSubmissions();
      
      setAcknowledgeSubmission(null);
      setAcknowledgeComment('');
    } catch (error) {
      console.error('Error acknowledging submission:', error);
      toast.error('Failed to acknowledge submission');
    } finally {
      setIsSubmittingAcknowledgment(false);
    }
  };

  // Shared header and content wrapper depending on mode
  const Content = (
    <div className="w-full py-6">
      <div className="mx-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">
                {isBackoffice ? 'Form Management' : 'Grievance Submissions'}
              </h1>
              <p className="text-gray-500 mt-1">
                {isBackoffice 
                  ? 'Configure grievance forms for clients' 
                  : 'View and manage grievance submission details'
                }
              </p>
            </div>
          </div>
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
                                    <TableCell>{formatDate(form.created_at)}</TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        {/* Preview (icon-only) */}
                                        <Button variant="outline" size="icon" onClick={() => window.open(previewUrl, '_blank')}>
                                          <ExternalLink className="h-4 w-4" />
                                        </Button>
                                          {/* Backoffice extra actions (QR and Edit hidden) */}
                                            <Button variant="outline" size="icon" onClick={() => handleDeleteForm(form.id)}>
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
                  <CardTitle>Submission List</CardTitle>
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
                          placeholder="Search submissions..."
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

                      {/* 3. Date Range Filter */}
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
                                  onSelect={setDateFrom}
                                  className="rounded-md border"
                                />
                              </div>
                              <div>
                                <label className="text-sm font-medium">To:</label>
                                <CalendarIcon
                                  mode="single"
                                  selected={dateTo}
                                  onSelect={setDateTo}
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
                        Showing {filteredSubmissions.length} of {submissions.length} submissions
                      </div>
                    )}
                    </div>

                    {!selectedForm ? (
                      <div className="text-center py-12 text-gray-500">Select a form to view submissions</div>
                    ) : submissionsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading submissions...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Submitter - Name</TableHead>
                              <TableHead>Mobile number</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Submission Date</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredSubmissions.length === 0 ? (
                              <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                {hasActiveFilters ? 'No submissions match your filters' : 'No submissions found'}
                              </TableCell>
                              </TableRow>
                            ) : (
                              filteredSubmissions.map((sub: any) => (
                                <TableRow key={sub.id}>
                                  <TableCell>
                                    <div className="font-medium">{getName(sub)}</div>
                                  </TableCell>
                                  <TableCell>{getPhone(sub) || '-'}</TableCell>
                                  <TableCell className="max-w-[360px] truncate">{getDescription(sub) || '-'}</TableCell>
                                  <TableCell>{getType(sub) || '-'}</TableCell>
                                  <TableCell>
                                  {getStatusBadge(sub.status)}
                                  </TableCell>
                                  <TableCell>{formatDate(sub.created_at)}</TableCell>
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
                                        title="Acknowledge submission"
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
													<DialogTitle>Submission Details</DialogTitle>
												</DialogHeader>
												<div className="space-y-6">
													{/* Key information */}
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
														<div>
															<div className="text-sm text-gray-600">Name</div>
															<div className="mt-1">{viewSubmission.submitter_name || (viewSubmission.responses && (viewSubmission.responses.name || viewSubmission.responses.full_name || viewSubmission.responses.submitter_name)) || 'Anonymous'}</div>
														</div>
														<div>
															<div className="text-sm text-gray-600">Phone</div>
															<div className="mt-1">{viewSubmission.submitter_phone || (viewSubmission.responses && (viewSubmission.responses.phone || viewSubmission.responses.contact || viewSubmission.responses.mobile)) || 'Not provided'}</div>
														</div>
														<div>
															<div className="text-sm text-gray-600">Subject</div>
															<div className="mt-1">{viewSubmission.responses && (viewSubmission.responses.subject || viewSubmission.responses.heading || viewSubmission.responses.title) || 'Not provided'}</div>
														</div>
														<div>
															<div className="text-sm text-gray-600">Description</div>
															<div className="mt-1 whitespace-pre-wrap">{viewSubmission.responses && (viewSubmission.responses.description || viewSubmission.responses.message || viewSubmission.responses.details) || 'Not provided'}</div>
														</div>
														<div>
															<div className="text-sm text-gray-600">Type</div>
															<div className="mt-1">{viewSubmission.submitter_type || (viewSubmission.responses && (viewSubmission.responses.submitter_type || viewSubmission.responses.type)) || 'Not provided'}</div>
														</div>
														<div>
															<div className="text-sm text-gray-600">Submitted</div>
															<div className="mt-1">{formatDate(viewSubmission.created_at)}</div>
														</div>
													</div>
													{/* Status */}
													<div>
														<div className="text-sm text-gray-600 mb-2">Status</div>
                                {getStatusBadge(viewSubmission.status)}
													</div>
													{/* Attachments */}
													<div className="space-y-3">
														<div className="text-lg font-semibold">Attachments</div>
														{(() => {
															const raw = (viewSubmission as any).attachments || ((viewSubmission as any).responses && (viewSubmission as any).responses.attachments);
															const list = raw ? (Array.isArray(raw) ? raw : Object.values(raw).flat()) : [];
															if (!list || list.length === 0) {
																return <div className="text-sm text-gray-500">No attachments</div>;
															}
															return (
																<div className="space-y-2">
                                      <ul className="space-y-2">
																		{list.map((f: any, idx: number) => (
                                          <li key={idx} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                                            <span className="text-sm truncate mr-3">
																					{f.filename || f.name || `Attachment ${idx + 1}`}
                                            </span>
                                            <a
                                              href={(f.url || f.publicUrl)}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-sm text-blue-600 hover:underline"
                                            >
                                              Download
																				</a>
																			</li>
																	))}
																</ul>
																															</div>
																);
														})()}
													</div>
											</div>
										</DialogContent>
									</Dialog>
                      )}
                      {acknowledgeSubmission && (
                        <Dialog open={!!acknowledgeSubmission} onOpenChange={(open) => { if (!open) setAcknowledgeSubmission(null); }}>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Acknowledge Submission</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-gray-600">
                                Are you sure you want to acknowledge this submission? This action cannot be undone.
                              </p>
                              <Textarea
                                placeholder="Enter comment (optional)"
                                value={acknowledgeComment}
                                onChange={(e) => setAcknowledgeComment(e.target.value)}
                                className="min-h-[100px]"
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setAcknowledgeSubmission(null)}>
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
