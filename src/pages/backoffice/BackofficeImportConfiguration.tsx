import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { runImportConfiguration } from '@/services/backoffice/importConfigurationService';

interface ClientType { id: string; key: string; name: string }
interface ClientRow { id: string; name: string; client_type: ClientType | null }
interface ImportLog { id: string; client_id: string; response_status: string; response_code: number; created_at: string }

const BackofficeImportConfiguration = () => {
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState(false);

  const processedClientIds = useMemo(() => new Set(logs.map(l => l.client_id)), [logs]);

  const fetchClientsAndLogs = async () => {
    const [{ data: clientData }, { data: logData }] = await Promise.all([
      supabase.from('clients').select('id,name,client_type:client_type_id(id,key,name)').order('name'),
      supabase.from('configuration_import_logs').select('id,client_id,response_status,response_code,created_at').order('created_at', { ascending: false }),
    ]);
    setClients((clientData as unknown as ClientRow[]) || []);
    setLogs(logData || []);
  };

  useEffect(() => { fetchClientsAndLogs(); }, []);

  const triggerImport = async (clientId: string) => {
    setLoading(true);
    try {
      const categories = (categoriesTemplateJson as Record<string, unknown>)?.categories;
      const contributing_factors = (contributingFactorsTemplateJson as Record<string, unknown>)?.contributing_factors;
      const report_types = (reportTypesTemplateJson as Record<string, unknown>)?.report_types;
      const priorities = (prioritiesTemplateJson as Record<string, unknown>)?.priorities;
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
      const payload = {
        client_id: clientId,
        categories,
        contributing_factors,
        report_types,
        priorities,
        forms,
        assessment_templates,
        edu_resources
      };
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
        toast.success('Import completed — all 3 client types imported');
      }
      await fetchClientsAndLogs();
      setSelectedClient('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 p-[50px]">
        <Card>
          <CardHeader>
            <CardTitle>Client Import Status</CardTitle>
            <CardDescription>
              Triggers a one-time import of all configuration data (school, work &amp; institute types) for a client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">Client</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Code</th>
                    <th className="py-2">Timestamp</th>
                    <th className="py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => {
                    const log = logs.find(l => l.client_id === client.id);
                    const isNewClient = !processedClientIds.has(client.id);

                    return (
                      <tr key={client.id} className="border-t">
                        <td className="py-2">{client.name}</td>
                        <td className="py-2">
                          <span className="inline-block capitalize rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                            {client.client_type?.name || '—'}
                          </span>
                        </td>
                        <td className="py-2 capitalize">
                          {log?.response_status || 'Pending'}
                        </td>
                        <td className="py-2">
                          {log?.response_code ?? '-'}
                        </td>
                        <td className="py-2">
                          {log ? new Date(log.created_at).toLocaleString() : '-'}
                        </td>
                        <td className="py-2 text-center">
                          {isNewClient && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Trigger Import (all 3 types)"
                              onClick={() => triggerImport(client.id)}
                              disabled={loading}
                              className="text-primary hover:text-primary/80"
                            >
                              <UploadCloud className="h-5 w-5" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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


