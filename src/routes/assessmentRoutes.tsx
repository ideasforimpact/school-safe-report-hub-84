
import React from 'react';
import { Route } from 'react-router-dom';
import RouteGuard from '../components/RouteGuard';

// Import placeholder components
const AssessmentsList = () => <div>Assessments List</div>;
const AssessmentDetail = () => <div>Assessment Detail</div>;
const AssessmentTemplates = () => <div>Assessment Templates</div>;
const AssessmentAssignments = () => <div>Assessment Assignments</div>;

const assessmentRoutes = (
  <>
    <Route
      path="/assessments"
      element={
        <RouteGuard>
          <AssessmentsList />
        </RouteGuard>
      }
    />
    <Route
      path="/assessments/:id"
      element={
        <RouteGuard>
          <AssessmentDetail />
        </RouteGuard>
      }
    />
    <Route
      path="/assessments/templates"
      element={
        <RouteGuard>
          <AssessmentTemplates />
        </RouteGuard>
      }
    />
    <Route
      path="/assessments/assignments"
      element={
        <RouteGuard>
          <AssessmentAssignments />
        </RouteGuard>
      }
    />
  </>
);

export default assessmentRoutes;
