-- Migration: Make super_admin_allowed_domain nullable
-- This allows the field to be optional for client configuration

-- First, update existing NULL values to be explicitly NULL
UPDATE clients 
SET super_admin_allowed_domain = NULL 
WHERE super_admin_allowed_domain = '';

-- Alter the column to be nullable (it should already be nullable, but ensuring it)
ALTER TABLE clients 
ALTER COLUMN super_admin_allowed_domain DROP NOT NULL;

-- Add a comment to document the purpose
COMMENT ON COLUMN clients.super_admin_allowed_domain IS 'Optional comma-separated list of email domains allowed for super admin access. If NULL, no domain restrictions apply for super admin.';

    