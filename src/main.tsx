
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
import { TransportSafetyProvider } from './contexts/transport-safety/TransportSafetyContext'
import { FacilityProvider } from './contexts/FacilityContext'
import { AssessmentProvider } from './contexts/assessment/AssessmentContext'
import { StudentProvider } from './contexts/StudentContext'
import { Toaster } from 'sonner'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ClientProvider>
      <AuthProvider>
        <IncidentProvider>
          <FacilityProvider>
            <AssessmentProvider>
              <EmployeeVerificationProvider>
                <FeedbackProvider>
                  <GrievanceProvider>
                    <TransportSafetyProvider>
                      <StudentProvider>
                        <Toaster position="top-right" closeButton />
                        <App />
                      </StudentProvider>
                    </TransportSafetyProvider>
                  </GrievanceProvider>
                </FeedbackProvider>
              </EmployeeVerificationProvider>
            </AssessmentProvider>
          </FacilityProvider>
        </IncidentProvider>
      </AuthProvider>
    </ClientProvider>
  </BrowserRouter>
);
