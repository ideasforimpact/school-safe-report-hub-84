
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import EditIncidentForm from './EditIncidentForm';
import EditIncidentHeader from './EditIncidentHeader';
import VoidIncidentDialog from './VoidIncidentDialog';
import { useEditIncident } from '@/hooks/useEditIncident';
import { Person } from '@/types/incident'; // Import for Person type
import Loader from '@/components/common/Loader';
import type { NextScenarioResult } from '@/demo_client/incident/demoScenarios';

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

  // Demo Setup pipe: header → page → form. The header hosts the demo
  // icon (top-right of the page); when clicked it stashes the chosen
  // scenario here; the form watches this prop and applies it via its
  // own setFormData, then calls onConsumed to clear the slot. This
  // avoids lifting the form's entire state up to the page just for
  // this one feature.
  const [pendingDemo, setPendingDemo] = useState<NextScenarioResult | null>(null);

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
            <Loader text="Loading incident details..." />
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
          onDemoApply={setPendingDemo}
        />

        <EditIncidentForm
          pendingDemo={pendingDemo}
          onDemoConsumed={() => setPendingDemo(null)}
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
