import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { UploadCloud } from 'lucide-react';
import Layout from '@/components/layout/Layout';

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
    setClients((clientData as any[] || []) as ClientRow[]);
    setLogs(logData || []);
  };

  useEffect(() => { fetchClientsAndLogs(); }, []);

  const triggerImport = async (clientId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-configuration', {
        body: { client_id: clientId },
      });
      if (error) throw error;
      if (data?.status === 'failed') {
        toast.error('Import completed with errors');
      } else {
        toast.success('Import completed — all 3 client types imported');
      }
      await fetchClientsAndLogs();
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


