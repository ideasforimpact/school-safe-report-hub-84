import React, { useState, useEffect, useCallback } from 'react';
import { Person } from '@/types/incident';
import { Student } from '@/types/student';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth/useAuth';
import { toast } from 'sonner';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { FormErrors } from '@/hooks/incident-form/useIncidentFormValidation';
import AddStudentDialog from '@/components/students/AddStudentDialog';
import { useClientIntegrationEnabled } from '@/hooks/useClientIntegrationEnabled';

interface UserBasicInfo {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PeopleInvolvedSectionProps {
  peopleInvolved: Person[];
  onPersonChange: (index: number, field: string, value: string, additionalFields?: Record<string, string>) => void;
  onAddPerson: () => void;
  onRemovePerson: (index: number) => void;
  students: Student[];
  employees: UserBasicInfo[];
  errors?: FormErrors;
  onStudentAdded?: () => void;
}

const PeopleInvolvedSection: React.FC<PeopleInvolvedSectionProps> = ({
  peopleInvolved,
  onPersonChange,
  onAddPerson,
  onRemovePerson,
  students,
  employees,
  errors = {},
  onStudentAdded
}) => {
  const { employeeData } = useAuth();
  const { isIntegrationEnabled } = useClientIntegrationEnabled();
  const [staffMembers, setStaffMembers] = useState<Employee[]>([]);
  const [fetchedStudents, setFetchedStudents] = useState<Student[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Get client type from auth context
  const clientType = employeeData?.client?.client_type?.key || employeeData?.clientType?.key || '';
  const isSchoolClient = clientType.toLowerCase() === 'school';
  
  console.log('Auth employeeData in incidents:', employeeData);
  console.log('Client type from auth:', clientType);
  console.log('Is school client:', isSchoolClient);
  
  // State for search functionality
  const [searchQueries, setSearchQueries] = useState<Record<number, string>>({});
  const [isSearching, setIsSearching] = useState<Record<number, boolean>>({});
  const [searchResults, setSearchResults] = useState<Record<number, Student[]>>({});
  const [isSearchingAPI, setIsSearchingAPI] = useState<Record<number, boolean>>({});
  const [searchTimeouts, setSearchTimeouts] = useState<Record<number, NodeJS.Timeout>>({});
  
  // State for AddStudentDialog
  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
  const [currentPersonIndex, setCurrentPersonIndex] = useState<number | null>(null);
  const [currentPersonData, setCurrentPersonData] = useState<Person | null>(null);
  const [hadSearchQuery, setHadSearchQuery] = useState(false);

  // Fetch client type information
  useEffect(() => {
    const fetchClientType = async () => {
      if (!employeeData?.clientId) return;

      try {
        const { data: clientData, error } = await supabase
          .from('clients')
          .select('institution_type')
          .eq('id', employeeData.clientId)
          .single();

        if (error) {
          console.error('Error fetching client type:', error);
          return;
        }

        console.log('Fetched client data:', clientData);
      } catch (error) {
        console.error('Error fetching client type:', error);
      }
    };

    fetchClientType();
  }, [employeeData?.clientId]);

  // Fetch staff members when component mounts
  useEffect(() => {
    const fetchStaffMembers = async () => {
      if (!employeeData?.clientId) return;

      try {
        setIsLoadingStaff(true);
        const { data: staffData, error } = await supabase
          .from('employees')
          .select('id, first_name, last_name, email')
          .eq('client_id', employeeData.clientId)
          .eq('status', true);

        if (error) {
          console.error('Error fetching staff members:', error);
          toast.error('Failed to load staff members');
          return;
        }

        const mappedStaff = staffData.map(emp => ({
          id: emp.id,
          firstName: emp.first_name,
          lastName: emp.last_name,
          email: emp.email
        }));

        setStaffMembers(mappedStaff);
      } catch (error) {
        console.error('Error fetching staff members:', error);
        toast.error('Failed to load staff members');
      } finally {
        setIsLoadingStaff(false);
      }
    };

    fetchStaffMembers();
  }, [employeeData?.clientId]);

  // Fetch students filtered by client_id - only if integration is NOT enabled
  const fetchStudents = useCallback(async () => {
    // Don't fetch client-side students if integration is enabled
    if (isIntegrationEnabled) {
      console.log('[PeopleInvolvedSection] Integration enabled - skipping client-side student fetch');
      setFetchedStudents([]);
      return;
    }

    if (!employeeData?.clientId) return;

    try {
      setIsLoadingStudents(true);
      const { data: studentData, error } = await supabase
        .from('students')
        .select('id, student_id, name, grade, section, campus')
        .eq('client_id', employeeData.clientId);

      if (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to load students');
        return;
      }

      const mappedStudents = studentData.map(student => ({
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        grade: student.grade,
        section: student.section,
        campus: student.campus,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      console.log('[PeopleInvolvedSection] Updated student list:', {
        totalStudents: mappedStudents.length,
        students: mappedStudents.map(s => ({ id: s.id, name: s.name, studentId: s.studentId }))
      });
      setFetchedStudents(mappedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoadingStudents(false);
    }
  }, [employeeData?.clientId, isIntegrationEnabled]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Log when people are added
  useEffect(() => {
    console.log('[PeopleInvolvedSection] People involved updated:', {
      count: peopleInvolved.length,
      people: peopleInvolved.map((p, idx) => ({
        index: idx,
        role: p.role,
        name: p.name
      })),
      fetchedStudentsCount: fetchedStudents.length
    });
  }, [peopleInvolved.length, fetchedStudents.length]);

  // Search students using edge function
  const searchStudentsAPI = useCallback(async (searchTerm: string, clientId: string) => {
    if (!searchTerm || searchTerm.length < 3) {
      return [];
    }

    try {
      // Get session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        console.error('[Search Students] No authentication token available');
        return [];
      }

      // Build URL with query params
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const url = new URL(`${supabaseUrl}/functions/v1/search-students`);
      url.searchParams.set('search', searchTerm);
      url.searchParams.set('client_id', clientId);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('[Search Students] API error:', response.status, response.statusText);
        return [];
      }

      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        // Return data in the same format as transformStudent from edge function
        // This ensures consistent format for both internal and external students
        return result.data.map((student: any) => ({
          id: student.id,
          student_id: student.student_id, // Keep original field name from API
          name: student.name,
          gender: student.gender || null,
          email: student.email || null,
          status: student.status || null,
          grade_id: student.grade_id,
          section_id: student.section_id,
          client_id: student.client_id,
          external_client_id: student.external_client_id || null, // Include external_client_id from API response
          grades: student.grades || null,
          sections: student.sections || null,
          is_external: student.is_external || false,
          // Also include legacy fields for backward compatibility
          studentId: student.student_id,
          grade: student.grades?.name || '',
          section: student.sections?.name || '',
          campus: '',
          isExternal: student.is_external || false,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
      }

      return [];
    } catch (error) {
      console.error('[Search Students] Error calling API:', error);
      return [];
    }
  }, []);

  const handleSearch = (index: number, value: string, role: string) => {
    setSearchQueries(prev => ({ ...prev, [index]: value }));
    setIsSearching(prev => ({ ...prev, [index]: true }));

    // Clear previous timeout
    if (searchTimeouts[index]) {
      clearTimeout(searchTimeouts[index]);
    }

    // For Student role, use edge function search
    if (role === 'Student' && employeeData?.clientId) {
      if (value.length < 3) {
        // Clear search results if less than 3 characters
        setSearchResults(prev => ({ ...prev, [index]: [] }));
        setIsSearchingAPI(prev => ({ ...prev, [index]: false }));
        return;
      }

      // Set loading state
      setIsSearchingAPI(prev => ({ ...prev, [index]: true }));

      // Debounce API call (500ms delay)
      const timeout = setTimeout(async () => {
        const results = await searchStudentsAPI(value, employeeData.clientId);
        setSearchResults(prev => ({ ...prev, [index]: results }));
        setIsSearchingAPI(prev => ({ ...prev, [index]: false }));
      }, 500);

      setSearchTimeouts(prev => ({ ...prev, [index]: timeout }));
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(searchTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [searchTimeouts]);

  const handleSelectPerson = (index: number, person: Employee | Student, role: string) => {
    if (role === 'Staff') {
      const staff = person as Employee;
      // Update both name and id in a single atomic update
      const additionalFields = staff.id ? { id: staff.id } : undefined;
      onPersonChange(index, 'name', `${staff.firstName} ${staff.lastName}`, additionalFields);
    } else {
      const student = person as Student | any;
      
      // Check if this is an external student (from API) or internal student (from client-side)
      const isExternal = student.is_external === true || student.isExternal === true;
      
      // Prepare all student information - use all available fields from the student object
      const studentInfo: any = {
        id: student.id || null,
        student_id: student.student_id || student.studentId || null,
        name: student.name,
        is_external: isExternal ? true : false, // Explicitly set to false for internal students
        // Include all fields from the student object
        gender: student.gender || null,
        email: student.email || null,
        status: student.status || null,
        grade_id: student.grade_id || null,
        section_id: student.section_id || null,
        client_id: student.client_id || employeeData?.clientId || null,
        grades: student.grades || (student.grade ? { id: null, name: student.grade } : null),
        sections: student.sections || (student.section ? { id: null, name: student.section } : null),
      };
      
      // For external students, always include external_client_id and external_student_id from the API response
      if (isExternal) {
        studentInfo.external_client_id = student.external_client_id || null;
        // external_student_id is the original student ID from the external system (stored as 'id' in the student object)
        studentInfo.external_student_id = student.id || null;
      }
      
      // Update name with student ID in parentheses
      const studentId = student.student_id || student.studentId || '';
      const displayName = studentId ? `${student.name} (${studentId})` : student.name;
      
      console.log('[PeopleInvolvedSection] Selected student:', {
        student,
        studentInfo,
        isExternal,
        displayName
      });
      
      // Pass all student information as additional fields
      onPersonChange(index, 'name', displayName, studentInfo);
    }
    setIsSearching(prev => ({ ...prev, [index]: false }));
    setSearchQueries(prev => ({ ...prev, [index]: '' }));
  };

  const handleAddStudentClick = (index: number) => {
    setCurrentPersonIndex(index);
    // Create a person object with the search query as the name for prepopulation
    const searchQuery = searchQueries[index] || '';
    // Track if there was a search query - only auto-fill if there was one
    setHadSearchQuery(!!searchQuery);
    const personWithSearchName = {
      ...peopleInvolved[index],
      name: searchQuery
    };
    setCurrentPersonData(personWithSearchName);
    setIsAddStudentDialogOpen(true);
    setIsSearching(prev => ({ ...prev, [index]: false }));
    setSearchQueries(prev => ({ ...prev, [index]: '' }));
  };

  const handleStudentAdded = async (newStudent: Student) => {
    // Only auto-fill if there was a search query (Scenario 2)
    // Don't auto-fill if there was no search query (Scenario 1)
    if (currentPersonIndex !== null && hadSearchQuery) {
      // Prepare all student information for internal student
      const studentInfo: any = {
        id: newStudent.id || null,
        student_id: newStudent.studentId || null,
        name: newStudent.name,
        is_external: false, // Newly added students are always internal
        gender: null,
        email: null,
        status: null,
        grade_id: null,
        section_id: null,
        client_id: employeeData?.clientId || null,
        grades: newStudent.grade ? { id: null, name: newStudent.grade } : null,
        sections: newStudent.section ? { id: null, name: newStudent.section } : null,
      };
      
      // Update the person with the new student data including all information
      onPersonChange(currentPersonIndex, 'name', `${newStudent.name} (${newStudent.studentId})`, studentInfo);
    }
    setIsAddStudentDialogOpen(false);
    setCurrentPersonIndex(null);
    setCurrentPersonData(null);
    setHadSearchQuery(false);
    
    // Refresh the student list to show the newly added student
    await fetchStudents();
    
    // Also call the parent callback if provided
    if (onStudentAdded) {
      onStudentAdded();
    }
  };

  // Transform client-side student to match API format (from transformStudent in edge function)
  const transformClientStudent = (student: Student): any => {
    return {
      id: student.id,
      student_id: student.studentId,
      name: student.name,
      gender: null,
      email: null,
      status: null,
      grade_id: null,
      section_id: null,
      client_id: employeeData?.clientId || null,
      grades: student.grade ? { id: null, name: student.grade } : null,
      sections: student.section ? { id: null, name: student.section } : null,
      is_external: false
    };
  };

  const getFilteredOptions = (index: number, role: string) => {
    const searchQuery = searchQueries[index] || '';
    
    // Get already selected people names for filtering
    const selectedStaffNames = peopleInvolved
      .filter((person, idx) => idx !== index && person.role === 'Staff')
      .map(person => person.name);
    
    const selectedStudentNames = peopleInvolved
      .filter((person, idx) => idx !== index && person.role === 'Student')
      .map(person => {
        // Handle both formats: "John Doe" and "John Doe (STU123)"
        return person.name.includes('(') ? person.name.split(' (')[0] : person.name;
      });
    
    if (role === 'Staff') {
      const availableStaff = staffMembers.filter(staff => {
        const fullName = `${staff.firstName} ${staff.lastName}`;
        return !selectedStaffNames.includes(fullName);
      });
      
      return searchQuery
        ? availableStaff.filter(staff => {
            const fullName = `${staff.firstName} ${staff.lastName}`;
            const searchTerm = searchQuery.toLowerCase();
            return fullName.toLowerCase().includes(searchTerm) || 
                   staff.email.toLowerCase().includes(searchTerm);
          })
        : availableStaff;
    } else if (role === 'Student') {
      // If integration is enabled, don't show client-side students
      if (isIntegrationEnabled) {
        // Only show API search results when integration is enabled
        if (searchQuery.length === 0) {
          // Return empty array - no client-side data when integration is enabled
          return [];
        }
      } else {
        // Integration is NOT enabled - show client-side students
        if (searchQuery.length === 0) {
          // If search query is empty, show all internal students from client-side data
          const availableInternalStudents = fetchedStudents.filter(student => {
            const studentName = student.name;
            return !selectedStudentNames.includes(studentName);
          });

          // Transform to match API format (same as transformStudent in edge function)
          const transformedInternal = availableInternalStudents.map(transformClientStudent);
          
          return transformedInternal;
        }
      }
      
      // If search query is less than 3 characters, show message
      if (searchQuery.length > 0 && searchQuery.length < 3) {
        return [{ id: 'min-chars', name: 'Please type at least 3 characters', isMinCharsMessage: true } as any];
      }

      // Use API search results if available (for Student role with >= 3 characters)
      const apiSearchResults = searchResults[index] || [];
      const isAPILoading = isSearchingAPI[index];

      // When integration is disabled, also include local students that match the search
      let localStudents: any[] = [];
      if (!isIntegrationEnabled && searchQuery.length >= 3) {
        const searchTerm = searchQuery.toLowerCase();
        const matchingLocalStudents = fetchedStudents.filter(student => {
          const studentName = student.name.toLowerCase();
          const studentId = student.studentId?.toLowerCase() || '';
          return (studentName.includes(searchTerm) || studentId.includes(searchTerm)) &&
                 !selectedStudentNames.includes(student.name);
        });
        localStudents = matchingLocalStudents.map(transformClientStudent);
      }

      // Combine API results and local students, removing duplicates
      const allStudents = [...apiSearchResults, ...localStudents];
      const uniqueStudents = allStudents.filter((student, index, self) => 
        index === self.findIndex(s => s.id === student.id || s.student_id === student.student_id)
      );

      // Filter out already selected students
      const availableStudents = uniqueStudents.filter(student => {
        const studentName = student.name;
        return !selectedStudentNames.includes(studentName);
      });

      const result: any[] = [];

      // Show loading state
      if (isAPILoading) {
        result.push({ id: 'loading', name: 'Searching...', isLoading: true } as any);
        return result;
      }

      // Add search results
      if (availableStudents.length > 0) {
        result.push(...availableStudents);
      } else if (searchQuery.length >= 3) {
        // No results found after search
        result.push({ id: 'no-student-found', name: 'No Student Found', isNoStudentOption: true } as any);
      }

      // Add "Add Student" option at the bottom (only if search query exists and integration is NOT enabled)
      if (searchQuery.length >= 3 && !isIntegrationEnabled) {
        result.push({ id: 'add-student', name: 'Add Student', isAddOption: true } as any);
      }

      return result;
    }
    return [];
  };

  const getSelectedDisplay = (person: Person, role: string) => {
    if (role === 'Staff') {
      const staff = staffMembers.find(s => `${s.firstName} ${s.lastName}` === person.name);
      return staff ? `${staff.firstName} ${staff.lastName} (${staff.email})` : person.name;
    } else if (role === 'Student') {
      // If the name already includes student ID in parentheses, return as is
      if (person.name.includes('(') && person.name.includes(')')) {
        return person.name;
      }
      // Otherwise, try to find the student and add ID
      const student = fetchedStudents.find(s => s.name === person.name);
      return student ? `${student.name} (${student.studentId})` : person.name;
    }
    return person.name;
  };

  const renderNameField = (person: Person, index: number) => {
    const hasError = errors[`peopleInvolved.${index}.name`];
    
    if (person.role === 'Staff' || person.role === 'Student') {
      const isCurrentlySearching = isSearching[index];
      const filteredOptions = getFilteredOptions(index, person.role);
      const selectedDisplay = getSelectedDisplay(person, person.role);
      const isLoading = person.role === 'Staff' ? isLoadingStaff : isLoadingStudents;
      
      // Log render state for debugging
      if (person.role === 'Student' && isCurrentlySearching) {
        console.log('[PeopleInvolvedSection] Rendering Student name field:', {
          index,
          isCurrentlySearching,
          filteredOptionsCount: filteredOptions.length,
          hasRealStudents: filteredOptions.some(opt => !(opt as any).isAddOption && !(opt as any).isNoStudentOption),
          isLoading,
          fetchedStudentsCount: fetchedStudents.length
        });
      }

      return (
        <div className="relative">
          <div className="relative">
            <Input
              value={searchQueries[index] || (isCurrentlySearching ? '' : selectedDisplay)}
              onChange={(e) => {
                handleSearch(index, e.target.value, person.role);
                // Ensure searching state is true when typing
                if (!isSearching[index]) {
                  setIsSearching(prev => ({ ...prev, [index]: true }));
                }
              }}
              onFocus={() => {
                console.log('[PeopleInvolvedSection] Input focused:', {
                  index,
                  personRole: person.role,
                  personName: person.name,
                  fetchedStudentsCount: fetchedStudents.length,
                  isSearching: isSearching[index],
                  searchQuery: searchQueries[index]
                });
                setIsSearching(prev => ({ ...prev, [index]: true }));
                // Clear any existing search query to show all available options
                if (!searchQueries[index] && !person.name) {
                  setSearchQueries(prev => ({ ...prev, [index]: '' }));
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (!searchQueries[index]) {
                    setIsSearching(prev => ({ ...prev, [index]: false }));
                  }
                }, 200);
              }}
              placeholder={
                isLoading 
                  ? `Loading ${person.role === 'Student' ? 'students' : person.role.toLowerCase()}s...` 
                  : `Search by ${person.role === 'Student' ? 'student name or ID' : person.role.toLowerCase() + ' name'}...`
              }
              className={`w-full pr-8 ${hasError ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          {hasError && (
            <p className="text-red-500 text-xs mt-1">{hasError}</p>
          )}
          
          {isCurrentlySearching && filteredOptions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
              <ul className="py-1 text-sm">
                {filteredOptions.map((option) => {
                  // Check if this is the "Please type at least 3 characters" message
                  if (person.role === 'Student' && (option as any).isMinCharsMessage) {
                    return (
                      <li
                        key="min-chars"
                        className="px-3 py-2 text-gray-500 cursor-not-allowed"
                      >
                        <div className="flex items-center">
                          <span className="text-sm">Please type at least 3 characters</span>
                        </div>
                      </li>
                    );
                  }

                  // Check if this is the loading state
                  if (person.role === 'Student' && (option as any).isLoading) {
                    return (
                      <li
                        key="loading"
                        className="px-3 py-2 text-gray-500 cursor-not-allowed"
                      >
                        <div className="flex items-center">
                          <span className="text-sm">Searching...</span>
                        </div>
                      </li>
                    );
                  }
                  
                  // Check if this is the "No Student Found" option
                  if (person.role === 'Student' && (option as any).isNoStudentOption) {
                    return (
                      <li
                        key="no-student-found"
                        className="px-3 py-2 text-gray-500 cursor-not-allowed border-b border-gray-200"
                      >
                        <div className="flex items-center">
                          <span className="text-sm">No Student Found</span>
                        </div>
                      </li>
                    );
                  }
                  
                  // Check if this is the "Add Student" option - render it at the bottom (only if integration is NOT enabled)
                  if (person.role === 'Student' && (option as any).isAddOption && !isIntegrationEnabled) {
                    return (
                      <li
                        key="add-student"
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-t border-gray-200"
                        onClick={() => handleAddStudentClick(index)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center text-blue-600">
                          <Plus className="h-4 w-4 mr-2" />
                          <span className="font-medium">Add Student</span>
                        </div>
                      </li>
                    );
                  }
                  
                  return (
                    <li
                      key={person.role === 'Staff' ? (option as Employee).id : (option as Student).id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSelectPerson(index, option, person.role)}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div>
                        {person.role === 'Staff' ? (
                          <>
                            <span className="font-medium">
                              {(option as Employee).firstName} {(option as Employee).lastName}
                            </span>
                            <span className="text-gray-500 ml-1">
                              ({(option as Employee).email})
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {(option as any).name}
                              </span>
                              {(option as any).is_external && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                  External
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5">
                              ({(option as any).student_id || (option as Student).studentId})
                              {((option as any).grades?.name || (option as Student).grade || (option as any).sections?.name || (option as Student).section) && (
                                <span className="ml-1">
                                  - {((option as any).grades?.name || (option as Student).grade || '').trim()} {((option as any).sections?.name || (option as Student).section || '').trim()}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {isCurrentlySearching && searchQueries[index] && filteredOptions.length === 0 && !isLoading && (
            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
              <p className="p-3 text-sm text-gray-500">No {person.role.toLowerCase()}s found</p>
            </div>
          )}
          
          {/* Show dropdown when focused and there are options, even without search query */}
          {isCurrentlySearching && !searchQueries[index] && !isLoading && (
            <>
              {/* Show actual students/staff when available */}
              {filteredOptions.some(opt => 
                !(opt as any).isAddOption && !(opt as any).isNoStudentOption
              ) && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  <ul className="py-1 text-sm">
                    {filteredOptions
                      .filter(opt => !(opt as any).isAddOption && !(opt as any).isNoStudentOption)
                      .map((option) => (
                        <li
                          key={person.role === 'Staff' ? (option as Employee).id : (option as Student).id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleSelectPerson(index, option, person.role)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <div>
                            {person.role === 'Staff' ? (
                              <>
                                <span className="font-medium">
                                  {(option as Employee).firstName} {(option as Employee).lastName}
                                </span>
                                <span className="text-gray-500 ml-1">
                                  ({(option as Employee).email})
                                </span>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {(option as any).name || (option as Student).name}
                                  </span>
                                  {((option as any).is_external) && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                      External
                                    </span>
                                  )}
                                </div>
                                <div className="text-gray-500 text-xs mt-0.5">
                                  ({(option as any).student_id || (option as Student).studentId})
                                  {((option as any).grades?.name || (option as Student).grade || (option as any).sections?.name || (option as Student).section) && (
                                    <span className="ml-1">
                                      - {((option as any).grades?.name || (option as Student).grade || '').trim()} {((option as any).sections?.name || (option as Student).section || '').trim()}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    {/* Show "Add Student" link at the bottom for Student role (only if integration is NOT enabled) */}
                    {person.role === 'Student' && !isIntegrationEnabled && (
                      <li
                        key="add-student"
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-t border-gray-200"
                        onClick={() => handleAddStudentClick(index)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div className="flex items-center text-blue-600">
                          <Plus className="h-4 w-4 mr-2" />
                          <span className="font-medium">Add Student</span>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Show "Add Student" and "No Student Found" only when no real students are available */}
              {!filteredOptions.some(opt => 
                !(opt as any).isAddOption && !(opt as any).isNoStudentOption
              ) && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  <ul className="py-1 text-sm">
                    {filteredOptions.map((option) => {
                      // Check if this is the "Add Student" option (only if integration is NOT enabled)
                      if (person.role === 'Student' && (option as any).isAddOption && !isIntegrationEnabled) {
                        return (
                          <li
                            key="add-student"
                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                            onClick={() => handleAddStudentClick(index)}
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <div className="flex items-center text-blue-600">
                              <Plus className="h-4 w-4 mr-2" />
                              <span className="font-medium">Add Student</span>
                            </div>
                          </li>
                        );
                      }
                      
                      // Check if this is the "No Student Found" option
                      if (person.role === 'Student' && (option as any).isNoStudentOption) {
                        return (
                          <li
                            key="no-student-found"
                            className="px-3 py-2 text-gray-500 cursor-not-allowed border-b border-gray-200"
                          >
                            <div className="flex items-center">
                              <span className="text-sm">No Student Found</span>
                            </div>
                          </li>
                        );
                      }
                      
                      return null;
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      );
    } else {
      return (
        <div>
          <input
            type="text"
            value={person.name}
            onChange={(e) => onPersonChange(index, 'name', e.target.value)}
            className={`w-full p-2 border rounded-md text-sm ${hasError ? 'border-red-500' : ''}`}
            placeholder="Full name"
          />
          {hasError && (
            <p className="text-red-500 text-xs mt-1">{hasError}</p>
          )}
        </div>
      );
    }
  };

  // Helper function to get role options based on client type
  const getRoleOptions = () => {
    const options = [];
    
    // Only show Student option if client type is "school"
    if (isSchoolClient) {
      options.push({ value: 'Student', label: 'Student' });
    }
    
    // Always show Staff and Other options
    options.push(
      { value: 'Staff', label: 'Staff' },
      { value: 'Other', label: 'Other' }
    );
    
    return options;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">People Involved</h3>
        <button
          type="button"
          onClick={onAddPerson}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          + Add Person
        </button>
      </div>

      {peopleInvolved.length === 0 ? (
        <div className="text-sm text-gray-500 italic">
          No people added yet. Click "Add Person" to include individuals involved in this incident.
        </div>
      ) : (
        <div className="space-y-4">
          {peopleInvolved.map((person, index) => {
            const roleError = errors[`peopleInvolved.${index}.role`];
            const roleOptions = getRoleOptions();
            
            return (
              <div key={index} className="flex flex-col md:flex-row gap-3 p-3 border rounded-md bg-gray-50">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={person.role}
                    onChange={(e) => onPersonChange(index, 'role', e.target.value)}
                    className={`w-full p-2 border rounded-md text-sm bg-white ${roleError ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select role</option>
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {roleError && (
                    <p className="text-red-500 text-xs mt-1">{roleError}</p>
                  )}
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  {renderNameField(person, index)}
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <input
                    type="text"
                    value={person.notes || ''}
                    onChange={(e) => onPersonChange(index, 'notes', e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                    placeholder="Additional notes"
                  />
                </div>
                
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => onRemovePerson(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                    aria-label="Remove person"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <AddStudentDialog
        open={isAddStudentDialogOpen}
        onOpenChange={(open) => {
          setIsAddStudentDialogOpen(open);
          if (!open) {
            // Reset state when dialog is closed
            setCurrentPersonIndex(null);
            setCurrentPersonData(null);
            setHadSearchQuery(false);
          }
        }}
        peopleInvolved={currentPersonData}
        onStudentAdded={handleStudentAdded}
      />
    </div>
  );
};

export default PeopleInvolvedSection;
