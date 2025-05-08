
import React from 'react';
import Layout from '@/components/layout/Layout';
import { TransportSafetyProvider } from '@/contexts/transport-safety/TransportSafetyContext';
import DocumentsPageContent from '@/components/transport-safety/documents/DocumentsPageContent';

const DocumentsPage: React.FC = () => {
  return (
    <Layout>
      <TransportSafetyProvider>
        <DocumentsPageContent />
      </TransportSafetyProvider>
    </Layout>
  );
};

export default DocumentsPage;
