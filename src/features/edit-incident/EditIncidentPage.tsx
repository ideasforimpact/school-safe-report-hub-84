
import React from 'react';
import Layout from '@/components/layout/Layout';
import EditIncidentForm from './EditIncidentForm';
import EditIncidentHeader from './EditIncidentHeader';
import VoidIncidentDialog from './VoidIncidentDialog';
import { useEditIncident } from '@/hooks/useEditIncident';
import { Person } from '@/types/incident'; // Import for Person type

const EditIncidentPage = () => {
  const {
    formData,
    peopleInvolved,
    isSubmitting,
    handleSubmit,
    handleVoidIncident,
    showVoidDialog,
    setShowVoidDialog,
    voidReason,
    setVoidReason,
    incident,
    navigate,
    id
  } = useEditIncident();

  const handleFormSubmit = (updatedFormData: any, updatedPeople: Person[]) => {
    handleSubmit({
      formData: updatedFormData,
      peopleInvolved: updatedPeople
    });
  };

  if (!incident) {
    return (
      <Layout>
        <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Edit Incident</h1>
            <p className="text-gray-500">Loading incident details...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6 w-full overflow-x-hidden">
        <EditIncidentHeader 
          isVoided={incident?.isVoided} 
          onVoidClick={() => setShowVoidDialog(true)} 
          ticketId={incident.ticketId}
        />

        <EditIncidentForm />
        
        <VoidIncidentDialog
          open={showVoidDialog}
          onOpenChange={setShowVoidDialog}
          voidReason={voidReason}
          onVoidReasonChange={(reason) => setVoidReason(reason)}
          onConfirm={handleVoidIncident}
        />
      </div>
    </Layout>
  );
};

export default EditIncidentPage;
