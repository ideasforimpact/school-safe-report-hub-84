import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plug, Eye, Link as LinkIcon, Loader2 } from 'lucide-react';
import { fetchClientNames } from '@/services/client/clientService';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getSchoolsList, saveClientIntegration } from '@/services/integrationService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts';

interface Client {
  id: string;
  name: string;
}

interface IntegrationClient {
  id: string;
  name: string;
  linkedClientName: string | null;
  linkedStatus: boolean | null;
  targetClientId?: string | null;
  hasIntegration: boolean;
}

const IntegrationPage = () => {
  const [clients, setClients] = useState<IntegrationClient[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [schools, setSchools] = useState<Client[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewClient, setViewClient] = useState<IntegrationClient | null>(null);


  useEffect(() => {
    fetchClients();
  }, []);
  useEffect(() => {
    if (!isLinkDialogOpen) {
      setIsLinked(false);
    }
  }, [isLinkDialogOpen]);
  const fetchClients = async () => {
    try {
      setLoading(true);

      const clientNames = await fetchClientNames();

      const integrationClients: IntegrationClient[] = clientNames.map(client => {
        const integration = client.client_integration?.[0]; 

        return {
          id: client.id,
          name: client.name,
          linkedClientName: integration?.target_client_name ?? null,
          linkedStatus: integration?.is_linked ?? null,
          targetClientId: integration?.target_client_id ?? null,
          hasIntegration: !!integration,
        };
      });

      setClients(integrationClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };
  const resetDialogState = () => {
    setIsLinkDialogOpen(false);
    setSelectedClientId(null);
    setSelectedSchoolId(null);
    setIsLinked(false);
  };


  const handleView = (client: IntegrationClient) => {
    setViewClient(client);
    setIsViewDialogOpen(true);
  };

  useEffect(() => {
    if (!isLinkDialogOpen || !selectedClientId) return;

    const fetchSchools = async () => {
      try {
        setSchoolsLoading(true);
        const response = await getSchoolsList();

        const schoolsData = response.data || [];
        setSchools(schoolsData);

        // 🔑 IMPORTANT: set selected value AFTER schools are set
        const integration = clients.find(c => c.id === selectedClientId);

        if (integration?.targetClientId) {
          const exists = schoolsData.some(
            s => s.id === integration.targetClientId
          );

          if (exists) {
            setSelectedSchoolId(integration.targetClientId);
          }
        }
      } catch (error) {
        toast.error('Failed to load schools');
      } finally {
        setSchoolsLoading(false);
      }
    };

    fetchSchools();
  }, [isLinkDialogOpen, selectedClientId]);



  const handleLink = async (clientId: string, schoolId: string) => {
    try {
      setLinking(true);

      const selectedSchool = schools.find(s => s.id === schoolId);

      if (!selectedSchool) {
        toast.error('Invalid school selected');
        return;
      }

      await saveClientIntegration({
        clientId,
        targetClientId: schoolId,
        targetClientName: selectedSchool.name,
        isLinked,
        updatedBy: user?.id!,
      });

      toast.success(
        isLinked ? 'Client linked successfully' : 'Client unlinked successfully'
      );

      await fetchClients();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save integration');
    } finally {
      setLinking(false);
    }
  };

  const openLinkDialog = async (client: IntegrationClient) => {
    try {
      setDialogLoading(true);
      setSelectedClientId(client.id);
      setIsLinked(client.linkedStatus ?? false);

      const response = await getSchoolsList();
      const schoolsData = response.data || [];
      setSchools(schoolsData);

      if (client.targetClientId) {
        const exists = schoolsData.some(
          s => s.id === client.targetClientId
        );
        if (exists) {
          setSelectedSchoolId(client.targetClientId);
        }
      } else {
        setSelectedSchoolId(null);
      }

      setIsLinkDialogOpen(true);
    } catch (e) {
      toast.error('Failed to load integration data');
    } finally {
      setDialogLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 p-[50px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Plug className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Integration</h1>
              <p className="text-gray-500 mt-1">Manage client integrations and connections</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Client Integrations</CardTitle>
                <CardDescription>
                  View and manage client integration connections
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="mt-4 text-gray-500">Loading clients...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <Plug className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Clients Found
                </h3>
                <p className="text-gray-500">
                  No clients are currently available in the system
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Linked Client Name</TableHead>
                    <TableHead>Linked Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.linkedClientName || '-'}</TableCell>
                      <TableCell>
                        {!client.hasIntegration ? (
                          <Badge variant="secondary">
                            Not Linked
                          </Badge>
                        ) : client.linkedStatus ? (
                          <Badge className="bg-green-600 text-white">
                            Linked
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Unlinked
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(client)}
                            title="View client"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openLinkDialog(client)}
                            title="Link client"
                          >
                            <LinkIcon
                              className={`h-4 w-4 ${!client.hasIntegration
                                ? 'text-gray-400'
                                : client.linkedStatus
                                  ? 'text-green-600'
                                  : 'text-red-500'
                                }`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      {dialogLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading integration details…</span>
          </div>
        </div>
      )}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Client</DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* School dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Please select the school
              </label>

              <Select
                key={selectedClientId}
                value={selectedSchoolId ?? undefined}
                onValueChange={setSelectedSchoolId}
                disabled={schoolsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      schoolsLoading ? 'Loading schools...' : 'Select a school'
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Linked
              </label>
              <Switch checked={isLinked} onCheckedChange={setIsLinked} />
            </div>
          </div>


          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetDialogState}
              disabled={linking}
            >
              Cancel
            </Button>

            <Button
              onClick={async () => {
                if (!selectedClientId || !selectedSchoolId) return;

                await handleLink(selectedClientId, selectedSchoolId /* , isLinked */);

                setIsLinkDialogOpen(false);
                setSelectedClientId(null);
                setSelectedSchoolId(null);
                setIsLinked(false);
              }}
              disabled={linking || schoolsLoading || !selectedSchoolId}
            >
              {(linking || schoolsLoading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Integration Details</DialogTitle>
          </DialogHeader>

          {viewClient && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-sm text-gray-500">Client Name</p>
                <p className="font-medium">{viewClient.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Linked Client Name</p>
                <p className="font-medium">
                  {viewClient.linkedClientName ?? '-'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Linked Status</p>
                {!viewClient.hasIntegration ? (
                  <Badge variant="secondary">Not Linked</Badge>
                ) : viewClient.linkedStatus ? (
                  <Badge className="bg-green-600 text-white">Linked</Badge>
                ) : (
                  <Badge variant="destructive">Unlinked</Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </Layout>
  );
};

export default IntegrationPage;

