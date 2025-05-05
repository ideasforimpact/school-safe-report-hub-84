
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
import { useIncidents } from '@/contexts/IncidentContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

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
  const { campuses, classes, sections } = useIncidents();
  const [selectedCampus, setSelectedCampus] = useState<string>(defaultValues?.campus || '');
  const [selectedGrade, setSelectedGrade] = useState<string>(defaultValues?.grade || '');
  
  const [filteredClasses, setFilteredClasses] = useState<Array<{ id: string, name: string, campusId: string }>>([]);
  const [filteredSections, setFilteredSections] = useState<Array<{ id: string, name: string, classId: string }>>([]);
  
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

  // Filter classes based on selected campus
  useEffect(() => {
    if (selectedCampus) {
      const campusSpecificClasses = classes.filter(cls => {
        const campus = campuses.find(c => c.name === selectedCampus);
        return campus && cls.campusId === campus.id;
      });
      setFilteredClasses(campusSpecificClasses);
      // Reset grade and section when campus changes
      if (!defaultValues?.grade) {
        form.setValue('grade', '');
        setSelectedGrade('');
      }
    } else {
      setFilteredClasses([]);
    }
  }, [selectedCampus, campuses, classes, form, defaultValues]);

  // Filter sections based on selected class/grade
  useEffect(() => {
    if (selectedGrade) {
      const selectedClass = classes.find(c => c.name === selectedGrade);
      if (selectedClass) {
        const classSpecificSections = sections.filter(section => section.classId === selectedClass.id);
        setFilteredSections(classSpecificSections);
      } else {
        setFilteredSections([]);
      }
    } else {
      setFilteredSections([]);
      // Reset section when grade changes
      if (!defaultValues?.section) {
        form.setValue('section', '');
      }
    }
  }, [selectedGrade, classes, sections, form, defaultValues]);

  // Update section value when grade changes
  useEffect(() => {
    if (selectedGrade && form.getValues('section')) {
      const currentSection = form.getValues('section');
      const sectionExists = filteredSections.some(section => section.name === currentSection);
      
      if (!sectionExists) {
        form.setValue('section', '');
      }
    }
  }, [filteredSections, form, selectedGrade]);

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
                  disabled={!selectedCampus || filteredClasses.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedCampus ? "Select campus first" : "Select grade"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredClasses.map((cls) => (
                      <SelectItem key={cls.id} value={cls.name}>{cls.name}</SelectItem>
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
