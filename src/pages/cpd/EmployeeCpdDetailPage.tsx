import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BookOpen, Edit2, Trash2, Loader2, ArrowLeft, PlusCircle } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type CpdDomain = {
  id: string;
  name: string;
  threshold: number;
};

type CpdEntry = {
  id: string;
  title: string;
  domain_name: string;
  hours: number | null;
  captured_date?: string | null;
};

type EmployeeCpdRow = {
  employee_id: string;
  employee_name: string;
  department_name: string | null;
  cpd_entries: CpdEntry[];
  obtained_cpd: number;
  total_cpd: number;
  status: 'In Progress' | 'At Risk' | 'Compliant';
  core_values_hours: number;
  knowledge_hours: number;
  growth_hours: number;
  core_values_threshold: number;
  knowledge_threshold: number;
  growth_threshold: number;
  domain_hours?: Record<string, number>;
};

type CpdOverviewResponse = {
  success: boolean;
  total_staff: number;
  compliant_count: number;
  at_risk_count: number;
  total_cpd: number;
  employees: EmployeeCpdRow[];
  domains: CpdDomain[];
};

const titleRegex = /^[A-Za-z0-9\s]+$/;

type AddDialogProps = {
  open: boolean;
  onClose: () => void;
  employee: EmployeeCpdRow;
  clientId: string;
  domains: CpdDomain[];
  onAdded: () => void;
};

