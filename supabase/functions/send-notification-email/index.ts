import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from "npm:nodemailer@6";
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
  to: string;
  toName: string;
  subject: string;
  body: string; // HTML allowed
  priority?: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[send-notification-email] Function called at:', new Date().toISOString());
  console.log('[send-notification-email] Request method:', req.method);
  console.log('[send-notification-email] Request URL:', req.url);

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[send-notification-email] ERROR: No authorization header');
      throw new Error('No authorization header');
    }

    // Initialize supabase client
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    // Extract token from Authorization header
    const token = authHeader.replace('Bearer ', '').trim();
    const serviceRoleKey = getSupabaseServiceRoleKey();
    
    console.log('[send-notification-email] Authentication check:', {
      tokenLength: token.length,
      serviceRoleKeyLength: serviceRoleKey.length,
      tokenPrefix: token.substring(0, 30) + '...',
      serviceRoleKeyPrefix: serviceRoleKey.substring(0, 30) + '...'
    });
    
    // Helper function to decode JWT payload (without verification, just to check role)
    function decodeJWTPayload(jwt: string): any {
      try {
        const parts = jwt.split('.');
        if (parts.length !== 3) return null;
        const payload = parts[1];
        // Add padding if needed for base64 decoding
        const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
        const decoded = atob(paddedPayload);
        return JSON.parse(decoded);
      } catch (error) {
        console.error('[send-notification-email] Error decoding JWT:', error);
        return null;
      }
    }
    
    // Check if token is a service role key by decoding and checking the role claim
    let isServiceRoleKey = false;
    let tokenPayload: any = null;
    
    try {
      tokenPayload = decodeJWTPayload(token);
      if (tokenPayload && tokenPayload.role === 'service_role') {
        isServiceRoleKey = true;
        console.log('[send-notification-email] Token is a service role key (role claim: service_role)');
      } else if (tokenPayload) {
        console.log('[send-notification-email] Token role claim:', tokenPayload.role || 'none');
      }
    } catch (error) {
      console.log('[send-notification-email] Could not decode token payload, will try user authentication');
    }
    
    // Authenticate based on token type
    let authenticatedUser: any = null;
    
    if (isServiceRoleKey) {
      // Service role key authenticated - JWT payload confirms it
      console.log('[send-notification-email] Service role key authenticated');
    } else {
      // Regular user authentication
      console.log('[send-notification-email] Attempting user authentication...');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (user && !userError) {
        console.log('[send-notification-email] User authenticated:', user.id);
        authenticatedUser = user;
      } else {
        console.error('[send-notification-email] ERROR: User authentication failed:', {
          error: userError?.message,
          code: userError?.code,
          status: userError?.status
        });
        throw new Error('Invalid authentication: ' + (userError?.message || 'User not found'));
      }
    }
    
    console.log('[send-notification-email] Authentication successful:', {
      isServiceRole: isServiceRoleKey,
      userId: authenticatedUser?.id || 'service_role'
    });

    // Parse request body
    let requestBody: EmailRequest;
    try {
      requestBody = await req.json();
      console.log('[send-notification-email] Request body received:', {
        to: requestBody.to,
        toName: requestBody.toName,
        subject: requestBody.subject,
        bodyLength: requestBody.body?.length || 0,
        priority: requestBody.priority,
      });
    } catch (parseError: any) {
      console.error('[send-notification-email] ERROR: Failed to parse request body:', parseError);
      throw new Error('Invalid request body: ' + parseError.message);
    }

    const { to, toName, subject, body, priority } = requestBody;

    // Validate required fields
    if (!to || !subject || !body) {
      const missing = [];
      if (!to) missing.push('to');
      if (!subject) missing.push('subject');
      if (!body) missing.push('body');
      console.error('[send-notification-email] ERROR: Missing required fields:', missing);
      throw new Error('Missing required fields: ' + missing.join(', '));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('[send-notification-email] ERROR: Invalid email format:', to);
      throw new Error('Invalid email format: ' + to);
    }

    console.log('[send-notification-email] Calling sendEmail function...');
    // Send email via SMTP (Nodemailer)
    const emailSent = await sendEmail({
      to,
      toName,
      subject,
      body,
      priority
    });

    if (emailSent) {
      console.log('[send-notification-email] SUCCESS: Email sent successfully to:', to);
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' } as EmailResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      console.error('[send-notification-email] ERROR: sendEmail returned false');
      throw new Error('Failed to send email - sendEmail returned false');
    }

  } catch (error: any) {
    console.error('[send-notification-email] ERROR: Exception caught:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause
    });
    console.error('[send-notification-email] Full error object:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to send email', 
        error: String(error?.message || error),
        errorType: error?.name || 'Unknown',
        stack: error?.stack || 'No stack trace'
      } as EmailResponse & { errorType?: string; stack?: string }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Send email using Nodemailer (SMTP) with existing secrets
 */
