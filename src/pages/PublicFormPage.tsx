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
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at,
        created_by: (data as any).created_by ?? undefined,
      };

      setForm(mapped);

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
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => ({
      ...prev,
      [fieldId]: selectedFiles
    }));
  };

  const uploadFiles = async (submissionId: string) => {
    const attachments: Record<string, any[]> = {};
    const targetPrefix = `${clientIdQS || 'unknown-client'}/${submissionId}`;

    for (const [fieldId, fieldFiles] of Object.entries(files)) {
      if (!fieldFiles || fieldFiles.length === 0) continue;

      const uploadedForField: any[] = [];
      for (const file of fieldFiles) {
        const fileName = `${Date.now()}_${file.name}`;
        const path = `${targetPrefix}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('form-attachments')
          .upload(path, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('form-attachments')
          .getPublicUrl(path);

        uploadedForField.push({
          fieldId,
          filename: file.name,
          url: urlData.publicUrl,
          size: file.size
        });
      }

      if (uploadedForField.length > 0) {
        attachments[fieldId] = uploadedForField;
      }
    }

    return attachments;
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

      // Step 1: Insert submission WITHOUT attachments
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

             const { data: inserted, error: insertError } = await (supabase as any)
         .from('form_submissions')
         .insert([baseSubmission])
         .select('*')
         .single();

      if (insertError || !inserted) {
        throw insertError || new Error('Submission failed');
      }

      // Step 2: Upload files AFTER successful insert, under clientId/submissionId
      let attachments: Record<string, any[]> | null = null;
      const hasFiles = Object.values(files).some(arr => arr && arr.length > 0);
      if (hasFiles) {
        attachments = await uploadFiles(inserted.id);

        // Step 3: Try to update attachments column; if missing, merge into responses
        if (attachments && Object.keys(attachments).length > 0) {
                     const { error: updateError } = await supabase
             .from('form_submissions')
             .update({ attachments: attachments as any })
             .eq('id', inserted.id);

          if (updateError) {
            // Fallback: store attachments inside responses
            const patchedResponses = { ...baseSubmission.responses, attachments };
            const { error: patchError } = await supabase
              .from('form_submissions')
              .update({ responses: patchedResponses })
              .eq('id', inserted.id);

            if (patchError) {
              throw patchError;
            }
          }
        }
      }

      toast.success('Form submitted successfully!');

      // Redirect to forms page after successful submission
      navigate('/forms');

      // Reset form
      setFormData({});
      setFiles({});
      setCaptchaToken(null);
      if (form && (form.fields as FormField[]).some(f => f.type === 'captcha')) {
        // generateCaptcha(); // No longer needed for ALTCHA
      }
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

    // No longer required for ALTCHA
    // if ((form.fields as FormField[]).some(f => f.type === 'captcha')) {
    //   const expectedResult = captchaValue.split('=')[0].trim();
    //   const [num1, , num2] = expectedResult.split(' ');
    //   const expected = parseInt(num1) + parseInt(num2);
    //   if (parseInt(captchaInput) !== expected) {
    //     toast.error('Captcha verification failed');
    //     return false;
    //   }
    // }

    return true;
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.id] || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              maxLength={field.maxLength}
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
              maxLength={field.maxLength}
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
                multiple={field.maxFiles && field.maxFiles > 1}
                accept={field.allowedFileTypes?.join(',')}
                onChange={(e) => handleFileChange(field.id, e)}
                className="hidden"
              />
              <label htmlFor={field.id} className="cursor-pointer">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload files
                    {field.maxFiles && field.maxFiles > 1 && ` (max ${field.maxFiles})`}
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
            <AltchaWidget ref={altchaRef as any} onStateChange={(ev: any) => setCaptchaToken(ev?.detail?.payload || null)} />
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
            <div className="flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-blue-600 mr-2" />
              <CardTitle className="text-2xl">{form.title}</CardTitle>
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
                  disabled={submitting}
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