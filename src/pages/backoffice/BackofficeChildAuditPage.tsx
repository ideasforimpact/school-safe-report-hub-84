import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ChevronDown, Loader2, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import Loader from '@/components/common/Loader';
import { toast } from 'sonner';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type BackofficeCheckTypeRow = {
  id: string;
  type: string;
  key: string;
  alt_definition: Array<{ type: string; table: string; condition: string; item_group: string }>;
  active: boolean;
};

type BackofficeLookupRow = {
  id: string;
  item_group: string;
  type: string;
  label: string;
  active: boolean;
};

type ClientOption = { id: string; name: string };

type SyncResult = {
  client_id: string;
  client_name: string;
  status: 'success' | 'error';
  message: string;
  check_types_inserted?: number;
  lookups_inserted?: number;
};

const ITEM_GROUP_TITLE: Record<string, string> = {
  physical_condition: 'Physical Condition',
  incidents_at_home: 'Incidents at Home',
  sleep_quality_home: 'Sleep Quality (Home)',
  morning_behaviour_home: 'Morning Behaviour at Home',
  health_medical: 'Health / Medical',
  behaviour_mood: 'Behaviour / Mood',
  meltdown: 'Meltdown',
  aggression: 'Aggression',
  school_incidents: 'School Incidents',
  hostel_incidents: 'Hostel Incidents',
  sleep_hostel: 'Sleep (Hostel)',
  night_behaviour: 'Night Behaviour',
  daily_living: 'Daily Living',
  safety_observations: 'Safety Observations',
};

const ITEM_GROUP_ICON: Record<string, string> = {
  aggression: '⚡',
  meltdown: '🔥',
  hostel_incidents: '🏠',
  school_incidents: '🏫',
  health_medical: '💊',
  physical_condition: '🩹',
  safety_observations: '🛡️',
};

const toTitle = (group: string) => ITEM_GROUP_TITLE[group] ?? group;
const toIcon = (group: string) => ITEM_GROUP_ICON[group] ?? '📋';

type SelectableRowsProps = {
  items: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (id: string) => void;
};

const SelectableRows: React.FC<SelectableRowsProps> = ({ items, selected, onToggle }) => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    {items.map((item) => {
      const isSelected = selected.includes(item.id);
      return (
        <button
          type="button"
          key={item.id}
          onClick={() => onToggle(item.id)}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
            isSelected
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-slate-200 bg-slate-50 hover:border-slate-300',
          )}
        >
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border',
              isSelected ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300',
            )}
          >
            {isSelected ? <Check className="h-3 w-3" /> : null}
          </span>
          <span className="text-sm font-medium text-slate-700">{item.label}</span>
        </button>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// SyncClientsPanel: multi-select dropdown of clients missing the Child Audit
// template, plus a Sync button that processes them sequentially via the
// `sync-child-audit-template` Edge Function. Progress is surfaced through a
// single sticky toast and an on-page result list.
// ---------------------------------------------------------------------------
type SyncClientsPanelProps = {
  unseededClients: ClientOption[];
  clientsLoading: boolean;
  refreshUnseeded: () => Promise<void>;
};