async function sendEmail(emailData: EmailRequest): Promise<boolean> {
  console.log('[sendEmail] Function called with data:', {
    to: emailData.to,
    toName: emailData.toName,
    subject: emailData.subject,
    bodyLength: emailData.body?.length || 0
  });

  const smtpHost = Deno.env.get('SMTP_HOST') || '';
  const smtpPort = Number(Deno.env.get('SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('SMTP_USER') || '';
  const smtpPass = (Deno.env.get('SMTP_PASSWORD') || '').replace(/\s+/g, '');
  const fromEmail = Deno.env.get('FROM_EMAIL') || smtpUser || '';
  const fromName = Deno.env.get('FROM_NAME') || 'Safe School Team';

  console.log('[sendEmail] SMTP Configuration check:', {
    smtpHost: smtpHost ? `${smtpHost.substring(0, 10)}...` : 'MISSING',
    smtpPort: smtpPort || 'MISSING',
    smtpUser: smtpUser ? `${smtpUser.substring(0, 5)}...` : 'MISSING',
    smtpPass: smtpPass ? '***' : 'MISSING',
    fromEmail: fromEmail || 'MISSING',
    fromName: fromName
  });

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
    const missing = [];
    if (!smtpHost) missing.push('SMTP_HOST');
    if (!smtpPort) missing.push('SMTP_PORT');
    if (!smtpUser) missing.push('SMTP_USER');
    if (!smtpPass) missing.push('SMTP_PASSWORD');
    if (!fromEmail) missing.push('FROM_EMAIL');
    console.error('[sendEmail] ERROR: SMTP configuration missing:', missing);
    return false;
  }

  console.log('[sendEmail] Sending via Nodemailer SMTP...');
  console.log('[sendEmail] SMTP Host:', smtpHost, 'Port:', smtpPort, 'User:', smtpUser);

  try {
    console.log('[sendEmail] Creating Nodemailer transporter...');
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      pool: false,
      connectionTimeout: 10000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
      tls: { servername: smtpHost, rejectUnauthorized: true },
    });

    console.log('[sendEmail] Verifying SMTP connection...');
    // Optional quick capability check
    await transporter.verify();
    console.log('[sendEmail] SMTP connection verified successfully');

    const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
    console.log('[sendEmail] Sending email from:', fromHeader, 'to:', emailData.to);

    const info = await transporter.sendMail({
      from: fromHeader,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.body,
    });

    console.log('[sendEmail] SUCCESS: Email sent, messageId:', info.messageId);
    console.log('[sendEmail] Nodemailer response info:', JSON.stringify(info, null, 2));
    return true;
  } catch (err: any) {
    console.error('[sendEmail] ERROR: Nodemailer SMTP error:', {
      message: err?.message,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      responseCode: err?.responseCode,
      stack: err?.stack
    });
    console.error('[sendEmail] Full error object:', err);
    return false;
  }
} 