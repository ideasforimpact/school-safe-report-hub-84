import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Info, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ProviderItem = Record<string, { success: number; failed: number }>;

type ApiDocTypePayload = {
  total_calls: number;
  success_count: number;
  failed_count: number;
  provider: ProviderItem[];
};

type DocRow = {
  documentTypeKey: string;
  total_calls: number;
  success_count: number;
  failed_count: number;
  provider: ProviderItem[];
};

type ParentGroup = {
  key: 'emp_verify' | 'veh_track';
  label: 'EMP-VERIFY' | 'VEH-TRACK';
  description: string;
  rows: DocRow[];
  total_calls: number;
  success_count: number;
  failed_count: number;
};

type EdgeResponse = {
  success: boolean;
  data?: {
    client_id: string;
    employee_verification_api_calls: Array<Record<string, ApiDocTypePayload>>;
    vehicle_verification_api_calls?: Array<Record<string, ApiDocTypePayload>>;
    summary: {
      total_calls: number;
      success_count: number;
      failed_count: number;
    };
  };
  error?: string;
};

const formatTitle = (value: string) => {
  if (value === 'rc_calls') return 'Vehicle RC Verification';
  if (value === 'challan_calls') return 'Challan Verification';
  return (
    value
      .replace(/_verification$/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()) + ' Verification'
  );
};

const formatProviderLabel = (value: string) =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

const getProviderBadgeClassName = (providerName: string, index: number) => {
  const normalized = providerName.toLowerCase();
  if (normalized.includes('quick')) {
    return 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100';
  }
  if (normalized.includes('sure')) {
    return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
  }
  return index % 2 === 0
    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100'
    : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100';
};

const EMP_VERIFY_DOC_ORDER = [
  'aadhar_verification',
  'driving_license_verification',
  'voter_id_verification',
  'passport_verification',
];

const VEH_CALL_ORDER = ['rc_calls', 'challan_calls'];

const getProviderBreakdown = (providerItems: ProviderItem[]) => {
  const providerCounts = providerItems
    .map((providerItem) => {
      const [providerName, count] = Object.entries(providerItem)[0] || [];
      if (!providerName || !count) return null;
      return {
        providerName,
        success: Number(count.success || 0),
        failed: Number(count.failed || 0),
        total: Number(count.success || 0) + Number(count.failed || 0),
      };
    })
    .filter(Boolean) as Array<{ providerName: string; success: number; failed: number; total: number }>;

  return providerCounts;
};

const ClientApiCallsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const clientName = (location.state as { clientName?: string } | null)?.clientName || 'Client';

  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<EdgeResponse['data'] | null>(null);
  const [expandedParentRows, setExpandedParentRows] = useState<Record<ParentGroup['key'], boolean>>({
    emp_verify: true,
    veh_track: false,
  });

  useEffect(() => {
    if (!clientId) return;
    const loadApiCalls = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke<EdgeResponse>('client-api-calls', {
          body: {
            action: 'get-client-api-calls',
            clientId,
          },
        });

        if (error) throw error;
        if (!data?.success) {
          throw new Error(data?.error || 'Failed to fetch API calls');
        }
        setPayload(data.data || null);
      } catch (err: any) {
        console.error('Error loading client API calls:', err);
        toast.error(err?.message || 'Failed to fetch API calls');
      } finally {
        setLoading(false);
      }
    };

    loadApiCalls();
  }, [clientId]);

  const groupedRows = useMemo<ParentGroup[]>(() => {
    const empGrouped = payload?.employee_verification_api_calls?.[0] || {};
    const vehGrouped = payload?.vehicle_verification_api_calls?.[0] || {};

    const empRows: DocRow[] = Object.entries(empGrouped).map(([documentTypeKey, data]) => ({
      documentTypeKey,
      ...(data as ApiDocTypePayload),
    }));

    const vehRows: DocRow[] = Object.entries(vehGrouped).map(([documentTypeKey, data]) => ({
      documentTypeKey,
      ...(data as ApiDocTypePayload),
    }));

    const emptyGroup = (key: ParentGroup['key']): ParentGroup => ({
      key,
      label: key === 'emp_verify' ? 'EMP-VERIFY' : 'VEH-TRACK',
      description: key === 'emp_verify' ? 'Employee Verification' : 'Vehicle Verification & Tracking',
      rows: [],
      total_calls: 0,
      success_count: 0,
      failed_count: 0,
    });

    const groupedMap: Record<ParentGroup['key'], ParentGroup> = {
      emp_verify: emptyGroup('emp_verify'),
      veh_track: emptyGroup('veh_track'),
    };

    empRows.forEach((row) => {
      const group = groupedMap.emp_verify;
      group.rows.push(row);
      group.total_calls += row.total_calls;
      group.success_count += row.success_count;
      group.failed_count += row.failed_count;
    });

    vehRows.forEach((row) => {
      const group = groupedMap.veh_track;
      group.rows.push(row);
      group.total_calls += row.total_calls;
      group.success_count += row.success_count;
      group.failed_count += row.failed_count;
    });

    groupedMap.emp_verify.rows.sort((a, b) => {
      const ai = EMP_VERIFY_DOC_ORDER.indexOf(a.documentTypeKey);
      const bi = EMP_VERIFY_DOC_ORDER.indexOf(b.documentTypeKey);
      const safeAi = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const safeBi = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      return safeAi - safeBi;
    });

    groupedMap.veh_track.rows.sort((a, b) => {
      const ai = VEH_CALL_ORDER.indexOf(a.documentTypeKey);
      const bi = VEH_CALL_ORDER.indexOf(b.documentTypeKey);
      const safeAi = ai === -1 ? Number.MAX_SAFE_INTEGER : ai;
      const safeBi = bi === -1 ? Number.MAX_SAFE_INTEGER : bi;
      return safeAi - safeBi;
    });

    return [groupedMap.emp_verify, groupedMap.veh_track].filter((group) => group.rows.length > 0);
  }, [payload]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">API Usage - {clientName}</h1>
            <p className="text-sm text-muted-foreground">Client ID: {clientId}</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/backoffice/clients')}>
            Back to Clients
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Loading API usage...</span>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{payload?.summary.total_calls ?? 0}</div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700">Successful</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-green-700">{payload?.summary.success_count ?? 0}</div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-700">Failed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold text-red-700">{payload?.summary.failed_count ?? 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12" />
                      <TableHead>Code Word / Description</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Total Calls</TableHead>
                      <TableHead>Successful</TableHead>
                      <TableHead>Failed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No API calls found for this client.
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedRows.map((group) => {
                        const isExpanded = Boolean(expandedParentRows[group.key]);
                        return (
                          <React.Fragment key={group.key}>
                            <TableRow className="bg-muted/30">
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setExpandedParentRows((prev) => ({
                                      ...prev,
                                      [group.key]: !prev[group.key],
                                    }))}
                                >
                                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                </Button>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{group.label}</Badge>
                                  <span className="font-medium">{group.description}</span>
                                </div>
                              </TableCell>
                              <TableCell>Multiple</TableCell>
                              <TableCell className="font-semibold">{group.total_calls}</TableCell>
                              <TableCell className="text-green-700">{group.success_count}</TableCell>
                              <TableCell className="text-red-700">{group.failed_count}</TableCell>
                            </TableRow>

                            {isExpanded && (
                              group.rows.map((row) => {
                                const providerCounts = getProviderBreakdown(row.provider);
                                const providerNames = providerCounts.map((item) => item.providerName);
                                const isMultiple = providerNames.length > 1;
                                const primaryProvider = providerNames[0];
                                const providerSummaryText = providerCounts
                                  .map((item) => `${item.providerName}: ${item.total}`)
                                  .join(' , ');
                                const successSummaryText = providerCounts
                                  .map((item) => `${item.providerName}: ${item.success}`)
                                  .join(' , ');
                                const failedSummaryText = providerCounts
                                  .map((item) => `${item.providerName}: ${item.failed}`)
                                  .join(' , ');

                                return (
                                  <TableRow key={`${group.key}-${row.documentTypeKey}`}>
                                    <TableCell />
                                    <TableCell className="pl-10 text-muted-foreground">
                                      {'\u2192'} {formatTitle(row.documentTypeKey)}
                                    </TableCell>
                                    <TableCell>
                                      {providerNames.length === 0 ? (
                                        '-'
                                      ) : (
                                        <div className="flex flex-wrap gap-1">
                                          {providerNames.map((providerName, index) => (
                                            <Badge
                                              key={`${row.documentTypeKey}-${providerName}`}
                                              variant="outline"
                                              className={getProviderBadgeClassName(providerName, index)}
                                            >
                                              {formatProviderLabel(providerName)}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <span>{row.total_calls}</span>
                                        {isMultiple && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">{providerSummaryText}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-green-700">
                                      <div className="flex items-center gap-1">
                                        <span>{row.success_count}</span>
                                        {isMultiple && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">{successSummaryText}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-red-700">
                                      <div className="flex items-center gap-1">
                                        <span>{row.failed_count}</span>
                                        {isMultiple && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p className="text-xs">{failedSummaryText}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ClientApiCallsPage;

