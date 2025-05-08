
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/auth/AuthContext'
import { ClientProvider } from './contexts/ClientContext'
import { IncidentProvider } from './contexts/incident/IncidentContext'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ClientProvider>
      <AuthProvider>
        <IncidentProvider>
          <App />
        </IncidentProvider>
      </AuthProvider>
    </ClientProvider>
  </BrowserRouter>
);
