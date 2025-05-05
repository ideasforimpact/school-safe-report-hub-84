
import React from 'react';
import { Ticket } from 'lucide-react';

interface TicketInfoBannerProps {
  ticketId: string;
}

const TicketInfoBanner: React.FC<TicketInfoBannerProps> = ({ ticketId }) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4 flex items-center">
      <Ticket className="h-5 w-5 text-blue-600 mr-3" />
      <p className="text-blue-600 font-medium">
        Ticket Information: <span className="font-bold">{ticketId}</span>
      </p>
    </div>
  );
};

export default TicketInfoBanner;
