import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '../_shared/env.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get grievance admin recipients for a client
async function getGrievanceAdminRecipients(supabase: any, clientId: string) {
  const recipients = []
  const seenEmails = new Set()

  try {
    // Get super admins for this client
    const { data: superAdmins, error: superAdminError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, email')
      .eq('client_id', clientId)
      .eq('is_super_admin', true)
      .eq('status', true)

    if (superAdminError) {
      console.error('❌ Error fetching super admins:', superAdminError)
    }

    if (superAdmins) {
      for (const admin of superAdmins) {
        if (!seenEmails.has(admin.email)) {
          recipients.push(admin)
          seenEmails.add(admin.email)
          console.log(`👑 Added super admin: ${admin.email}`)
        }
      }
    }

    // Get grievance module IDs
    const { data: modules, error: moduleError } = await supabase
      .from('modules')
      .select('id')
      .ilike('name', '%grievance%')

    if (moduleError) {
      console.error('❌ Error fetching grievance modules:', moduleError)
    }

    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id)

      // Get grievance admins
      const { data: grievanceAdmins, error: grievanceAdminError } = await supabase
        .from('employee_modules')
        .select(`
          employee_id,
          employees!inner(id, first_name, last_name, email, client_id, status)
        `)
        .eq('employees.client_id', clientId)
        .eq('employees.status', true)
        .eq('level->is_admin', true)
        .in('module_id', moduleIds)

      if (grievanceAdminError) {
        console.error('❌ Error fetching grievance admins:', grievanceAdminError)
      }

      if (grievanceAdmins) {
        for (const moduleAccess of grievanceAdmins) {
          const employee = moduleAccess.employees
          if (employee && !seenEmails.has(employee.email)) {
            recipients.push({
              id: employee.id,
              first_name: employee.first_name,
              last_name: employee.last_name,
              email: employee.email
            })
            seenEmails.add(employee.email)
            console.log(`🔧 Added grievance admin: ${employee.email}`)
          }
        }
      }
    }

    console.log(`📊 Total recipients found: ${recipients.length}`)
    return recipients
  } catch (error) {
    console.error('❌ Error getting grievance admin recipients:', error)
    return []
  }
}

