
import React, { useEffect, useState } from 'react';
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
  grade: z.string().min(1, { message: 'Grade is required' }),
  section: z.string().min(1, { message: 'Section is required' })
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  isSubmitting?: boolean;
}

const StudentForm = ({ defaultValues, onSubmit, isSubmitting = false }: StudentFormProps) => {
  // Data states
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Selection states
  const [selectedCampus, setSelectedCampus] = useState<string>(defaultValues?.campus || '');
  const [selectedGrade, setSelectedGrade] = useState<string>(defaultValues?.grade || '');
  
  // Filtered lists
  const [filteredGrades, setFilteredGrades] = useState<Grade[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  
  // Student ID validation states
  const [studentIdInput, setStudentIdInput] = useState<string>(defaultValues?.studentId || '');
  const [isCheckingStudentId, setIsCheckingStudentId] = useState<boolean>(false);
  const [studentIdExists, setStudentIdExists] = useState<boolean>(false);
  const [studentIdValidationMessage, setStudentIdValidationMessage] = useState<string>('');
  
  const debouncedStudentId = useDebounce(studentIdInput, 500);
  const { employeeData } = useAuth();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      studentId: '',
      name: '',
      campus: '',
      grade: '',
      section: ''
    }
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
    const nameRegex = /^[a-zA-Z\s]{1,25}$/;
    return nameRegex.test(name);
  };

  // Handle student ID input change
  const handleStudentIdChange = (value: string) => {
    setStudentIdInput(value);
    form.setValue('studentId', value);
  };

  // Fetch campuses, grades, and sections from Supabase - filtered by client_id
  useEffect(() => {
    const fetchEducationalStructure = async () => {
      if (!employeeData?.clientId) {
        console.log('No client ID available, skipping data fetch');
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      try {
        console.log('Fetching educational structure for client:', employeeData.clientId);
        
        // Fetch campuses filtered by client_id
        const { data: campusData, error: campusError } = await supabase
          .from('campuses')
          .select('id, name')
          .eq('client_id', employeeData.clientId);
        
        if (campusError) throw campusError;
        
        // Fetch grades filtered by client_id
        const { data: gradeData, error: gradeError } = await supabase
          .from('grades')
          .select('id, name, campus_id')
          .eq('client_id', employeeData.clientId);
        
        if (gradeError) throw gradeError;
        
        // Fetch sections filtered by client_id
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .select('id, name, grade_id')
          .eq('client_id', employeeData.clientId);
        
        if (sectionError) throw sectionError;
        
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
          const selectedCampusId = campusData.find(c => c.name === defaultValues.campus)?.id;
          if (selectedCampusId && gradeData) {
            const campusGrades = gradeData
              .filter(g => g.campus_id === selectedCampusId)
              .map(g => ({ id: g.id, name: g.name, campusId: g.campus_id }));
            setFilteredGrades(campusGrades);
            
            if (defaultValues.grade) {
              const selectedGradeId = campusGrades.find(g => g.name === defaultValues.grade)?.id;
              if (selectedGradeId && sectionData) {
                setFilteredSections(sectionData
                  .filter(s => s.grade_id === selectedGradeId)
                  .map(s => ({ id: s.id, name: s.name, classId: s.grade_id }))
                );
              }
            }
          }
        }
        
      } catch (error) {
        console.error('Error fetching educational structure:', error);
        toast.error('Failed to load educational structure data');
      } finally {
        setDataLoading(false);
      }
    };
    
    fetchEducationalStructure();
  }, [employeeData?.clientId, defaultValues]);

  // Filter grades based on selected campus
  useEffect(() => {
    if (selectedCampus) {
      const campusObj = campuses.find(c => c.name === selectedCampus);
      if (campusObj) {
        const campusGrades = grades.filter(g => g.campusId === campusObj.id);
        setFilteredGrades(campusGrades);
      }
      
      // Reset grade and section when campus changes (unless in edit mode with matching values)
      if (!defaultValues?.grade || (defaultValues.campus !== selectedCampus)) {
        form.setValue('grade', '');
        setSelectedGrade('');
        form.setValue('section', '');
      }
    } else {
      setFilteredGrades([]);
    }
  }, [selectedCampus, campuses, grades, form, defaultValues]);

  // Filter sections based on selected grade
  useEffect(() => {
    if (selectedGrade) {
      const gradeObj = grades.find(g => g.name === selectedGrade);
      if (gradeObj) {
        const gradeSections = sections.filter(s => s.classId === gradeObj.id);
        setFilteredSections(gradeSections);
      }
      
      // Reset section when grade changes (unless in edit mode with matching values)
      if (!defaultValues?.section || (defaultValues.grade !== selectedGrade)) {
        form.setValue('section', '');
      }
    } else {
      setFilteredSections([]);
    }
  }, [selectedGrade, grades, sections, form, defaultValues]);

  // Custom form submission handler
  const handleFormSubmit = (data: FormValues) => {
    if (studentIdExists) {
      toast.error('Cannot save student with duplicate Student ID');
      return;
    }
    onSubmit(data);
  };

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading educational structure data...</span>
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
                    field.onChange(value);
                    setSelectedCampus(value);
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
                    field.onChange(value);
                    setSelectedGrade(value);
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
                  onValueChange={field.onChange}
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
        
        <Button 
          type="submit" 
          className="w-full" 
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
      </form>
    </Form>
  );
};

export default StudentForm;