const SyncClientsPanel: React.FC<SyncClientsPanelProps> = ({
  unseededClients,
  clientsLoading,
  refreshUnseeded,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [results, setResults] = useState<SyncResult[]>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unseededClients;
    return unseededClients.filter((c) => c.name.toLowerCase().includes(q));
  }, [unseededClients, search]);

  const toggleId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const clearSelection = () => setSelectedIds([]);

  const selectedClients = useMemo(
    () => unseededClients.filter((c) => selectedIds.includes(c.id)),
    [unseededClients, selectedIds],
  );

  // Sequential queue: process one client at a time, update toast + results.
  const handleSync = useCallback(async () => {
    if (selectedIds.length === 0 || isSyncing) return;

    const queue = [...selectedIds];
    const total = queue.length;
    setIsSyncing(true);
    setProgress({ done: 0, total });
    setResults([]);

    const toastId = toast.loading(`Syncing 0 / ${total} clients...`);
    const collected: SyncResult[] = [];

    for (let i = 0; i < queue.length; i++) {
      const clientId = queue[i];
      const fallbackName =
        unseededClients.find((c) => c.id === clientId)?.name ?? clientId.slice(0, 8);

      try {
        const { data, error } = await supabase.functions.invoke('sync-child-audit-template', {
          body: { client_id: clientId },
        });

        if (error) {
          // Network / non-2xx wrapped by supabase-js
          collected.push({
            client_id: clientId,
            client_name: fallbackName,
            status: 'error',
            message: error.message || 'Edge function call failed',
          });
        } else if (data && data.success) {
          collected.push({
            client_id: clientId,
            client_name: data.client_name ?? fallbackName,
            status: 'success',
            message: `Inserted ${data.check_types_inserted ?? 0} check types + ${data.lookups_inserted ?? 0} lookups`,
            check_types_inserted: data.check_types_inserted,
            lookups_inserted: data.lookups_inserted,
          });
        } else {
          collected.push({
            client_id: clientId,
            client_name: data?.client_name ?? fallbackName,
            status: 'error',
            message: data?.error ?? 'Unknown error',
          });
        }
      } catch (err) {
        collected.push({
          client_id: clientId,
          client_name: fallbackName,
          status: 'error',
          message: (err as Error)?.message ?? 'Unexpected error',
        });
      }

      setProgress({ done: i + 1, total });
      setResults([...collected]);
      toast.loading(`Synced ${i + 1} / ${total} clients...`, { id: toastId });
    }

    const successes = collected.filter((r) => r.status === 'success').length;
    const failures = collected.filter((r) => r.status === 'error').length;

    if (failures === 0) {
      toast.success(`Synced ${successes} / ${total} client${total === 1 ? '' : 's'} successfully`, {
        id: toastId,
      });
    } else if (successes === 0) {
      toast.error(`All ${total} client${total === 1 ? '' : 's'} failed to sync`, { id: toastId });
    } else {
      toast.warning(`Synced ${successes} / ${total} — ${failures} failed`, { id: toastId });
    }

    setIsSyncing(false);
    setProgress(null);
    setSelectedIds([]);
    // Refresh the unseeded-clients list so synced ones drop off the dropdown
    await refreshUnseeded();
  }, [selectedIds, isSyncing, unseededClients, refreshUnseeded]);

  return (
    <div className="mt-4 mb-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Sync Clients</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={isSyncing || clientsLoading || unseededClients.length === 0}
                className={cn(
                  'flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-60',
                )}
              >
                <span className="flex items-center gap-2 truncate text-slate-700">
                  {clientsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                      Loading clients...
                    </>
                  ) : unseededClients.length === 0 ? (
                    'All clients already have the template'
                  ) : selectedClients.length === 0 ? (
                    `Select clients to sync (${unseededClients.length} pending)`
                  ) : (
                    `${selectedClients.length} client${selectedClients.length === 1 ? '' : 's'} selected`
                  )}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 text-slate-500" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
              <div className="p-2 border-b border-slate-100">
                <Input
                  placeholder="Search clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="max-h-64 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <div className="px-3 py-6 text-center text-sm text-slate-500">No clients found.</div>
                ) : (
                  filtered.map((c) => {
                    const checked = selectedIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={cn(
                          'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
                          'hover:bg-slate-100',
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleId(c.id)}
                          aria-label={c.name}
                        />
                        <span className="text-slate-700">{c.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {selectedIds.length > 0 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2">
                  <span className="text-xs text-slate-500">
                    {selectedIds.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    Clear
                  </button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {selectedIds.length > 0 && (
          <Button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="mt-2 md:mt-6 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing
                {progress ? ` ${progress.done}/${progress.total}` : '...'}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync ({selectedIds.length})
              </>
            )}
          </Button>
        )}
      </div>

      {selectedClients.length > 0 && !isSyncing && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedClients.map((c) => (
            <Badge key={c.id} variant="secondary" className="flex items-center gap-1">
              {c.name}
              <button
                type="button"
                onClick={() => toggleId(c.id)}
                className="ml-1 text-slate-500 hover:text-slate-700"
                aria-label={`Remove ${c.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Sync results
          </div>
          <ul className="divide-y divide-slate-100">
            {results.map((r) => (
              <li key={r.client_id} className="flex items-start justify-between gap-3 px-4 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-700">{r.client_name}</div>
                  <div
                    className={cn(
                      'truncate text-xs',
                      r.status === 'success' ? 'text-emerald-600' : 'text-red-600',
                    )}
                  >
                    {r.message}
                  </div>
                </div>
                <Badge
                  variant={r.status === 'success' ? 'default' : 'destructive'}
                  className={cn(
                    r.status === 'success'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : '',
                  )}
                >
                  {r.status === 'success' ? 'Success' : 'Failed'}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
const BackofficeChildAuditPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [checkTypes, setCheckTypes] = useState<BackofficeCheckTypeRow[]>([]);
  const [lookups, setLookups] = useState<BackofficeLookupRow[]>([]);
  const [selectedCheckTypeKey, setSelectedCheckTypeKey] = useState<string | null>(null);
  const [unseededClients, setUnseededClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  // Per-group local highlight selections — purely visual, never persisted.
  const [selectedByGroup, setSelectedByGroup] = useState<Record<string, string[]>>({});

  const toggleInGroup = useCallback((groupKey: string, id: string) => {
    setSelectedByGroup((prev) => {
      const current = prev[groupKey] ?? [];
      const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      return { ...prev, [groupKey]: next };
    });
  }, []);

  // Fetch clients that are NOT yet present in child_audit_check_type.
  // Two-step approach: pull distinct client_ids already seeded, then pull
  // active clients and filter on the frontend (Postgrest doesn't offer a
  // clean NOT IN against another sub-select).
  // Calls the `list-child-audit-unseeded-clients` Edge Function (service-role).
  // We CAN'T query `child_audit_check_type` directly from the browser: RLS limits
  // SELECT to the caller's own client_id, so other clients' rows would be hidden
  // and they'd all incorrectly appear "unseeded".
  const loadUnseededClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'list-child-audit-unseeded-clients',
        { body: {} },
      );

      if (error || !data?.success) {
        console.error('Failed to load clients for sync', error || data);
        toast.error('Failed to load clients for sync');
        return;
      }

      setUnseededClients((data.clients ?? []) as ClientOption[]);
    } catch (err) {
      console.error('Failed to load clients for sync', err);
      toast.error('Failed to load clients for sync');
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadTemplate = async () => {
      setLoading(true);
      const [{ data: ctData, error: ctErr }, { data: luData, error: luErr }] = await Promise.all([
        supabase
          .from('backoffice_child_audit_check_type')
          .select('id, type, key, alt_definition, active')
          .eq('active', true)
          .order('type'),
        supabase
          .from('backoffice_child_audit_look_up')
          .select('id, item_group, type, label, active')
          .eq('active', true)
          .order('label'),
      ]);

      if (ctErr || luErr) {
        console.error('Failed to load Child Audit templates', ctErr || luErr);
        toast.error('Failed to load Child Audit templates');
        setLoading(false);
        return;
      }

      const types = (ctData ?? []) as BackofficeCheckTypeRow[];
      setCheckTypes(types);
      setLookups((luData ?? []) as BackofficeLookupRow[]);
      if (types.length > 0) setSelectedCheckTypeKey(types[0].key);
      setLoading(false);
    };

    void loadTemplate();
    void loadUnseededClients();
  }, [loadUnseededClients]);

  const selectedCheckType = useMemo(
    () => checkTypes.find((c) => c.key === selectedCheckTypeKey) ?? null,
    [checkTypes, selectedCheckTypeKey],
  );

  const groupsForSelected = useMemo(() => {
    if (!selectedCheckType) return [];
    const altGroupKeys = (selectedCheckType.alt_definition ?? []).map((g) => {
      const match = /item_group\s*=\s*'([^']+)'/.exec(g.condition);
      return match?.[1] ?? '';
    });

    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const key of altGroupKeys) {
      if (!key || seen.has(key)) continue;
      seen.add(key);
      ordered.push(key);
    }

    return ordered.map((groupKey) => ({
      groupKey,
      title: toTitle(groupKey),
      icon: toIcon(groupKey),
      items: lookups
        .filter((l) => l.type === selectedCheckType.key && l.item_group === groupKey)
        .map((l) => ({ id: l.id, label: l.label })),
    }));
  }, [selectedCheckType, lookups]);

  const checkTypeItems = checkTypes.map((c) => ({ id: c.key, label: c.type }));

  return (
    <Layout>
      <div className="flex flex-col w-full px-4 py-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-slate-900">Child Audit — Master Template</h1>
          <p className="mt-1 text-sm text-slate-500">
            Read-only view of the global template that is copied into each new client's
            Child Audit module on creation.
          </p>
        </div>

        <SyncClientsPanel
          unseededClients={unseededClients}
          clientsLoading={clientsLoading}
          refreshUnseeded={loadUnseededClients}
        />

        {loading ? (
          <Card>
            <CardContent className="py-12">
              <Loader text="Loading Child Audit templates..." />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Check Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {checkTypeItems.map((item) => {
                    const isSelected = item.id === selectedCheckTypeKey;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setSelectedCheckTypeKey(item.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition',
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full border',
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-300',
                          )}
                        >
                          {isSelected ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {groupsForSelected.map((group) => (
              <Card key={group.groupKey}>
                <CardHeader>
                  <CardTitle className="text-xl">
                    {group.icon} {group.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {group.items.length > 0 ? (
                    <SelectableRows
                      items={group.items}
                      selected={selectedByGroup[group.groupKey] ?? []}
                      onToggle={(id) => toggleInGroup(group.groupKey, id)}
                    />
                  ) : (
                    <p className="text-sm text-slate-500">No template values configured.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BackofficeChildAuditPage;