// Generate grievance notification email body
function generateGrievanceNotificationBody(variables: any) {
  return `
    <div style="max-width:640px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#1f2937;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:8px;">
      <div style="text-align:center;background-color:#f9fafb;padding:20px;margin:-24px -24px 24px -24px;border-bottom:1px solid #e5e7eb;border-radius:8px 8px 0 0;">
        <h2 style="margin:0;color:#1f2937;font-size:24px;">📝 Grievance Submitted</h2>
      </div>
      <div style="text-align:left;">
        <p style="margin:0 0 20px;font-size:16px;">Hello <strong>${variables.User_Name}</strong>,</p>
        <p style="margin:0 0 20px;font-size:16px;">Your grievance has been successfully submitted. Our team will review it and take the necessary action.</p>
        <div style="background-color:#f3f4f6;padding:16px;border-radius:6px;border-left:4px solid #6b7280;margin:20px 0;">
          <h3 style="margin:0 0 12px;color:#1f2937;font-size:18px;">Details:</h3>
          <p style="margin:6px 0;"><strong>Title:</strong> ${variables.Grievance_Title}</p>
          <p style="margin:6px 0;"><strong>Description:</strong> ${variables.Grievance_Description}</p>
          <p style="margin:6px 0;"><strong>Submitted On:</strong> ${variables.Submitted_Date}</p>
        </div>
        <p style="margin:20px 0;font-size:16px;color:#6b7280;">You will be notified of any updates regarding this grievance.</p>
      </div>
      <div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;color:#6b7280;">
        <p style="margin:0;font-size:14px;">Regards,<br/><strong>Safe School Team</strong></p>
      </div>
    </div>
  `
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔔 Processing grievance notifications from email queue...')

    // Create Supabase client
    const supabaseUrl = getSupabaseUrl()
    const supabaseKey = getSupabaseServiceRoleKey()
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get pending grievance notifications from email_queue
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('module_name', 'grievance')
      .eq('is_sent', false)
      .lt('retry_count', 3) // Don't retry more than 3 times
      .order('created_at', { ascending: true })
      .limit(50) // Process in batches

    if (fetchError) {
      console.error('❌ Error fetching pending grievance emails:', fetchError)
      throw fetchError
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log('✅ No pending grievance notifications to process')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No pending grievance notifications',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📧 Found ${pendingEmails.length} pending grievance notification entries`)

    let processed = 0
    let failed = 0

    // Process each email entry (each entry represents one grievance submission)
    for (const emailEntry of pendingEmails) {
      try {
        console.log(`📤 Processing grievance notification entry ${emailEntry.id}`)

        // Get client_id from params
        const clientId = emailEntry.params?.client_id
        if (!clientId) {
          console.error(`❌ No client_id found in params for email ${emailEntry.id}`)
          failed++
          continue
        }

        // Get all recipients (super admins and grievance admins) for this client
        const recipients = await getGrievanceAdminRecipients(supabase, clientId)
        
        if (recipients.length === 0) {
          console.log(`⚠️ No recipients found for client ${clientId}, marking as processed`)
          const currentTime = new Date().toISOString()
          
          // Mark as sent even though no recipients (to avoid reprocessing)
          await supabase
            .from('email_queue')
            .update({ 
              is_sent: true,
              sent_at: currentTime,
              error_message: 'No recipients found'
            })
            .eq('id', emailEntry.id)

          // Update corresponding notification_logs status
          await supabase
            .from('notification_logs')
            .update({
              status: 'failed',
              error_message: 'No recipients found'
            })
            .eq('email_queue_id', emailEntry.id)

          continue
        }

        console.log(`📧 Found ${recipients.length} recipients for grievance notification`)

        // Send email to each recipient
        let entryProcessed = 0
        let entryFailed = 0

        for (const recipient of recipients) {
          try {
            // Generate email body with recipient's name
            const emailBody = generateGrievanceNotificationBody({
              User_Name: `${recipient.first_name} ${recipient.last_name}`,
              Grievance_ID: emailEntry.params?.Grievance_ID,
              Grievance_Title: emailEntry.params?.Grievance_Title,
              Grievance_Description: emailEntry.params?.Grievance_Description,
              Submitted_Date: emailEntry.params?.Submitted_Date
            })

            // Call the send-notification-email function
            const { data: sendResult, error: sendError } = await supabase.functions.invoke(
              'send-notification-email',
              {
                body: {
                  to: recipient.email,
                  subject: emailEntry.subject,
                  body: emailBody,
                  priority: emailEntry.priority || 'medium'
                }
              }
            )

            if (sendError || !sendResult?.success) {
              console.error(`❌ Failed to send email to ${recipient.email}:`, sendError || sendResult)
              entryFailed++
            } else {
              console.log(`✅ Successfully sent email to ${recipient.email}`)
              await recordCentralizedNotification({
                supabase,
                emailEntry,
                recipient,
              })
              entryProcessed++
            }
          } catch (recipientError) {
            console.error(`❌ Error sending to ${recipient.email}:`, recipientError)
            entryFailed++
          }
        }

        // Update the email queue entry based on results
        const currentTime = new Date().toISOString()
        
        if (entryProcessed > 0 && entryFailed === 0) {
          // All emails sent successfully
          await supabase
            .from('email_queue')
            .update({ 
              is_sent: true,
              sent_at: currentTime,
              error_message: null
            })
            .eq('id', emailEntry.id)

          // Update corresponding notification_logs status
          await supabase
            .from('notification_logs')
            .update({
              status: 'sent',
              sent_at: currentTime,
              error_message: null
            })
            .eq('email_queue_id', emailEntry.id)

          processed++
        } else if (entryProcessed > 0 && entryFailed > 0) {
          // Some emails sent, some failed - mark as sent but log error
          const errorMessage = `Partial success: ${entryProcessed} sent, ${entryFailed} failed`
          
          await supabase
            .from('email_queue')
            .update({ 
              is_sent: true,
              sent_at: currentTime,
              error_message: errorMessage
            })
            .eq('id', emailEntry.id)

          // Update corresponding notification_logs status
          await supabase
            .from('notification_logs')
            .update({
              status: 'sent',
              sent_at: currentTime,
              error_message: errorMessage
            })
            .eq('email_queue_id', emailEntry.id)

          processed++
        } else {
          // All emails failed - retry later
          const errorMessage = `All recipients failed: ${entryFailed} failed`
          
          await supabase
            .from('email_queue')
            .update({ 
              retry_count: (emailEntry.retry_count || 0) + 1,
              last_retry_at: currentTime,
              error_message: errorMessage
            })
            .eq('id', emailEntry.id)

          // Update corresponding notification_logs status
          await supabase
            .from('notification_logs')
            .update({
              status: 'failed',
              error_message: errorMessage
            })
            .eq('email_queue_id', emailEntry.id)

          failed++
        }

      } catch (error) {
        console.error(`❌ Error processing email entry ${emailEntry.id}:`, error)
        const currentTime = new Date().toISOString()
        
        // Update retry count
        await supabase
          .from('email_queue')
          .update({ 
            retry_count: (emailEntry.retry_count || 0) + 1,
            last_retry_at: currentTime,
            error_message: error.message
          })
          .eq('id', emailEntry.id)

        // Update corresponding notification_logs status
        await supabase
          .from('notification_logs')
          .update({
            status: 'failed',
            error_message: error.message
          })
          .eq('email_queue_id', emailEntry.id)
        
        failed++
      }
    }

    console.log(`📊 Grievance notification processing complete: ${processed} entries processed, ${failed} failed`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${pendingEmails.length} grievance notification entries`,
        processed,
        failed
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in process-grievance-notifications:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
 
async function recordCentralizedNotification({
  supabase,
  emailEntry,
  recipient,
}: {
  supabase: any;
  emailEntry: any;
  recipient: { id: string; email: string };
}) {
  try {
    const messagePreview = (emailEntry.body || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 240)
 
    const { error } = await supabase.rpc('create_centralized_notification', {
      p_client_id: emailEntry.client_id,
      p_module_id: null,
      p_module_name: emailEntry.module_name || 'grievance',
      p_email_id: emailEntry.id,
      p_notification_type: emailEntry.notification_type || 'grievance_submitted',
      p_channel: 'email',
      p_title: emailEntry.subject || null,
      p_message: messagePreview || null,
      p_payload: emailEntry.params || {},
      p_recipient_employee_id: recipient.id,
      p_recipient_email: recipient.email,
    })
 
    if (error) {
      console.error('Failed to create centralized grievance notification:', error)
    }
  } catch (error) {
    console.error('Error creating centralized grievance notification:', error)
  }
}
 