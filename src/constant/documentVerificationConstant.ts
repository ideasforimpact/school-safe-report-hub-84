/**
 * Document verification related constants
 * Centralized configuration for the "Documents & Verification" table
 */

/**
 * document_status.name values (as stored in the DB / returned via
 * documentStatusName on a VerificationDocument) that identify who/what
 * verified a document. Use these instead of hardcoding the raw strings
 * so every comparison site stays in sync.
 */
export const DOCUMENT_STATUS_NAME = {
  GOVERNANCE: 'governance',
  MANUAL: 'manual',
  BACKOFFICE: 'backoffice',
  /** Set only by the backoffice manual/custom-document review flow */
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
} as const;

/**
 * Display labels shown in the "Verified by" column/badge.
 */
export const VERIFIED_BY_LABEL = {
  GOVERNMENT: 'Government',
  MANUAL: 'Manual',
  BACKOFFICE: 'Backoffice',
} as const;
