import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Users, User, Plus, Search, Pencil, Eye, CalendarPlus, List, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useAuth } from '@/contexts';
import { supabase } from '@/integrations/supabase/client';
import SearchMultiSelect, { SearchMultiSelectOption } from '@/components/common/SearchMultiSelect';
import ReusableFileUploader from '@/components/common/ReusableFileUploader';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { FileItem } from '@/types/fileTypes';
import {
  COMMITTEE_DESCRIPTION_MAX_LENGTH,
  COMMITTEE_DESCRIPTION_MIN_LENGTH,
  COMMITTEE_NAME_MAX_LENGTH,
  COMMITTEE_NAME_MIN_LENGTH,
} from '@/components/constants';
import {
  Committee,
  CommitteeMemberRole,
  CommitteeEvent,
  createCommittee,
  createCommitteeEvent,
  deleteCommitteeAttachment,
  fetchCommitteeById,
  fetchCommitteeEvents,
  fetchCommitteeMemberRoles,
  fetchCommitteeMembers,
  fetchCommittees,
  updateCommittee,
} from '@/services/committees/committeeService';
import { formatDate } from '@/lib/Dateformat';
import { TextareaWithVoice } from '@/components/ui/textarea-with-voice';

type EmployeeOption = {
  id: string;
  name: string;
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



const normalizeRole = (role: string): string => role.toLowerCase().replace(/[^a-z]/g, '');

const removeLeadingSpaces = (value: string): string => value.replace(/^\s+/, '');

const CommitteesPage = () => {
  const { employeeData } = useAuth();
  const navigate = useNavigate();
  const clientId = employeeData?.clientId || '';
  const employeeId = employeeData?.id || null;
  const isAdmin = !!employeeData?.isSuperAdmin;

  const [committees, setCommittees] = useState<Committee[]>([]);
  const [memberRoles, setMemberRoles] = useState<CommitteeMemberRole[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [committeeMemberIdsByCommittee, setCommitteeMemberIdsByCommittee] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [memberFilterId, setMemberFilterId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [viewCommittee, setViewCommittee] = useState<Committee | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [committeeAttachments, setCommitteeAttachments] = useState<FileItem[]>([]);
  const [existingCommitteeAttachments, setExistingCommitteeAttachments] = useState<Committee['attachments']>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [selectedMemberRoles, setSelectedMemberRoles] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<EmployeeOption | null>(null);

  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [selectedCommitteeForEvent, setSelectedCommitteeForEvent] = useState<Committee | null>(null);
  const [eventType, setEventType] = useState<'mom' | 'event'>('mom');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventParticipantIds, setEventParticipantIds] = useState<string[]>([]);
  const [eventAttachments, setEventAttachments] = useState<FileItem[]>([]);
  const [addingEvent, setAddingEvent] = useState(false);

  const [eventListDialogOpen, setEventListDialogOpen] = useState(false);
  const [selectedCommitteeForEventList, setSelectedCommitteeForEventList] = useState<Committee | null>(null);
  const [committeeEvents, setCommitteeEvents] = useState<CommitteeEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const loadCommittees = useCallback(async () => {
    if (!clientId) {
      setCommittees([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchCommittees(clientId);
      setCommittees(data);
      if (data.length === 0) {
        setCommitteeMemberIdsByCommittee({});
      } else {
        const memberEntries = await Promise.all(
          data.map(async (committee) => {
            try {
              const members = await fetchCommitteeMembers(committee.id, clientId);
              return [committee.id, members.map((member) => member.employee_id)] as const;
            } catch {
              return [committee.id, []] as const;
            }
          })
        );
        setCommitteeMemberIdsByCommittee(Object.fromEntries(memberEntries));
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load committees');
      setCommittees([]);
      setCommitteeMemberIdsByCommittee({});
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const loadEmployees = useCallback(async () => {
    if (!clientId) {
      setEmployees([]);
      return;
    }

    const { data, error } = await supabase
      .from('employees')
      .select('id, first_name, last_name')
      .eq('client_id', clientId)
      .eq('status', true)
      .order('first_name', { ascending: true });

    if (error) {
      setEmployees([]);
      return;
    }

    // Some clients store employee status in non-boolean formats. Fallback to all employees.
    const employeeRowsSource =
      (data || []).length > 0
        ? (data || [])
        : (
            await supabase
              .from('employees')
              .select('id, first_name, last_name')
              .eq('client_id', clientId)
              .order('first_name', { ascending: true })
          ).data || [];

    const rows = employeeRowsSource.map((employee: any) => ({
      id: employee.id,
      name: `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unnamed Employee',
    }));
    setEmployees(rows);
  }, [clientId]);

  const loadMemberRoles = useCallback(async () => {
    try {
      const roles = await fetchCommitteeMemberRoles();
      setMemberRoles(roles);
    } catch {
      setMemberRoles([]);
    }
  }, []);

  useEffect(() => {
    loadCommittees();
    loadEmployees();
    loadMemberRoles();
  }, [loadCommittees, loadEmployees, loadMemberRoles]);

  const filteredCommittees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return committees.filter((committee) => {
      const matchesCommitteeName =
        query.length === 0 ||
        committee.name.toLowerCase().includes(query) ||
        (committee.description || '').toLowerCase().includes(query);
      const memberIds = committeeMemberIdsByCommittee[committee.id] || [];
      const matchesMember = memberFilterId === 'all' || memberIds.includes(memberFilterId);
      return matchesCommitteeName && matchesMember;
    });
  }, [committees, searchTerm, committeeMemberIdsByCommittee, memberFilterId]);

  const activeCommitteeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm.trim()) count += 1;
    if (memberFilterId !== 'all') count += 1;
    return count;
  }, [searchTerm, memberFilterId]);

  const pageSize = 10;
  const totalPages = filteredCommittees.length > 0 ? Math.ceil(filteredCommittees.length / pageSize) : 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const paginatedCommittees = filteredCommittees.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, memberFilterId]);

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCommitteeAttachments([]);
    setExistingCommitteeAttachments([]);
    setSelectedMemberIds([]);
    setSelectedMemberRoles({});
    setStatus('active');
    setEditingCommittee(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setOpenDialog(true);
  };

  const openEditDialog = async (committee: Committee) => {
    setEditingCommittee(committee);
    setName(committee.name);
    setDescription(committee.description || '');
    if (clientId) {
      try {
        const [members, committeeDetails] = await Promise.all([
          fetchCommitteeMembers(committee.id, clientId),
          fetchCommitteeById(committee.id, clientId),
        ]);
        const memberIds = members.map((member) => member.employee_id);
        const memberRoleMap: Record<string, string> = {};
        members.forEach((member) => {
          memberRoleMap[member.employee_id] = member.role || '';
        });
        setSelectedMemberIds(memberIds);
        setSelectedMemberRoles(memberRoleMap);
        setExistingCommitteeAttachments(committeeDetails?.attachments || []);
        setCommitteeAttachments([]);
      } catch {
        setSelectedMemberIds([]);
        setSelectedMemberRoles({});
        setExistingCommitteeAttachments([]);
        setCommitteeAttachments([]);
      }
    }
    setStatus(committee.status ? 'active' : 'inactive');
    setOpenDialog(true);
  };

  const handleSave = async () => {
    if (!clientId) {
      toast.error('Client context is missing');
      return;
    }

    if (!name.trim()) {
      toast.error('Committee name is required');
      return;
    }
    if (name.trim().length < COMMITTEE_NAME_MIN_LENGTH || name.trim().length > COMMITTEE_NAME_MAX_LENGTH) {
      toast.error(`Committee name must be between ${COMMITTEE_NAME_MIN_LENGTH} and ${COMMITTEE_NAME_MAX_LENGTH} characters`);
      return;
    }
    const trimmedDescription = description.trim();
    if (
      trimmedDescription &&
      (trimmedDescription.length < COMMITTEE_DESCRIPTION_MIN_LENGTH ||
        trimmedDescription.length > COMMITTEE_DESCRIPTION_MAX_LENGTH)
    ) {
      toast.error(
        `Description must be between ${COMMITTEE_DESCRIPTION_MIN_LENGTH} and ${COMMITTEE_DESCRIPTION_MAX_LENGTH} characters`
      );
      return;
    }

    const normalizedName = name.trim().toLowerCase();
    const duplicateCommittee = committees.find((committee) => {
      const isSameName = committee.name.trim().toLowerCase() === normalizedName;
      const isSameRecord = editingCommittee ? committee.id === editingCommittee.id : false;
      return isSameName && !isSameRecord;
    });
    if (duplicateCommittee) {
      toast.error('Committee name already exists');
      return;
    }

    if (selectedMemberIds.length === 0) {
      toast.error('Committee members are required');
      return;
    }

    const memberWithoutRole = selectedMemberIds.find((memberId) => !selectedMemberRoles[memberId]);
    if (memberWithoutRole) {
      toast.error('Each selected member must have a role');
      return;
    }

    const chairpersonCount = selectedMemberIds.reduce((count, memberId) => {
      return count + (normalizeRole(selectedMemberRoles[memberId] || '') === 'chairperson' ? 1 : 0);
    }, 0);
    if (chairpersonCount > 1) {
      toast.error('Only one member can be assigned as Chairperson');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        clientId,
        name,
        description,
        members: selectedMemberIds.map((memberId) => ({
          employeeId: memberId,
          role: selectedMemberRoles[memberId],
        })),
        attachments: committeeAttachments,
        status: status === 'active',
        employeeId,
      };

      if (editingCommittee) {
        await updateCommittee(editingCommittee.id, payload);
        toast.success('Committee updated successfully');
      } else {
        await createCommittee(payload);
        toast.success('Committee created successfully');
      }

      setOpenDialog(false);
      resetForm();
      await loadCommittees();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save committee');
    } finally {
      setSaving(false);
    }
  };

  const resetEventForm = () => {
    setEventType('mom');
    setEventTitle('');
    setEventDescription('');
    setEventDate('');
    setEventParticipantIds([]);
    setEventAttachments([]);
    setSelectedCommitteeForEvent(null);
  };

  const handleOpenAddEvent = (committee: Committee) => {
    const committeeMemberIds = committeeMemberIdsByCommittee[committee.id] || [];
    const canAddMom = isAdmin || (!!employeeId && committeeMemberIds.includes(employeeId));
    if (!canAddMom) {
      toast.error('Only admin or committee members can add MOM/Event');
      return;
    }
    resetEventForm();
    setSelectedCommitteeForEvent(committee);
    setAddEventDialogOpen(true);
  };

  const memberOptions: SearchMultiSelectOption[] = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        label: employee.name,
      })),
    [employees]
  );

  const selectedMemberBadges = useMemo(
    () =>
      selectedMemberIds
        .map((id) => employees.find((employee) => employee.id === id))
        .filter((employee): employee is EmployeeOption => Boolean(employee)),
    [selectedMemberIds, employees]
  );

  const removeSelectedMember = (memberId: string) => {
    setSelectedMemberIds((prev) => prev.filter((id) => id !== memberId));
    setSelectedMemberRoles((prev) => {
      const clone = { ...prev };
      delete clone[memberId];
      return clone;
    });
  };

  const handleMembersChange = (ids: string[]) => {
    setSelectedMemberIds(ids);
    setSelectedMemberRoles((prev) => {
      const next: Record<string, string> = {};
      ids.forEach((id) => {
        next[id] = prev[id] || '';
      });
      return next;
    });
  };

  const handleAddEvent = async () => {
    if (!clientId || !selectedCommitteeForEvent) return;
    if (!eventTitle.trim() || !eventDate || !eventDescription.trim()) {
      toast.error('Title, date and description are required');
      return;
    }
    if (eventParticipantIds.length === 0) {
      toast.error('At least one participant is required');
      return;
    }

    try {
      setAddingEvent(true);
      await createCommitteeEvent({
        committeeId: selectedCommitteeForEvent.id,
        clientId,
        eventType,
        title: eventTitle.trim(),
        description: eventDescription,
        eventDate,
        participantIds: eventParticipantIds,
        attachments: eventAttachments,
        employeeId,
      });
      toast.success('MOM/Event added');
      setAddEventDialogOpen(false);
      resetEventForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add MOM/Event');
    } finally {
      setAddingEvent(false);
    }
  };

  const handleRemoveCommitteeAttachment = async (attachmentId: string) => {
    if (!clientId || !employeeId) return;
    try {
      await deleteCommitteeAttachment(attachmentId, clientId, employeeId);
      setExistingCommitteeAttachments((prev) => (prev || []).filter((item) => item.id !== attachmentId));
      toast.success('Committee attachment removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove committee attachment');
    }
  };

  const handleOpenEventList = async (committee: Committee) => {
    if (!clientId) return;
    setSelectedCommitteeForEventList(committee);
    setEventListDialogOpen(true);
    setEventsLoading(true);
    try {
      const data = await fetchCommitteeEvents(committee.id, clientId);
      setCommitteeEvents(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load MOM/Event list');
      setCommitteeEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const eventParticipantOptions: SearchMultiSelectOption[] = useMemo(
    () =>
      employees.map((employee) => ({
        id: employee.id,
        label: employee.name,
      })),
    [employees]
  );

  const selectedEventParticipants = useMemo(
    () =>
      eventParticipantIds
        .map((id) => employees.find((employee) => employee.id === id))
        .filter((employee): employee is EmployeeOption => Boolean(employee)),
    [eventParticipantIds, employees]
  );

  const employeeNameById = useMemo(() => {
    return employees.reduce<Record<string, string>>((acc, employee) => {
      acc[employee.id] = employee.name;
      return acc;
    }, {});
  }, [employees]);

  const renderMembersIndicator = (committee: Committee) => {
    const memberIds = committeeMemberIdsByCommittee[committee.id] || [];
    const memberEntries = memberIds
      .map((id) => ({
        id,
        name: employeeNameById[id],
      }))
      .filter((member): member is { id: string; name: string } => Boolean(member.name));
    const count = committee.member_count ?? memberIds.length;

    if (count === 0) {
      return <span className="text-gray-500">-</span>;
    }

    return (
      <HoverCard openDelay={150} closeDelay={100}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
            aria-label="View committee members"
          >
            <User className="h-4 w-4" />
            <span className="text-xs font-medium">{count}</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-72 p-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Members</p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {memberEntries.length > 0 ? (
                <ul className="list-disc pl-4 space-y-1">
                  {memberEntries.map((member) => (
                    <li key={member.id} className="text-xs text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <span>{member.name}</span>
                        {committee.chairperson_employee_id === member.id && (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-100 px-1 text-[10px] font-semibold text-orange-700">
                            L
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-gray-500">Member names unavailable</p>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const getChairpersonName = (committee: Committee) => {
    if (!committee.chairperson_employee_id) return '-';
    return employeeNameById[committee.chairperson_employee_id] || '-';
  };

  return (
    <Layout>
      <div className="w-full py-6">
        <div className="mx-6 mb-8 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Committees</h1>
                <p className="text-sm text-gray-500 mt-1">Displays all committees available in the system.</p>
              </div>
            </div>

            <Button
              onClick={openCreateDialog}
              className="flex items-center gap-2"
              disabled={!isAdmin}
              title={isAdmin ? 'Add Committee' : 'Admin only'}
            >
              <Plus className="h-4 w-4" />
              <span>Add Committee</span>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mx-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by committee name..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {activeCommitteeFilterCount > 0 && (
              <Button
                type="button"
                variant="outline"
                className="inline-flex items-center gap-2"
                onClick={() => {
                  setSearchTerm('');
                  setMemberFilterId('all');
                }}
              >
                <X className="h-4 w-4" />
                {`Clear filter (${activeCommitteeFilterCount})`}
              </Button>
            )}
            {/* <div className="w-full max-w-sm">
              <Select value={memberFilterId} onValueChange={setMemberFilterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div> */}
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading committees...</div>
          ) : filteredCommittees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No committees found</div>
          ) : (
            <div className="overflow-x-auto rounded-md border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead>Committee Name</TableHead>
                    {/* <TableHead>Description</TableHead> */}
                    <TableHead>Number of Members</TableHead>
                    <TableHead>Leader</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCommittees.map((committee) => (
                    <TableRow key={committee.id}>
                      <TableCell className="font-medium">{committee.name}</TableCell>
                      <TableCell>{renderMembersIndicator(committee)}</TableCell>
                      <TableCell>{getChairpersonName(committee)}</TableCell>
                      <TableCell>{formatDate(committee.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                            onClick={() => openEditDialog(committee)}
                            disabled={!isAdmin}
                            title={isAdmin ? 'Edit committee' : 'Admin only'}
                          >
                            <Pencil className="h-4 w-4 mr-1" />

                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleOpenAddEvent(committee)}
                            disabled={!(isAdmin || ((committeeMemberIdsByCommittee[committee.id] || []).includes(employeeId || '')))}
                            title={
                              isAdmin || ((committeeMemberIdsByCommittee[committee.id] || []).includes(employeeId || ''))
                                ? 'Add MOM/Event'
                                : 'Committee member or admin only'
                            }
                          >
                            <CalendarPlus className="h-4 w-4 mr-1" />

                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => navigate(`/committees/${committee.id}/events`)}
                          >
                            <List className="h-4 w-4 mr-1" />

                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        {filteredCommittees.length > pageSize && (
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
        )}
      </div>

      <AlertDialog
        open={openDialog}
        onOpenChange={(open) => {
          setOpenDialog(open);
          if (!open) resetForm();
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>{editingCommittee ? 'Edit Committee' : 'Add Committee'}</AlertDialogTitle>
            <AlertDialogDescription>Enter committee details and save.</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 px-2 overflow-y-auto pr-2 no-scrollbar">
            <div className="space-y-2">
              <Label htmlFor="committee-name">Committee Name <span className="text-red-500">*</span></Label>
              <Input
                id="committee-name"
                value={name}
                onChange={(e) => setName(removeLeadingSpaces(e.target.value))}
                placeholder="Enter committee name"
                maxLength={COMMITTEE_NAME_MAX_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="committee-description">Description</Label>
              <TextareaWithVoice
                id="committee-description"
                value={description}
                onChange={(e) => setDescription(removeLeadingSpaces(e.target.value))}
                placeholder="Describe committee purpose"
                rows={8}
                maxLength={COMMITTEE_DESCRIPTION_MAX_LENGTH}
              />
            </div>

            <div className="space-y-2">
              <Label>Members <span className="text-red-500">*</span></Label>
              <SearchMultiSelect
                options={memberOptions}
                selectedIds={selectedMemberIds}
                onChange={handleMembersChange}
                placeholder="Search and select members..."
              />
              {selectedMemberBadges.length > 0 && (
                <div className="space-y-2 pt-2 max-h-56 overflow-y-auto rounded-md border p-2 no-scrollbar">
                  {selectedMemberBadges.map((member) => (
                    <div key={`role-${member.id}`} className="grid grid-cols-[1fr_200px_auto] items-center gap-3 ">
                      <span className="text-sm text-gray-700">{member.name}</span>
                      <Select
                        value={selectedMemberRoles[member.id] || ''}
                        onValueChange={(value) =>
                          setSelectedMemberRoles((prev) => ({
                            ...prev,
                            [member.id]: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select member role" />
                        </SelectTrigger>
                        <SelectContent>
                          {memberRoles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setMemberToRemove(member)}
                        aria-label={`Remove ${member.name}`}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Members are sourced from the employee table. Role is mandatory for each member.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Status <span className="text-red-500">*</span></Label>
              <Select value={status} onValueChange={(value: 'active' | 'inactive') => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Committee Attachments (Optional)</Label>
              <ReusableFileUploader
                onFilesChange={setCommitteeAttachments}
                initialFiles={committeeAttachments}
                maxFiles={20}
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
              {editingCommittee && existingCommitteeAttachments && existingCommitteeAttachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Existing Committee Attachments</Label>
                  <div className="max-h-28 overflow-y-auto space-y-1 rounded-md border p-2">
                    {existingCommitteeAttachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between gap-2">
                        <a
                          className="block truncate text-xs text-blue-600 hover:underline"
                          href={attachment.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {attachment.file_name}
                        </a>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveCommitteeAttachment(attachment.id)}
                          title="Remove attachment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <AlertDialogFooter className="pt-3 border-t">
            <Button variant="outline" onClick={() => setOpenDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingCommittee ? 'Update Committee' : 'Create Committee'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!viewCommittee} onOpenChange={(open) => !open && setViewCommittee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Committee Details</AlertDialogTitle>
          </AlertDialogHeader>
          {viewCommittee && (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Committee Name:</span> {viewCommittee.name}</p>
              <p><span className="font-medium">Description:</span> {viewCommittee.description || '-'}</p>
              <p><span className="font-medium">Number of Members:</span> {viewCommittee.member_count || 0}</p>
              <p><span className="font-medium">Created Date:</span> {formatDateTime(viewCommittee.created_at)}</p>
              <p><span className="font-medium">Last Updated:</span> {formatDateTime(viewCommittee.updated_at)}</p>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => {
          if (!open) setMemberToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member</AlertDialogTitle>
            <AlertDialogDescription>
              Remove "{memberToRemove?.name}" from this committee member list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (memberToRemove) {
                  removeSelectedMember(memberToRemove.id);
                }
                setMemberToRemove(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={addEventDialogOpen}
        onOpenChange={(open) => {
          setAddEventDialogOpen(open);
          if (!open) resetEventForm();
        }}
      >
        <AlertDialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <AlertDialogHeader>
            <AlertDialogTitle>Add MOM/Event</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCommitteeForEvent?.name ? `Committee: ${selectedCommitteeForEvent.name}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 overflow-y-auto pr-2 px-2 no-scrollbar">
            <div className="space-y-2">
              <Label htmlFor="event-title">Title <span className="text-red-500">*</span></Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(removeLeadingSpaces(e.target.value))}
                placeholder="Enter title"
              />
            </div>
            <div className="space-y-2">
              <Label>Type <span className="text-red-500">*</span></Label>
              <Select value={eventType} onValueChange={(value: 'mom' | 'event') => setEventType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mom">MOM</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Date <span className="text-red-500">*</span></Label>
              <Input
                id="event-date"
                type="datetime-local"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <TextareaWithVoice
                id="event-description"
                value={eventDescription}
                onChange={(e) => setEventDescription(removeLeadingSpaces(e.target.value))}
                placeholder="Enter description"
                rows={8}
              />
            </div>



            <div className="space-y-2">
              <Label>Participants <span className="text-red-500">*</span></Label>
              <SearchMultiSelect
                options={eventParticipantOptions}
                selectedIds={eventParticipantIds}
                onChange={setEventParticipantIds}
                placeholder="Search and select participants..."
              />
              {selectedEventParticipants.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedEventParticipants.map((participant) => (
                    <span
                      key={participant.id}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700 border border-blue-200"
                    >
                      {participant.name}
                      <button
                        type="button"
                        onClick={() => setEventParticipantIds((prev) => prev.filter((id) => id !== participant.id))}
                        className="inline-flex items-center justify-center rounded-full hover:bg-blue-100 p-0.5"
                        aria-label={`Remove ${participant.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <ReusableFileUploader
                onFilesChange={setEventAttachments}
                initialFiles={eventAttachments}
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
                disabled={addingEvent}
              />
            </div>
          </div>

          <AlertDialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setAddEventDialogOpen(false)} disabled={addingEvent}>
              Cancel
            </Button>
            <Button onClick={handleAddEvent} disabled={addingEvent}>
              {addingEvent ? 'Saving...' : 'Save'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={eventListDialogOpen}
        onOpenChange={(open) => {
          setEventListDialogOpen(open);
          if (!open) {
            setSelectedCommitteeForEventList(null);
            setCommitteeEvents([]);
          }
        }}
      >
        <AlertDialogContent className="max-w-5xl w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>View MOM/Event List</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCommitteeForEventList?.name ? `Committee: ${selectedCommitteeForEventList.name}` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {eventsLoading ? (
            <div className="py-8 text-center text-gray-500">Loading MOM/Event records...</div>
          ) : committeeEvents.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No MOM/Event records found.</div>
          ) : (
            <div className="w-full max-h-[420px] overflow-y-auto overflow-x-hidden rounded-md border no-scrollbar">
              <Table className="w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Attachments</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {committeeEvents.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.event_type.toUpperCase()}</TableCell>
                      <TableCell className="max-w-[220px] truncate">{item.description || '-'}</TableCell>
                      <TableCell>{formatDateTime(item.event_date)}</TableCell>
                      <TableCell>{item.participants?.length || 0}</TableCell>
                      <TableCell>
                        {item.attachments && item.attachments.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {item.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={attachment.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-600 hover:underline"
                              >
                                {attachment.file_name}
                              </a>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(item.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default CommitteesPage;
