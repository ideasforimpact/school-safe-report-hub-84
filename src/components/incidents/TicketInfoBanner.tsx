
import React from 'react';
import { Ticket } from 'lucide-react';

interface TicketInfoBannerProps {
  ticketId: string;
}

const TicketInfoBanner: React.FC<TicketInfoBannerProps> = ({ ticketId }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 flex items-start">
      <Ticket className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
      <div>
        <h3 className="font-medium text-blue-800">Ticket Information</h3>
        <p className="text-sm text-blue-600 mt-1">
          This incident will be assigned ticket ID: <strong>{ticketId}</strong>
        </p>
      </div>
    </div>
  );
};

export default TicketInfoBanner;
