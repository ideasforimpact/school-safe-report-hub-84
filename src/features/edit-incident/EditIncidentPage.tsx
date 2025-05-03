
import React from 'react';
import Layout from '@/components/layout/Layout';
import EditIncidentForm from './EditIncidentForm';
import EditIncidentHeader from './EditIncidentHeader';
import VoidIncidentDialog from './VoidIncidentDialog';
import { useEditIncident } from '@/hooks/useEditIncident';

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

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <EditIncidentHeader 
          isVoided={incident?.isVoided} 
          onVoidClick={() => setShowVoidDialog(true)} 
        />

        <EditIncidentForm
          initialFormData={formData}
          initialPeopleInvolved={peopleInvolved}
          isSubmitting={isSubmitting}
          onSubmit={handleFormSubmit}
          onCancel={() => navigate(`/incidents/${id}`)}
        />
        
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
