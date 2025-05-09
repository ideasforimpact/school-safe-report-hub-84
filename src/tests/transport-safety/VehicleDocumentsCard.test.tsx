
import React from 'react';
import { render } from '@testing-library/react';
import { VehicleDocumentsCard } from '../../components/transport-safety/DocumentsCard';

test('renders vehicle documents card', () => {
  const documents = [
    { id: '1', name: 'Registration', date: '2023-01-01', type: 'registration', status: 'active' },
    { id: '2', name: 'Insurance', date: '2023-01-15', type: 'insurance', status: 'active' }
  ];

  const { getByText } = render(
    <VehicleDocumentsCard 
      documents={documents}
      onAddDocument={() => {}}
      onViewDocument={() => {}}
    />
  );
  
  expect(getByText('Registration')).toBeInTheDocument();
  expect(getByText('Insurance')).toBeInTheDocument();
});
