import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FormsPage from './pages/FormsPage';
import FormPreviewPage from './pages/FormPreviewPage';
import FeedbackPage from './pages/feedback/FeedbackPage';
import FormResponsePage from './pages/feedback/FormResponsePage';
import GrievancesPage from './pages/grievances/GrievancesPage';
import ConfigurationPage from './pages/ConfigurationPage';
import FormSubmissionDetailsPage from './pages/FormSubmissionDetailsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/forms" element={<FormsPage />} />
        <Route path="/form-preview/:formId" element={<FormPreviewPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/feedback/responses/:responseId" element={<FormResponsePage />} />
        <Route path="/grievances" element={<GrievancesPage />} />
        <Route path="/configuration" element={<ConfigurationPage />} />

        <Route path="/form-submission/:submissionId" element={<FormSubmissionDetailsPage />} />
        
      </Routes>
    </Router>
  );
}

export default App;
