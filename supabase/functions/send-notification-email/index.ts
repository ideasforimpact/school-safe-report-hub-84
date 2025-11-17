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

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Initialize supabase client
    const supabase = createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey()
    );

    // Check if it's a service role key (for cron jobs)
    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = getSupabaseServiceRoleKey();
    
    if (token === serviceRoleKey) {
      // Service role authentication - proceed without user validation
      console.log('Service role authentication detected');
    } else {
      // Regular user authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      
      if (userError || !user) {
        throw new Error('Invalid authentication');
      }
    }

    const { to, toName, subject, body, priority }: EmailRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, body');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error('Invalid email format');
    }

    // Send email via SMTP (Nodemailer)
    const emailSent = await sendEmail({
      to,
      toName,
      subject,
      body,
      priority
    });

    if (emailSent) {
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' } as EmailResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      throw new Error('Failed to send email');
    }

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, message: 'Failed to send email', error: String(error?.message || error) } as EmailResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Send email using Nodemailer (SMTP) with existing secrets
 */
async function sendEmail(emailData: EmailRequest): Promise<boolean> {
  const smtpHost = Deno.env.get('SMTP_HOST') || '';
  const smtpPort = Number(Deno.env.get('SMTP_PORT') || '587');
  const smtpUser = Deno.env.get('SMTP_USER') || '';
  const smtpPass = (Deno.env.get('SMTP_PASSWORD') || '').replace(/\s+/g, '');
  const fromEmail = Deno.env.get('FROM_EMAIL') || smtpUser || '';
  const fromName = Deno.env.get('FROM_NAME') || 'Safe School Team';

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !fromEmail) {
    console.error('SMTP configuration missing');
    return false;
  }

  console.log('Sending via Nodemailer SMTP...');
  console.log('SMTP Host:', smtpHost, 'Port:', smtpPort, 'User:', smtpUser);
  console.log('Email request payload:', emailData);

  try {
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

    // Optional quick capability check
    await transporter.verify();

    const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;

    const info = await transporter.sendMail({
      from: fromHeader,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.body,
    });

    console.log('Email sent, id:', info.messageId);
    console.log('Nodemailer response info:', info);
    console.log('Email data sent:', emailData);
    return true;
  } catch (err: any) {
    console.error('Nodemailer SMTP error:', err?.message || err);
    return false;
  }
} 