const AddCpdEntryDialog: React.FC<AddDialogProps> = ({
  open,
  onClose,
  employee,
  clientId,
  domains,
  onAdded,
}) => {
  const [title, setTitle] = useState('');
  const [domainId, setDomainId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState('');
  const [hours, setHours] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedDate, setCapturedDate] = useState<string>('');

  useEffect(() => {
    if (open) {
      setTitle('');
      setCategory('');
      setHours('');
      setError(null);
      setCapturedDate('');
      const coreDomain =
        domains.find((d) => d.name === 'Core Values & Ethics') ?? domains[0];
      setDomainId(coreDomain?.id);
    }
  }, [open, domains]);

  const currentDomain = domains.find((d) => d.id === domainId);
  const usedForDomain =
    (employee.domain_hours && domainId && employee.domain_hours[domainId]) ?? 0;
  const thresholdForDomain = currentDomain?.threshold ?? 0;
  const domainRemaining = Math.max(0, thresholdForDomain - usedForDomain);

  const numericHours = Number(hours);
  const exceedsRemaining =
    !!hours &&
    !Number.isNaN(numericHours) &&
    domainRemaining > 0 &&
    numericHours > domainRemaining;

  const isFormBasicValid =
    !!title.trim() &&
    !!domainId &&
    !!capturedDate &&
    !!hours &&
    !Number.isNaN(numericHours) &&
    numericHours > 0;

  const validate = (): boolean => {
    if (!title || title.trim().length < 2 || title.trim().length > 100) {
      setError('Title must be between 2 and 100 characters.');
      return false;
    }
    if (!titleRegex.test(title.trim())) {
      setError('Title can only contain letters, numbers and spaces.');
      return false;
    }

    const existingTitles =
      employee.cpd_entries?.map((e) => e.title.toLowerCase().trim()) ?? [];
    if (existingTitles.includes(title.toLowerCase().trim())) {
      setError('This title already exists for this employee.');
      return false;
    }

    if (!domainId) {
      setError('Please select a CPD domain.');
      return false;
    }

    if (!capturedDate) {
      setError('Please select a date.');
      return false;
    }

    if (category.trim()) {
      if (category.trim().length < 2 || category.trim().length > 100) {
        setError('Learning category must be between 2 and 100 characters.');
        return false;
      }
    }

    const h = Number(hours);
    if (!hours || Number.isNaN(h) || h <= 0) {
      setError('Hours must be a positive number.');
      return false;
    }
    if (domainRemaining <= 0) {
      setError('You have already reached the required hours for this domain.');
      return false;
    }
    if (h > domainRemaining) {
      setError(
        `You can only add up to ${domainRemaining}h for this domain based on the threshold.`,
      );
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const employeeId = employee.employee_id;

      const { data, error } = await supabase.functions.invoke('cpd_learning', {
        method: 'POST',
        body: {
          action: 'create',
          client_id: clientId,
          employee_id: employeeId,
          title: title.trim(),
          domain_id: domainId,
          category: category.trim(),
          hours: Number(hours),
          captured_date: capturedDate,
        },
      });

      if (error || data?.success === false) {
        const message =
          error?.message || data?.error || 'Failed to add CPD entry.';
        console.error('Error creating CPD entry:', error || data);
        setError(message);
        return;
      }

      onClose();
      onAdded();
    } finally {
      setSubmitting(false);
    }
  };

  const disableAdd =
    submitting || domainRemaining <= 0 || !isFormBasicValid || exceedsRemaining;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add CPD Learning</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="cpd-title-detail">
              Learning / Activity Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cpd-title-detail"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Child Protection Workshop"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cpd-domain-detail">
              CPD Domain <span className="text-red-500">*</span>
            </Label>
            <Select
              value={domainId}
              onValueChange={(value) => setDomainId(value || undefined)}
              disabled={submitting}
            >
              <SelectTrigger id="cpd-domain-detail">
                <SelectValue placeholder="Select CPD domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentDomain && (
              <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                {domainRemaining > 0
                  ? `You still need ${domainRemaining}h in ${currentDomain.name}.`
                  : `You have completed required hours for ${currentDomain.name}.`}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cpd-category-detail">
              Learning Category (optional)
            </Label>
            <Input
              id="cpd-category-detail"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Workshop, Course, Seminar"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cpd-date-detail">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cpd-date-detail"
              type="date"
              value={capturedDate}
              onChange={(e) => setCapturedDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cpd-hours-detail">
              Hours <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cpd-hours-detail"
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={domainRemaining <= 0}
              placeholder="e.g., 6"
            />
            {exceedsRemaining && (
              <p className="text-xs text-red-600">
                You can only add up to {domainRemaining}h for this domain based
                on the threshold.
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={disableAdd}>
            {submitting ? 'Adding...' : 'Add Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

type EditDialogProps = {
  open: boolean;
  onClose: () => void;
  entry: CpdEntry | null;
  employee: EmployeeCpdRow;
  clientId: string;
  domains: CpdDomain[];
  onUpdated: () => void;
};

const EditCpdEntryDialog: React.FC<EditDialogProps> = ({
  open,
  onClose,
  entry,
  employee,
  clientId,
  domains,
  onUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [domainId, setDomainId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState('');
  const [hours, setHours] = useState<string>('');
  const [capturedDate, setCapturedDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && entry) {
      setTitle(entry.title || '');
      setCategory('');
      setHours(entry.hours?.toString() ?? '');
      setCapturedDate(entry.captured_date ?? '');
      setError(null);
      const matchingDomain = domains.find(
        (d) => d.name.toLowerCase() === entry.domain_name.toLowerCase(),
      );
      setDomainId(matchingDomain?.id);
    }
  }, [open, entry, domains]);

  if (!entry) return null;

  const currentDomain = domains.find((d) => d.id === domainId);
  const usedForDomain =
    (employee.domain_hours && domainId && employee.domain_hours[domainId]) ?? 0;
  const thresholdForDomain = currentDomain?.threshold ?? 0;
  const numericHours = Number(hours);
  const previousHours = entry.hours ?? 0;
  const effectiveUsed = usedForDomain - previousHours;
  const domainRemaining = Math.max(0, thresholdForDomain - usedForDomain);
  const entryMaxHours = Math.max(0, thresholdForDomain - effectiveUsed);
  const exceedsRemaining =
    !!hours &&
    !Number.isNaN(numericHours) &&
    entryMaxHours > 0 &&
    numericHours > entryMaxHours;

  const validate = (): boolean => {
    if (!title || title.trim().length < 2 || title.trim().length > 100) {
      setError('Title must be between 2 and 100 characters.');
      return false;
    }
    if (!titleRegex.test(title.trim())) {
      setError('Title can only contain letters, numbers and spaces.');
      return false;
    }

    if (!domainId) {
      setError('Please select a CPD domain.');
      return false;
    }

    if (!capturedDate) {
      setError('Please select a date.');
      return false;
    }

    const h = Number(hours);
    if (!hours || Number.isNaN(h) || h <= 0) {
      setError('Hours must be a positive number.');
      return false;
    }
    if (domainRemaining <= 0 && h > previousHours) {
      setError('You have already reached the required hours for this domain.');
      return false;
    }
    if (h > entryMaxHours) {
      setError(
        `You can only set this entry up to ${entryMaxHours}h based on the threshold for this domain.`,
      );
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setSubmitting(true);
      const employeeId = employee.employee_id;
      const { data, error } = await supabase.functions.invoke('cpd_learning', {
        method: 'POST',
        body: {
          action: 'edit',
          id: entry.id,
          client_id: clientId,
          employee_id: employeeId,
          title: title.trim(),
          domain_id: domainId,
          category: category.trim(),
          hours: Number(hours),
          captured_date: capturedDate,
        },
      });

      if (error || data?.success === false) {
        const message = error?.message || data?.error || 'Failed to update CPD entry.';
        console.error('Error updating CPD entry:', error || data);
        setError(message);
        return;
      }

      onClose();
      onUpdated();
    } finally {
      setSubmitting(false);
    }
  };

  const isFormBasicValid =
    !!title.trim() &&
    !!domainId &&
    !!capturedDate &&
    !!hours &&
    !Number.isNaN(numericHours) &&
    numericHours > 0;

  const disableSave =
    submitting || !isFormBasicValid || exceedsRemaining;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit CPD Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="edit-title">
              Learning / Activity Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-domain">
              CPD Domain <span className="text-red-500">*</span>
            </Label>
            <Select
              value={domainId}
              onValueChange={(value) => setDomainId(value || undefined)}
              disabled={submitting}
            >
              <SelectTrigger id="edit-domain">
                <SelectValue placeholder="Select CPD domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentDomain && (
              <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                {domainRemaining > 0
                  ? `You still need ${domainRemaining}h in ${currentDomain.name}.`
                  : `You have completed required hours for ${currentDomain.name}.`}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-category">Learning Category (optional)</Label>
            <Input
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Workshop, Course, Seminar"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-date"
              type="date"
              value={capturedDate}
              onChange={(e) => setCapturedDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="edit-hours">
              Hours <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit-hours"
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={entryMaxHours <= 0}
            />
            {domainRemaining > 0 && !exceedsRemaining && (
              <p className="mt-1 text-xs text-gray-500">
                Remaining for selected domain: {domainRemaining}h
              </p>
            )}
            {exceedsRemaining && (
              <p className="mt-1 text-xs text-red-600">
                You can only set up to {entryMaxHours}h for this entry based on the
                domain threshold.
              </p>
            )}
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={disableSave}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const EmployeeCpdDetailPage: React.FC = () => {
  const { employeeId: routeEmployeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  const currentEmployeeId = employeeData?.id;
  const isSuperAdmin = employeeData?.isSuperAdmin === true;

  const [data, setData] = useState<CpdOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CpdEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<CpdEntry | null>(null);
  const [entriesPage, setEntriesPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!clientId || !currentEmployeeId || !routeEmployeeId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke<CpdOverviewResponse>(
        'cpd_overview_list',
        {
          body: {
            client_id: clientId,
            employee_id: isSuperAdmin ? currentEmployeeId : routeEmployeeId,
            is_super_admin: isSuperAdmin,
          },
        },
      );
      if (error) {
        console.error('Error loading CPD detail:', error);
        setData(null);
        return;
      }
      setData(data ?? null);
    } finally {
      setLoading(false);
    }
  }, [clientId, currentEmployeeId, routeEmployeeId, isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const employeeRow: EmployeeCpdRow | undefined = useMemo(() => {
    if (!data || !routeEmployeeId) return undefined;
    return data.employees.find((e) => e.employee_id === routeEmployeeId);
  }, [data, routeEmployeeId]);

  const totalThreshold = data?.total_cpd ?? 0;
  const obtained = employeeRow?.obtained_cpd ?? 0;

  const openDeleteConfirm = (entry: CpdEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientId || !employeeRow || !entryToDelete) return;
    const idToDelete = entryToDelete.id;
    setEntryToDelete(null);
    setDeleteDialogOpen(false);
    try {
      setDeletingId(idToDelete);
      const { data, error } = await supabase.functions.invoke('cpd_learning', {
        method: 'POST',
        body: {
          action: 'delete',
          id: idToDelete,
          client_id: clientId,
          employee_id: employeeRow.employee_id,
        },
      });
      if (error || data?.success === false) {
        console.error('Error deleting CPD entry:', error || data);
        return;
      }
      loadData();
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading CPD details...
        </div>
      </Layout>
    );
  }

  if (!employeeRow) {
    return (
      <Layout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate('/cpd_overview')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <p className="text-sm text-gray-500">Employee CPD details not found.</p>
        </div>
      </Layout>
    );
  }

  // Client-side pagination for CPD entries (10 per page)
  const entriesPageSize = 10;
  const totalEntryPages =
    employeeRow.cpd_entries.length > 0
      ? Math.ceil(employeeRow.cpd_entries.length / entriesPageSize)
      : 1;
  const safeEntriesPage = Math.min(entriesPage, totalEntryPages);
  const entryStartIndex = (safeEntriesPage - 1) * entriesPageSize;
  const paginatedEntries = employeeRow.cpd_entries.slice(
    entryStartIndex,
    entryStartIndex + entriesPageSize,
  );

  const goToPreviousEntriesPage = () => {
    setEntriesPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextEntriesPage = () => {
    setEntriesPage((prev) => Math.min(totalEntryPages, prev + 1));
  };

  return (
    <Layout>
      <div className="w-full py-6">
        {/* Header – same layout as Student Well-Being Management */}
        <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/cpd_overview')}
                  className="flex h-full w-full items-center justify-center text-primary hover:text-primary/80"
                  aria-label="Back to CPD Overview"
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">{employeeRow.employee_name}</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {employeeRow.department_name ?? '—'}
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm text-gray-500">Total</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 max-w-[180px] h-2.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-slate-500 transition-all"
                          style={{
                            width: `${totalThreshold > 0 ? Math.min(100, (obtained / totalThreshold) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 tabular-nums shrink-0">
                        {obtained}/{totalThreshold}h
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm text-gray-500">Core Values & Ethics</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 max-w-[180px] h-2.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{
                            width: `${employeeRow.core_values_threshold > 0 ? Math.min(100, (employeeRow.core_values_hours / employeeRow.core_values_threshold) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 tabular-nums shrink-0">
                        {employeeRow.core_values_hours}/{employeeRow.core_values_threshold}h
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm text-gray-500">Knowledge & Practice</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 max-w-[180px] h-2.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${employeeRow.knowledge_threshold > 0 ? Math.min(100, (employeeRow.knowledge_hours / employeeRow.knowledge_threshold) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 tabular-nums shrink-0">
                        {employeeRow.knowledge_hours}/{employeeRow.knowledge_threshold}h
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-sm text-gray-500">Professional Growth & Development</p>
                    <div className="flex items-center gap-2">
                      <div className="w-32 max-w-[180px] h-2.5 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all"
                          style={{
                            width: `${employeeRow.growth_threshold > 0 ? Math.min(100, (employeeRow.growth_hours / employeeRow.growth_threshold) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 tabular-nums shrink-0">
                        {employeeRow.growth_hours}/{employeeRow.growth_threshold}h
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">CPD Entries</h2>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Add CPD entry"
              onClick={() => setAddOpen(true)}
            >
              <PlusCircle className="h-4 w-4" />
            </button>
          </div>

          {employeeRow.cpd_entries.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">
                No CPD entries found for this staff member yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-left font-medium">Title</TableHead>
                    <TableHead className="text-left font-medium">Domain</TableHead>
                    <TableHead className="text-left font-medium">Category</TableHead>
                    <TableHead className="text-left font-medium">Date</TableHead>
                    <TableHead className="text-left font-medium">Hours</TableHead>
                    <TableHead className="text-right font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.title}</TableCell>
                      <TableCell>{entry.domain_name}</TableCell>
                      <TableCell>—</TableCell>
                      <TableCell>
                        {entry.captured_date
                          ? new Date(entry.captured_date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell>{entry.hours ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Edit CPD entry"
                            onClick={() => {
                              setSelectedEntry(entry);
                              setEditOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            title="Delete CPD entry"
                            onClick={() => openDeleteConfirm(entry)}
                            disabled={deletingId === entry.id}
                          >
                            {deletingId === entry.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <AddCpdEntryDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        employee={employeeRow}
        clientId={clientId!}
        domains={data?.domains ?? []}
        onAdded={loadData}
      />

      {employeeRow.cpd_entries.length > entriesPageSize && (
        <div className="flex justify-center mt-4 pb-6">
          <Pagination>
            <PaginationContent className="flex items-center gap-3">
              <PaginationItem>
                <PaginationPrevious
                  onClick={goToPreviousEntriesPage}
                  className={
                    safeEntriesPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 py-1 text-sm font-medium text-gray-700">
                  {safeEntriesPage} of {totalEntryPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={goToNextEntriesPage}
                  className={
                    safeEntriesPage === totalEntryPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <EditCpdEntryDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        entry={selectedEntry}
        employee={employeeRow}
        clientId={clientId!}
        domains={data?.domains ?? []}
        onUpdated={loadData}
      />

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setEntryToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete CPD entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this CPD entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deletingId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'OK'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default EmployeeCpdDetailPage;

