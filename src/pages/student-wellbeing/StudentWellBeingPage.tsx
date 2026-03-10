import React, { useState, useEffect, useCallback } from 'react';
import { Heart, Users, FolderOpen, Plus, Search, MessageSquare, Pencil, Trash2, MoreVertical, Zap, Calendar, X, Eye, Download, History } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';
import Layout from '@/components/layout/Layout';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useAuth } from '@/contexts';
import {
  fetchStudentWellbeingRecords,
  deleteStudentWellbeingRecord,
  type StudentWellbeingRecord,
  type StudentWellbeingSummary,
} from '@/services/student-wellbeing/studentWellbeingService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { NewWellBeingRecordDialog } from '@/components/student-wellbeing/NewWellBeingRecordDialog';
import { EditWellBeingRecordDialog } from '@/components/student-wellbeing/EditWellBeingRecordDialog';
import { NewConsultationDialog } from '@/components/student-wellbeing/NewConsultationDialog';
import { ConsultationDetailsDialog } from '@/components/student-wellbeing/ConsultationDetailsDialog';
import { NewActionDialog } from '@/components/student-wellbeing/NewActionDialog';
import { ActionDetailsDialog } from '@/components/student-wellbeing/ActionDetailsDialog';
import { NewFollowUpEntryDialog } from '@/components/student-wellbeing/NewFollowUpEntryDialog';
import { ViewRecordDialog } from '@/components/student-wellbeing/ViewRecordDialog';
import { StudentWellbeingAuditDialog } from '@/components/student-wellbeing/StudentWellbeingAuditDialog';
import { formatDate } from '@/lib/Dateformat';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All status' },
  { value: 'open', label: 'Open' },
  { value: 'under_observation', label: 'Under Observation Cases' },
  { value: 'closed', label: 'Closed' },
] as const;

