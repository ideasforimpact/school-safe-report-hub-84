
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
  grade: z.string().min(1, { message: 'Grade is required' }),
  section: z.string().min(1, { message: 'Section is required' }),
  campus: z.string().min(1, { message: 'Campus is required' })
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  isSubmitting?: boolean;
}

const StudentForm = ({ defaultValues, onSubmit, isSubmitting = false }: StudentFormProps) => {
  const { classes, sections } = useIncidents();
  const [selectedGrade, setSelectedGrade] = useState<string>(defaultValues?.grade || '');
  const [filteredSections, setFilteredSections] = useState<Array<{ id: string, name: string, classId: string }>>([]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      studentId: '',
      name: '',
      grade: '',
      section: '',
      campus: ''
    }
  });

  // Filter sections based on selected class/grade
  useEffect(() => {
    if (selectedGrade) {
      const selectedClass = classes.find(c => c.name === selectedGrade || c.id === selectedGrade);
      if (selectedClass) {
        const classSpecificSections = sections.filter(section => section.classId === selectedClass.id);
        setFilteredSections(classSpecificSections);
      } else {
        setFilteredSections([]);
      }
    } else {
      setFilteredSections([]);
    }
  }, [selectedGrade, classes, sections]);

  // Update section value when grade changes
  useEffect(() => {
    if (selectedGrade && form.getValues('section')) {
      const currentSection = form.getValues('section');
      const sectionExists = filteredSections.some(section => section.name === currentSection || section.id === currentSection);
      
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
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
        
        <FormField
          control={form.control}
          name="campus"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campus</FormLabel>
              <FormControl>
                <Input placeholder="Enter campus" {...field} />
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
