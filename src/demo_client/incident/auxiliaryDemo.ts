// Demo Setup helpers for the small text-only affordances on the
// Incident Detail page (Reopen Incident dialog, Add Comment form).
//
// Each is a flat array of 3 strings; cycle pointers are module-level
// so they persist across re-opens of their respective dialogs within
// a tab. Full page reload resets to 0.

import rawAuxiliary from './auxiliaryScenarios.json';

interface AuxiliaryScenarios {
  reopen: string[];
  comment: string[];
}

const data = rawAuxiliary as AuxiliaryScenarios;

let reopenCycleIndex = 0;
let commentCycleIndex = 0;

/**
 * Returns the next pre-canned "Reason for Reopening" text. Cycles
 * deterministically; returns empty string if no scenarios are
 * defined (so callers don't have to null-check).
 */
export function getNextReopenScenario(): string {
  const list = data.reopen || [];
  if (list.length === 0) return '';
  const text = list[reopenCycleIndex % list.length];
  reopenCycleIndex = (reopenCycleIndex + 1) % list.length;
  return text;
}

/**
 * Returns the next pre-canned incident comment text. Same cycling
 * rules as the reopen scenarios.
 */
export function getNextCommentScenario(): string {
  const list = data.comment || [];
  if (list.length === 0) return '';
  const text = list[commentCycleIndex % list.length];
  commentCycleIndex = (commentCycleIndex + 1) % list.length;
  return text;
}
