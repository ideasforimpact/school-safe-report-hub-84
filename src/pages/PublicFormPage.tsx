import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
const sb: any = supabase as any;
import { CustomForm, FormField } from '@/types/formTypes';
import { FileText, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import AltchaWidget from '@/components/captcha/AltchaWidget';

const PublicFormPage = () => {
  const { previewUrl } = useParams() as { previewUrl?: string };
  const navigate = useNavigate();
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const clientIdQS = qs.get('clientId') || undefined;
  const formIdQS = qs.get('formId') || undefined;

  const [form, setForm] = useState<CustomForm | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File[]>>({});
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const altchaRef = useRef<{ value: string | null } | null>(null);

  useEffect(() => {
    const token = formIdQS || previewUrl;
    if (token && token !== 'undefined') {
      fetchForm(token);
    } else {
      setLoading(false);
    }
  }, [previewUrl, formIdQS]);

  const normalizeFields = (rawFields: any): FormField[] => {
    try {
      if (Array.isArray(rawFields)) return rawFields as FormField[];
      if (typeof rawFields === 'string') return JSON.parse(rawFields) as FormField[];
      return (rawFields ?? []) as FormField[];
    } catch {
      return [] as FormField[];
    }
  };

  const fetchForm = async (token: string) => {
    try {
      setLoading(true);

      const trimmed = decodeURIComponent(token);
      const prefixed = trimmed.startsWith('form/') ? trimmed : `form/${trimmed}`;

      let data: any = null;

      if (formIdQS) {
        const byId = await (supabase as any)
          .from('custom_forms')
          .select('*')
          .eq('id', trimmed)
          .eq('is_active', true)
          .maybeSingle();
        if (byId.data && (!clientIdQS || byId.data.client_id === clientIdQS)) {
          data = byId.data;
        }
      }

      if (!data) {
        const viaPreview1 = await (supabase as any)
          .from('custom_forms')
          .select('*')
          .eq('preview_url', prefixed)
          .eq('is_active', true)
          .maybeSingle();
        if (viaPreview1.data && (!clientIdQS || viaPreview1.data.client_id === clientIdQS)) {
          data = viaPreview1.data;
        }
      }

      if (!data) {
        const viaPreview2 = await (supabase as any)
          .from('custom_forms')
          .select('*')
          .eq('preview_url', trimmed)
          .eq('is_active', true)
          .maybeSingle();
        if (viaPreview2.data && (!clientIdQS || viaPreview2.data.client_id === clientIdQS)) {
          data = viaPreview2.data;
        }
      }

      if (!data) {
        toast.error('Form not found for this client or it is inactive');
        return;
      }

      const fields = normalizeFields((data as any).fields);
      const mapped: CustomForm = {
        id: (data as any).id,
        client_id: (data as any).client_id,
        title: (data as any).title,
        description: (data as any).description,
        fields,
        is_active: (data as any).is_active ?? true,
        preview_url: (data as any).preview_url ?? '',
        client_logo: (data as any).client_logo ?? undefined,
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at,
        created_by: (data as any).created_by ?? undefined,
      };

      setForm(mapped);
      setClientLogoUrl(mapped.client_logo || null);

      // Fallback: fetch client name/logo if not present on form
      if (!mapped.client_logo || !clientName) {
        const { data: clientRow } = await supabase
          .from('clients')
          .select('name, logo')
          .eq('id', mapped.client_id)
          .maybeSingle();
        if (clientRow) {
          setClientName((clientRow as any).name || null);
          if (!mapped.client_logo) setClientLogoUrl((clientRow as any).logo || null);
        }
      }

      const initialData: Record<string, any> = {};
      fields.forEach((field: FormField) => {
        initialData[field.id] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Error loading form:', error);
      toast.error('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // No extra init needed for ALTCHA
  }, [form]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleFileChange = (fieldId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const newlySelected = Array.from(event.target.files || []);
    setFiles(prev => {
      const existing = prev[fieldId] || [];
      const merged = [...existing, ...newlySelected].slice(0, 5);
      if (existing.length + newlySelected.length > 5) {
        toast.error('You can upload a maximum of 5 files. Extra files were ignored.');
      }
      return {
        ...prev,
        [fieldId]: merged
      };
    });
    // Reset input value so the same file can be re-selected if needed
    if (event.target) {
      event.target.value = '';
    }
  };

  const uploadFiles = async (submissionId: string) => {
    // Deprecated in favor of server-side upload via Edge Function
    const attachments: Record<string, any[]> = {};
    return attachments;
  };

  // Helper: read a File as base64 data URL
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Require ALTCHA if captcha field exists
    const solved = altchaRef.current?.value || captchaToken;
    if ((form!.fields as FormField[]).some(f => f.type === 'captcha') && !solved) {
      toast.error('Please complete the CAPTCHA');
      return;
    }

    try {
      setSubmitting(true);

      // Build base submission payload
      const baseSubmission = {
        form_id: form!.id,
        client_id: form!.client_id,
        submitter_name: formData.name || null,
        submitter_email: formData.contact || null,
        submitter_phone: formData.contact || null,
        submitter_type: formData.submitter_type || null,
        responses: formData,
        status: 'pending'
      };

      // Build files payload: { [fieldId]: [{ filename, size, contentType, base64Data }] }
      const filesPayload: Record<string, Array<{ filename: string; size: number; contentType: string; base64Data: string }>> = {};
      for (const [fieldId, fieldFiles] of Object.entries(files)) {
        if (!fieldFiles || fieldFiles.length === 0) continue;
        const capped = fieldFiles.slice(0, 5);
        const encoded = await Promise.all(
          capped.map(async (f) => ({
            filename: f.name,
            size: f.size,
            contentType: f.type || 'application/octet-stream',
            base64Data: await readFileAsBase64(f),
          }))
        );
        filesPayload[fieldId] = encoded;
      }

      // Single call to Edge Function: create submission and upload attachments server-side
      const { data: fnData, error: fnError } = await (supabase as any).functions.invoke('submit-form', {
        body: { formData: baseSubmission, files: filesPayload },
      });

      if (fnError || !fnData?.data) {
        throw new Error(fnError?.message || 'Failed to submit form');
      }

      toast.success('Form submitted successfully!');

      const inserted = fnData.data;
      // Redirect to success page after successful submission
      const successUrl = `/public-form-submission-success?formTitle=${encodeURIComponent(form!.title)}&submissionId=${inserted.id}&formId=${encodeURIComponent(form!.id)}&clientId=${encodeURIComponent(form!.client_id)}`;
      navigate(successUrl);

      // Reset form
      setFormData({});
      setFiles({});
      setCaptchaToken(null);
    } catch (error: any) {
      console.error('Error submitting form:', error);
      const msg = error?.message || 'Failed to submit form. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const validateForm = () => {
    if (!form) return false;

    for (const field of (form.fields as FormField[])) {
      if (field.required) {
        if (field.type === 'file') {
          if (!files[field.id] || files[field.id].length === 0) {
            toast.error(`${field.label} is required`);
            return false;
          }
        } else if (field.type === 'captcha') {
          // No longer required for ALTCHA
        } else {
          if (!formData[field.id] || formData[field.id].toString().trim() === '') {
            toast.error(`${field.label} is required`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              placeholder={field.placeholder || 'Your phone number'}
              value={formData[field.id] || ''}
              onKeyDown={(e) => {
                const allowed = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'];
                if (allowed.includes(e.key)) return;
                if (!/^[0-9]$/.test(e.key) || String(formData[field.id] || '').length >= 10) {
                  e.preventDefault();
                }
              }}
              onBeforeInput={(e: any) => {
                const data = e?.nativeEvent?.data as string | null;
                if (data && !/^\d$/.test(data)) {
                  e.preventDefault();
                }
                const target = e.currentTarget as HTMLInputElement;
                if (target?.value?.length >= 10) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
                const text = (e.clipboardData || (window as any).clipboardData).getData('text');
                if (!/^\d+$/.test(text)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                if (e.target.value !== onlyDigits) {
                  (e.target as HTMLInputElement).value = onlyDigits;
                }
                handleInputChange(field.id, onlyDigits);
              }}
              required={field.required}
            />
          </div>
        );

      case 'email':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={field.placeholder || 'Your email address'}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              maxLength={25}
              required={field.required}
            />
          </div>
        );

      case 'text':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              maxLength={(() => {
                const labelLc = (field.label || '').toLowerCase();
                const isName = ['name', 'your full name', 'full name', 'your name'].includes(labelLc);
                const isTitle = labelLc.includes('subject') || labelLc.includes('title');
                return isName ? 15 : (isTitle ? 25 : field.maxLength);
              })()}
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              maxLength={(() => {
                const labelLc = (field.label || '').toLowerCase();
                const isDescription = labelLc.includes('description');
                return isDescription ? 100 : field.maxLength;
              })()}
              required={field.required}
              rows={4}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={formData[field.id] || ''}
              onValueChange={(value) => handleInputChange(field.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                id={field.id}
                type="file"
                multiple
                accept={field.allowedFileTypes?.join(',')}
                onChange={(e) => handleFileChange(field.id, e)}
                className="hidden"
              />
              <label htmlFor={field.id} className="cursor-pointer">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload files (max 5)
                  </p>
                  {files[field.id] && files[field.id].length > 0 && (
                    <div className="mt-2">
                      {files[field.id].map((file, index) => (
                        <Badge key={index} variant="secondary" className="mr-1">
                          {file.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        );

      case 'captcha':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {/* ALTCHA widget replaces math captcha */}
            <AltchaWidget ref={altchaRef as any} onStateChange={(ev) => setCaptchaToken((ev as any)?.detail?.payload || null)} />
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Form Not Found</h3>
          <p className="text-gray-500">The form you're looking for doesn't exist or is inactive.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex flex-col items-center justify-center mb-4">
              {clientLogoUrl ? (
                <div className="h-16 w-16 rounded-full bg-white p-2 shadow ring-1 ring-gray-200 flex items-center justify-center overflow-hidden mb-2">
                  <img src={clientLogoUrl} alt={clientName || 'Client logo'} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <FileText className="h-8 w-8 text-blue-600 mb-2" />)
              }
              {clientName && (
                <div className="text-sm text-gray-500">{clientName}</div>
              )}
              <div className="flex items-center justify-center mt-1">
                <CardTitle className="text-2xl">{form.title}</CardTitle>
              </div>
            </div>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {(form.fields as FormField[]).map(renderField)}
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitting || (((form!.fields as FormField[]) || []).some((f: FormField) => f.type === 'captcha') && !captchaToken)}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Grievance
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicFormPage; 