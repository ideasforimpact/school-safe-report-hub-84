import React, { useMemo } from 'react';
import { IncidentRecord } from '@/services/incidentService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

interface StudentsInvolvedTableProps {
  incidents: IncidentRecord[];
  loading: boolean;
}

type PersonInvolved = {
  id?: string;
  role?: string;
  name?: string;
  student_id?: string;
  grade?: string;
  grade_name?: string;
  grades?: { name?: string } | null;
  section?: string;
  section_name?: string;
  sections?: { name?: string } | null;
};

type StudentIncidentRef = {
  id: string;
  ticketId: string;
};

type StudentInvolvementRow = {
  key: string;
  name: string;
  grade: string;
  section: string;
  incidents: StudentIncidentRef[];
  categories: string[];
};

const StudentsInvolvedTable: React.FC<StudentsInvolvedTableProps> = ({ incidents, loading }) => {
  const rows = useMemo<StudentInvolvementRow[]>(() => {
    const byStudent = new Map<string, StudentInvolvementRow>();

    const normalizeText = (value: unknown): string => {
      return typeof value === 'string' && value.trim() ? value.trim() : '';
    };

    const readNestedName = (value: unknown): string => {
      if (!value || typeof value !== 'object') return '';
      return normalizeText((value as { name?: unknown }).name);
    };

    const stripStudentIdSuffix = (name: string): string => {
      return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    };

    incidents.forEach((incident) => {
      const people = Array.isArray(incident.peopleInvolved) ? incident.peopleInvolved : [];

      people.forEach((personRaw) => {
        const person = personRaw as PersonInvolved;
        if ((person.role || '').toLowerCase() !== 'student') return;

        const rawName = normalizeText(person.name) || 'Unknown Student';
        const name = stripStudentIdSuffix(rawName) || 'Unknown Student';
        const grade =
          normalizeText(person.grade) ||
          normalizeText(person.grade_name) ||
          readNestedName(person.grades) ||
          '';
        const section =
          normalizeText(person.section) ||
          normalizeText(person.section_name) ||
          readNestedName(person.sections) ||
          '';

        const studentId = normalizeText(person.student_id) || normalizeText(person.id);
        const key = studentId || `${name.toLowerCase()}::${grade.toLowerCase()}::${section.toLowerCase()}`;

        const existing = byStudent.get(key);
        if (!existing) {
          byStudent.set(key, {
            key,
            name,
            grade,
            section,
            incidents: [],
            categories: [],
          });
        }

        const row = byStudent.get(key);
        if (!row) return;

        if (!row.grade && grade) row.grade = grade;
        if (!row.section && section) row.section = section;

        if (!row.incidents.some((entry) => entry.id === incident.id)) {
          row.incidents.push({
            id: incident.id,
            ticketId: incident.ticket_id,
          });
        }

        if (incident.category && !row.categories.includes(incident.category)) {
          row.categories.push(incident.category);
        }
      });
    });

    return Array.from(byStudent.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [incidents]);

  const getInitials = (fullName: string): string => {
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
    return initials || 'ST';
  };

  const openIncidentInNewTab = (incidentId: string): void => {
    window.open(`/incident/${incidentId}`, '_blank', 'noopener,noreferrer');
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-10">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading students involved...</span>
        </div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-10 text-center text-gray-500">
        No students found in the selected incidents.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Student Name
              </TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Grade and Section
              </TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Incidents
              </TableHead>
              <TableHead className="py-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Categories
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key} className="hover:bg-transparent">
                <TableCell className="py-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gray-200 text-sm font-semibold text-gray-600">
                        {getInitials(row.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xl font-semibold text-gray-900">{row.name}</span>
                  </div>
                </TableCell>

                <TableCell className="py-5">
                  <div className="leading-6">
                    <p className="text-xl font-medium text-gray-900">
                      {row.grade || '-'}
                    </p>
                    <p className="text-base text-gray-500">
                      {row.section || '-'}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="py-5">
                  <div className="flex flex-wrap items-center text-xl font-semibold text-indigo-700">
                    {row.incidents.map((incident, index) => (
                      <React.Fragment key={incident.id}>
                        <button
                          type="button"
                          className="hover:text-indigo-800 hover:underline"
                          onClick={(event) => {
                            event.stopPropagation();
                            openIncidentInNewTab(incident.id);
                          }}
                        >
                          {incident.ticketId}
                        </button>
                        {index < row.incidents.length - 1 && (
                          <span className="mx-2 text-gray-400">•</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </TableCell>

                <TableCell className="py-5">
                  <div className="flex flex-wrap items-center text-xl text-gray-800">
                    {row.categories.map((category, index) => (
                      <React.Fragment key={`${row.key}-${category}`}>
                        <span>{category}</span>
                        {index < row.categories.length - 1 && (
                          <span className="mx-2 text-gray-400">•</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default StudentsInvolvedTable;
