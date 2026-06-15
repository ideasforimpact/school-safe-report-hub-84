import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { AlertCircle, ArrowLeft, CalendarPlus, Download, Pencil, Trash2, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import SearchMultiSelect, { SearchMultiSelectOption } from '@/components/common/SearchMultiSelect';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';
import { FileItem } from '@/types/fileTypes';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { useAuth } from '@/contexts';
import { supabase } from '@/integrations/supabase/client';
import {
  Committee,
  CommitteeEvent,
  CommitteeEventPayload,
  createCommitteeEvent,
  deleteCommitteeEvent,
  deleteCommitteeEventAttachment,
  fetchCommitteeFormData,
  fetchEventsPageData,
  updateCommitteeEvent,
} from '@/services/committees/committeeService';
import { toast } from 'sonner';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';
import { useIsReadOnlySwitchedContext } from '@/hooks/useIsReadOnlySwitchedContext';

type EmployeeOption = { id: string; name: string };

const formatDateTimeForInput = (value: string): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const removeLeadingSpaces = (value: string): string => value.replace(/^\s+/, '');

const CommitteeEventsPage = () => {
  const { committeeId = '' } = useParams();
  const navigate = useNavigate();
  const { employeeData } = useAuth();
  const clientId = employeeData?.clientId || '';
  const employeeId = employeeData?.id || null;
  const isSuperAdmin = !!employeeData?.isSuperAdmin;
  const isReadOnlySwitchedContext = useIsReadOnlySwitchedContext();

  const [committee, setCommittee] = useState<Committee | null>(null);
  const [events, setEvents] = useState<CommitteeEvent[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCommitteeMember, setIsCommitteeMember] = useState(false);
  const [meetingDateFilter, setMeetingDateFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'mom' | 'event'>('all');
  const [attachmentStorageFilter, setAttachmentStorageFilter] = useState<'all' | 'with' | 'without' | 'supabase'>('all');

  const [openForm, setOpenForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CommitteeEvent | null>(null);
  const [eventType, setEventType] = useState<'mom' | 'event'>('mom');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<FileItem[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<CommitteeEvent['attachments']>([]);
  const [saving, setSaving] = useState(false);
  const [formTouched, setFormTouched] = useState({
    title: false,
    date: false,
    description: false,
    participants: false,
  });

  const [eventToDelete, setEventToDelete] = useState<CommitteeEvent | null>(null);
  
  const participantOptions: SearchMultiSelectOption[] = useMemo(
    () => employees.map((employee) => ({ id: employee.id, label: employee.name })),
    [employees]
  );

  const selectedParticipants = useMemo(
    () =>
      participantIds
        .map((id) => employees.find((employee) => employee.id === id))
        .filter((employee): employee is EmployeeOption => Boolean(employee)),
    [participantIds, employees]
  );

  const canCreateEvent = !isReadOnlySwitchedContext && (isSuperAdmin || isCommitteeMember);
  const canManageEvent = !isReadOnlySwitchedContext && isSuperAdmin;
  const eventTitleError = useMemo(() => (!eventTitle.trim() ? 'Title is required' : ''), [eventTitle]);
  const eventDateError = useMemo(() => (!eventDate ? 'Date is required' : ''), [eventDate]);
  const eventDescriptionError = useMemo(
    () => (!eventDescription.trim() ? 'Description is required' : ''),
    [eventDescription]
  );
  const participantsError = useMemo(
    () => (participantIds.length === 0 ? 'At least one participant is required' : ''),
    [participantIds]
  );
  const isEventFormValid = !eventTitleError && !eventDateError && !eventDescriptionError && !participantsError;

  const loadData = useCallback(async () => {
    if (!clientId || !committeeId) return;
    try {
      setLoading(true);
      // One edge-function call for page data + one cached call for form data (employees/roles).
      const [pageData, formData] = await Promise.all([
        fetchEventsPageData(committeeId, clientId),
        fetchCommitteeFormData(clientId),
      ]);

      setCommittee(pageData.committee);
      setEvents(pageData.events);
      setIsCommitteeMember(pageData.members.some((m) => m.employee_id === employeeId));
      setEmployees(formData.employees);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load MOM/Event list');
    } finally {
      setLoading(false);
    }
  }, [clientId, committeeId, employeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingEvent(null);
    setEventType('mom');
    setEventTitle('');
    setEventDate('');
    setEventDescription('');
    setParticipantIds([]);
    setAttachments([]);
    setExistingAttachments([]);
    setFormTouched({
      title: false,
      date: false,
      description: false,
      participants: false,
    });
  };

  const openCreate = () => {
    if (isReadOnlySwitchedContext) {
      toast.error('Read-only switched client context: add is not allowed');
      return;
    }
    if (!canCreateEvent) {
      toast.error('Only admin or committee members can add MOM/Event');
      return;
    }
    resetForm();
    setOpenForm(true);
  };

  const openEdit = (event: CommitteeEvent) => {
    if (isReadOnlySwitchedContext) {
      toast.error('Read-only switched client context: edit is not allowed');
      return;
    }
    if (!canManageEvent) {
      toast.error('Only admin users can edit MOM/Event');
      return;
    }
    setEditingEvent(event);
    setEventType(event.event_type);
    setEventTitle(event.title || '');
    setEventDate(formatDateTimeForInput(event.event_date));
    setEventDescription(event.description || '');
    setParticipantIds(event.participants || []);
    setAttachments([]);
    setExistingAttachments(event.attachments || []);
    setOpenForm(true);
  };

  const handleSave = async () => {
    if (!clientId || !committeeId) return;
    if (!canCreateEvent) {
      toast.error('Only admin or committee members can add MOM/Event');
      return;
    }
    if (editingEvent && !canManageEvent) {
      toast.error('Only admin users can edit MOM/Event');
      return;
    }
    if (!eventTitle.trim() || !eventDate || !eventDescription.trim()) {
      toast.error('Event title, date, and description are required');
      return;
    }
    if (participantIds.length === 0) {
      toast.error('Participants are required');
      return;
    }

    const payload: CommitteeEventPayload = {
      eventId: editingEvent?.id,
      committeeId,
      clientId,
      eventType,
      title: eventTitle.trim(),
      eventDate,
      description: eventDescription,
      participantIds,
      attachments,
      employeeId,
    };

    try {
      setSaving(true);
      if (editingEvent) {
        await updateCommitteeEvent(payload);
        toast.success('MOM/Event updated');
      } else {
        await createCommitteeEvent(payload);
        toast.success('MOM/Event created');
      }
      setOpenForm(false);
      resetForm();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save MOM/Event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete || !clientId) return;
    if (!canManageEvent) {
      toast.error('Only admin users can delete MOM/Event');
      return;
    }
    try {
      await deleteCommitteeEvent(eventToDelete.id, clientId, employeeId);
      toast.success('MOM/Event deleted');
      setEventToDelete(null);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete MOM/Event');
    }
  };

  const handleRemoveExistingAttachment = async (attachmentId: string) => {
    if (!clientId) return;
    if (!canManageEvent) {
      toast.error('Only admin users can remove attachments');
      return;
    }
    try {
      await deleteCommitteeEventAttachment(attachmentId, clientId, employeeId);
      setExistingAttachments((prev) => (prev || []).filter((item) => item.id !== attachmentId));
      toast.success('Attachment removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove attachment');
    }
  };

  const downloadAttachments = (event: CommitteeEvent) => {
    if (!event.attachments || event.attachments.length === 0) return;
    event.attachments.forEach(async (attachment) => {
      await downloadAttachment(attachment);
    });
  };

  const downloadAttachment = async (attachment: NonNullable<CommitteeEvent['attachments']>[number]) => {
    try {
      let blob: Blob | null = null;
      if (attachment.storage_bucket && attachment.storage_path) {
        const { data, error } = await supabase.storage
          .from(attachment.storage_bucket)
          .download(attachment.storage_path);
        if (error) throw error;
        blob = data;
      } else {
        const response = await fetch(attachment.file_url);
        blob = await response.blob();
      }

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error(`Failed to download ${attachment.file_name}`);
    }
  };

  const renderAttachmentIndicator = (event: CommitteeEvent) => {
    if (!event.attachments || event.attachments.length === 0) {
      return <span className="text-gray-500">-</span>;
    }

    return (
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700"
            aria-label="View attachments"
          >
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">{event.attachments.length}</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80 p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Attachments</p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {event.attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between gap-2 rounded border p-2">
                  <span className="truncate text-xs text-gray-700" title={attachment.file_name}>
                    {attachment.file_name}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => downloadAttachment(attachment)}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDateOnly = formatDateTimeForInput(event.event_date).slice(0, 10);
      const matchesDate = !meetingDateFilter || eventDateOnly === meetingDateFilter;
      const matchesType = eventTypeFilter === 'all' || event.event_type === eventTypeFilter;
      const hasAttachments = !!event.attachments && event.attachments.length > 0;
      const usesSupabaseStorage = (event.attachments || []).some((item) => !!item.storage_bucket);
      const matchesAttachmentStorage =
        attachmentStorageFilter === 'all' ||
        (attachmentStorageFilter === 'with' && hasAttachments) ||
        (attachmentStorageFilter === 'without' && !hasAttachments) ||
        (attachmentStorageFilter === 'supabase' && usesSupabaseStorage);

      return matchesDate && matchesType && matchesAttachmentStorage;
    });
  }, [events, meetingDateFilter, eventTypeFilter, attachmentStorageFilter]);

  const activeEventFilterCount = useMemo(() => {
    let count = 0;
    if (meetingDateFilter) count += 1;
    if (eventTypeFilter !== 'all') count += 1;
    if (attachmentStorageFilter !== 'all') count += 1;
    return count;
  }, [meetingDateFilter, eventTypeFilter, attachmentStorageFilter]);

  const renderParticipantsIndicator = (event: CommitteeEvent) => {
    const participants = event.participant_names || [];
    if (participants.length === 0) {
      return <span className="text-gray-500">-</span>;
    }

    return (
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
            aria-label="View participants"
          >
            <User className="h-4 w-4" />
            <span className="text-xs font-medium">{participants.length}</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-72 p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Participants</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              <ul className="list-disc pl-4 space-y-1">
                {participants.map((participant, index) => (
                  <li key={`${participant}-${index}`} className="text-xs text-gray-700">
                    {participant}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <Layout>
      <div className="w-full py-6">
        <div className="mx-6 mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" className="mb-2 px-0" onClick={() => navigate('/committees')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Committees
            </Button>
            <h1 className="text-2xl font-bold">{committee?.name || 'Committee'} MOM / Events</h1>
          </div>
          {!isReadOnlySwitchedContext && (
            <Button onClick={openCreate} disabled={!canCreateEvent} title={canCreateEvent ? 'Add MOM / Event' : 'Committee member or admin only'}>
              <CalendarPlus className="h-4 w-4 mr-2" />
              Add MOM / Event
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="w-full max-w-[220px]">
              <Label className="text-xs text-gray-600">Meeting date</Label>
              <Input type="date" value={meetingDateFilter} onChange={(e) => setMeetingDateFilter(e.target.value)} />
            </div>
            <div className="w-full max-w-[220px]">
              <Label className="text-xs text-gray-600">Event type</Label>
              <Select value={eventTypeFilter} onValueChange={(value: 'all' | 'mom' | 'event') => setEventTypeFilter(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="mom">MOM</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full max-w-[260px]">
              <Label className="text-xs text-gray-600">Attachment</Label>
              <Select
                value={attachmentStorageFilter}
                onValueChange={(value: 'all' | 'with' | 'without' | 'supabase') => setAttachmentStorageFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="with">With Attachments</SelectItem>
                  <SelectItem value="without">Without Attachments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeEventFilterCount > 0 && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="inline-flex items-center gap-2"
                  onClick={() => {
                    setMeetingDateFilter('');
                    setEventTypeFilter('all');
                    setAttachmentStorageFilter('all');
                  }}
                >
                  <X className="h-4 w-4" />
                  {`Clear filter (${activeEventFilterCount})`}
                </Button>
              </div>
            )}
          </div>
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading MOM/Event list...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-10 text-gray-500">No Record Found.</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Attachment Indicator</TableHead>
                    <TableHead>Created By</TableHead>
                    {!isReadOnlySwitchedContext && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="max-w-[220px] truncate">{event.title || '-'}</TableCell>
                      <TableCell className="font-medium">{event.event_type.toUpperCase()}</TableCell>
                      <TableCell>{formatDateTime(event.event_date)}</TableCell>
                      <TableCell>{renderParticipantsIndicator(event)}</TableCell>
                      <TableCell>{renderAttachmentIndicator(event)}</TableCell>
                      <TableCell>{event.created_by_name || '-'}</TableCell>
                      {!isReadOnlySwitchedContext && (
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => openEdit(event)}
                            disabled={!canManageEvent}
                            title={canManageEvent ? 'Edit' : 'Admin only'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setEventToDelete(event)}
                            disabled={!canManageEvent}
                            title={canManageEvent ? 'Delete' : 'Admin only'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={openForm && !isReadOnlySwitchedContext} onOpenChange={(open) => { setOpenForm(open); if (!open) resetForm(); }}>
        <AlertDialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>{editingEvent ? 'Edit MOM / Event' : 'Add MOM / Event'}</AlertDialogTitle>
            <AlertDialogDescription>Record meeting/event details for this committee.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 px-2 overflow-y-auto pr-2 no-scrollbar">
             <div className="space-y-2">
              <Label htmlFor="evt-title"> Title <span className="text-red-500">*</span></Label>
              <Input
                id="evt-title"
                value={eventTitle}
                onChange={(e) => {
                  setFormTouched((prev) => ({ ...prev, title: true }));
                  setEventTitle(removeLeadingSpaces(e.target.value));
                }}
                onBlur={() => setFormTouched((prev) => ({ ...prev, title: true }))}
                placeholder="Enter title"
              />
              {formTouched.title && eventTitleError && (
                <p className="text-xs text-red-500">{eventTitleError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Type <span className="text-red-500">*</span></Label>
              <Select value={eventType} onValueChange={(value: 'mom' | 'event') => setEventType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mom">MOM</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evt-date">Date <span className="text-red-500">*</span></Label>
              <Input
                id="evt-date"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => {
                  setFormTouched((prev) => ({ ...prev, date: true }));
                  setEventDate(e.target.value);
                }}
                onBlur={() => setFormTouched((prev) => ({ ...prev, date: true }))}
              />
              {formTouched.date && eventDateError && (
                <p className="text-xs text-red-500">{eventDateError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="evt-desc">Description <span className="text-red-500">*</span></Label>
              <TextareaWithVoice
                id="evt-desc"
                rows={8}
                value={eventDescription}
                onChange={(e) => {
                  setFormTouched((prev) => ({ ...prev, description: true }));
                  setEventDescription(removeLeadingSpaces(e.target.value));
                }}
                onBlur={() => setFormTouched((prev) => ({ ...prev, description: true }))}
              />
              {formTouched.description && eventDescriptionError && (
                <p className="text-xs text-red-500">{eventDescriptionError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Participants <span className="text-red-500">*</span></Label>
              <SearchMultiSelect
                options={participantOptions}
                selectedIds={participantIds}
                onChange={(ids) => {
                  setFormTouched((prev) => ({ ...prev, participants: true }));
                  setParticipantIds(ids);
                }}
                placeholder="Search and select participants..."
              />
              {selectedParticipants.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedParticipants.map((participant) => (
                    <span
                      key={participant.id}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 border border-blue-200"
                    >
                      {participant.name}
                      <button
                        type="button"
                        onClick={() => {
                          setFormTouched((prev) => ({ ...prev, participants: true }));
                          setParticipantIds((prev) => prev.filter((id) => id !== participant.id));
                        }}
                        className="inline-flex items-center justify-center rounded-full hover:bg-blue-100 p-0.5"
                        aria-label={`Remove ${participant.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {formTouched.participants && participantsError && (
                <p className="text-xs text-red-500">{participantsError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <ReusableFileUploader
                onFilesChange={setAttachments}
                initialFiles={attachments}
                maxFiles={10}
                maxSize={50}
                maxTotalSize={500}
                allowedTypes={[
                  'image/jpeg',
                  'image/jpg',
                  'image/png',
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  'text/plain',
                ]}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                disabled={saving}
              />
            </div>
            {editingEvent && existingAttachments && existingAttachments.length > 0 && (
              <div className="space-y-2">
                <Label>Existing Attachments</Label>
                <div className="max-h-28 overflow-y-auto space-y-2 border rounded-md p-2">
                  {existingAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between gap-2 text-sm">
                      <a className="text-blue-600 hover:underline truncate" href={attachment.file_url} target="_blank" rel="noreferrer">
                        {attachment.file_name}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveExistingAttachment(attachment.id)}
                        disabled={!canManageEvent}
                        title={canManageEvent ? 'Remove attachment' : 'Admin only'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpenForm(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !isEventFormValid}>{saving ? 'Saving...' : editingEvent ? 'Update' : 'Save'}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete MOM/Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{eventToDelete?.event_type?.toUpperCase()}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CommitteeEventsPage;
