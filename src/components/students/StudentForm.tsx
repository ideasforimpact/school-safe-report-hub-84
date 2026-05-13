
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { checkStudentIdExists } from '@/services/student/studentValidationService';
import { useAuth } from '@/contexts/auth';
import { Person } from '@/types/incident';
import { useRealTimeSubHook } from '@/hooks/useRealTimeSubHook';
import Loader from '../common/Loader';

interface Campus {
  id: string;
  name: string;
}

interface Grade {
  id: string;
  name: string;
  campusId: string;
}

interface Section {
  id: string;
  name: string;
  classId: string;
}

const formSchema = z.object({
  studentId: z.string()
    .min(1, { message: 'Student ID is required' })
    .max(15, { message: 'Student ID cannot exceed 15 characters' })
    .regex(/^[a-zA-Z0-9]+$/, { message: 'Student ID must be alphanumeric' }),
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(25, { message: 'Name cannot exceed 25 characters' })
    .regex(/^[a-zA-Z\s]+$/, { message: 'Name can only contain letters and spaces' }),
  campus: z.string().min(1, { message: 'Campus is required' }),
  campusId: z.string().optional(),
  grade: z.string().min(1, { message: 'Grade is required' }),
  gradeId: z.string().optional(),
  section: z.string().min(1, { message: 'Section is required' }),
  sectionId: z.string().optional()
}).refine((data) => data.campusId && data.gradeId && data.sectionId, {
  message: "All IDs must be selected",
  path: ["sectionId"] // Show error on section field
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  isSubmitting?: boolean;
  peopleInvolved?: Person | null;
  onCancel?: () => void;
}

const StudentForm = ({ defaultValues, onSubmit, isSubmitting = false, peopleInvolved, onCancel }: StudentFormProps) => {
  // Data states
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Selection states - track both IDs and names
  const [selectedCampus, setSelectedCampus] = useState<string>(defaultValues?.campus || '');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>(defaultValues?.grade || '');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  
  // Filtered lists
  const [filteredGrades, setFilteredGrades] = useState<Grade[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  
  // Student ID validation states
  const [studentIdInput, setStudentIdInput] = useState<string>(defaultValues?.studentId?.toUpperCase?.() || '');
  const [isCheckingStudentId, setIsCheckingStudentId] = useState<boolean>(false);
  const [studentIdExists, setStudentIdExists] = useState<boolean>(false);
  const [studentIdValidationMessage, setStudentIdValidationMessage] = useState<string>('');
  
  const debouncedStudentId = useDebounce(studentIdInput, 500);
  const lastValidatedId = useRef<string | null>(null);
  const fetchStructureInProgress = useRef(false);
  const { employeeData } = useAuth();
  
  // Prepare default values with peopleInvolved data if available
  const getDefaultValues = () => {
    if (peopleInvolved?.name) {
      return {
        studentId: defaultValues?.studentId || '',
        name: peopleInvolved.name,
        campus: defaultValues?.campus || '',
        campusId: defaultValues?.campusId || '',
        grade: defaultValues?.grade || '',
        gradeId: defaultValues?.gradeId || '',
        section: defaultValues?.section || '',
        sectionId: defaultValues?.sectionId || ''
      };
    }
    return defaultValues || {
      studentId: '',
      name: '',
      campus: '',
      campusId: '',
      grade: '',
      gradeId: '',
      section: '',
      sectionId: ''
    };
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues()
  });

  // Student ID validation effect
  useEffect(() => {
    const validateStudentId = async () => {
      if (!debouncedStudentId || !employeeData?.clientId) {
        setStudentIdExists(false);
        setStudentIdValidationMessage('');
        return;
      }

      // Skip validation if this is an edit form and the student ID hasn't changed
      if (defaultValues?.studentId && debouncedStudentId === defaultValues.studentId) {
        setStudentIdExists(false);
        setStudentIdValidationMessage('');
        return;
      }

      // Avoid duplicate validation for the same ID
      if (debouncedStudentId === lastValidatedId.current) {
        return;
      }

      lastValidatedId.current = debouncedStudentId;
      setIsCheckingStudentId(true);
      try {
        const exists = await checkStudentIdExists(debouncedStudentId, employeeData.clientId);
        setStudentIdExists(exists);
        setStudentIdValidationMessage(
          exists ? 'Student ID already exists' : 'Student ID is available'
        );
      } catch (error) {
        console.error('Error validating student ID:', error);
        setStudentIdValidationMessage('Error checking student ID');
      } finally {
        setIsCheckingStudentId(false);
      }
    };

    validateStudentId();
  }, [debouncedStudentId, employeeData?.clientId, defaultValues?.studentId]);

  // Student ID validation function (alphanumeric, max 15 characters)
  const isValidStudentId = (studentId: string) => {
    const studentIdRegex = /^[a-zA-Z0-9]{1,15}$/;
    return studentIdRegex.test(studentId);
  };

  // Name validation function (letters and spaces only, no special characters)
  const isValidName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const nameRegex = /^[a-zA-Z\s]{1,25}$/;
    return nameRegex.test(name);
  };

  // Handle student ID input change
  const handleStudentIdChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setStudentIdInput(upperValue);
    form.setValue('studentId', upperValue);
  };

  // Fetch campuses, grades, and sections from Supabase - filtered by client_id
  // Note: we only depend on clientId here so we don't re-run this effect
  // after submit/save when defaultValues may change, which was causing a
  // brief "Loading educational structure data..." flash.
    const fetchEducationalStructure = useCallback(async () => {
      if (!employeeData?.clientId || fetchStructureInProgress.current) {
        console.log('Skipping educational structure fetch: No clientId or fetch already in progress');
        if (!employeeData?.clientId) setDataLoading(false);
        return;
      }

      fetchStructureInProgress.current = true;
      setDataLoading(true);
      try {
        console.log('Fetching educational structure for client:', employeeData.clientId);
        
        // Use consolidated edge function instead of multiple direct queries
        const { data, error } = await supabase.functions.invoke('student-management', {
          body: { client_id: employeeData.clientId },
          headers: { path: 'get-form-data' }
        });
        
        if (error) throw error;
        
        const { campuses: campusData, grades: gradeData, sections: sectionData } = data;
        
        console.log('Fetched data:', { campusData, gradeData, sectionData });
        
        // Transform and set data
        setCampuses(campusData || []);
        setGrades((gradeData || []).map(g => ({
          id: g.id,
          name: g.name,
          campusId: g.campus_id
        })));
        setSections((sectionData || []).map(s => ({
          id: s.id,
          name: s.name,
          classId: s.grade_id
        })));

        // Handle pre-selected values for edit mode
        if (defaultValues?.campus && campusData) {
          const foundCampusId = campusData.find(c => c.name === defaultValues.campus)?.id;
          if (foundCampusId && gradeData) {
            // Set campus ID state and form value
            setSelectedCampusId(foundCampusId);
            form.setValue('campusId', foundCampusId);

            const campusGrades = gradeData
              .filter(g => g.campus_id === foundCampusId)
              .map(g => ({ id: g.id, name: g.name, campusId: g.campus_id }));
            setFilteredGrades(campusGrades);
            
            if (defaultValues.grade) {
              const foundGradeId = campusGrades.find(g => g.name === defaultValues.grade)?.id;
              if (foundGradeId && sectionData) {
                // Set grade ID state and form value
                setSelectedGradeId(foundGradeId);
                form.setValue('gradeId', foundGradeId);

                const gradeSections = sectionData
                  .filter(s => s.grade_id === foundGradeId)
                  .map(s => ({ id: s.id, name: s.name, classId: s.grade_id }));
                setFilteredSections(gradeSections);

                if (defaultValues.section) {
                  const foundSectionId = gradeSections.find(
                    s => s.name === defaultValues.section
                  )?.id;
                  if (foundSectionId) {
                    setSelectedSectionId(foundSectionId);
                    form.setValue('sectionId', foundSectionId);
                  }
                }
              }
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching educational structure:', error);
        toast.error('Failed to load educational structure data');
      } finally {
        setDataLoading(false);
        fetchStructureInProgress.current = false;
      }
    }, [employeeData?.clientId, defaultValues, form]);

    useEffect(() => {
      fetchEducationalStructure();
    }, [fetchEducationalStructure]);
    // eslint-disable-next-line react-hooks/exhaustive-deps

  // Filter grades based on selected campus
  useEffect(() => {
    if (selectedCampus) {
      const campusObj = campuses.find(c => c.name === selectedCampus);
      if (campusObj) {
        setSelectedCampusId(campusObj.id);
        form.setValue('campusId', campusObj.id);
        const campusGrades = grades.filter(g => g.campusId === campusObj.id);
        setFilteredGrades(campusGrades);
      }
      
      // Reset grade and section when campus changes (unless in edit mode with matching values)
      if (!defaultValues?.grade || (defaultValues.campus !== selectedCampus)) {
        form.setValue('grade', '');
        form.setValue('gradeId', '');
        setSelectedGrade('');
        setSelectedGradeId('');
        form.setValue('section', '');
        form.setValue('sectionId', '');
        setSelectedSectionId('');
      }
    } else {
      setFilteredGrades([]);
      setSelectedCampusId('');
      form.setValue('campusId', '');
    }
  }, [selectedCampus, campuses, grades, form, defaultValues]);

  // Filter sections based on selected grade
  useEffect(() => {
    if (selectedGrade) {
      const gradeObj = grades.find(g => g.name === selectedGrade);
      if (gradeObj) {
        setSelectedGradeId(gradeObj.id);
        form.setValue('gradeId', gradeObj.id);
        const gradeSections = sections.filter(s => s.classId === gradeObj.id);
        setFilteredSections(gradeSections);
      }
      
      // Reset section when grade changes (unless in edit mode with matching values)
      if (!defaultValues?.section || (defaultValues.grade !== selectedGrade)) {
        form.setValue('section', '');
        form.setValue('sectionId', '');
        setSelectedSectionId('');
      }
    } else {
      setFilteredSections([]);
      setSelectedGradeId('');
      form.setValue('gradeId', '');
    }
  }, [selectedGrade, grades, sections, form, defaultValues]);

  // Custom form submission handler
  const handleFormSubmit = (data: FormValues) => {
    if (studentIdExists) {
      toast.error('Cannot save student with duplicate Student ID');
      return;
    }
    
    // Ensure all IDs are set before submission
    if (!data.campusId || !data.gradeId || !data.sectionId) {
      toast.error('Please ensure all fields are properly selected');
      return;
    }
    
    onSubmit(data);
  };

  // Handle cancel - clear form and close dialog
  const handleCancel = () => {
    form.reset();
    setStudentIdInput('');
    setSelectedCampus('');
    setSelectedCampusId('');
    setSelectedGrade('');
    setSelectedGradeId('');
    setSelectedSectionId('');
    setFilteredGrades([]);
    setFilteredSections([]);
    if (onCancel) {
      onCancel();
    }
  };
  useRealTimeSubHook({
    channelName: `campuses-student-form-${employeeData?.clientId}`,
    table: 'campuses',
    events: '*',
    enabled: !!employeeData?.clientId,
    onPayload: () => {
      console.log('[Realtime] Campus changed → refetching');
      fetchEducationalStructure();
    },
  });

  useRealTimeSubHook({
    channelName: `grades-student-form-${employeeData?.clientId}`,
    table: 'grades',
    events: '*',
    enabled: !!employeeData?.clientId,
    onPayload: () => {
      console.log('[Realtime] Grade changed → refetching');
      fetchEducationalStructure();
    },
  });

  useRealTimeSubHook({
    channelName: `sections-student-form-${employeeData?.clientId}`,
    table: 'sections',
    events: '*',
    enabled: !!employeeData?.clientId,
    onPayload: () => {
      console.log('[Realtime] Section changed → refetching');
      fetchEducationalStructure();
    },
  });


  if (dataLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader text="Loading educational structure data..." />        
      </div>
    );
  }

  // Show message if no client data is available
  if (!employeeData?.clientId) {
    return (
      <div className="flex justify-center items-center py-8">
        <span className="text-muted-foreground">Unable to load form - client information not available</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    placeholder="Enter student ID" 
                    value={studentIdInput}
                    onChange={(e) => handleStudentIdChange(e.target.value)}
                    maxLength={15}
                    className={`pr-10 ${studentIdExists ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isCheckingStudentId && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                    )}
                    {!isCheckingStudentId && studentIdInput && (
                      <>
                        {studentIdExists ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </FormControl>
              {studentIdValidationMessage && (
                <p className={`text-sm ${studentIdExists ? 'text-red-500' : 'text-green-500'}`}>
                  {studentIdValidationMessage}
                </p>
              )}
              {studentIdInput && !isValidStudentId(studentIdInput) && (
                <p className="text-xs text-red-500">Student ID must be alphanumeric and maximum 15 characters</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter student name" 
                  maxLength={25}
                  className={field.value && !isValidName(field.value) ? 'border-red-500' : ''}
                  {...field} 
                />
              </FormControl>
              {field.value && field.value.length > 25 && (
                <p className="text-xs text-red-500">Name cannot exceed 25 characters</p>
              )}
              {field.value && !isValidName(field.value) && (
                <p className="text-xs text-red-500">Name can only contain letters and spaces</p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="campus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campus <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Select 
                  value={field.value} 
                  onValueChange={(value) => {
                    const campus = campuses.find(c => c.name === value);
                    if (campus) {
                      field.onChange(value);
                      form.setValue('campusId', campus.id);
                      setSelectedCampus(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((campus) => (
                      <SelectItem key={campus.id} value={campus.name}>{campus.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="grade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Grade <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Select 
                  value={field.value} 
                  onValueChange={(value) => {
                    const grade = filteredGrades.find(g => g.name === value);
                    if (grade) {
                      field.onChange(value);
                      form.setValue('gradeId', grade.id);
                      setSelectedGrade(value);
                    }
                  }}
                  disabled={!selectedCampus || filteredGrades.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCampus ? "Select campus first" : "Select grade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredGrades.map((grade) => (
                      <SelectItem key={grade.id} value={grade.name}>{grade.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Select 
                  value={field.value} 
                  onValueChange={(value) => {
                    const section = filteredSections.find(s => s.name === value);
                    if (section) {
                      field.onChange(value);
                      form.setValue('sectionId', section.id);
                      setSelectedSectionId(section.id);
                    }
                  }}
                  disabled={!selectedGrade || filteredSections.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedGrade ? "Select grade first" : "Select section"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSections.map((section) => (
                      <SelectItem key={section.id} value={section.name}>{section.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {peopleInvolved ? (
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                studentIdExists || 
                isCheckingStudentId || 
                !isValidStudentId(studentIdInput) ||
                !form.getValues('name') ||
                !isValidName(form.getValues('name')) ||
                !form.getValues('campus') ||
                !form.getValues('grade') ||
                !form.getValues('section')
              }
            >
              {isSubmitting ? 'Processing...' : 'Save Student'}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                studentIdExists || 
                isCheckingStudentId || 
                !isValidStudentId(studentIdInput) ||
                !form.getValues('name') ||
                !isValidName(form.getValues('name')) ||
                !form.getValues('campus') ||
                !form.getValues('grade') ||
                !form.getValues('section')
              }
            >
              {isSubmitting ? 'Processing...' : 'Save Student'}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
};

export default StudentForm;
