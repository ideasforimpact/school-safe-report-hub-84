
import React from 'react';
import Layout from '@/components/layout/Layout';
import EditIncidentForm from './EditIncidentForm';
import EditIncidentHeader from './EditIncidentHeader';
import VoidIncidentDialog from './VoidIncidentDialog';
import { useEditIncident } from '@/hooks/useEditIncident';

const EditIncidentPage = () => {
  const {
    formData,
    setFormData,
    peopleInvolved,
    setPeopleInvolved,
    isSubmitting,
    availableSubcategories,
    setAvailableSubcategories,
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

  return (
    <Layout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <EditIncidentHeader 
          isVoided={incident?.isVoided} 
          onVoidClick={() => setShowVoidDialog(true)} 
        />

        <EditIncidentForm
          formData={formData}
          setFormData={setFormData}
          peopleInvolved={peopleInvolved}
          setPeopleInvolved={setPeopleInvolved}
          availableSubcategories={availableSubcategories}
          setAvailableSubcategories={setAvailableSubcategories}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
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
