
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import TemplatesList from '@/components/assessments/templates/TemplatesList';
import CreateTemplateForm from '@/components/assessments/templates/CreateTemplateForm';
import TemplateDetail from '@/components/assessments/templates/TemplateDetail';
import AssignTemplateForm from '@/components/assessments/assignments/AssignTemplateForm';
import BulkAssignForm from '@/components/assessments/assignments/BulkAssignForm';
import AssignmentsList from '@/components/assessments/assignments/AssignmentsList';
import AssessmentResponseForm from '@/components/assessments/responses/AssessmentResponseForm';
import ResultsAnalytics from '@/components/assessments/results/ResultsAnalytics';

export const TemplateRoutes = () => (
  <Routes>
    <Route index element={<TemplatesList />} />
    <Route path="new" element={<CreateTemplateForm />} />
    <Route path=":templateId" element={<TemplateDetail />} />
    <Route path=":templateId/edit" element={<CreateTemplateForm />} />
    <Route path=":templateId/assign" element={<AssignTemplateForm />} />
    <Route path=":templateId/bulk-assign" element={<BulkAssignForm />} />
  </Routes>
);

export const AssignmentRoutes = () => (
  <Routes>
    <Route index element={<AssignmentsList />} />
    <Route path="bulk-assign" element={<BulkAssignForm />} />
  </Routes>
);

export const ResultsRoutes = () => (
  <Routes>
    <Route index element={<ResultsAnalytics />} />
  </Routes>
);

export const ResponseRoutes = () => (
  <Route path="/:assignmentId/respond" element={<AssessmentResponseForm />} />
);
