import { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth';
import { useClientIntegrationEnabled } from '@/hooks/useClientIntegrationEnabled';
import { supabase } from '@/integrations/supabase/client';
import { Student } from '@/types/student';

// De-duplicate identical student-management invocations (handles React StrictMode double-effect in dev)
const _studentMgmtInflight = new Map<string, Promise<any>>();
const _studentMgmtRecent = new Map<string, { at: number; value: any }>();
const STUDENT_MGMT_DEDUPE_MS = 1200;
const invokeStudentList = async (clientId: string) => {
  const key = `list:${clientId}`;
  const now = Date.now();
  const recent = _studentMgmtRecent.get(key);
  if (recent && now - recent.at < STUDENT_MGMT_DEDUPE_MS) return recent.value;
  const existing = _studentMgmtInflight.get(key);
  if (existing) return existing;
  const request = supabase.functions
    .invoke('student-management', { body: { client_id: clientId }, headers: { path: 'list' } })
    .then((res) => { _studentMgmtRecent.set(key, { at: Date.now(), value: res }); return res; })
    .finally(() => { _studentMgmtInflight.delete(key); });
  _studentMgmtInflight.set(key, request);
  return request;
};
 
export interface StudentOption {
  id: string;
  name: string;
  student_id?: string;
  section_id?: string | null;
  grade_id?: string | null;
  section_name?: string | null;
  grade_name?: string | null;
  is_external?: boolean;
}
 
interface StudentSearchSelectProps {
  value: StudentOption | null;
  onChange: (student: StudentOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  refreshKey?: number;
}
 
export function StudentSearchSelect({
  value,
  onChange,
  placeholder = 'Select student...',
  disabled = false,
  className = '',
  refreshKey,
}: StudentSearchSelectProps) {
  const { employeeData } = useAuth();
  const { isIntegrationEnabled } = useClientIntegrationEnabled();
  const [fetchedStudents, setFetchedStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentOption[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSearchingAPI, setIsSearchingAPI] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  /** When integration is off: only open dropdown after user clicks the input, not on auto-focus when dialog opens */
  const userClickedInputRef = useRef(false);
 
  const clientId = employeeData?.clientId;
 
  useEffect(() => {
    if (isIntegrationEnabled || !clientId) {
      setFetchedStudents([]);
      return;
    }
    let cancelled = false;
    setIsLoadingStudents(true);
    invokeStudentList(clientId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error(error);
          setFetchedStudents([]);
          return;
        }
        const studentList: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.students)
            ? data.students
            : [];
        setFetchedStudents(
          studentList.map((s: any) => ({
            id: s.id,
            studentId: s.student_id,
            name: s.name,
            grade: s.grade,
            section: s.section,
            campus: s.campus,
            createdAt: new Date(s.created_at),
            updatedAt: new Date(s.updated_at),
            grade_id: s.grade_id ?? null,
            section_id: s.section_id ?? null,
            campus_id: s.campus_id ?? null,
          }))
        );
      })
      .catch((e) => {
        if (!cancelled) { console.error(e); setFetchedStudents([]); }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingStudents(false);
      });
    return () => { cancelled = true; };
  }, [clientId, isIntegrationEnabled, refreshKey]);
 
  const searchStudentsAPI = useCallback(async (term: string): Promise<StudentOption[]> => {
    if (!term || term.length < 3 || !clientId) return [];
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return [];
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = new URL(`${supabaseUrl}/functions/v1/search-students`);
      url.searchParams.set('search', term);
      url.searchParams.set('client_id', clientId);
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) return [];
      const result = await res.json();
      if (!result.success || !Array.isArray(result.data)) return [];
      return result.data.map((s: any) => ({
        id: s.id,
        name: s.name,
        student_id: s.student_id,
        section_id: s.section_id ?? null,
        grade_id: s.grade_id ?? null,
        section_name: s.sections?.name ?? null,
        grade_name: s.grades?.name ?? null,
        is_external: s.is_external === true,
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [clientId]);
 
  useEffect(() => {
    if (!open) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (isIntegrationEnabled) {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        setIsSearchingAPI(false);
        return;
      }
      setIsSearchingAPI(true);
      timeoutRef.current = setTimeout(async () => {
        const results = await searchStudentsAPI(searchQuery);
        setSearchResults(results);
        setIsSearchingAPI(false);
        timeoutRef.current = null;
      }, 500);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    } else {
      if (!searchQuery.trim()) {
        setSearchResults(
          fetchedStudents.map((s) => ({
            id: s.id,
            name: s.name,
            student_id: s.studentId,
            section_id: s.section_id ?? null,
            grade_id: s.grade_id ?? null,
            section_name: s.section ?? null,
            grade_name: s.grade ?? null,
            is_external: false,
          }))
        );
      } else {
        const q = searchQuery.toLowerCase();
        const filtered = fetchedStudents.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.studentId && s.studentId.toLowerCase().includes(q))
        );
        setSearchResults(
          filtered.map((s) => ({
            id: s.id,
            name: s.name,
            student_id: s.studentId,
            section_id: s.section_id ?? null,
            grade_id: s.grade_id ?? null,
            section_name: s.section ?? null,
            grade_name: s.grade ?? null,
            is_external: false,
          }))
        );
      }
    }
  }, [open, searchQuery, isIntegrationEnabled, fetchedStudents, searchStudentsAPI]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayValue = value
    ? (value.student_id
        ? `${value.name || value.student_id} (${value.student_id})`
        : (value.name || ''))
    : '';

  const options = open ? searchResults : [];

  const handleFocus = () => {
    if (userClickedInputRef.current) {
      setOpen(true);
      userClickedInputRef.current = false;
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Input
        value={open ? searchQuery : displayValue}
        onMouseDown={() => {
          userClickedInputRef.current = true;
        }}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setOpen(true);
          if (!e.target.value) onChange(null);
        }}
        onFocus={handleFocus}
        placeholder={isLoadingStudents ? 'Loading students...' : placeholder}
        disabled={disabled || isLoadingStudents}
        className="pr-8"
      />
      <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {isIntegrationEnabled && searchQuery.length > 0 && searchQuery.length < 3 && (
            <div className="px-3 py-2 text-sm text-gray-500">Type at least 3 characters</div>
          )}
          {isIntegrationEnabled && searchQuery.length >= 3 && isSearchingAPI && (
            <div className="px-3 py-2 text-sm text-gray-500">Searching...</div>
          )}
          {!isSearchingAPI && options.length === 0 && searchQuery.length >= (isIntegrationEnabled ? 3 : 0) && (
            <div className="px-3 py-2 text-sm text-gray-500">No results found</div>
          )}
          {!isSearchingAPI &&
            options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="flex w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt);
                  setSearchQuery('');
                  setOpen(false);
                }}
              >
                {opt.student_id ? `${opt.name} (${opt.student_id})` : opt.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
