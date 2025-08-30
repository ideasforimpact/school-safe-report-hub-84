# Assessment Notification Cron Job Workflow

## Overview
Complete email-based notification system for assessments using cron jobs and email queue.

## 🔄 **Complete Workflow**

### **1. User Actions → Email Queue**
When users perform actions (assign, submit, complete, rework), notifications are queued in `email_queue` table:

```
User Action → AssessmentNotificationService → NotificationService → email_queue table
```

### **2. Cron Jobs Process Email Queue**
Automated cron jobs process and send emails:

```
Cron Job → email_queue → send-notification-email → SMTP → User's Email
```

## 📋 **Cron Jobs Needed**

### **Job 1: Process Assessment Notifications**
- **File**: `supabase/functions/process-assessment-notifications/index.ts`
- **Schedule**: Every 5 minutes (`*/5 * * * *`)
- **Purpose**: Process immediate notifications from user actions
- **Handles**:
  - ✅ Assessment Assigned
  - ✅ Assessment Submitted  
  - ✅ Assessment Completed
  - ✅ Assessment Rework Required

### **Job 2: Assessment Reminders**
- **File**: `supabase/functions/assessment-reminders-cron/index.ts`
- **Schedule**: Daily at 8:00 AM (`0 8 * * *`)
- **Purpose**: Check and queue reminder notifications
- **Handles**:
  - ⏰ Assessment Due in 5 Days
  - 🚨 Assessment Overdue

### **Job 3: Cleanup Old Emails**
- **Schedule**: Weekly on Sunday at 2:00 AM (`0 2 * * 0`)
- **Purpose**: Clean up sent emails older than 30 days

### **Job 4: Cleanup Old Logs**
- **Schedule**: Weekly on Sunday at 3:00 AM (`0 3 * * 0`)
- **Purpose**: Clean up notification logs older than 90 days

## 🗃️ **Database Tables Used**

### **email_queue**
Stores all queued notifications:
```sql
- id (uuid)
- module_name ('assessment')
- notification_type ('assessment_assigned', etc.)
- client_id
- recipient_email
- recipient_name  
- subject (processed template)
- body (processed template)
- params (template variables as JSON)
- priority (0=normal, 1=high)
- is_sent (boolean)
- retry_count 
- max_retries (3)
- scheduled_at
- sent_at
- error_message
- created_at
- updated_at
```

### **notification_logs**
Tracks all notification attempts:
```sql
- id (uuid)
- module ('assessment')
- type ('assessment_assigned', etc.)
- recipient_id (employee_id)
- recipient_email
- subject
- body  
- status ('pending', 'sent', 'failed', 'skipped')
- error_message
- sent_at
- metadata (JSON with assessmentId, etc.)
- created_at
```

## 🔧 **Setup Instructions**

### **1. Deploy Edge Functions**
```bash
# Deploy the notification processor
supabase functions deploy process-assessment-notifications

# Deploy the reminders cron
supabase functions deploy assessment-reminders-cron
```

### **2. Setup Cron Jobs**
```sql
-- Run the SQL in setup_assessment_cron_jobs.sql
-- Remember to replace 'your-project-id' with actual project ID
```

### **3. Environment Variables**
```bash
# In Supabase dashboard, add these environment variables:
FRONTEND_URL=https://your-domain.com
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **4. Enable Extensions**
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

## 📊 **Monitoring & Debugging**

### **Check Cron Jobs Status**
```sql
-- View all assessment cron jobs
SELECT * FROM cron.job WHERE jobname LIKE '%assessment%';

-- View cron job run history
SELECT * FROM cron.job_run_details 
WHERE jobname LIKE '%assessment%' 
ORDER BY start_time DESC 
LIMIT 10;
```

### **Check Email Queue**
```sql
-- Pending assessment emails
SELECT * FROM email_queue 
WHERE module_name = 'assessment' 
  AND is_sent = false
ORDER BY created_at DESC;

-- Failed assessment emails
SELECT * FROM email_queue 
WHERE module_name = 'assessment' 
  AND retry_count >= max_retries
ORDER BY created_at DESC;
```

### **Check Notification Logs**
```sql
-- Recent assessment notifications
SELECT * FROM notification_logs 
WHERE module = 'assessment'
ORDER BY created_at DESC 
LIMIT 20;

-- Failed notifications
SELECT * FROM notification_logs 
WHERE module = 'assessment' 
  AND status = 'failed'
ORDER BY created_at DESC;
```

## 🚀 **Testing**

### **1. Test Immediate Notifications**
1. Create an assessment and assign it
2. Check `email_queue` table for new entry
3. Wait 5 minutes for cron to process
4. Check recipient's email

### **2. Test Reminder Notifications**
1. Create assessment with due date 5 days from now
2. Run reminder cron manually:
   ```sql
   SELECT net.http_post(
     url := 'https://your-project-id.supabase.co/functions/v1/assessment-reminders-cron',
     headers := jsonb_build_object('Authorization', 'Bearer your_service_role_key'),
     body := jsonb_build_object('trigger', 'manual_test')
   );
   ```
3. Check `email_queue` for reminder notification

### **3. Manual Cron Execution**
```sql
-- Manually trigger notification processing
SELECT net.http_post(
  url := 'https://your-project-id.supabase.co/functions/v1/process-assessment-notifications',
  headers := jsonb_build_object('Authorization', 'Bearer your_service_role_key'),
  body := jsonb_build_object('trigger', 'manual')
);
```

## 🎯 **Key Features**

### **✅ Self-Action Skip Logic**
- Users don't get notified for actions they perform themselves
- Handled in frontend notification service before queuing

### **✅ Duplicate Prevention**
- Reminders check if already sent today
- Uses `notification_logs` to prevent duplicates

### **✅ Retry Mechanism**
- Failed emails retry up to 3 times
- Exponential backoff handled by cron frequency

### **✅ Priority Handling**
- Overdue notifications have high priority (1)
- Regular notifications have normal priority (0)

### **✅ Error Handling**
- Failed notifications logged with error messages
- Cron jobs continue processing other notifications

## 📈 **Scalability**

### **Performance Optimization**
- Process emails in batches of 50
- Separate cron for immediate vs scheduled notifications
- Database indexes on frequently queried columns

### **Load Distribution**
- Immediate notifications: Every 5 minutes
- Reminders: Once daily  
- Cleanup: Weekly during low-traffic hours

## 🔒 **Security**

### **Service Role Authentication**
- All cron jobs use service role key
- Frontend notifications use user context for skip logic

### **Data Privacy**
- Email content processed server-side
- Sensitive data not exposed in logs

This complete cron-based system ensures all assessment notifications are reliably processed and delivered via email! 🎉 