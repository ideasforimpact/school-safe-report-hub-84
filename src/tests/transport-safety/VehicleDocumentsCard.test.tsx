
import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import VehicleDocumentsCard from '@/components/transport-safety/vehicle-detail/VehicleDocumentsCard';
import { mockVehicle } from './mocks';

describe('VehicleDocumentsCard', () => {
  it('renders document status card header', () => {
    renderWithRouter(<VehicleDocumentsCard vehicle={mockVehicle} />);
    
    expect(screen.getByText('Document Status')).toBeInTheDocument();
  });

  it('renders all documents with correct information', () => {
    renderWithRouter(<VehicleDocumentsCard vehicle={mockVehicle} />);
    
    mockVehicle.documents.forEach(doc => {
      // Check document type is displayed with proper capitalization
      const docType = doc.type.charAt(0).toUpperCase() + doc.type.slice(1);
      expect(screen.getByText(docType)).toBeInTheDocument();
      
      // Check expiry date is displayed
      const expiryText = screen.getByText(/expires:/i);
      expect(expiryText).toBeInTheDocument();
      
      // Check status badge is displayed
      const statusElement = screen.getByText(doc.status.replace(/_/g, ' '), { exact: false });
      expect(statusElement).toBeInTheDocument();
    });
  });

  it('renders manage documents button with correct link', () => {
    renderWithRouter(<VehicleDocumentsCard vehicle={mockVehicle} />);
    
    const manageButton = screen.getByRole('link', { name: /manage documents/i });
    expect(manageButton).toBeInTheDocument();
    expect(manageButton).toHaveAttribute('href', `/transport-safety/${mockVehicle.id}/documents`);
  });
});
