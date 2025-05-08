
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from './test-utils';
import VehicleInfoCard from '@/components/transport-safety/vehicle-detail/VehicleInfoCard';
import { mockVehicle, mockTransportSafetyContext } from './mocks';
import { toast } from '@/hooks/use-toast';
import '@testing-library/jest-dom';

jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn()
}));

describe('VehicleInfoCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders vehicle information correctly', () => {
    renderWithRouter(<VehicleInfoCard vehicle={mockVehicle} />);
    
    expect(screen.getByText(`${mockVehicle.make} ${mockVehicle.model}`)).toBeInTheDocument();
    expect(screen.getByText(mockVehicle.registrationNumber)).toBeInTheDocument();
    expect(screen.getByText(mockVehicle.year.toString())).toBeInTheDocument();
    expect(screen.getByText(`${mockVehicle.capacity} passengers`)).toBeInTheDocument();
    
    const statusBadge = screen.getByText(mockVehicle.status.charAt(0).toUpperCase() + mockVehicle.status.slice(1));
    expect(statusBadge).toBeInTheDocument();
  });

  it('displays correct vehicle type', () => {
    renderWithRouter(<VehicleInfoCard vehicle={mockVehicle} />);
    
    expect(screen.getByText('Bus')).toBeInTheDocument();
  });

  it('shows edit vehicle button with correct link', () => {
    renderWithRouter(<VehicleInfoCard vehicle={mockVehicle} />);
    
    const editButton = screen.getByRole('link', { name: /edit vehicle/i });
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveAttribute('href', `/transport-safety/${mockVehicle.id}/edit`);
  });

  it('runs safety check when button is clicked', async () => {
    const customContext = {
      ...mockTransportSafetyContext,
      verifyDocument: jest.fn()
    };
    
    renderWithRouter(
      <VehicleInfoCard vehicle={mockVehicle} />,
      { transportSafetyContext: customContext }
    );
    
    const safetyCheckButton = screen.getByRole('button', { name: /run safety check/i });
    expect(safetyCheckButton).toBeInTheDocument();
    
    fireEvent.click(safetyCheckButton);
    expect(screen.getByRole('button', { name: /running safety check/i })).toBeInTheDocument();
    
    // Advance timers to complete the mock API call
    jest.advanceTimersByTime(2000);
    
    await waitFor(() => {
      expect(customContext.verifyDocument).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith({
        title: "Safety Check Complete",
        description: expect.stringContaining("documents were checked")
      });
    });
    
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument();
  });

  it('initially shows no safety checks message', () => {
    renderWithRouter(<VehicleInfoCard vehicle={mockVehicle} />);
    
    expect(screen.getByText(/no safety checks have been run yet/i)).toBeInTheDocument();
  });
});
