
import { AlertTriangle, CheckCircle, ClipboardList } from 'lucide-react';

export const summaryData = {
  total: 24,
  completed: 16,
  pending: 8,
  averageScore: 85,
};

export const assessmentTypes = [
  {
    id: 1,
    title: 'Safety Assessments',
    description: 'Evaluate and maintain safety protocols in your facilities',
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    count: 12,
    progress: 75
  },
  {
    id: 2,
    title: 'Compliance Checks',
    description: 'Ensure adherence to regulations and safety standards',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    count: 8,
    progress: 90
  },
  {
    id: 3,
    title: 'Risk Evaluations',
    description: 'Identify and analyze potential risks in your environment',
    icon: ClipboardList,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    count: 4,
    progress: 60
  },
];

export const recentAssessments = [
  { id: 'A-2023-001', title: 'Annual Fire Safety Check', type: 'Safety', status: 'Completed', date: '2023-10-15', score: 92 },
  { id: 'A-2023-002', title: 'Quarterly Building Inspection', type: 'Compliance', status: 'In Review', date: '2023-11-05', score: 78 },
  { id: 'A-2023-003', title: 'Emergency Response Test', type: 'Safety', status: 'Pending', date: '2023-11-20', score: null },
  { id: 'A-2023-004', title: 'Staff Safety Training Evaluation', type: 'Training', status: 'Completed', date: '2023-10-28', score: 88 },
  { id: 'A-2023-005', title: 'Environmental Risk Assessment', type: 'Risk', status: 'In Progress', date: '2023-11-10', score: null },
];
