
import { useState, useEffect } from 'react';

export function useTicketId(generateTicketIdFn: () => string) {
  // State for next ticket ID
  const [nextTicketId, setNextTicketId] = useState('');

  useEffect(() => {
    // Generate a preview of the next ticket ID
    setNextTicketId(generateTicketIdFn());
  }, [generateTicketIdFn]);

  return {
    nextTicketId
  };
}
