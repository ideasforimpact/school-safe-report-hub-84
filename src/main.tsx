
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/auth/AuthContext'
import { ClientProvider } from './contexts/ClientContext'
import { IncidentProvider } from './contexts/incident/IncidentContext'
import { EmployeeVerificationProvider } from './contexts/employee-verification/EmployeeVerificationContext'
import { FeedbackProvider } from './contexts/feedback/FeedbackContext'
import { GrievanceProvider } from './contexts/grievances/GrievanceContext'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ClientProvider>
      <AuthProvider>
        <IncidentProvider>
          <EmployeeVerificationProvider>
            <FeedbackProvider>
              <GrievanceProvider>
                <App />
              </GrievanceProvider>
            </FeedbackProvider>
          </EmployeeVerificationProvider>
        </IncidentProvider>
      </AuthProvider>
    </ClientProvider>
  </BrowserRouter>
);
