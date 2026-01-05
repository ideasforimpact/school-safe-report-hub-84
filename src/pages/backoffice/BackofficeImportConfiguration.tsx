import { useEffect, useMemo, useState } from 'react';
import BackofficeLayout from '@/components/layout/BackofficeLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
// Import template JSONs to send to edge function
import categoriesTemplateJson from '@/templates/categories/category-template.json';
import contributingFactorsTemplateJson from '@/templates/categories/contributing-factors-template.json';
import reportTypesTemplateJson from '@/templates/categories/report-types-template.json';
import prioritiesTemplateJson from '@/templates/categories/priorities-template.json';
import formTemplateJson from '@/templates/forms/form-template.json';
import assessmentTemplatesJson from '@/templates/assessment/assessment_templates.json';
import eduResourcesJson from '@/templates/edu_resources/edu_resource.json';
import Layout from '@/components/layout/Layout';


interface ClientRow { id: string; name: string }
interface ImportLog { id: string; client_id: string; response_status: string; response_code: number; created_at: string }

const BackofficeImportConfiguration = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const processedClientIds = useMemo(() => new Set(logs.map(l => l.client_id)), [logs]);
  const selectableClients = useMemo(() => clients.filter(c => !processedClientIds.has(c.id)), [clients, processedClientIds]);

  const fetchClientsAndLogs = async () => {
    const [{ data: clientData }, { data: logData }] = await Promise.all([
      supabase.from('clients').select('id,name').order('name'),
      supabase.from('configuration_import_logs').select('id,client_id,response_status,response_code,created_at').order('created_at', { ascending: false })
    ]);
    setClients(clientData || []);
    setLogs(logData || []);
  };

  useEffect(() => { fetchClientsAndLogs(); }, []);

  const triggerImport = async () => {
    if (!selectedClient) { toast.error('Select a client'); return; }
    setLoading(true);
    try {
      const categories = (categoriesTemplateJson as any)?.categories;
      const contributing_factors = (contributingFactorsTemplateJson as any)?.contributing_factors;
      const report_types = (reportTypesTemplateJson as any)?.report_types;
      const priorities = (prioritiesTemplateJson as any)?.priorities;
      const forms = [formTemplateJson]; // Wrap single form template in array
      const assessment_templates = assessmentTemplatesJson; // Assessment templates array
      const edu_resources = eduResourcesJson; // Edu resources array

      // Frontend validation before invoking
      const missing: string[] = [];
      if (!Array.isArray(categories) || categories.length === 0) missing.push('categories');
      if (!Array.isArray(contributing_factors) || contributing_factors.length === 0) missing.push('contributing_factors');
      if (!Array.isArray(report_types) || report_types.length === 0) missing.push('report_types');
      if (!Array.isArray(priorities) || priorities.length === 0) missing.push('priorities');
      if (!Array.isArray(forms) || forms.length === 0) missing.push('forms');
      if (!Array.isArray(assessment_templates) || assessment_templates.length === 0) missing.push('assessment_templates');
      if (!Array.isArray(edu_resources) || edu_resources.length === 0) missing.push('edu_resources');
      if (missing.length > 0) {
        toast.error(`Missing template(s): ${missing.join(', ')}`);
        setLoading(false);
        return;
      }

      const payload = { client_id: selectedClient, categories, contributing_factors, report_types, priorities, forms, assessment_templates, edu_resources };

      console.log('Sending payload with forms, assessments, and edu resources:', { 
        client_id: selectedClient, 
        formsCount: forms.length,
        forms: forms.map(f => ({ title: f.title, fieldsCount: f.fields?.length || 0 })),
        assessmentTemplatesCount: assessment_templates.length,
        assessmentTemplates: assessment_templates.map(a => ({ title: a.title, questionsCount: a.questions?.length || 0 })),
        eduResourcesCount: edu_resources.length
      });

      const { data, error } = await supabase.functions.invoke('import-configuration', {
        body: payload
      });
      if (error) throw error;
      if (data?.status === 'failed') {
        toast.error('Import completed with errors');
      } else {
        toast.success('Import completed');
      }
      await fetchClientsAndLogs();
      setSelectedClient('');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 p-[50px]">
        <Card>
          <CardHeader>
            <CardTitle>Import Default Configuration</CardTitle>
            <CardDescription>Select a client and trigger the import-configuration function. Clients already processed are hidden.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <div className="w-80">
              <label className="block text-sm font-medium mb-2">Active Client</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger><SelectValue placeholder={selectableClients.length ? 'Select client' : 'All clients processed'} /></SelectTrigger>
                <SelectContent>
                  {selectableClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={triggerImport} disabled={!selectedClient || loading}>{loading ? 'Processing…' : 'Trigger Import'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Import Status</CardTitle>
            <CardDescription>Latest runs from configuration_import_logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Client</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Code</th>
                    <th className="py-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => {
                    const client = clients.find(c => c.id === l.client_id);
                    return (
                      <tr key={l.id} className="border-t">
                        <td className="py-2">{client?.name || l.client_id}</td>
                        <td className="py-2 capitalize">{l.response_status}</td>
                        <td className="py-2">{l.response_code}</td>
                        <td className="py-2">{new Date(l.created_at).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr><td className="py-6 text-gray-500" colSpan={4}>No imports yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BackofficeImportConfiguration;


