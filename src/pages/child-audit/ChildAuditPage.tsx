import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '@/components/layout/Layout';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Settings,
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
import {
  fetchChildAuditStudents,
  type ChildAuditStudentRow,
} from '@/services/child-audit/childAuditStudentsService';
import {
  createChildAuditRecord,
  fetchChildAuditLookups,
  fetchChildAuditRecordsByStudent,
  type ChildAuditLookupItem,
  type ChildAuditLookups,
  type ChildAuditRecord,
} from '@/services/child-audit/childAuditRecordsService';

type TabKey = 'check' | 'calendar' | 'audit' | 'report';

const DEFAULT_LOOKUPS: ChildAuditLookups = {
  checkTypes: [],
  physicalConditions: [],
  behaviours: [],
  meltdowns: [],
  aggressions: [],
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

const ChildAuditPage = () => {
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId;
  const employeeId = employeeData?.id ?? null;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<ChildAuditStudentRow[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<ChildAuditStudentRow | null>(null);

  const [lookups, setLookups] = useState<ChildAuditLookups>(DEFAULT_LOOKUPS);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [records, setRecords] = useState<ChildAuditRecord[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('check');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const [selectedCheckType, setSelectedCheckType] = useState<string | null>(null);
  const [selectedPhysical, setSelectedPhysical] = useState<string[]>([]);
  const [selectedBehaviours, setSelectedBehaviours] = useState<string[]>([]);
  const [selectedAggressions, setSelectedAggressions] = useState<string[]>([]);
  const [meltdownOccurred, setMeltdownOccurred] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [physicalWhere, setPhysicalWhere] = useState<Record<string, string[]>>({});

  const lookupMap = useMemo(() => {
    const map = new Map<string, string>();
    [...lookups.checkTypes, ...lookups.physicalConditions, ...lookups.behaviours, ...lookups.aggressions].forEach(
      (item) => map.set(item.id, item.name)
    );
    return map;
  }, [lookups]);

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
      const lookupRows = await fetchChildAuditLookups();
      setLookups(lookupRows);
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
      return;
    }
    setRecordsLoading(true);
    try {
      const rows = await fetchChildAuditRecordsByStudent(clientId, selectedStudent.id);
      setRecords(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load audit records');
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, [clientId, selectedStudent]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadStudentRecords();
  }, [loadStudentRecords]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((r) => {
      const id = (r.student_id ?? '').toLowerCase();
      const name = (r.name ?? '').toLowerCase();
      const gs = (r.grade_section ?? '').toLowerCase();
      return id.includes(q) || name.includes(q) || gs.includes(q);
    });
  }, [students, search]);

  const recentRecord = records[0];

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

  const monthReport = useMemo(() => {
    const month = calendarMonth;
    const monthKey = getMonthKey(month);
    const monthRows = records.filter((r) => getMonthKey(new Date(r.created_at)) === monthKey);

    const tags: Record<string, number> = {};
    monthRows.forEach((r) => {
      r.physical_condition_ids.forEach((id) => {
        const key = lookupMap.get(id) ?? 'Physical';
        tags[key] = (tags[key] ?? 0) + 1;
      });
      r.behaviour_ids.forEach((id) => {
        const key = lookupMap.get(id) ?? 'Behaviour';
        tags[key] = (tags[key] ?? 0) + 1;
      });
      r.aggression_ids.forEach((id) => {
        const key = lookupMap.get(id) ?? 'Aggression';
        tags[key] = (tags[key] ?? 0) + 1;
      });
      if (r.meltdown_occurred) tags['Meltdown'] = (tags['Meltdown'] ?? 0) + 1;
    });

    return {
      checks: monthRows.length,
      injuryDays: monthRows.filter((r) => r.physical_condition_ids.length > 0).length,
      meltdowns: monthRows.filter((r) => r.meltdown_occurred).length,
      tags: Object.entries(tags).sort((a, b) => b[1] - a[1]),
    };
  }, [records, calendarMonth, lookupMap]);

  const toggleItem = (items: string[], id: string) =>
    items.includes(id) ? items.filter((value) => value !== id) : [...items, id];

  const resetCheckForm = () => {
    setSelectedCheckType(null);
    setSelectedPhysical([]);
    setSelectedBehaviours([]);
    setSelectedAggressions([]);
    setMeltdownOccurred(false);
    setNotes('');
    setPhysicalWhere({});
  };

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
        aggression_ids: selectedAggressions,
        notes: notes.trim() || null,
      });
      toast.success('Child Audit check submitted');
      resetCheckForm();
      await loadStudentRecords();
      setActiveTab('audit');
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
                  {BODY_PART_OPTIONS.map((part) => {
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
      <div className="w-full px-4 py-6">
        {!selectedStudent ? (
          <>
            <div className="mb-5 w-full">
              <h1 className="text-3xl font-bold tracking-tight">Child Audit</h1>
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
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              setSelectedStudent(row);
                              setActiveTab('check');
                              setSelectedDate(new Date());
                              setCalendarMonth(new Date());
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
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open ${row.name}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
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
            <div className="flex items-center justify-between gap-3 mb-4 max-w-6xl mx-auto">
              <Button variant="ghost" className="text-base" onClick={() => setSelectedStudent(null)}>
                <ArrowLeft className="h-5 w-5" />
                Back
              </Button>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleString('en-IN')}</p>
            </div>

            <Card className="mb-3 border-slate-200 bg-white">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                    <p className="text-base text-muted-foreground mt-1">ID: {selectedStudent.student_id}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 min-w-[420px]">
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="text-base font-semibold">{getCampusType(selectedStudent.campus)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Grade</p>
                      <p className="text-base font-semibold">{selectedStudent.grade ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Age</p>
                      <p className="text-base font-semibold">—</p>
                    </div>
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
                    {toTimeLabel(recentRecord.created_at)}
                  </p>
                ) : (
                  <p className="text-base mt-1">No record yet.</p>
                )}
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-12 bg-slate-100">
                <TabsTrigger className="text-sm md:text-base" value="check">
                  <span className="mr-1">📋</span>
                  Check
                </TabsTrigger>
                <TabsTrigger className="text-sm md:text-base" value="calendar">
                  <span className="mr-1">📅</span>
                  Calendar
                </TabsTrigger>
                <TabsTrigger className="text-sm md:text-base" value="audit">
                  <span className="mr-1">📊</span>
                  Audit
                </TabsTrigger>
                <TabsTrigger className="text-sm md:text-base" value="report">
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
                      (id) => setSelectedCheckType(selectedCheckType === id ? null : id)
                    )}
                  </CardContent>
                </Card>

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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">👁 Behaviour</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCheckboxRows(lookups.behaviours, selectedBehaviours, (id) =>
                      setSelectedBehaviours((p) => toggleItem(p, id))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">🔥 Meltdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderCheckboxRows(
                      [{ id: 'meltdown', name: lookups.meltdowns[0]?.name ?? 'Meltdown occurred', active: true }],
                      meltdownOccurred ? ['meltdown'] : [],
                      () => setMeltdownOccurred((p) => !p)
                    )}
                  </CardContent>
                </Card>

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
                    />
                  </CardContent>
                </Card>

                <div className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur px-2 py-3">
                  <Button className="w-full h-12 text-base font-semibold" onClick={submitCheck} disabled={saving}>
                    {saving ? 'Saving...' : 'Submit Check'}
                  </Button>
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
                  records.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-base font-semibold">{lookupMap.get(record.check_type_id ?? '') ?? 'Check'}</p>
                          <p className="text-sm text-muted-foreground">
                            {toDateLabel(record.created_at)} · {toTimeLabel(record.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {record.physical_condition_ids.map((id) => (
                            <Badge key={`${record.id}-pp-${id}`} variant="softAmber">
                              {lookupMap.get(id) ?? 'Physical'}
                            </Badge>
                          ))}
                          {record.behaviour_ids.map((id) => (
                            <Badge key={`${record.id}-bb-${id}`} variant="teal">
                              {lookupMap.get(id) ?? 'Behaviour'}
                            </Badge>
                          ))}
                          {record.aggression_ids.map((id) => (
                            <Badge key={`${record.id}-aa-${id}`} variant="destructive">
                              {lookupMap.get(id) ?? 'Aggression'}
                            </Badge>
                          ))}
                          {record.meltdown_occurred && <Badge variant="softInfo">Meltdown</Badge>}
                        </div>
                        {record.notes && <p className="text-sm text-muted-foreground mt-2">"{record.notes}"</p>}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="report" className="space-y-4">
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

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Factor Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {monthReport.tags.length === 0 ? (
                      <p className="text-base text-muted-foreground">No factors recorded this month.</p>
                    ) : (
                      monthReport.tags.map(([name, count]) => {
                        const style = getFactorStyle(name);
                        return (
                          <div key={name} className="rounded-lg border p-3 flex items-center justify-between">
                            <p className={cn('text-base font-medium inline-flex items-center gap-2', style.textClass)}>
                              <span>{style.icon}</span>
                              <span>{style.title}</span>
                            </p>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">{count}</Badge>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>

                <Button className="w-full h-12 text-base">
                  <Download className="h-4 w-4 mr-2" />
                  Download {new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })} Report (PDF)
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ChildAuditPage;