/** Academic year runs Apr 1 (start year) to Mar 31 (end year). e.g. 2025-2026 = 1 Apr 2025 – 31 Mar 2026 */
function getCurrentAcademicYear(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed: Jan=0, Apr=3
  if (m >= 3) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

/** Past and current academic years only (no future). Default 10 years back. */
function getAcademicYearOptions(pastYears = 10): { value: string; label: string }[] {
  const current = getCurrentAcademicYear();
  const match = current.match(/^(\d{4})-(\d{4})$/);
  const currentStartYear = match ? parseInt(match[1], 10) : new Date().getFullYear();
  const minStartYear = currentStartYear - pastYears;
  const options: { value: string; label: string }[] = [{ value: 'all', label: 'All years' }];
  for (let startY = currentStartYear; startY >= minStartYear; startY--) {
    options.push({ value: `${startY}-${startY + 1}`, label: `${startY}-${startY + 1}` });
  }
  return options;
}

function getAcademicYearRange(value: string): { start: Date; end: Date } | null {
  if (!value || value === 'all') return null;
  const match = value.match(/^(\d{4})-(\d{4})$/);
  if (!match) return null;
  const startYear = parseInt(match[1], 10);
  const endYear = parseInt(match[2], 10);
  if (endYear !== startYear + 1) return null;
  const start = new Date(startYear, 3, 1); // April 1
  const end = new Date(endYear, 2, 31); // March 31
  return { start, end };
}

/** Get academic year string for a given date (e.g. "2025-2026"). */
function getAcademicYearForDate(dateInput: string | Date | null | undefined): string {
  if (dateInput == null) return '';
  try {
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = d.getMonth();
    if (m >= 3) return `${y}-${y + 1}`;
    return `${y - 1}-${y}`;
  } catch {
    return '';
  }
}

function formatStatus(status: string): string {
  if (status === 'under_observation') {
    return 'Under Observation Cases';
  }
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'under_observation':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'closed':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

const StudentWellBeingPage = () => {
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;

  const [records, setRecords] = useState<StudentWellbeingRecord[]>([]);
  const [summary, setSummary] = useState<StudentWellbeingSummary>({
    studentsCount: 0,
    openCases: 0,
    underObservation: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [academicYearFilter, setAcademicYearFilter] = useState<string>(() => getCurrentAcademicYear());
  const [newRecordDialogOpen, setNewRecordDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<StudentWellbeingRecord | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [recordToView, setRecordToView] = useState<StudentWellbeingRecord | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<StudentWellbeingRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newConsultationDialogOpen, setNewConsultationDialogOpen] = useState(false);
  const [recordForConsultation, setRecordForConsultation] = useState<StudentWellbeingRecord | null>(null);
  const [consultationDetailsOpen, setConsultationDetailsOpen] = useState(false);
  const [recordForConsultationDetails, setRecordForConsultationDetails] = useState<StudentWellbeingRecord | null>(null);
  const [newActionDialogOpen, setNewActionDialogOpen] = useState(false);
  const [recordForAction, setRecordForAction] = useState<StudentWellbeingRecord | null>(null);
  const [actionDetailsOpen, setActionDetailsOpen] = useState(false);
  const [recordForActionDetails, setRecordForActionDetails] = useState<StudentWellbeingRecord | null>(null);
  const [newFollowUpDialogOpen, setNewFollowUpDialogOpen] = useState(false);
  const [recordForFollowUp, setRecordForFollowUp] = useState<StudentWellbeingRecord | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [recordForAudit, setRecordForAudit] = useState<StudentWellbeingRecord | null>(null);

  const loadRecords = useCallback(async () => {
    if (!clientId) {
      setRecords([]);
      setSummary({ studentsCount: 0, openCases: 0, underObservation: 0, closed: 0 });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const academicYear = academicYearFilter && academicYearFilter !== 'all' ? academicYearFilter : undefined;
      const result = await fetchStudentWellbeingRecords(clientId, employeeData?.id, academicYear);
      setRecords(result.records);
      setSummary(result.summary);
    } catch (err) {
      console.error('Failed to load student well-being records:', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [clientId, employeeData?.id, academicYearFilter]);

  useEffect(() => {
      loadRecords();
    }, [loadRecords]);

  const handleDeleteConfirm = async () => {
    if (!recordToDelete || !clientId || !employeeData?.id) return;
    setDeleting(true);
    try {
      await deleteStudentWellbeingRecord(recordToDelete.id, clientId, employeeData.id);
      toast.success('Record was deleted successfully');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      loadRecords();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete record');
    } finally {
      setDeleting(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    if (!matchStatus) return false;
    const obs = r.date_of_observation ? new Date(r.date_of_observation) : null;
    const obsDay = obs && !isNaN(obs.getTime())
      ? new Date(obs.getFullYear(), obs.getMonth(), obs.getDate())
      : null;

    if (dateRange?.from || dateRange?.to) {
      if (!obsDay) return false;
      if (dateRange.from) {
        const fromDay = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
        if (obsDay < fromDay) return false;
      }
      if (dateRange.to) {
        const toDay = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());
        if (obsDay > toDay) return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const studentId = (r.student_display_id ?? r.student_id ?? '').toLowerCase();
    return (
      studentId.includes(q) ||
      r.student_name?.toLowerCase().includes(q) ||
      r.class?.toLowerCase().includes(q) ||
      r.concern?.toLowerCase().includes(q)
    );
  });
  // Active filter count
  const activeFilterCount = [
    searchQuery,
    statusFilter !== 'all' ? statusFilter : '',
    dateRange?.from || dateRange?.to ? 'date' : '',
    academicYearFilter !== getCurrentAcademicYear() ? academicYearFilter : '',
  ].filter(value => {
    if (!value) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }).length;

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateRange(undefined);
    setAcademicYearFilter(getCurrentAcademicYear());
  };

  const exportToCsv = () => {
    const maxConsultations = 5;
    const maxActions = 5;
    const escape = (v: string) => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const fmtDate = (value: string | null) => {
      if (!value) return '';
      try {
        const d = new Date(value);
        return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch {
        return '';
      }
    };
    const formatExportDateForFilename = (d?: Date) => {
      if (!d) return 'all';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    const headers = [
      'Academic Year',
      'Student Name',
      'Grade/Section',
      'Concern',
      'Date of Observation',
      'Status',
      ...Array.from({ length: maxConsultations }, (_, i) => [
        `Consultation ${i + 1} - Provided By`,
        `Consultation ${i + 1} - Date`,
        `Consultation ${i + 1} - Mode`,
        `Consultation ${i + 1} - Notes`,
      ]).flat(),
      ...Array.from({ length: maxActions }, (_, i) => [
        `Action ${i + 1} - Date`,
        `Action ${i + 1} - Description`,
      ]).flat(),
    ];
    const rows = filteredRecords.map((r) => {
      const consultations = r.consultations ?? [];
      const actions = r.actions ?? [];
      const rowAcademicYear = getAcademicYearForDate(r.date_of_observation ?? r.created_at);
      const base = [
        rowAcademicYear,
        r.student_name ?? '',
        (r.class ?? '').replace(/^Class\s+/i, ''),
        r.concern ?? '',
        fmtDate(r.date_of_observation),
        formatStatus(r.status ?? ''),
      ];
      for (let i = 0; i < maxConsultations; i++) {
        const c = consultations[i];
        base.push(
          c?.consultation_provided_by ?? '',
          c ? fmtDate(c.consultation_date) : '',
          c?.mode_name ?? '',
          c?.support_notes ?? ''
        );
      }
      for (let i = 0; i < maxActions; i++) {
        const a = actions[i];
        base.push(a ? fmtDate(a.taken_date) : '', a?.description ?? '');
      }
      return base.map(escape).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fromStr = formatExportDateForFilename(dateRange?.from);
    const toStr = formatExportDateForFilename(dateRange?.to);
    a.download = `student-wellbeing-records-${fromStr}-${toStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filteredRecords.length} record(s)`);
  };


  return (
    <Layout>
      <div className="w-full py-6">
        {/* Header – spacing, font size and count width aligned with SOP module */}
        <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold">Student Well-Being Management</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Safe school students will be supported with well-being records and follow-ups.
                </p>
                {/* Same spacing and count layout as SOP: mt-6, grid gap-6, text-sm label, text-3xl font-semibold count */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Number of Students</p>
                    <p className="text-3xl font-semibold text-gray-900 tabular-nums">{summary.studentsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Cases</p>
                    <p className="text-3xl font-semibold text-gray-900 tabular-nums">
                      {summary.openCases + summary.closed + summary.underObservation}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Open Cases</p>
                    <p className="text-3xl font-semibold text-orange-600 tabular-nums">{summary.openCases}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Closed Cases</p>
                    <p className="text-3xl font-semibold text-green-600 tabular-nums">{summary.closed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Under Observation Cases</p>
                    <p className="text-3xl font-semibold text-blue-600 tabular-nums">{summary.underObservation}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={exportToCsv}
                disabled={filteredRecords.length === 0}
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
              <Button
                className="flex items-center gap-2"
                onClick={() => setNewRecordDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>New Record</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Records list – search, status and date range filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <h2 className="text-lg font-semibold mb-4">Records</h2>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-[320px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Student, Grade/Section, or Concern..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 border border-input rounded-md bg-background"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-10 border border-input rounded-md bg-background">
                <SelectValue placeholder="All status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="w-[300px]">
              <DatePickerWithRange
                date={dateRange}
                onChange={setDateRange}
                className="w-full"
              />
            </div>
            <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
              <SelectTrigger className="w-[140px] h-10 border border-input rounded-md bg-background">
                <SelectValue placeholder="Academic Year" />
              </SelectTrigger>
              <SelectContent>
                {getAcademicYearOptions().map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
             {(searchQuery || statusFilter !== 'all' || dateRange?.from || dateRange?.to || academicYearFilter !== getCurrentAcademicYear()) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10"
                  onClick={handleClearFilters}
                >
                  <X className="h-4 w-4" />
                  Clear Filter ({activeFilterCount})
                </Button>
              )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No records</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                There are no student well-being records yet. Add a new record to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-left font-medium">Student Id</TableHead>
                    <TableHead className="text-left font-medium">Student</TableHead>
                    <TableHead className="text-left font-medium">Grade/Section</TableHead>
                    <TableHead className="text-left font-medium">Concern</TableHead>
                    <TableHead className="text-left font-medium">Consultation</TableHead>
                    <TableHead className="text-left font-medium">Action Taken</TableHead>
                    <TableHead className="text-left font-medium">Status</TableHead>
                    <TableHead className="text-left font-medium">Created Date</TableHead>
                    <TableHead className="text-right font-medium">Manage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.student_display_id ?? row.student_id ?? '—'}</TableCell>
                      <TableCell className="font-medium">{row.student_name}</TableCell>
                      <TableCell>
                        {(() => {
                          const text = (row.class ?? '').replace(/^Class\s+/i, '');
                          const display = text.length > 10 ? `${text.slice(0, 10)}...` : text;
                          return (
                            <span
                              className="block truncate max-w-[180px]"
                              title={text || undefined}
                            >
                              {display || '—'}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{row.concern}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordForConsultationDetails(row);
                            setConsultationDetailsOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/80 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-amber-700" />
                          <span>{(row.consultations?.length ?? 0) > 0 ? 'Yes' : 'No'}</span>
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">
                            {row.consultations?.length ?? 0}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordForActionDetails(row);
                            setActionDetailsOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/80 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors"
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-700" />
                          <span>{(row.actions?.length ?? 0) > 0 ? 'Yes' : 'No'}</span>
                          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-white">
                            {row.actions?.length ?? 0}
                          </span>
                        </button>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(row.status)}`}
                        >
                          {formatStatus(row.status)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(row.date_of_observation)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View audit trail"
                            onClick={() => {
                              setRecordForAudit(row);
                              setAuditDialogOpen(true);
                            }}
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="Actions">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setRecordToEdit(row);
                                setEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setRecordToView(row);
                                setViewDialogOpen(true);
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onSelect={(e) => {
                                e.preventDefault();
                                setRecordToDelete(row);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setRecordForConsultation(row);
                                setNewConsultationDialogOpen(true);
                              }}
                            >
                              <MessageSquare className="mr-2 h-4 w-4" />
                              New Consultation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={row.status === "closed"}
                              onSelect={(e) => {
                                e.preventDefault();
                                setRecordForAction(row);
                                setNewActionDialogOpen(true);
                              }}
                            >
                              <Zap className="mr-2 h-4 w-4" />
                              Action
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setRecordForFollowUp(row);
                                setNewFollowUpDialogOpen(true);
                              }}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Next Follow-up Date
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <NewWellBeingRecordDialog
        open={newRecordDialogOpen}
        onClose={() => setNewRecordDialogOpen(false)}
        onSuccess={loadRecords}
      />
      <EditWellBeingRecordDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setRecordToEdit(null);
        }}
        onSuccess={loadRecords}
        record={recordToEdit}
      />
      <ViewRecordDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setRecordToView(null);
        }}
        record={recordToView}
      />
      <NewConsultationDialog
        open={newConsultationDialogOpen}
        onClose={() => {
          setNewConsultationDialogOpen(false);
          setRecordForConsultation(null);
        }}
        onSuccess={loadRecords}
        record={recordForConsultation}
      />
      <ConsultationDetailsDialog
        open={consultationDetailsOpen}
        onClose={() => {
          setConsultationDetailsOpen(false);
          setRecordForConsultationDetails(null);
        }}
        record={recordForConsultationDetails}
      />
      <NewActionDialog
        open={newActionDialogOpen}
        onClose={() => {
          setNewActionDialogOpen(false);
          setRecordForAction(null);
        }}
        onSuccess={loadRecords}
        record={recordForAction}
      />
      <ActionDetailsDialog
        open={actionDetailsOpen}
        onClose={() => {
          setActionDetailsOpen(false);
          setRecordForActionDetails(null);
        }}
        record={recordForActionDetails}
      />
      <NewFollowUpEntryDialog
        open={newFollowUpDialogOpen}
        onClose={() => {
          setNewFollowUpDialogOpen(false);
          setRecordForFollowUp(null);
        }}
        onSuccess={loadRecords}
        record={recordForFollowUp}
      />
      <StudentWellbeingAuditDialog
        open={auditDialogOpen}
        onClose={() => {
          setAuditDialogOpen(false);
          setRecordForAudit(null);
        }}
        record={recordForAudit}
      />
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setRecordToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete well-being record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record for {recordToDelete?.student_name}? 
              <p className="mt-2 text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default StudentWellBeingPage;
