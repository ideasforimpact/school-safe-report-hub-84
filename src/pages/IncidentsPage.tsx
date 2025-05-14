
import React from 'react';
import Layout from '@/components/layout/Layout';
import IncidentsList from './IncidentsList';

const IncidentsPage: React.FC = () => {
  return (
    <Layout>
      <IncidentsList />
    </Layout>
  );
};

export default IncidentsPage;
