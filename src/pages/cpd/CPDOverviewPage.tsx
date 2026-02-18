import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
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
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Search, BookOpen, PlusCircle, Eye, Loader2, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type CpdEntry = {
  id: string;
  title: string;
  domain_name: string;
  hours: number | null;
};

type CpdDomain = {
  id: string;
  name: string;
  threshold: number;
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
  // domain_id -> used hours
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

type AddCpdDialogProps = {
  open: boolean;
  onClose: () => void;
  employee: EmployeeCpdRow | null;
  clientId: string;
  domains: CpdDomain[];
  onAdded: () => void;
};

const titleRegex = /^[A-Za-z0-9\s]+$/;

const AddCpdDialog: React.FC<AddCpdDialogProps> = ({
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
      // default domain = Core Values & Ethics
      const coreDomain = domains.find((d) => d.name === 'Core Values & Ethics') ?? domains[0];
      setDomainId(coreDomain?.id);
    }
  }, [open, domains]);

  if (!employee) return null;

  const currentDomain = domains.find((d) => d.id === domainId);
  const usedForDomain =
    (employee.domain_hours && domainId && employee.domain_hours[domainId]) ?? 0;
  const thresholdForDomain = currentDomain?.threshold ?? 0;
  const remainingForDomain = Math.max(0, thresholdForDomain - usedForDomain);

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
    if (remainingForDomain <= 0) {
      setError('You have already reached the required hours for this domain.');
      return false;
    }
    if (h > remainingForDomain) {
      setError(
        `You can only add up to ${remainingForDomain}h for this domain based on the threshold.`,
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
        const message = error?.message || data?.error || 'Failed to add CPD entry.';
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

  const numericHours = Number(hours);
  const exceedsRemaining =
    !!hours &&
    !Number.isNaN(numericHours) &&
    remainingForDomain > 0 &&
    numericHours > remainingForDomain;

  const isFormBasicValid =
    !!title.trim() &&
    !!domainId &&
    !!capturedDate &&
    !!hours &&
    !Number.isNaN(numericHours) &&
    numericHours > 0;

  const disableAdd =
    submitting || remainingForDomain <= 0 || !isFormBasicValid || exceedsRemaining;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add CPD Learning</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label htmlFor="cpd-title">
              Learning / Activity Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cpd-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Child Protection Workshop"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cpd-domain">
              CPD Domain <span className="text-red-500">*</span>
            </Label>
            <Select
              value={domainId}
              onValueChange={(value) => setDomainId(value || undefined)}
              disabled={submitting}
            >
              <SelectTrigger id="cpd-domain">
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
                {remainingForDomain > 0
                  ? `You still need ${remainingForDomain}h in ${currentDomain.name}.`
                  : `You have completed required hours for ${currentDomain.name}.`}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cpd-category">Learning Category (optional)</Label>
            <Input
              id="cpd-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Workshop, Course, Seminar"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cpd-date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cpd-date"
              type="date"
              value={capturedDate}
              onChange={(e) => setCapturedDate(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="cpd-hours">
              Hours <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cpd-hours"
              type="number"
              min={1}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              disabled={remainingForDomain <= 0}
              placeholder="e.g., 6"
            />
            {exceedsRemaining && (
              <p className="text-xs text-red-600">
                You can only add up to {remainingForDomain}h for this domain based on the
                threshold.
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

const CPDOverviewPage: React.FC = () => {
  const { employeeData, user } = useAuth();
  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id;
  const isSuperAdmin = employeeData?.isSuperAdmin === true;

  const [data, setData] = useState<CpdOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeCpdRow | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDomainIds, setExportDomainIds] = useState<string[]>([]);
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    if (!clientId || !employeeId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke<CpdOverviewResponse>('cpd_overview_list', {
        body: {
          client_id: clientId,
          employee_id: employeeId,
          is_super_admin: isSuperAdmin,
        },
      });

      if (error) {
        console.error('Error fetching CPD overview:', error);
        setData(null);
        return;
      }

      setData(data ?? null);
    } finally {
      setLoading(false);
    }
  }, [clientId, employeeId, isSuperAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredEmployees = (data?.employees ?? []).filter((row) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      row.employee_name.toLowerCase().includes(q) ||
      (row.department_name ?? '').toLowerCase().includes(q)
    );
  });

  // Client-side pagination over filtered employees
  const pageSize = 10;
  const totalPages =
    filteredEmployees.length > 0 ? Math.ceil(filteredEmployees.length / pageSize) : 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + pageSize);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const selectedDomainsForExport = (data?.domains ?? []).filter((d) =>
    exportDomainIds.includes(d.id),
  );

  const handleExportExcel = () => {
    if (selectedDomainsForExport.length === 0) {
      toast.error('Select at least one CPD domain to export.');
      return;
    }
    const employees = data?.employees ?? [];
    if (employees.length === 0) {
      toast.error('No employee data to export.');
      return;
    }
    try {
      const exportRows: Record<string, string | number>[] = [];
      for (const row of employees) {
        const record: Record<string, string | number> = {
          'Employee Name': row.employee_name,
          Department: row.department_name ?? '—',
        };
        let totalSelectedHours = 0;
        for (const domain of selectedDomainsForExport) {
          const titles = (row.cpd_entries ?? [])
            .filter((e) => e.domain_name === domain.name)
            .map((e) => e.title)
            .filter(Boolean);
          record[domain.name] = titles.length > 0 ? titles.join(', ') : '—';
          const used = row.domain_hours?.[domain.id] ?? 0;
          const threshold = domain.threshold ?? 0;
          record[`${domain.name} (Spending Hours)`] = `${used} / ${threshold}`;
          totalSelectedHours += used;
        }
        record['Total CPD Values'] = totalSelectedHours;
        exportRows.push(record);
      }
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employee CPD');
      const filename = `employee_cpd_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
      toast.success(`Exported ${employees.length} employees to ${filename}`);
      setExportDialogOpen(false);
    } catch (err: unknown) {
      console.error('CPD export error:', err);
      toast.error(err instanceof Error ? err.message : 'Export failed.');
    }
  };

  return (
    <Layout>
      <div className="w-full py-6">
        {/* Header summary cards - follow Student Well-Being layout but CPD content */}
        <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">Employee CPD Overview</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Track Continuing Professional Development hours and compliance across employees.
                </p>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Total Employees</p>
                    <p className="text-3xl font-semibold text-gray-900 tabular-nums">
                      {data?.total_staff ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Compliant</p>
                    <p className="text-3xl font-semibold text-green-600 tabular-nums">
                      {data?.compliant_count ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">At Risk</p>
                    <p className="text-3xl font-semibold text-red-600 tabular-nums">
                      {data?.at_risk_count ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button
                type="button"
                className="bg-cyan-600 hover:bg-cyan-700 text-white shadow-md hover:shadow-lg transition-all"
                onClick={() => {
                  setExportDomainIds(data?.domains?.map((d) => d.id) ?? []);
                  setExportDialogOpen(true);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Employee CPD table - layout inspired by provided screenshot */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Employee CPD Status</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee name or department..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-gray-500 text-sm">
                No employee CPD records found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-left font-medium w-[220px]">Employee Name</TableHead>
                    <TableHead className="text-left font-medium w-[160px]">Department</TableHead>
                    <TableHead className="text-left font-medium w-[120px]">Total CPD</TableHead>
                    <TableHead className="text-left font-medium w-[160px]">Core Values</TableHead>
                    <TableHead className="text-left font-medium w-[160px]">Knowledge</TableHead>
                    <TableHead className="text-left font-medium w-[160px]">Growth</TableHead>
                    <TableHead className="text-left font-medium w-[120px]">Status</TableHead>
                    <TableHead className="text-right font-medium w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedEmployees.map((row) => {
                    const total = row.total_cpd || data?.total_cpd || 0;
                    const obtained = row.obtained_cpd || 0;
                    const totalLabel = `${obtained} / ${total}`;

                    const renderBar = (
                      obtainedValue: number,
                      threshold: number,
                      barColorClass: string,
                    ) => {
                      const widthPercent = threshold > 0
                        ? Math.min(100, (obtainedValue / threshold) * 100)
                        : 0;
                      return (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>{obtainedValue}h</span>
                            <span className="text-gray-400">{threshold}h</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColorClass}`}
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    };

                    const statusColor =
                      row.status === 'Compliant'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : row.status === 'In Progress'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-red-100 text-red-800 border-red-200';

                    return (
                      <TableRow key={row.employee_id}>
                        <TableCell className="font-medium w-[220px] max-w-[220px] whitespace-nowrap">
                          {row.employee_name.length > 25 ? (
                            <span title={row.employee_name}>
                              {row.employee_name.slice(0, 25)}…
                            </span>
                          ) : (
                            row.employee_name
                          )}
                        </TableCell>
                        <TableCell className="w-[160px] max-w-[160px] whitespace-nowrap">
                          {row.department_name ?? '—'}
                        </TableCell>
                        <TableCell className="w-[120px] whitespace-nowrap">
                          <span className="font-semibold text-gray-900">{totalLabel}</span>
                        </TableCell>
                        <TableCell className="w-[160px]">
                          {renderBar(
                            row.core_values_hours,
                            row.core_values_threshold,
                            'bg-blue-500',
                          )}
                        </TableCell>
                        <TableCell className="w-[160px]">
                          {renderBar(
                            row.knowledge_hours,
                            row.knowledge_threshold,
                            'bg-emerald-500',
                          )}
                        </TableCell>
                        <TableCell className="w-[160px]">
                          {renderBar(
                            row.growth_hours,
                            row.growth_threshold,
                            'bg-purple-500',
                          )}
                        </TableCell>
                        <TableCell className="w-[120px]">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right w-[120px]">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Add CPD entry"
                              onClick={() => {
                                setSelectedEmployee(row);
                                setAddDialogOpen(true);
                              }}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                              title="View CPD entries"
                              onClick={() => {
                                navigate(`/cpd_overview/${row.employee_id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {filteredEmployees.length > pageSize && (
        <div className="flex justify-center mt-4 pb-6">
          <Pagination>
            <PaginationContent className="flex items-center gap-3">
              <PaginationItem>
                <PaginationPrevious
                  onClick={goToPreviousPage}
                  className={
                    safeCurrentPage === 1
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-3 py-1 text-sm font-medium text-gray-700">
                  {safeCurrentPage} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  onClick={goToNextPage}
                  className={
                    safeCurrentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : 'cursor-pointer'
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )
      }

      <AddCpdDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        employee={selectedEmployee}
        clientId={clientId!}
        domains={data?.domains ?? []}
        onAdded={loadData}
      />

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export CPD to Excel</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Choose which CPD domains to include. Columns will include Employee Name, Department,
            then for each selected domain: activity titles and spending hours (used / threshold),
            plus Total CPD Values.
          </p>
          <div className="space-y-3 py-2">
            {(data?.domains ?? []).map((d) => (
              <div key={d.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`export-domain-${d.id}`}
                  checked={exportDomainIds.includes(d.id)}
                  onCheckedChange={(checked) => {
                    setExportDomainIds((prev) =>
                      checked
                        ? (prev.includes(d.id) ? prev : [...prev, d.id])
                        : prev.filter((id) => id !== d.id),
                    );
                  }}
                />
                <label
                  htmlFor={`export-domain-${d.id}`}
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  {d.name}
                </label>
              </div>
            ))}
            {(data?.domains ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">No CPD domains available.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExportExcel}
              disabled={selectedDomainsForExport.length === 0}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CPDOverviewPage;

