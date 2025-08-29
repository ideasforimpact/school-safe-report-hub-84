// Simple fallback email logger for when database table is not available
export class SimpleEmailLogger {
  private static instance: SimpleEmailLogger;
  
  private constructor() {}
  
  public static getInstance(): SimpleEmailLogger {
    if (!SimpleEmailLogger.instance) {
      SimpleEmailLogger.instance = new SimpleEmailLogger();
    }
    return SimpleEmailLogger.instance;
  }
  
  async logEmail(emailData: {
    module_name: string;
    notification_type: string;
    client_id: string;
    recipient_email: string;
    recipient_name?: string;
    subject: string;
    body: string;
    params: Record<string, any>;
    priority?: number;
  }): Promise<boolean> {
    try {
      // For now, just log to console - this is a fallback when DB table doesn't exist
      console.log('📧 EMAIL NOTIFICATION (DB fallback):', {
        type: emailData.notification_type,
        module: emailData.module_name,
        recipient: emailData.recipient_email,
        subject: emailData.subject,
        timestamp: new Date().toISOString()
      });
      
      // In a production environment, you might want to:
      // 1. Write to a file
      // 2. Send to an external service
      // 3. Use a different database table
      // 4. Queue in memory for later processing
      
      return true;
    } catch (error) {
      console.error('Error in simple email logger:', error);
      return false;
    }
  }
}

export const simpleEmailLogger = SimpleEmailLogger.getInstance(); 