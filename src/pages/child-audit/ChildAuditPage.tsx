import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Layout from '@/components/layout/Layout';
import {
  ArrowLeft,
  Check,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Search,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts';
import Loader from '@/components/common/Loader';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  fetchChildAuditStudents,
  type ChildAuditStudentRow,
} from '@/services/child-audit/childAuditStudentsService';
import {
  fetchChildAuditStudentDetails,
  type ChildAuditCheckTypeDetail,
  type ChildAuditLatestSelection,
} from '@/services/child-audit/childAuditStudentDetailsService';
import { pdf } from "@react-pdf/renderer";
import ChildAuditReportPDF from '@/pages/child-audit/ChildAuditReportpdf';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';
import { type FileItem } from '@/types/fileTypes';
import { DESCRIPTION_MAX_LENGTH } from '@/components/constants';
import { formatDate } from '@/lib/Dateformat';

type TabKey = 'check' | 'calendar' | 'audit' | 'report';
type ChildAuditLookupItem = {
  id: string;
  name: string;
  active: boolean;
  definition?: string | null;
};

type ChildAuditLookups = {
  checkTypes: ChildAuditLookupItem[];
  physicalConditions: ChildAuditLookupItem[];
  behaviours: ChildAuditLookupItem[];
  meltdowns: ChildAuditLookupItem[];
  aggressions: ChildAuditLookupItem[];
};

type ChildAuditRecord = {
  id: string;
  client_id: string;
  student_id: string;
  employee_id: string | null;
  check_type_id: string | null;
  physical_condition_ids: string[];
  physical_where?: Record<string, string[]>;
  behaviour_ids: string[];
  meltdown_occurred: boolean;
  meltdown_definition: string[];
  aggression_ids: string[];
  notes: string | null;
  attachments?: Array<{
    id: string;
    bucket: string;
    file_path: string;
    file_name: string;
    mime_type: string | null;
    file_size: number | null;
    signed_url: string | null;
  }>;
  created_at: string;
  updated_at: string;
};

type CreateChildAuditRecordPayload = Omit<
  ChildAuditRecord,
  'id' | 'created_at' | 'updated_at' | 'attachments'
> & {
  attachments?: Array<{
    file_name: string;
    mime_type?: string | null;
    file_size?: number | null;
    base64: string;
  }>;
};

type ChildAuditEdgeResponse = {
  ok: boolean;
  version?: number;
  data?: ChildAuditRecord[];
  record?: ChildAuditRecord;
  error?: string;
  message?: string;
};

type CheckSelectionState = {
  physical_condition_ids: string[];
  behaviour_ids: string[];
  aggression_ids: string[];
  meltdown_occurred: boolean;
  meltdown_definition: string[];
  notes: string | null;
  physical_where: Record<string, string[]>;
};

const DEFAULT_LOOKUPS: ChildAuditLookups = {
  checkTypes: [],
  physicalConditions: [],
  behaviours: [],
  meltdowns: [],
  aggressions: [],
};

const normalizeGroupKey = (value: string | null | undefined) =>
  (value ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/\//g, '_')
    .replace(/[^a-z0-9_]/g, '');

const toLookupItems = (
  rows: Array<{ id: string; label: string; active: boolean; definition?: string | null }>
): ChildAuditLookupItem[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.label,
    active: row.active,
    definition: row.definition ?? null,
  }));

const toItemGroupTitle = (itemGroup: string | null | undefined) => {
  const value = (itemGroup ?? '').trim();
  if (!value) return 'General';

  const labelMap: Record<string, string> = {
    physical_condition: 'Physical Condition',
    incidents_at_home: 'Incidents at Home',
    sleep_quality_home: 'Sleep Quality (Home)',
    morning_behaviour_home: 'Morning Behaviour at Home',
    health_medical: 'Health / Medical',
    behaviour_mood: 'Behaviour / Mood',
    school_incidents: 'School Incidents',
    hostel_incidents: 'Hostel Incidents',
    sleep_hostel: 'Sleep (Hostel)',
    night_behaviour: 'Night Behaviour',
    daily_living: 'Daily Living',
    safety_observations: 'Safety Observations',
    aggression: 'Aggression',
    meltdown: 'Meltdown',
  };

  const normalized = normalizeGroupKey(value);
  if (labelMap[normalized]) return labelMap[normalized];

  return value
    .split('_')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
};

const getItemGroupIcon = (itemGroup: string | null | undefined) => {
  const key = normalizeGroupKey(itemGroup);
  const iconMap: Record<string, string> = {
    physical_condition: '🩹',
    incidents_at_home: '🏠',
    sleep_quality_home: '😴',
    morning_behaviour_home: '🌅',
    health_medical: '🏥',
    behaviour_mood: '👁',
    school_incidents: '🏫',
    hostel_incidents: '🏠',
    sleep_hostel: '🌙',
    night_behaviour: '🌙',
    daily_living: '🧩',
    safety_observations: '⚠️',
    aggression: '⚡',
    meltdown: '🔥',
  };
  return iconMap[key] ?? '📋';
};

const mapLookupsFromCheckTypes = (
  checkTypes: ChildAuditCheckTypeDetail[],
  selectedCheckTypeId: string | null
): ChildAuditLookups => {
  const checkTypeItems = checkTypes.map((checkType) => ({
    id: checkType.id,
    name: checkType.type,
    active: checkType.active,
  }));

  const target =
    checkTypes.find((checkType) => checkType.id === selectedCheckTypeId) ??
    checkTypes.find((checkType) => checkType.active) ??
    null;

  if (!target) {
    return {
      checkTypes: checkTypeItems,
      physicalConditions: [],
      behaviours: [],
      meltdowns: [],
      aggressions: [],
    };
  }

  const groups = target.lookup_groups ?? [];
  const valuesByGroup = groups.map((group) => ({
    key: normalizeGroupKey(group.item_group),
    values: group.values ?? [],
  }));

  const collect = (groupKeys: string[]) =>
    valuesByGroup
      .filter((group) => groupKeys.includes(group.key))
      .flatMap((group) => group.values);

  return {
    checkTypes: checkTypeItems,
    physicalConditions: toLookupItems(collect(['physical_condition'])),
    behaviours: toLookupItems(
      valuesByGroup
        .filter((group) => !['physical_condition', 'aggression', 'meltdown'].includes(group.key))
        .flatMap((group) => group.values)
    ),
    meltdowns: toLookupItems(collect(['meltdown'])),
    aggressions: toLookupItems(collect(['aggression'])),
  };
};

const toDateLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const toTimeLabel = (value: string) =>
  new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const getMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const getDayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const BODY_PART_OPTIONS = [
  'Head',
  'Face',
  'Neck',
  'Left Arm',
  'Right Arm',
  'Left Hand',
  'Right Hand',
  'Chest',
  'Back',
  'Stomach',
  'Left Leg',
  'Right Leg',
  'Left Foot',
  'Right Foot',
];
const DEFAULT_PHYSICAL_DEFINITION = JSON.stringify(BODY_PART_OPTIONS);

const getCampusType = (campus: string | null) => {
  const value = (campus ?? '').toLowerCase();
  if (value.includes('hostel')) return 'Hostel';
  if (value.includes('day')) return 'Day Scholar';
  return campus || 'School';
};

const getCheckTypeIcon = (name: string) => {
  const key = name.toLowerCase();
  if (key.includes('morning')) return '🌅';
  if (key.includes('evening')) return '🌆';
  if (key.includes('school')) return '🏫';
  if (key.includes('hostel')) return '🏠';
  return '📋';
};

const getFactorStyle = (name: string) => {
  const key = name.toLowerCase();
  if (key.includes('scratch') || key.includes('bruise') || key.includes('injury') || key.includes('swelling')) {
    return { title: 'Physical / Injuries', icon: '🚨', textClass: 'text-red-700' };
  }
  if (key.includes('sleep') || key.includes('wake')) {
    return { title: 'Sleep Issues', icon: '🌙', textClass: 'text-emerald-700' };
  }
  if (key.includes('aggressive') || key.includes('hitting') || key.includes('biting') || key.includes('toward')) {
    return { title: 'Aggression', icon: '⚡', textClass: 'text-orange-700' };
  }
  if (key.includes('meltdown')) {
    return { title: 'Meltdowns', icon: '🔥', textClass: 'text-amber-700' };
  }
  if (key.includes('bandage') || key.includes('health') || key.includes('med')) {
    return { title: 'Health / Medical', icon: '🩺', textClass: 'text-teal-700' };
  }
  return { title: 'Behaviour / Mood', icon: '👁', textClass: 'text-slate-700' };
};

const toAuditDateHeader = (value: string) =>
  new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();

const fetchChildAuditRecordsByStudent = async (
  clientId: string,
  studentId: string
): Promise<ChildAuditRecord[]> => {
  const { data, error } = await supabase.functions.invoke<ChildAuditEdgeResponse>('child-audit-save-check', {
    body: {
      action: 'fetch_records',
      client_id: clientId,
      student_id: studentId,
    },
  });

  if (error) throw new Error(error.message ?? 'Failed to fetch child audit records');
  if (!data?.ok || !Array.isArray(data.data)) {
    throw new Error(data?.message ?? data?.error ?? 'Invalid response from child-audit-save-check');
  }

  return data.data;
};

const createChildAuditRecord = async (payload: CreateChildAuditRecordPayload): Promise<ChildAuditRecord> => {
  const { data, error } = await supabase.functions.invoke<ChildAuditEdgeResponse>('child-audit-save-check', {
    body: {
      action: 'save_check',
      client_id: payload.client_id,
      student_id: payload.student_id,
      employee_id: payload.employee_id,
      check_type_id: payload.check_type_id,
      physical_condition_ids: payload.physical_condition_ids,
      behaviour_ids: payload.behaviour_ids,
      aggression_ids: payload.aggression_ids,
      meltdown_occurred: payload.meltdown_occurred,
      meltdown_definition: payload.meltdown_definition ?? [],
      notes: payload.notes,
      physical_where: payload.physical_where ?? {},
      attachments: payload.attachments ?? [],
    },
  });

  if (error) throw new Error(error.message ?? 'Failed to save child audit check');
  if (!data?.ok || !data.record) {
    throw new Error(data?.message ?? data?.error ?? 'Invalid response from child-audit-save-check');
  }

  return data.record;
};

