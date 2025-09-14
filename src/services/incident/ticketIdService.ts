import { supabase } from '@/integrations/supabase/client';
import { formatClientNameForTicketId } from '@/utils/clientUtils';

/**
 * Service for generating ticket IDs based on client information
 */
export class TicketIdService {
  /**
   * Generates the next ticket ID for a client using optimized database query
   * @param clientName - The client name
   * @param clientId - The client ID (for filtering incidents)
   * @returns Promise<string> - The next ticket ID
   */
  static async generateNextTicketId(clientName: string, clientId: string): Promise<string> {
    try {
      console.log('Generating ticket ID for client:', clientName, 'ID:', clientId);
      
      const prefix = formatClientNameForTicketId(clientName);
      console.log('Generated prefix:', prefix);
      
      // Optimized query: Get the highest numbered ticket ID for this client prefix
      // This query extracts the number from ticket_id and finds the maximum
      const { data, error } = await supabase
        .from('incidents')
        .select('ticket_id')
        .eq('client_id', clientId)
        .like('ticket_id', `${prefix}-%`)
        .order('ticket_id', { ascending: false })
        .limit(1);
      
      if (error) {
        console.error('Error fetching existing ticket IDs:', error);
        // Fallback to timestamp-based ID if database query fails
        return this.generateFallbackTicketId(clientName);
      }
      
      let nextNumber = 1; // Default to 001 for first ticket
      
      if (data && data.length > 0) {
        // Extract the number from the highest ticket ID
        const highestTicketId = data[0].ticket_id;
        const match = highestTicketId.match(/-(\d+)$/);
        
        if (match) {
          const currentNumber = parseInt(match[1], 10);
          nextNumber = currentNumber + 1;
          console.log('Found existing ticket ID:', highestTicketId, 'Next number:', nextNumber);
        } else {
          console.log('Could not parse number from ticket ID:', highestTicketId);
        }
      } else {
        console.log('No existing ticket IDs found for prefix:', prefix, 'Starting with 001');
      }
      
      // Format with leading zeros (3 digits)
      const formattedNumber = nextNumber.toString().padStart(3, '0');
      const nextTicketId = `${prefix}-${formattedNumber}`;
      
      console.log('Generated next ticket ID:', nextTicketId);
      
      return nextTicketId;
    } catch (error) {
      console.error('Error in generateNextTicketId:', error);
      // Fallback to timestamp-based ID if anything fails
      return this.generateFallbackTicketId(clientName);
    }
  }
  
  /**
   * Generates a fallback ticket ID using timestamp when database query fails
   * @param clientName - The client name
   * @returns string - Fallback ticket ID
   */
  private static generateFallbackTicketId(clientName: string): string {
    const prefix = formatClientNameForTicketId(clientName);
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    return `${prefix}-${timestamp}`;
  }
  
  /**
   * Validates if a ticket ID is unique for a client
   * @param ticketId - The ticket ID to validate
   * @param clientId - The client ID
   * @returns Promise<boolean> - True if unique, false if already exists
   */
  static async isTicketIdUnique(ticketId: string, clientId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('id')
        .eq('ticket_id', ticketId)
        .eq('client_id', clientId)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // No rows found - ticket ID is unique
        return true;
      }
      
      if (error) {
        console.error('Error checking ticket ID uniqueness:', error);
        return false;
      }
      
      // If we get data, the ticket ID already exists
      return false;
    } catch (error) {
      console.error('Error in isTicketIdUnique:', error);
      return false;
    }
  }
  
  /**
   * Gets all ticket IDs for a client (for debugging/testing)
   * @param clientId - The client ID
   * @returns Promise<string[]> - Array of ticket IDs
   */
  static async getClientTicketIds(clientId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('ticket_id')
        .eq('client_id', clientId)
        .not('ticket_id', 'is', null)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching client ticket IDs:', error);
        return [];
      }
      
      return data?.map(incident => incident.ticket_id) || [];
    } catch (error) {
      console.error('Error in getClientTicketIds:', error);
      return [];
    }
  }
}
