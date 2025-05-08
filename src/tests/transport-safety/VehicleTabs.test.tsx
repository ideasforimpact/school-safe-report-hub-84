
import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import VehicleTabs from '@/components/transport-safety/vehicle-detail/VehicleTabs';

describe('VehicleTabs', () => {
  const vehicleId = 'test-vehicle-id';

  it('renders tabs with documents tab selected by default', () => {
    renderWithRouter(<VehicleTabs vehicleId={vehicleId} />);
    
    const documentsTab = screen.getByRole('tab', { name: /documents/i });
    const historyTab = screen.getByRole('tab', { name: /history/i });
    
    expect(documentsTab).toBeInTheDocument();
    expect(historyTab).toBeInTheDocument();
    expect(documentsTab).toHaveAttribute('data-state', 'active');
    expect(historyTab).toHaveAttribute('data-state', 'inactive');
  });

  it('renders documents tab content by default', () => {
    renderWithRouter(<VehicleTabs vehicleId={vehicleId} />);
    
    expect(screen.getByText('Vehicle Documents')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /document management/i })).toBeInTheDocument();
  });

  it('switches to history tab when clicked', () => {
    renderWithRouter(<VehicleTabs vehicleId={vehicleId} />);
    
    const historyTab = screen.getByRole('tab', { name: /history/i });
    fireEvent.click(historyTab);
    
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText(/vehicle history records will be available/i)).toBeInTheDocument();
  });

  it('renders document management link with correct url', () => {
    renderWithRouter(<VehicleTabs vehicleId={vehicleId} />);
    
    const documentManagementLink = screen.getByRole('link', { name: /document management/i });
    expect(documentManagementLink).toHaveAttribute('href', `/transport-safety/${vehicleId}/documents`);
  });
});
