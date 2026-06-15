import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye, FileText, AlertCircle, UserCheck, Download, X } from 'lucide-react';
import TablePaginationBar from '@/components/common/TablePaginationBar';
import DebouncedSearchInput from '@/components/common/DebouncedSearchInput';
import { DatePicker } from '@/components/ui/date-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAssessmentAccess } from '@/hooks/assessments/useAssessmentAccess';
import AssessmentViewDialog from './view/AssessmentViewDialog';
import ReassignAssessmentDialog from './ReassignAssessmentDialog';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import Loader from '../common/Loader';
import { formatDate } from '@/lib/Dateformat';

interface AssessmentTemplate {
  questions: any;
}

interface Assessment {
  id: string;
  assessment_id: number;
  name: string;
  status: string;
  target_completion_date: string;
  created_by: string;
  assigned_to: string;
  template_id: string;
  created_at: string;
  score: number | null;
  answers: any[];
  client_id: string;
  creator_name: string;
  assignee_name: string;
  template?: { questions: any[] };
}

interface AssessmentStatusCounts {
  total: number;
  new: number;
  draft: number;
  submitted: number;
  completed: number;
}

interface AssessmentsTableProps {
  onDataLoaded?: (counts: AssessmentStatusCounts) => void;
}

const AssessmentsTable: React.FC<AssessmentsTableProps> = ({ onDataLoaded }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { hasAssessmentAdmin, currentUserEmployeeId, clientId } = useAssessmentAccess();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter metadata (loaded once on mount)
  const [allCreators, setAllCreators] = useState<{ id: string; name: string }[]>([]);
  const [allAssignees, setAllAssignees] = useState<{ id: string; name: string }[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [targetDateFrom, setTargetDateFrom] = useState<Date | undefined>(undefined);
  const [targetDateTo, setTargetDateTo] = useState<Date | undefined>(undefined);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<number[]>([]);
  const [downloadingBulkType, setDownloadingBulkType] = useState<'questions' | 'qa' | null>(null);
  const [showDownloadNotice, setShowDownloadNotice] = useState(false);
  const [pendingBulkDownloadType, setPendingBulkDownloadType] = useState<'questions' | 'qa' | null>(null);
  const [downloadNoticeStats, setDownloadNoticeStats] = useState({ total: 0, unanswered: 0 });
  const [selectedAssessmentForReassign, setSelectedAssessmentForReassign] = useState<{
    id: number;
    assignedTo: string | null;
    assigneeName: string;
  } | null>(null);
  const [isBulkBarPinned, setIsBulkBarPinned] = useState(false);
  const [bulkBarPlaceholderHeight, setBulkBarPlaceholderHeight] = useState(0);
  const [bulkBarFixedLeft, setBulkBarFixedLeft] = useState(0);
  const [bulkBarFixedWidth, setBulkBarFixedWidth] = useState(0);
  const bulkBarAnchorRef = useRef<HTMLDivElement | null>(null);

  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Stable refs so realtime handler never recreates
  const onDataLoadedRef = useRef(onDataLoaded);
  useEffect(() => { onDataLoadedRef.current = onDataLoaded; }, [onDataLoaded]);
  const fetchAssessmentsRef = useRef<(page: number, isMetaLoad?: boolean) => Promise<void>>(async () => {});
  const currentPageRef = useRef(1);
  const lastFetchTimeRef = useRef<number>(0);

  const assessmentIdFromUrl = searchParams.get('assessmentId');

  const activeFilterCount = [
    assessmentIdFromUrl,
    debouncedSearch,
    statusFilter !== 'all' ? statusFilter : '',
    createdByFilter !== 'all' ? createdByFilter : '',
    assignedToFilter !== 'all' ? assignedToFilter : '',
    targetDateFrom,
    targetDateTo
  ].filter(value => {
    if (!value) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }).length;

  // ── sync URL search param ──────────────────────────────────────────────────
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlAssessmentId = searchParams.get('assessmentId');
    if (urlAssessmentId) {
      setDebouncedSearch('');
    } else if (urlSearch) {
      setDebouncedSearch(urlSearch);
    }
  }, [searchParams]);

  // ── reset page when filters change ────────────────────────────────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, createdByFilter, assignedToFilter, targetDateFrom, targetDateTo, assessmentIdFromUrl]);

  // ── main fetch ─────────────────────────────────────────────────────────────
  const fetchAssessments = useCallback(async (page: number, isMetaLoad = false) => {
    lastFetchTimeRef.current = Date.now();
    if (!clientId || !currentUserEmployeeId) {
      setAssessments([]);
      setTotalCount(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('list-assessments', {
        body: {
          client_id: clientId,
          page,
          search: debouncedSearch,
          status: statusFilter,
          created_by: createdByFilter,
          assigned_to: assignedToFilter,
          target_date_from: targetDateFrom ? targetDateFrom.toISOString().split('T')[0] : null,
          target_date_to: targetDateTo ? targetDateTo.toISOString().split('T')[0] : null,
          assessment_id_url: assessmentIdFromUrl || null,
          is_admin: hasAssessmentAdmin,
          employee_id: currentUserEmployeeId,
          include_meta: isMetaLoad,
        },
      });

      if (fnError) throw fnError;

      setAssessments(data.assessments || []);
      setTotalCount(data.totalCount ?? 0);
      setTotalPages(data.totalPages ?? 1);
      setPageSize(data.pageSize ?? 10);

      if (isMetaLoad) {
        if (data.creators) setAllCreators(data.creators);
        if (data.assignees) setAllAssignees(data.assignees);
        if (data.statusCounts) {
          onDataLoadedRef.current?.(data.statusCounts);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching assessments:', error);
      setError('Failed to fetch assessments');
      toast.error('Failed to fetch assessments');
    } finally {
      setLoading(false);
    }
  }, [
    clientId,
    currentUserEmployeeId,
    hasAssessmentAdmin,
    debouncedSearch,
    statusFilter,
    createdByFilter,
    assignedToFilter,
    targetDateFrom,
    targetDateTo,
    assessmentIdFromUrl,
  ]);

  // Keep mutable refs in sync
  useEffect(() => { fetchAssessmentsRef.current = fetchAssessments; }, [fetchAssessments]);
  useEffect(() => { currentPageRef.current = currentPage; }, [currentPage]);

  
  const lastFetchKeyRef = useRef('');

  useEffect(() => {
    if (!clientId || !currentUserEmployeeId) {
      setLoading(false);
      return;
    }
    const fetchKey = [
      clientId,
      currentUserEmployeeId,
      String(hasAssessmentAdmin),
      currentPage,
      debouncedSearch,
      statusFilter,
      createdByFilter,
      assignedToFilter,
      targetDateFrom?.toISOString() ?? '',
      targetDateTo?.toISOString() ?? '',
      assessmentIdFromUrl ?? '',
    ].join('|');

    if (fetchKey === lastFetchKeyRef.current) return;
    lastFetchKeyRef.current = fetchKey;

    fetchAssessmentsRef.current(currentPage, true);
  }, [
    clientId,
    currentUserEmployeeId,
    hasAssessmentAdmin,
    currentPage,
    debouncedSearch,
    statusFilter,
    createdByFilter,
    assignedToFilter,
    targetDateFrom,
    targetDateTo,
    assessmentIdFromUrl,
  ]);

  // ── realtime ───────────────────────────────────────────────────────────────
  // Stable handler — never recreates, reads latest values via refs.
  // Skips if an explicit fetch happened within 1500 ms to avoid double-call.
  const stableRealtimeHandler = useCallback(() => {
    if (Date.now() - lastFetchTimeRef.current < 1500) return;
    fetchAssessmentsRef.current(currentPageRef.current, true);
  }, []);

  useRealTimeSubHook({
    channelName: `assessment-${clientId}`,
    events: '*',
    table: 'assessments',
    enabled: !!clientId,
    onPayload: stableRealtimeHandler,
  });

  // ── bulk bar sticky logic ──────────────────────────────────────────────────
  useEffect(() => {
    const headerOffset = 80;

    if (selectedAssessmentIds.length === 0) {
      setIsBulkBarPinned(false);
      setBulkBarPlaceholderHeight(0);
      return;
    }

    const anchor = bulkBarAnchorRef.current;
    if (!anchor) return;

    const updatePosition = () => {
      const rect = anchor.getBoundingClientRect();

      setBulkBarFixedLeft(rect.left);
      setBulkBarFixedWidth(rect.width);
      setBulkBarPlaceholderHeight(anchor.offsetHeight);
      setIsBulkBarPinned(rect.top <= headerOffset);
    };

    updatePosition();

    window.addEventListener('scroll', updatePosition, { passive: true });

    return () => {
      window.removeEventListener('scroll', updatePosition);
    };
  }, [selectedAssessmentIds.length]);

  const clearAllFilters = () => {
    setDebouncedSearch('');
    setStatusFilter('all');
    setCreatedByFilter('all');
    setAssignedToFilter('all');
    setTargetDateFrom(undefined);
    setTargetDateTo(undefined);
    if (searchParams.toString()) {
      navigate({ pathname: location.pathname, search: '' }, { replace: true });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'New': 'bg-blue-100 text-blue-800',
      'Draft': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Submitted': 'bg-purple-100 text-purple-800',
      'Completed': 'bg-green-100 text-green-800',
    };
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const calculateCompletionPercentage = (assessment: Assessment) => {
    const answers = Array.isArray(assessment.answers) ? assessment.answers : [];
    const questions = Array.isArray(assessment.template?.questions) ? assessment.template!.questions : [];
    if (questions.length === 0) return 0;
    const answered = answers.filter(a => a && typeof a === 'object' && a.answer !== undefined).length;
    return Math.round((answered / questions.length) * 100);
  };

  const handleAnswerQuestions = (id: number) => navigate(`/assessment/answer/${id}`);
  const handleView = (id: number) => { setSelectedAssessmentId(id); setViewDialogOpen(true); };
  const isAnswerButtonEnabled = (status: string) => status === 'New' || status === 'Draft';
  const isAssignedToCurrentUser = (assignedTo: string | null) => assignedTo === currentUserEmployeeId;
  const canReassignAssessment = (a: Assessment) => hasAssessmentAdmin && a.created_by === currentUserEmployeeId;

  const handleAssessmentUpdated = () => fetchAssessments(currentPage, true);
  const handleReassign = (a: Assessment) => {
    setSelectedAssessmentForReassign({ id: a.assessment_id, assignedTo: a.assigned_to, assigneeName: a.assignee_name || 'Unassigned' });
    setReassignDialogOpen(true);
  };

  // ── PDF helpers ────────────────────────────────────────────────────────────
  const getAnswerForQuestion = (assessment: Assessment, questionId: string | undefined, questionIndex: number) => {
    const answers = Array.isArray(assessment.answers) ? assessment.answers : [];
    if (questionId) {
      const byId = answers.find((a: any) => String(a?.questionId) === String(questionId));
      if (byId) return byId;
    }
    return answers.find((a: any) => {
      const match = String(a?.questionId || '').match(/^question_(\d+)_/);
      return match && parseInt(match[1], 10) === questionIndex;
    });
  };

  const buildAssessmentPdf = (assessment: Assessment, includeAnswers: boolean) => {
    const formatAnswer = (value: boolean | undefined) => {
      if (value === true) return 'Yes';
      if (value === false) return 'No';
      return 'Not answered';
    };

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const maxTextWidth = pageWidth - margin * 2;
    const lineHeight = 6;
    let cursorY = margin;

    const ensureSpace = (requiredHeight: number) => {
      if (cursorY + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        cursorY = margin;
      }
    };

    const addText = (text: string, fontSize = 11, style: 'normal' | 'bold' = 'normal') => {
      pdf.setFont('helvetica', style);
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text || '-', maxTextWidth);
      ensureSpace(lines.length * lineHeight);
      pdf.text(lines, margin, cursorY);
      cursorY += lines.length * lineHeight;
    };

    const addGap = (size = 4) => {
      cursorY += size;
    };

    const questions = Array.isArray(assessment.template?.questions) ? assessment.template?.questions : [];
    const shouldIncludeAnswers =
      includeAnswers && (assessment.status === 'Submitted' || assessment.status === 'Completed');

    addText('Assessment', 16, 'bold');
    addGap(1);
    addText(`Name: ${assessment.name || '-'}`, 11, 'bold');
    addGap(1);
    if (assessment.target_completion_date) {
      addText(`Due Date: ${formatDate(assessment.target_completion_date)}`, 10);
    }
    addGap(4);
    addText(shouldIncludeAnswers ? 'Questions & Answers' : 'Questions Only', 12, 'bold');
    addGap(2);

    questions.forEach((question: any, index: number) => {
      const answer = getAnswerForQuestion(assessment, question?.id, index);
      addText(`${index + 1}. ${question?.text || 'Untitled question'}${question?.required ? ' *' : ''}`, 11, 'bold');
      addGap(1);

      if (shouldIncludeAnswers) {
        addText(`Answer: ${formatAnswer(answer?.answer)}`, 10);
        if (answer?.comment) {
          addText(`Comment: ${answer.comment}`, 10);
        }
        if (Array.isArray(answer?.attachments) && answer.attachments.length > 0) {
          const attachmentNames = answer.attachments
            .map((attachment: any) => attachment?.name)
            .filter(Boolean)
            .join(', ');
          addText(`Attachments: ${attachmentNames || `${answer.attachments.length} file(s)`}`, 10);
        }
      } else {
        addText('Answer:', 10);
      }

      addGap(4);
    });

    const typeSuffix = includeAnswers && shouldIncludeAnswers ? 'questions_answers' : 'questions_only';
    const sanitizedName = (assessment.name || `assessment_${assessment.assessment_id}`)
      .replace(/[^a-z0-9]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();

    return {
      fileName: `${sanitizedName || `assessment_${assessment.assessment_id}`}_${typeSuffix}.pdf`,
      blob: pdf.output('blob'),
    };
  };

  const triggerBrowserDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const executeBulkDownload = async (includeAnswers: boolean) => {
    if (selectedAssessmentIds.length === 0) {
      toast.error('Please select at least one assessment');
      return;
    }

    const selectedAssessments = assessments.filter((assessment) =>
      selectedAssessmentIds.includes(assessment.assessment_id)
    );

    if (selectedAssessments.length === 0) {
      toast.error('No valid assessments selected');
      return;
    }

    setDownloadingBulkType(includeAnswers ? 'qa' : 'questions');
    try {
      const pdfFiles = selectedAssessments.map(a => buildAssessmentPdf(a, includeAnswers));
      if (pdfFiles.length <= 3) {
        pdfFiles.forEach((file) => {
          triggerBrowserDownload(file.blob, file.fileName);
        });
        toast.success(`Downloading ${pdfFiles.length} PDF file(s)`);
      } else {
        const zip = new JSZip();
        pdfFiles.forEach((file) => {
          zip.file(file.fileName, file.blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerBrowserDownload(zipBlob, `assessments_bulk_${Date.now()}.zip`);
        toast.success(`Downloading ${pdfFiles.length} PDFs as ZIP`);
      }
    } catch (error) {
      console.error('Error downloading bulk assessment PDF:', error);
      toast.error('Failed to generate bulk PDF');
    } finally {
      setDownloadingBulkType(null);
    }
  };

  const handleBulkDownload = (includeAnswers: boolean) => {
    if (!includeAnswers) {
      executeBulkDownload(false);
      return;
    }

    const selectedAssessments = assessments.filter((assessment) =>
      selectedAssessmentIds.includes(assessment.assessment_id)
    );

    const unansweredCount = selectedAssessments.filter(
      (assessment) => assessment.status !== 'Submitted' && assessment.status !== 'Completed'
    ).length;

    if (unansweredCount > 0) {
      setDownloadNoticeStats({
        total: selectedAssessments.length,
        unanswered: unansweredCount,
      });
      setPendingBulkDownloadType('qa');
      setShowDownloadNotice(true);
      return;
    }

    executeBulkDownload(true);
  };

  const handleSelectAssessment = (id: number, checked: boolean) => {
    setSelectedAssessmentIds(prev =>
      checked ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter(x => x !== id)
    );
  };

  const handleSelectAllOnPage = (checked: boolean) => {
    const pageIds = assessments.map(a => a.assessment_id);
    if (checked) {
      setSelectedAssessmentIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      setSelectedAssessmentIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const allOnPageSelected = assessments.length > 0 && assessments.every(a => selectedAssessmentIds.includes(a.assessment_id));
  const someOnPageSelected = assessments.some(a => selectedAssessmentIds.includes(a.assessment_id));


  // ── early returns ──────────────────────────────────────────────────────────
  if (!clientId) {
    return (
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Client Context Required</h3>
              <p className="text-gray-500">Please ensure you are logged in with a valid client context to view assessments.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (      
      <Loader text="Loading assessments..." />
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow overflow-visible">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Error Loading Assessments</h3>
              <p className="text-gray-500 mb-4">{error}</p>
              <Button onClick={() => fetchAssessments(currentPage, true)} variant="outline">Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Assessments</h2>
            {!hasAssessmentAdmin && (
              <Badge variant="outline" className="ml-2">
                Your Assessments Only
              </Badge>
            )}
          </div>

          {/* Enhanced Filters */}
          <div className="space-y-4">
            {/* First row - Search and Status */}
            <div className="flex gap-4">
              <DebouncedSearchInput
                value={debouncedSearch}
                onChange={(val) => { setDebouncedSearch(val); setCurrentPage(1); }}
                placeholder="Search assessments..."
                className="flex-1"
                triggerOnEnter
              />
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Second row - Created By, Assigned To, and Date Range */}
            <div className="flex gap-4 flex-wrap">
              <Select value={createdByFilter} onValueChange={v => { setCreatedByFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by creator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Creators</SelectItem>
                  {allCreators.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={assignedToFilter} onValueChange={v => { setAssignedToFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  {allAssignees.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <DatePicker
                  date={targetDateFrom}
                  onChange={d => { setTargetDateFrom(d); setCurrentPage(1); }}
                  placeholderText="Target date from"
                  className="w-52"
                />
                <DatePicker
                  date={targetDateTo}
                  onChange={d => { setTargetDateTo(d); setCurrentPage(1); }}
                  placeholderText="Target date to"
                  className="w-52"
                  disabledDates={(date) =>
                    targetDateFrom ? date < targetDateFrom : false
                  }
                />
              </div>

              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters ({activeFilterCount})
                </Button>
              )}
            </div>

          </div>
        </div>

        {selectedAssessmentIds.length > 0 && (
          <div ref={bulkBarAnchorRef} className="w-full">
            <div
              style={
                isBulkBarPinned
                  ? {
                      position: 'fixed',
                      top: '5rem',
                      left: `${bulkBarFixedLeft}px`,
                      width: `${bulkBarFixedWidth}px`,
                      zIndex: 30,
                    }
                  : undefined
              }
              className="bg-blue-50 border rounded-md shadow-sm"
            >
            
              <div className="px-6 py-2 flex items-center justify-between gap-3">
              
              <p className="text-sm text-blue-700">
                {selectedAssessmentIds.length} assessments selected
              </p>

                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="flex items-center gap-1 bg-sky-600 hover:bg-sky-700"
                      disabled={downloadingBulkType !== null}
                    >
                        <Download className="h-3.5 w-3.5" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-64">
                      <DropdownMenuItem
                        onClick={() => handleBulkDownload(false)}
                        disabled={downloadingBulkType !== null}
                        className="cursor-pointer"
                      >
                        <FileText className="h-4 w-4 mr-2 text-blue-600" />
                        <div className="flex flex-col">
                          <span>Questions Only</span>
                          <span className="text-xs text-muted-foreground">
                            Download selected assessments as PDF
                          </span>
                        </div>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleBulkDownload(true)}
                        disabled={downloadingBulkType !== null}
                        className="cursor-pointer"
                      >
                        <FileText className="h-4 w-4 mr-2 text-emerald-600" />
                        <div className="flex flex-col">
                          <span>Questions & Answers</span>
                          <span className="text-xs text-muted-foreground">
                            Submitted/Completed assessments include answers in PDF
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAssessmentIds([])}
                  className="text-blue-700 hover:text-blue-800"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                  </Button>
                </div>

              </div>
            </div>

          {isBulkBarPinned && (
            <div style={{ height: bulkBarPlaceholderHeight }} aria-hidden="true" />
          )}
          </div>
        )}

        <div className="p-0">
          {assessments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No assessments found matching your filters</p>
            </div>
          ) : (
            <>
            {/* Table Container */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allOnPageSelected ? true : someOnPageSelected ? 'indeterminate' : false}
                          onCheckedChange={checked => handleSelectAllOnPage(checked === true)}
                          aria-label="Select all on this page"
                          className="border-gray-400 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                        />
                      </TableHead>

                      <TableHead>Assessment Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Target Date</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map(assessment => (
                      <TableRow key={assessment.assessment_id}>
                        <TableCell className="w-10">
                          <Checkbox
                          checked={selectedAssessmentIds.includes(
                            assessment.assessment_id
                          )}
                          onCheckedChange={(checked) =>
                            handleSelectAssessment(
                              assessment.assessment_id,
                              checked === true
                            )
                          }
                          aria-label={`Select assessment ${assessment.name}`}
                            className="border-gray-400 data-[state=checked]:bg-sky-600 data-[state=checked]:border-sky-600"
                          />
                        </TableCell>

                        <TableCell className="font-medium">
                        <div
                          className="max-w-[200px] truncate"
                          title={assessment.name}
                        >
                          {assessment.name}
                        </div>
                        </TableCell>

                        <TableCell>{getStatusBadge(assessment.status)}</TableCell>

                        <TableCell>
                        <span className="font-medium">
                          {calculateCompletionPercentage(assessment)}%
                        </span>
                        </TableCell>
                        <TableCell>
                        {formatDate(assessment.target_completion_date)}
                        </TableCell>
                        <TableCell>
                        <div className="max-w-[150px] truncate" title={assessment.creator_name}>
                          {assessment.creator_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate" title={assessment.assignee_name}>
                          {assessment.assignee_name}
                        </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                          {/* Only show Answer button if user is assigned to this assessment */}
                            {isAssignedToCurrentUser(assessment.assigned_to) && (
                              <Button
                              variant="outline"
                              size="sm"
                                onClick={() => handleAnswerQuestions(assessment.assessment_id)}
                                disabled={!isAnswerButtonEnabled(assessment.status)}
                              className={`${
                                isAnswerButtonEnabled(assessment.status)
                                  ? 'text-blue-600 hover:text-blue-700'
                                  : 'text-gray-400 cursor-not-allowed opacity-50'
                              }`}
                              >
                              <FileText className="h-4 w-4 mr-1" />
                              Answer
                              </Button>
                            )}
                          
                          {/* Show Reassign button only for admins and their own assessments */}
                            {canReassignAssessment(assessment) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReassign(assessment)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                            )}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(assessment.assessment_id)}
                            className="text-green-600 hover:text-green-700"
                          >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <TablePaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                itemLabel="assessments"
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Assessment View Dialog */}
      <AssessmentViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        assessmentId={selectedAssessmentId || 0}
        onAssessmentUpdated={handleAssessmentUpdated}
      />

      {/* Reassign Assessment Dialog */}
      {selectedAssessmentForReassign && (
        <ReassignAssessmentDialog
          open={reassignDialogOpen}
          onOpenChange={setReassignDialogOpen}
          assessmentId={selectedAssessmentForReassign.id}
          currentAssigneeId={selectedAssessmentForReassign.assignedTo}
          currentAssigneeName={selectedAssessmentForReassign.assigneeName}
          onReassignSuccess={handleAssessmentUpdated}
        />
      )}

      <AlertDialog open={showDownloadNotice} onOpenChange={setShowDownloadNotice}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Download Notice</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700 pt-2">
              You selected <strong>{downloadNoticeStats.total}</strong> assessments, but{' '}
              <strong>{downloadNoticeStats.unanswered}</strong> of them have not been answered yet.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-md border bg-blue-50 p-3 text-blue-700 text-sm">
            The unanswered assessments will be downloaded with <strong>questions only</strong>.
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingBulkDownloadType(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-sky-600 hover:bg-sky-700"
              onClick={() => {
                if (pendingBulkDownloadType === 'qa') {
                  executeBulkDownload(true);
                } else if (pendingBulkDownloadType === 'questions') {
                  executeBulkDownload(false);
                }
                setPendingBulkDownloadType(null);
              }}
            >
              Continue Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AssessmentsTable;
