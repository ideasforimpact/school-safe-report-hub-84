
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
import { Loader2 } from 'lucide-react';

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
  studentId: z.string().min(1, { message: 'Student ID is required' }),
  name: z.string().min(2, { message: 'Name is required and must be at least 2 characters' }),
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

  // Fetch campuses, grades, and sections from Supabase
  useEffect(() => {
    const fetchEducationalStructure = async () => {
      setDataLoading(true);
      try {
        // Fetch campuses
        const { data: campusData, error: campusError } = await supabase
          .from('campuses')
          .select('id, name');
        
        if (campusError) throw campusError;
        
        // Fetch grades (classes)
        const { data: gradeData, error: gradeError } = await supabase
          .from('grades')
          .select('id, name, campus_id');
        
        if (gradeError) throw gradeError;
        
        // Fetch sections
        const { data: sectionData, error: sectionError } = await supabase
          .from('sections')
          .select('id, name, grade_id');
        
        if (sectionError) throw sectionError;
        
        // Transform and set data
        setCampuses(campusData);
        setGrades(gradeData.map(g => ({
          id: g.id,
          name: g.name,
          campusId: g.campus_id
        })));
        setSections(sectionData.map(s => ({
          id: s.id,
          name: s.name,
          classId: s.grade_id
        })));

        // Handle pre-selected values for edit mode
        if (defaultValues?.campus) {
          const selectedCampusId = campusData.find(c => c.name === defaultValues.campus)?.id;
          if (selectedCampusId) {
            const campusGrades = gradeData
              .filter(g => g.campus_id === selectedCampusId)
              .map(g => ({ id: g.id, name: g.name, campusId: g.campus_id }));
            setFilteredGrades(campusGrades);
            
            if (defaultValues.grade) {
              const selectedGradeId = campusGrades.find(g => g.name === defaultValues.grade)?.id;
              if (selectedGradeId) {
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
  }, [defaultValues]);

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

  if (dataLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading educational structure data...</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter student ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter student name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="campus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campus</FormLabel>
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
              <FormLabel>Grade</FormLabel>
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
              <FormLabel>Section</FormLabel>
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
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Save Student'}
        </Button>
      </form>
    </Form>
  );
};

export default StudentForm;
