import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { isValidEmail } from './BasicInfoTab';

// Maximum extra super admins allowed beyond the primary, per the feature
// spec. Hard-coded rather than env-driven because the env flag is a
// boolean (feature on/off), not a numeric cap.
export const MAX_SECONDARY_SUPER_ADMINS = 2;

interface SecondarySuperAdminEmailListProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  /**
   * Edit-view only — on the add client wizard the parent skips rendering
   * this list entirely. When IS_MULTI_SUPER_ADMIN env is off but the DB
   * already has secondaries for this client, the parent still renders the
   * list — but the rows come up disabled with no X so the user can see
   * them without being able to mutate.
   */
  isEdit: boolean;
}

/**
 * Renders ONLY the secondary super admin email INPUT ROWS for the client
 * currently being edited. The section header and the "+" button to add a
 * new secondary now live inline next to the primary Super Admin Email
 * input in BasicInfoTab — keeping the secondary inputs as a flat list
 * directly underneath the primary, matching the user's requested layout.
 *
 * Behavior is gated by VITE_IS_MULTI_SUPER_ADMIN:
 *
 *  - env=true:  inputs are editable, X to remove each row, format
 *               validation. Cross-client email existence is intentionally
 *               NOT warned about — that's the explicit point of Feature 1
 *               (one email can map to N clients).
 *  - env=false: read-only view of currently saved secondaries (if any).
 *               No X. onChange never fires. The unchanged list is echoed
 *               back on save so the backend reconciler diffs to a no-op
 *               and the DB rows stay untouched.
 */
const SecondarySuperAdminEmailList: React.FC<SecondarySuperAdminEmailListProps> = ({
  emails,
  onChange,
  isEdit,
}) => {
  const multiEnabled = import.meta.env.VITE_IS_MULTI_SUPER_ADMIN === 'true';

  // Not rendered on the add view at all per spec. Also not rendered when
  // env is off AND there are no pre-existing rows — keeps the form clean.
  if (!isEdit) return null;
  if (!multiEnabled && emails.length === 0) return null;

  const handleEdit = (index: number, value: string) => {
    if (!multiEnabled) return;
    const next = [...emails];
    next[index] = value;
    onChange(next);
  };

  const handleRemove = (index: number) => {
    if (!multiEnabled) return;
    const next = emails.filter((_, i) => i !== index);
    onChange(next);
  };

  return (
    <div className="space-y-1 mt-1">
      {emails.map((email, index) => {
        const disabled = !multiEnabled;
        // Only flag genuine format errors. Empty rows aren't errors — the
        // user may be mid-typing or just clicked + to open a new row.
        const showInvalid =
          multiEnabled && !!email && !isValidEmail(email);

        // Unique input id/name per row + multiple autofill-defense
        // signals. Chrome ignores autoComplete="off" on type="email", so
        // we render as type="text" with inputMode="email" (keeps the
        // mobile email keyboard) and stack
        // data-form-type="other" plus data-{1p,lp,bw}-ignore to opt out
        // of Chrome's heuristics and the major password managers. The
        // earlier bug — typing in a secondary changed the primary — was
        // Chrome cross-filling every type="email" field in the form when
        // the user picked an autofill suggestion. type="text" prevents
        // Chrome from classifying these as email fields at all, so the
        // cross-fill cannot trigger.
        const inputId = `secondarySuperAdminEmail-${index}`;

        return (
          <div key={inputId} className="space-y-1">
            <div className="flex gap-2 items-start">
              <Input
                id={inputId}
                name={inputId}
                type="text"
                inputMode="email"
                autoComplete="off"
                data-form-type="other"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                value={email}
                onChange={(e) => handleEdit(index, e.target.value)}
                placeholder="secondary.admin@example.com"
                disabled={disabled}
                className={showInvalid ? 'border-red-500' : ''}
                aria-label={`Additional super admin email ${index + 1}`}
              />
              {multiEnabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove additional super admin ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {showInvalid && (
              <p className="text-xs text-red-600">
                Enter a valid email address
              </p>
            )}
          </div>
        );
      })}

      {!multiEnabled && emails.length > 0 && (
        <p className="text-xs text-amber-600">
          Multi super admin is disabled. These existing entries are
          displayed read-only and will not be modified on save.
        </p>
      )}
    </div>
  );
};

export default SecondarySuperAdminEmailList;