const ChildAuditPage = () => {
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<ChildAuditStudentRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<ChildAuditStudentRow | null>(null);
  const [checkTypeDetails, setCheckTypeDetails] = useState<ChildAuditCheckTypeDetail[]>([]);

  const [lookups, setLookups] = useState<ChildAuditLookups>(DEFAULT_LOOKUPS);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [records, setRecords] = useState<ChildAuditRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('check');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const [selectedCheckType, setSelectedCheckType] = useState<string | null>(null);
  const [selectedPhysical, setSelectedPhysical] = useState<string[]>([]);
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([]);
  const [selectedAggressions, setSelectedAggressions] = useState<string[]>([]);
  const [meltdownOccurred, setMeltdownOccurred] = useState(false);
  const [meltdownDefinition, setMeltdownDefinition] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [physicalWhere, setPhysicalWhere] = useState<Record<string, string[]>>({});
  const [attachments, setAttachments] = useState<FileItem[]>([]);
  const [attachmentUploaderKey, setAttachmentUploaderKey] = useState(0);
  const [auditDateSort, setAuditDateSort] = useState<'asc' | 'desc'>('desc');
  const [auditTypeSort, setAuditTypeSort] = useState<'asc' | 'desc'>('asc');
  const [downloading, setDownloading] = useState(false);
  
  const EMPTY_INITIAL_FILES = useMemo<FileItem[]>(() => [], []);

  const parseWhereOptions = useCallback((definition?: string | null): string[] => {
    if (!definition) return BODY_PART_OPTIONS;
    const trimmed = definition.trim();
    if (!trimmed) return BODY_PART_OPTIONS;

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const values = parsed
          .filter((value) => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean);
        return values.length > 0 ? values : BODY_PART_OPTIONS;
      }
    } catch {
      // Fallback to comma-separated format
    }

    const csvValues = trimmed
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    return csvValues.length > 0 ? csvValues : BODY_PART_OPTIONS;
  }, []);

  const applySelectionState = useCallback((selection: CheckSelectionState | null) => {
    if (!selection) {
      setSelectedPhysical([]);
      setSelectedBehaviours([]);
      setSelectedAggressions([]);
      setMeltdownOccurred(false);
      setMeltdownDefinition([]);
      setNotes('');
      setPhysicalWhere({});
      return;
    }

    setSelectedPhysical(selection.physical_condition_ids ?? []);
    setSelectedBehaviours(selection.behaviour_ids ?? []);
    setSelectedAggressions(selection.aggression_ids ?? []);
    setMeltdownOccurred(selection.meltdown_occurred === true);
    setMeltdownDefinition(selection.meltdown_definition ?? []);
    setNotes(selection.notes ?? '');
    setPhysicalWhere(selection.physical_where ?? {});
  }, []);


  const savedSelectionByCheckType = useMemo(() => {
    const byCheckType = new Map<string, CheckSelectionState>();
    for (const record of records) {
      if (!record.check_type_id || byCheckType.has(record.check_type_id)) continue;
      byCheckType.set(record.check_type_id, {
        physical_condition_ids: record.physical_condition_ids ?? [],
        behaviour_ids: record.behaviour_ids ?? [],
        aggression_ids: record.aggression_ids ?? [],
        meltdown_occurred: record.meltdown_occurred === true,
        meltdown_definition: record.meltdown_definition ?? [],
        notes: record.notes ?? null,
        physical_where: record.physical_where ?? {},
      });
    }
    return byCheckType;
  }, [records]);

  const handleCheckTypeChange = useCallback(
    (nextId: string | null) => {
      setSelectedCheckType(nextId);
      if (!nextId) {
        applySelectionState(null);
        return;
      }

      const savedSelection = savedSelectionByCheckType.get(nextId) ?? null;
      applySelectionState(savedSelection);
    },
    [applySelectionState, savedSelectionByCheckType]
  );
  const [isHeaderPinned, setIsHeaderPinned] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [headerLeft, setHeaderLeft] = useState(0);
  const [headerWidth, setHeaderWidth] = useState(0);

  const headerRef = useRef<HTMLDivElement | null>(null);
  const lookupMap = useMemo(() => {
    const map = new Map<string, string>();
    [...lookups.checkTypes, ...lookups.physicalConditions, ...lookups.behaviours, ...lookups.aggressions].forEach(
      (item) => map.set(item.id, item.name)
    );
    return map;
  }, [lookups]);

  const checkTypeById = useMemo(() => {
    const map = new Map<string, { label: string; icon: string }>();
    for (const item of lookups.checkTypes) {
      map.set(item.id, { label: item.name, icon: getCheckTypeIcon(item.name) });
    }
    return map;
  }, [lookups.checkTypes]);

  const lookupMetadataById = useMemo(() => {
    const map = new Map<string, { label: string; item_group: string | null }>();
    for (const checkType of checkTypeDetails) {
      for (const group of checkType.lookup_groups ?? []) {
        for (const value of group.values ?? []) {
          map.set(value.id, {
            label: value.label,
            item_group: group.item_group ?? value.item_group ?? null,
          });
        }
      }
    }
    return map;
  }, [checkTypeDetails]);
  

  const selectedCheckTypeGroups = useMemo(() => {
    const target =
      checkTypeDetails.find((checkType) => checkType.id === selectedCheckType) ??
      checkTypeDetails.find((checkType) => checkType.active) ??
      null;
    if (!target) return [];

    return (target.lookup_groups ?? [])
      .map((group) => ({
        key: normalizeGroupKey(group.item_group),
        item_group: group.item_group,
        title: toItemGroupTitle(group.item_group),
        icon: getItemGroupIcon(group.item_group),
        items: toLookupItems(group.values ?? []),
      }))
      .filter((group) => group.items.length > 0);
  }, [checkTypeDetails, selectedCheckType]);

  const dynamicBehaviourGroups = useMemo(
    () =>
      selectedCheckTypeGroups.filter(
        (group) => !['physical_condition', 'aggression', 'meltdown'].includes(group.key)
      ),
    [selectedCheckTypeGroups]
  );

  const loadStudents = useCallback(async () => {
    if (!clientId) {
      setStudents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchChildAuditStudents(clientId);
      setStudents(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load Child Audit');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadStudentRecords = useCallback(async () => {
    if (!clientId || !selectedStudent) {
      setRecords([]);
      setCheckTypeDetails([]);
      setLookups(DEFAULT_LOOKUPS);
      setDetailLoading(false);
      return;
    }
    setDetailLoading(true);
    setRecordsLoading(true);
    try {
      const [rows, detail] = await Promise.all([
        fetchChildAuditRecordsByStudent(clientId, selectedStudent.id),
        fetchChildAuditStudentDetails(clientId, selectedStudent.id),
      ]);
      setRecords(rows);
      setCheckTypeDetails(detail.checkTypes);
      setLookups(mapLookupsFromCheckTypes(detail.checkTypes, null));

      const applyLatestSelection = (latest: ChildAuditLatestSelection | null) => {
        if (!latest) {
          if (detail.checkTypes.length > 0) {
            const firstCheckTypeId = detail.checkTypes[0].id;
            setSelectedCheckType((prev) => prev ?? firstCheckTypeId);
          }
          return;
        }

        setSelectedCheckType(latest.check_type_id);
        applySelectionState({
          physical_condition_ids: latest.physical_condition_ids ?? [],
          behaviour_ids: latest.behaviour_ids ?? [],
          aggression_ids: latest.aggression_ids ?? [],
          meltdown_occurred: latest.meltdown_occurred === true,
          meltdown_definition: latest.meltdown_definition ?? [],
          notes: latest.notes ?? null,
          physical_where: latest.physical_where ?? {},
        });
      };

      applyLatestSelection(detail.latestSelection);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load audit records');
      setRecords([]);
      setCheckTypeDetails([]);
      setLookups(DEFAULT_LOOKUPS);
    } finally {
      setDetailLoading(false);
      setRecordsLoading(false);
    }
  }, [applySelectionState, clientId, selectedStudent]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadStudentRecords();
  }, [loadStudentRecords]);

  useEffect(() => {
    if (!checkTypeDetails.length) return;
    setLookups(mapLookupsFromCheckTypes(checkTypeDetails, selectedCheckType));
  }, [checkTypeDetails, selectedCheckType]);

  useEffect(() => {
    const headerOffset = 80;

    if (!checkTypeDetails.length) return;

    const header = headerRef.current;
    if (!header) return;

    const updatePosition = () => {
      const rect = header.getBoundingClientRect();

      setHeaderLeft(rect.left);
      setHeaderWidth(rect.width);
      setHeaderHeight(header.offsetHeight);

      setIsHeaderPinned(rect.top <= headerOffset);
    };

    const timeout = setTimeout(() => {
      updatePosition();
    }, 0);

    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition); 

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [selectedStudent, checkTypeDetails]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    const normalizedQuery = q.replace(/[-_/]/g, ' ');
    return students.filter((r) => {
      const id = (r.student_id ?? '').toLowerCase();
      const name = (r.name ?? '').toLowerCase();
      const gs = (r.grade_section ?? '').toLowerCase();
      const grade = (r.grade ?? '').toLowerCase();
      const section = (r.section ?? '').toLowerCase();
      const gsNormalized = gs.replace(/[-_/]/g, ' ');
      const combined = `${grade} ${section}`.trim();
      return (
        id.includes(q) ||
        name.includes(q) ||
        gs.includes(q) ||
        gsNormalized.includes(normalizedQuery) ||
        grade.includes(q) ||
        section.includes(q) ||
        combined.includes(normalizedQuery)
      );
    });
  }, [students, search]);

  const recentRecord = records[0];
  const selectedCheckTypeRecord = useMemo(
    () => records.find((record) => record.check_type_id === selectedCheckType) ?? null,
    [records, selectedCheckType]
  );
  const savedAttachments = selectedCheckTypeRecord?.attachments ?? [];

  const calendarIndicators = useMemo(() => {
    const month = calendarMonth;
    const monthKey = getMonthKey(month);
    return records
      .filter((r) => getMonthKey(new Date(r.created_at)) === monthKey)
      .map((r) => {
        const d = new Date(r.created_at);
        return {
          date: d,
          hasInjury: r.physical_condition_ids.length > 0,
          hasAggression: r.aggression_ids.length > 0,
          hasMeltdown: r.meltdown_occurred,
        };
      });
  }, [records, calendarMonth]);

  const selectedDayRecords = useMemo(() => {
    if (!selectedDate) return [];
    const key = selectedDate.toDateString();
    return records.filter((r) => new Date(r.created_at).toDateString() === key);
  }, [records, selectedDate]);

  const calendarGrid = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstWeekday = first.getDay(); // 0 sun
    const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    return Array.from({ length: totalCells }, (_, i) => {
      const dayNum = i - firstWeekday + 1;
      if (dayNum < 1 || dayNum > daysInMonth) return null;
      return new Date(y, m, dayNum);
    });
  }, [calendarMonth]);

  const monthDaySummary = useMemo(() => {
    const map = new Map<
      string,
      { injury: boolean; sleep: boolean; aggression: boolean; meltdown: boolean; health: boolean }
    >();
    calendarIndicators.forEach(({ date, hasInjury, hasAggression, hasMeltdown }) => {
      const key = getDayKey(date);
      const prev = map.get(key) ?? { injury: false, sleep: false, aggression: false, meltdown: false, health: false };
      const related = records.filter((r) => getDayKey(new Date(r.created_at)) === key);
      const hasSleep = related.some((r) =>
        r.behaviour_ids.some((id) => (lookupMap.get(id) ?? '').toLowerCase().includes('sleep'))
      );
      map.set(key, {
        injury: prev.injury || hasInjury,
        sleep: prev.sleep || hasSleep,
        aggression: prev.aggression || hasAggression,
        meltdown: prev.meltdown || hasMeltdown,
        health: prev.health || related.some((r) => (r.notes ?? '').toLowerCase().includes('medic')),
      });
    });
    return map;
  }, [calendarIndicators, records, lookupMap]);

  const handleDownload = async () => {
    if (!selectedStudent) return;

    if (monthReport.checks === 0) {
      toast.error("No data available for this month");
      return;
    }

    try {
      setDownloading(true);

      const blob = await pdf(
        <ChildAuditReportPDF
          student={selectedStudent}
          monthReport={monthReport}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedStudent.name}_Report.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const monthReport = useMemo(() => {
  const month = calendarMonth;
  const monthKey = getMonthKey(month);
  const monthRows = records.filter((r) => getMonthKey(new Date(r.created_at)) === monthKey);
  const distribution = new Map<
    string,
    { title: string; icon: string; textClass: string; total: number; items: Map<string, number> }
  >();
  const ensureBucket = (title: string, icon: string, textClass: string) => {
    const existing = distribution.get(title);
    if (existing) return existing;
    const created = { title, icon, textClass, total: 0, items: new Map<string, number>() };
    distribution.set(title, created);
    return created;
  };
  const addItem = (title: string, icon: string, textClass: string, itemLabel: string) => {
    const bucket = ensureBucket(title, icon, textClass);
    bucket.total += 1;
    bucket.items.set(itemLabel, (bucket.items.get(itemLabel) ?? 0) + 1);
  };

  monthRows.forEach((r) => {
    r.physical_condition_ids.forEach((id) => {
        const label = lookupMap.get(id) ?? 'Physical';
      const bodyParts = r.physical_where?.[id] ?? [];
        const whereSuffix = bodyParts.length > 0 ? ` (${bodyParts.join(', ')})` : '';
      const style = getFactorStyle(label);
      addItem(style.title, style.icon, style.textClass, `${label}${whereSuffix}`);
    });
    r.behaviour_ids.forEach((id) => {
        const label = lookupMap.get(id) ?? 'Behaviour';
      const style = getFactorStyle(label);
      addItem(style.title, style.icon, style.textClass, label);
    });
    r.aggression_ids.forEach((id) => {
        const label = lookupMap.get(id) ?? 'Aggression';
      const style = getFactorStyle(label);
      addItem(style.title, style.icon, style.textClass, label);
    });
    if (r.meltdown_occurred) {
        const style = getFactorStyle('meltdown');
        addItem(style.title, style.icon, style.textClass, 'Meltdown occurred');
    }
  });

  const sectionOrder = [
      'Physical / Injuries',
      'Sleep Issues',
      'Aggression',
      'Meltdowns',
      'Health / Medical',
      'Behaviour / Mood',
  ];
  const sections = sectionOrder
    .map((title) => distribution.get(title))
      .filter((value): value is { title: string; icon: string; textClass: string; total: number; items: Map<string, number> } => Boolean(value))
    .map((bucket) => ({
        ...bucket,
        chips: Array.from(bucket.items.entries()).sort((a, b) => b[1] - a[1]),
    }));
  const logs = monthRows.map((r) => ({
    date: toDateLabel(r.created_at),
    time: toTimeLabel(r.created_at),
    type: checkTypeById.get(r.check_type_id ?? "")?.label || "-",
    injury:
    r.physical_condition_ids.length > 0
      ? r.physical_condition_ids
          .map((id) => lookupMap.get(id))
          .filter(Boolean)       
          .join(", ") || "-"
      : "-",
    meltdown: r.meltdown_occurred ? "Yes" : "-",
    observation:
    r.behaviour_ids.length > 0
      ? r.behaviour_ids
          .map((id) => lookupMap.get(id))
          .filter(Boolean)         
          .join(", ") || "-"
      : "-",
    notes: r.notes || "-",
  }));

const getTopItems = (items: Map<string, number>) =>
  Array.from(items.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label);

const findSection = (title: string) =>
  sections.find((s) => s.title === title);

const sleepSection = findSection("Sleep Issues");
const injurySection = findSection("Physical / Injuries");
const behaviourSection = findSection("Behaviour / Mood");
const healthSection = findSection("Health / Medical");
const meltdownSection = findSection("Meltdowns");

const diagnostics = {
  sleep: sleepSection
    ? {
        total: sleepSection.total,
        common: [{ label: getTopItems(sleepSection.items)[0] }],
      }
    : null,

  injury: injurySection
    ? {
        total: injurySection.total,
        types: getTopItems(injurySection.items).map((t) => ({ label: t })),
      }
    : null,

  behaviour: behaviourSection
    ? {
        total: behaviourSection.total,
        common: getTopItems(behaviourSection.items).map((t) => ({ label: t })),
      }
    : null,

  health: healthSection
    ? {
        total: healthSection.total,
        issues: getTopItems(healthSection.items).map((t) => ({ label: t })),
      }
    : null,

  meltdown: meltdownSection
    ? {
        total: meltdownSection.total,
        durationBreakdown: [
          { label: "< 5 minutes", count: 1 },
          { label: "5–15 minutes", count: 1 },
        ],
      }
    : null,
};
  return {
    checks: monthRows.length,
    injuryDays: monthRows.filter((r) => r.physical_condition_ids.length > 0).length,
    meltdowns: monthRows.filter((r) => r.meltdown_occurred).length,
    sections, 
    logs,     
    ...diagnostics,
  };
}, [records, calendarMonth, lookupMap, checkTypeById]);

  const auditTimelineGroups = useMemo(() => {
    const sortedRows = [...records].sort((a, b) => {
      const dateDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (dateDiff !== 0) return auditDateSort === 'asc' ? dateDiff : -dateDiff;
      const typeA = checkTypeById.get(a.check_type_id ?? '')?.label ?? '';
      const typeB = checkTypeById.get(b.check_type_id ?? '')?.label ?? '';
      const typeDiff = typeA.localeCompare(typeB);
      if (typeDiff !== 0) return auditTypeSort === 'asc' ? typeDiff : -typeDiff;
      return 0;
    });

    const grouped = new Map<string, ChildAuditRecord[]>();
    for (const row of sortedRows) {
      const key = getDayKey(new Date(row.created_at));
      const list = grouped.get(key) ?? [];
      list.push(row);
      grouped.set(key, list);
    }

    return Array.from(grouped.entries()).map(([dayKey, dayRows]) => ({
      dayKey,
      title: toAuditDateHeader(dayRows[0].created_at),
      rows: dayRows,
    }));
  }, [records, auditDateSort, auditTypeSort, checkTypeById]);

  const toggleItem = (items: string[], id: string) =>
    items.includes(id) ? items.filter((value) => value !== id) : [...items, id];

  const submitCheck = async () => {
    if (!clientId || !selectedStudent) return;
    if (!selectedCheckType) {
      toast.error('Please select Check Type');
      return;
    }

    setSaving(true);
    try {
      await createChildAuditRecord({
        client_id: clientId,
        student_id: selectedStudent.id,
        employee_id: employeeId,
        check_type_id: selectedCheckType,
        physical_condition_ids: selectedPhysical,
        behaviour_ids: selectedBehaviours,
        meltdown_occurred: meltdownOccurred,
        meltdown_definition: meltdownDefinition,
        aggression_ids: selectedAggressions,
        notes: notes.trim() || null,
        physical_where: physicalWhere,
        attachments: attachments.map((file) => ({
          file_name: file.name,
          mime_type: file.type || null,
          file_size: file.size,
          base64: file.base64,
        })),
      });
      toast.success('Child Audit check submitted');
      setAttachments([]);
      setAttachmentUploaderKey((prev) => prev + 1);
      await loadStudentRecords();
      setActiveTab('check');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save check');
    } finally {
      setSaving(false);
    }
  };

  const toggleBodyPart = (physicalId: string, bodyPart: string) => {
    setPhysicalWhere((prev) => {
      const current = prev[physicalId] ?? [];
      const next = current.includes(bodyPart)
        ? current.filter((item) => item !== bodyPart)
        : [...current, bodyPart];
      return { ...prev, [physicalId]: next };
    });
  };

  const renderCheckboxRows = (
    items: ChildAuditLookupItem[],
    selected: string[],
    onToggle: (id: string) => void,
    options?: { showWhereForSelected?: boolean }
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => {
        const active = selected.includes(item.id);
        return (
          <div key={item.id} className="space-y-2">
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-left text-[15px] font-medium transition-colors flex items-center gap-2',
                active
                  ? 'bg-[#e5f3ef] text-emerald-700 border-emerald-400'
                  : 'bg-muted/40 text-foreground border-border hover:border-emerald-300'
              )}
            >
              <span
                className={cn(
                  'h-4 w-4 rounded-full border flex items-center justify-center',
                  active ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-emerald-500 bg-white'
                )}
              >
                {active ? <Check className="h-3 w-3" /> : null}
              </span>
              <span>{item.name}</span>
            </button>
            {options?.showWhereForSelected && active && (
              <div className="px-3 pb-1">
                <p className="text-xs text-muted-foreground mb-1.5">Where?</p>
                <div className="flex flex-wrap gap-1.5">
                  {parseWhereOptions(item.definition ?? DEFAULT_PHYSICAL_DEFINITION).map((part) => {
                    const selectedPart = (physicalWhere[item.id] ?? []).includes(part);
                    return (
                      <button
                        type="button"
                        key={`${item.id}-${part}`}
                        onClick={() => toggleBodyPart(item.id, part)}
                        className={cn(
                          'text-[11px] rounded-full border px-2 py-0.5',
                          selectedPart
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        )}
                      >
                        {part}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <Layout>
      <div className="w-full pt-0 py-6">
        <div className={`mx-6 ${selectedStudent ? 'pb-16' : ''}`}>
        {!selectedStudent ? (
          <>
            <div className="mb-5 w-full">
              <h1 className="text-3xl font-bold tracking-tight mt-5">Child Audit</h1>
              <p className="text-base text-muted-foreground mt-1">
                Search and open a student to create checks, view calendar, audit history, and reports.
              </p>
            </div>
            {!clientId ? (
              <p className="text-base text-muted-foreground">No client is associated with your account.</p>
            ) : (
              <>
                <div className="relative w-full mb-5">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="search students..."
                    className="pl-11 h-11 text-base"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search students"
                  />
                </div>
                {loading ? (
                  <Loader text="Loading students..." />
                ) : (
                  <Card className="w-full">
                    <CardContent className="p-4 space-y-3">
                      {filtered.map((row) => (
                        <div
                          key={row.id}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedStudent(row);
                            setActiveTab('check');
                            setSelectedDate(new Date());
                            setCalendarMonth(new Date());
                            setSelectedCheckType(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedStudent(row);
                              setActiveTab('check');
                              setSelectedDate(new Date());
                              setCalendarMonth(new Date());
                              setSelectedCheckType(null);
                            }
                          }}
                        >
                          <div className="min-w-0 flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 mt-0.5">
                              👤
                            </div>
                            <div>
                              <p className="text-[17px] font-semibold leading-tight">{row.name}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                🏫 {getCampusType(row.campus)} · {row.grade_section}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filtered.length === 0 && (
                        <div className="py-10 text-center text-base text-muted-foreground">No students found.</div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <div ref={headerRef} className="w-full">
                <div
                  style={
                    isHeaderPinned
                      ? {
                          position: "fixed",
                          top: "80px",
                          left: `115px`,
                          right: '0px',
                          zIndex: 40,
                        }
                      : undefined
                  }
                  className="bg-white"
                >
                  <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4 bg-white">
                      <div className="flex items-center justify-between">
                        
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="icon"
                              onClick={() => {
                              setSelectedStudent(null);
                              setSelectedCheckType(null);
                              setCheckTypeDetails([]);
                              setLookups(DEFAULT_LOOKUPS);
                              }}
                          >
                            <ArrowLeft className="h-5 w-5" />
                          </Button>

                          <div>
                            <h2 className="text-xl font-bold">
                              {selectedStudent.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              ID: {selectedStudent.student_id}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(new Date())}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {isHeaderPinned && <div style={{ height: headerHeight }} />}
              </div>

              <Card className="mt-4 mb-4 border-slate-200 bg-white">
                <CardContent className="p-4">
                  <div className="w-full flex items-center justify-between px-4">
                    
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="text-base font-semibold">
                        {getCampusType(selectedStudent.campus)}
                      </p>
                    </div>

                    
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="text-base font-semibold">
                        {selectedStudent.grade ?? "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <Card className="mb-4 border-slate-200 bg-white">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Last recorded</p>
                {recentRecord ? (
                  <p className="text-base mt-1">
                    {lookupMap.get(recentRecord.check_type_id ?? '') ?? 'Check'} · {toDateLabel(recentRecord.created_at)}
                    {' · '}
                    {formatDate(recentRecord.created_at)}
                  </p>
                ) : (
                  <p className="text-base mt-1">No record yet.</p>
                )}
              </CardContent>
            </Card>

            {detailLoading ? (
              <Card className="mt-4">
                <CardContent className="py-8">
                  <Loader text="Loading child audit details..." />
                </CardContent>
              </Card>
            ) : (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-12 rounded-xl border border-slate-200 bg-slate-100 p-1">
                <TabsTrigger
                  className="h-full rounded-lg text-sm md:text-base text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  value="check"
                >
                  <span className="mr-1">📋</span>
                  Check
                </TabsTrigger>
                <TabsTrigger
                  className="h-full rounded-lg text-sm md:text-base text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  value="calendar"
                >
                  <span className="mr-1">📅</span>
                  Calendar
                </TabsTrigger>
                <TabsTrigger
                  className="h-full rounded-lg text-sm md:text-base text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  value="audit"
                >
                  <span className="mr-1">📊</span>
                  Audit
                </TabsTrigger>
                <TabsTrigger
                  className="h-full rounded-lg text-sm md:text-base text-slate-600 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  value="report"
                >
                  <span className="mr-1">📄</span>
                  Report
                </TabsTrigger>
              </TabsList>

              <TabsContent value="check" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Check Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCheckboxRows(
                      lookups.checkTypes,
                      selectedCheckType ? [selectedCheckType] : [],
                      (id) => handleCheckTypeChange(selectedCheckType === id ? null : id)
                    )}
                  </CardContent>
                </Card>

                {lookups.physicalConditions.length > 0 && (
                  <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">🩹 Physical Condition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCheckboxRows(
                      lookups.physicalConditions,
                      selectedPhysical,
                      (id) => setSelectedPhysical((p) => toggleItem(p, id)),
                      { showWhereForSelected: true }
                    )}
                  </CardContent>
                  </Card>
                )}

                {dynamicBehaviourGroups.map((group) => (
                  <Card key={group.key}>
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {group.icon} {group.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderCheckboxRows(group.items, selectedBehaviours, (id) =>
                        setSelectedBehaviours((p) => toggleItem(p, id))
                      )}
                    </CardContent>
                  </Card>
                ))}

                {lookups.meltdowns.length > 0 && (
                  <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">🔥 Meltdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCheckboxRows(
                      [{ id: 'meltdown', name: lookups.meltdowns[0]?.name ?? 'Meltdown occurred', active: true }],
                      meltdownOccurred ? ['meltdown'] : [],
                      () =>
                        setMeltdownOccurred((p) => {
                          const next = !p;
                          if (!next) setMeltdownDefinition([]);
                          return next;
                        })
                    )}
                    {meltdownOccurred && (
                      <div className="px-1 pt-2">
                        <div className="flex flex-wrap gap-2">
                          {parseWhereOptions(lookups.meltdowns[0]?.definition).map((value) => {
                            const active = meltdownDefinition.includes(value);
                            return (
                              <button
                                type="button"
                                key={`meltdown-${value}`}
                                onClick={() =>
                                  setMeltdownDefinition((prev) =>
                                    prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
                                  )
                                }
                                className={cn(
                                  'text-xs rounded-full border px-2.5 py-1',
                                  active
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                )}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                  </Card>
                )}

                {lookups.aggressions.length > 0 && (
                  <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">⚡ Aggression</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCheckboxRows(lookups.aggressions, selectedAggressions, (id) =>
                      setSelectedAggressions((p) => toggleItem(p, id))
                    )}
                  </CardContent>
                  </Card>
                )}
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Attachments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {savedAttachments.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <div className="space-y-2">
                          {savedAttachments.map((attachment) => {
                            const publicUrl = supabase.storage
                              .from(attachment.bucket)
                              .getPublicUrl(attachment.file_path).data.publicUrl;
                            return (
                              <div
                                key={attachment.id}
                                className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                              >
                                <span className="truncate text-sm text-slate-700">{attachment.file_name}</span>
                                <a
                                  href={publicUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 hover:text-blue-700"
                                  aria-label={`View ${attachment.file_name}`}
                                  title="View document"
                                >
                                  <Eye className="h-4 w-4" />
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <ReusableFileUploader
                      key={`${selectedStudent.id}-${attachmentUploaderKey}`}
                      onFilesChange={setAttachments}
                      initialFiles={EMPTY_INITIAL_FILES}
                      maxFiles={5}
                      maxSize={10}
                      maxTotalSize={50}
                      allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']}
                      accept="image/*,.pdf"
                      showFileList={true}
                      disabled={saving}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes..."
                      className="min-h-[110px] text-base"
                      maxLength={DESCRIPTION_MAX_LENGTH}
                    />
                    <div className="text-right text-sm text-gray-500 mt-2">
                      {notes.length}/{DESCRIPTION_MAX_LENGTH} characters
                    </div>
                  </CardContent>
                </Card>

                <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-md"
                  style={{
                    left: '115px',
                    right: '0px',
                  }}
                >
                  <div className="mx-6 py-3 border-slate-200 shadow-sm">
                    <Button className="w-full h-12 text-base font-semibold" onClick={submitCheck} disabled={saving}>
                    
                      {saving ? 'Saving...' : 'Submit Check'}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="px-3 py-2 flex items-center justify-between border-b">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <p className="text-lg font-semibold">
                        {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-7 border-b text-xs text-muted-foreground">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="px-2 py-2 text-center border-r last:border-r-0">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7">
                      {calendarGrid.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className="h-24 border-r border-b last:border-r-0 bg-slate-50/50" />;
                        }
                        const dayKey = getDayKey(day);
                        const summary = monthDaySummary.get(dayKey);
                        const selected = selectedDate && getDayKey(selectedDate) === dayKey;
                        return (
                          <button
                            type="button"
                            key={dayKey}
                            onClick={() => setSelectedDate(day)}
                            className={cn(
                              'h-24 border-r border-b last:border-r-0 p-1 text-left relative hover:bg-slate-50',
                              selected && 'bg-blue-50'
                            )}
                          >
                            <span className={cn('text-xs', selected ? 'text-blue-700 font-semibold' : 'text-slate-700')}>
                              {day.getDate()}
                            </span>
                            <div className="absolute bottom-1 left-1 flex gap-1">
                              {summary?.injury && <span className="h-2 w-2 rounded-sm bg-red-500" />}
                              {summary?.sleep && <span className="h-2 w-2 rounded-sm bg-emerald-500" />}
                              {summary?.aggression && <span className="h-2 w-2 rounded-sm bg-orange-500" />}
                              {summary?.meltdown && <span className="h-2 w-2 rounded-sm bg-amber-500" />}
                              {summary?.health && <span className="h-2 w-2 rounded-sm bg-teal-500" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-red-600">
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    Physical / Injury
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Sleep Issue
                  </span>
                  <span className="inline-flex items-center gap-1 text-orange-600">
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    Aggression
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Meltdown
                  </span>
                  <span className="inline-flex items-center gap-1 text-teal-600">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    Health / Medical
                  </span>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{selectedDate ? toDateLabel(selectedDate.toISOString()) : 'Day records'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedDayRecords.length === 0 ? (
                      <p className="text-base text-muted-foreground">No checks on this day.</p>
                    ) : (
                      selectedDayRecords.map((record) => (
                        <div key={record.id} className="rounded-xl border p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-base font-semibold">{lookupMap.get(record.check_type_id ?? '') ?? 'Check'}</p>
                            <p className="text-sm text-muted-foreground">{toTimeLabel(record.created_at)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {record.physical_condition_ids.map((id) => (
                              <Badge key={`${record.id}-p-${id}`} variant="softAmber">
                                {lookupMap.get(id) ?? 'Physical'}
                              </Badge>
                            ))}
                            {record.behaviour_ids.map((id) => (
                              <Badge key={`${record.id}-b-${id}`} variant="teal">
                                {lookupMap.get(id) ?? 'Behaviour'}
                              </Badge>
                            ))}
                            {record.aggression_ids.map((id) => (
                              <Badge key={`${record.id}-a-${id}`} variant="destructive">
                                {lookupMap.get(id) ?? 'Aggression'}
                              </Badge>
                            ))}
                            {record.meltdown_occurred && <Badge variant="softInfo">Meltdown</Badge>}
                          </div>
                          {record.notes && <p className="text-sm text-muted-foreground mt-2">"{record.notes}"</p>}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audit" className="space-y-4">
                {recordsLoading ? (
                  <Loader text="Loading audit timeline..." />
                ) : records.length === 0 ? (
                  <Card>
                    <CardContent className="py-10 text-center text-base text-muted-foreground">
                      No audit entries yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <Card>
                      <CardContent className="p-4 flex flex-wrap items-center gap-3">
                        <p className="text-sm font-medium text-muted-foreground">Sort by:</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setAuditDateSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                        >
                          Date {auditDateSort === 'asc' ? '↑' : '↓'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => setAuditTypeSort((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                        >
                          Type {auditTypeSort === 'asc' ? '↑' : '↓'}
                        </Button>
                      </CardContent>
                    </Card>

                    {auditTimelineGroups.map((group) => (
                      <div key={group.dayKey} className="space-y-3">
                        <p className="text-sm font-bold tracking-wide text-slate-500">{group.title}</p>
                        <div className="relative pl-5 space-y-3">
                          <div className="absolute left-[7px] top-0 bottom-0 w-px bg-slate-200" />
                          {group.rows.map((record) => {
                            const typeInfo = checkTypeById.get(record.check_type_id ?? '') ?? {
                              label: 'Check',
                              icon: '📋',
                            };

                            const itemGroups = new Map<string, string[]>();
                            const pushGroupItem = (groupLabel: string, value: string) => {
                              const current = itemGroups.get(groupLabel) ?? [];
                              current.push(value);
                              itemGroups.set(groupLabel, current);
                            };

                            for (const id of record.physical_condition_ids) {
                              const meta = lookupMetadataById.get(id);
                              const bodyParts = record.physical_where?.[id] ?? [];
                              const suffix = bodyParts.length > 0 ? ` (${bodyParts.join(', ')})` : '';
                              pushGroupItem(meta?.item_group ?? 'Physical Condition', `${meta?.label ?? 'Physical'}${suffix}`);
                            }
                            for (const id of record.behaviour_ids) {
                              const meta = lookupMetadataById.get(id);
                              pushGroupItem(meta?.item_group ?? 'Behaviour', meta?.label ?? 'Behaviour');
                            }
                            for (const id of record.aggression_ids) {
                              const meta = lookupMetadataById.get(id);
                              pushGroupItem(meta?.item_group ?? 'Aggression', meta?.label ?? 'Aggression');
                            }
                            if (record.meltdown_occurred) {
                              pushGroupItem('Meltdown', 'Meltdown occurred');
                            }

                            const entries = Array.from(itemGroups.entries());

                            return (
                              <div key={record.id} className="relative">
                                <span className="absolute -left-[16px] top-5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                                <Card className="border-slate-200">
                                  <CardContent className="p-4 space-y-3">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-base font-semibold inline-flex items-center gap-2">
                                        <span>{typeInfo.icon}</span>
                                        <span>{typeInfo.label}</span>
                                      </p>
                                      <p className="text-xs text-slate-500 inline-flex items-center gap-1">
                                        <Clock3 className="h-3.5 w-3.5" />
                                        <span>{toTimeLabel(record.created_at)}</span>
                                      </p>
                                    </div>

                                    {entries.length > 0 ? (
                                      <div className="space-y-2">
                                        {entries.map(([groupLabel, values]) => (
                                          <div key={`${record.id}-${groupLabel}`} className="space-y-1">
                                            <p className="text-xs font-semibold text-slate-500">{groupLabel}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                              {values.map((value, idx) => (
                                                <span
                                                  key={`${record.id}-${groupLabel}-${value}-${idx}`}
                                                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
                                                >
                                                  {value}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">No selected items.</p>
                                    )}

                                    <div className="pt-1 border-t border-slate-100">
                                      <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
                                      <p className="text-sm text-slate-600 italic">
                                        "{record.notes?.trim() ? record.notes : 'No notes provided.'}"
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="report" className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <p className="text-3xl font-bold">
                    {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {monthReport.checks === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center text-lg text-muted-foreground">
                      No checks recorded for this month.
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="py-6 text-center">
                          <p className="text-3xl font-bold">{monthReport.checks}</p>
                          <p className="text-sm text-muted-foreground mt-1">Total Checks</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="py-6 text-center">
                          <p className="text-3xl font-bold text-red-500">{monthReport.injuryDays}</p>
                          <p className="text-sm text-muted-foreground mt-1">Injury Days</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="py-6 text-center">
                          <p className="text-3xl font-bold text-amber-500">{monthReport.meltdowns}</p>
                          <p className="text-sm text-muted-foreground mt-1">Meltdowns</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="text-2xl font-bold mb-3">Factor Distribution</h3>
                      <div className="space-y-3">
                        {monthReport.sections.map((section) => (
                          <Card key={section.title}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-2">
                                <p className={cn('text-xl font-semibold inline-flex items-center gap-2', section.textClass)}>
                                  <span>{section.icon}</span>
                                  <span>{section.title}</span>
                                </p>
                                <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-0.5 text-sm font-semibold text-emerald-700">
                                  {section.total}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                {section.chips.map(([label, count]) => (
                                  <span
                                    key={`${section.title}-${label}`}
                                    className="rounded-full border border-slate-300 px-2.5 py-1 text-sm text-slate-700"
                                  >
                                    {label} ({count})
                                  </span>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div
                  className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-md"
                  style={{
                    left: "115px",   
                    right: "0px",
                  }}
                >
                  <div className="mx-6 py-3">
                    <Button
                      className="w-full h-12 text-base font-semibold"
                      onClick={handleDownload}
                      disabled={downloading || monthReport.checks === 0}
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                      <Download className="h-4 w-4 mr-2" />
                        Download {calendarMonth.toLocaleString('en-US', { month: 'short', year: 'numeric' })} Report (PDF)
                          </>
                        )}                    
                    </Button>
                  </div>
                </div>
              </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </div>
    </div>
    </Layout>
  );
};

export default ChildAuditPage;
