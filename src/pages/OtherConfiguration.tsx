
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useIncidents } from '@/contexts/IncidentContext';
import { OtherSettingsConfig } from './configuration/OtherSettingsConfig';

const OtherConfiguration = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('designations');
  
  const { 
    designations,
    addDesignation,
    updateDesignation,
    deleteDesignation
  } = useIncidents();

  // Set initial tab based on URL parameter when component mounts
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <div>
          <h1 className="text-2xl font-bold">Other Settings Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage designations and other system settings
          </p>
        </div>

        <OtherSettingsConfig 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          designations={designations}
          addDesignation={addDesignation}
          updateDesignation={updateDesignation}
          deleteDesignation={deleteDesignation}
        />
      </div>
    </Layout>
  );
};

export default OtherConfiguration;
