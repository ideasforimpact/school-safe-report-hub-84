import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClient } from '@/contexts/ClientContext';
import { backofficeFormService } from '@/services/forms/backofficeFormService';
import { FormConfiguration } from '@/components/backoffice/forms/FormConfiguration';
import { CustomForm } from '@/types/formTypes';
import { Edit, Trash2, ExternalLink, FileText, Plus, QrCode, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Input } from '@/components/ui/input';
import { useFormSubmissions } from '@/hooks/useFormSubmissions';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/auth';

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

  // Submissions hook (normal view)
  const { submissions, loading: submissionsLoading } = useFormSubmissions(selectedForm?.id || null);

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
    // Auto-select first form for submissions tab (normal view)
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
    const token = (form.preview_url ? form.preview_url.replace(/^form\//, '') : form.id);
    const qs = `?clientId=${encodeURIComponent(effectiveClientId || '')}&formId=${encodeURIComponent(form.id)}`;
    return `${window.location.origin}/form/${token}${qs}`;
  };

  // Filtered submissions for search (normal view)
  const filteredSubmissions = useMemo(() => {
    if (!searchTerm.trim()) return submissions;
    const s = searchTerm.toLowerCase();
    return submissions.filter((sub: any) =>
      (sub.submitter_name || '').toLowerCase().includes(s) ||
      (sub.submitter_email || '').toLowerCase().includes(s) ||
      (sub.status || '').toLowerCase().includes(s)
    );
  }, [submissions, searchTerm]);

  // Shared header and content wrapper depending on mode
  const Content = (
    <div className="w-full py-6">
      <div className="mx-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Form Management</h1>
              <p className="text-gray-500 mt-1">Configure grievance forms for clients</p>
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

        {/* Tabs always visible once we know the client */}
        {effectiveClientId ? (
          <Tabs defaultValue="forms" className="space-y-6">
            <TabsList>
              <TabsTrigger value="forms">Forms</TabsTrigger>
              {!isBackoffice && (
                <TabsTrigger value="submissions">Submissions</TabsTrigger>
              )}
            </TabsList>

            {/* Forms tab */}
            <TabsContent value="forms" className="space-y-6">
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
                                <TableCell colSpan={isBackoffice ? 6 : 5} className="text-center py-8 text-gray-500">
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
                                        {/* QR (icon-only) */}
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
                                            <div className="flex flex-col items-center justify-center p-4">
                                              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                                <QRCodeSVG value={previewUrl} size={220} />
                                              </div>
                                              <p className="text-sm text-gray-500 mt-4 text-center">
                                                Scan to open the grievance form
                                              </p>
                                            </div>
                                          </DialogContent>
                                        </Dialog>
                                        {/* Backoffice extra actions */}
                                        {isBackoffice && (
                                          <>
                                            <Button variant="outline" size="icon" onClick={() => { setEditingForm(form); setShowFormConfig(true); }}>
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="icon" onClick={() => handleDeleteForm(form.id)}>
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </>
                                        )}
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
            </TabsContent>

            {/* Submissions tab (normal view only) */}
            {!isBackoffice && (
              <TabsContent value="submissions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Form Submissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Form:</span>
                        <Select value={selectedForm?.id || ''} onValueChange={(val) => setSelectedForm(forms.find(f => f.id === val) || null)}>
                          <SelectTrigger className="w-80">
                            <SelectValue placeholder={forms.length ? 'Select a form' : 'No forms available'} />
                          </SelectTrigger>
                          <SelectContent>
                            {forms.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input placeholder="Search submissions..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                      </div>
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
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">No submissions</TableCell>
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
                                    <Badge variant={sub.status === 'resolved' ? 'default' : 'secondary'}>{sub.status || 'pending'}</Badge>
                                  </TableCell>
                                  <TableCell>{formatDate(sub.created_at)}</TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="outline" size="icon" onClick={() => setViewSubmission(sub)}>
                                      <Eye className="h-4 w-4" />
                                    </Button>
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
														<Badge variant={viewSubmission.status === 'resolved' ? 'default' : 'secondary'}>{viewSubmission.status || 'pending'}</Badge>
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
																	<ul className="list-disc pl-5 space-y-1">
																		{list.map((f: any, idx: number) => (
																			<li key={idx}>
																				<a href={(f.url || f.publicUrl)} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
																					{f.filename || f.name || `Attachment ${idx + 1}`}
																				</a>
																			</li>
																	))}
																</ul>
																{/* Preview first PDF if available */}
																{(() => {
																	const first = list[0];
																	const url = first && (first.url || first.publicUrl);
																	if (!url) return null;
																	if (url.toLowerCase().endsWith('.pdf')) {
																		return <iframe src={url} className="w-full h-[480px] border rounded" />;
																	}
																	return null;
																})()}
																															</div>
																);
														})()}
													</div>
											</div>
										</DialogContent>
									</Dialog>
								)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
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
