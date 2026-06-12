import { useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Building2, ShieldCheck, ChevronRight, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth';
import type { ClientChoiceRow } from '@/contexts/auth/types';
import { buildClientLogoUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Multi-client picker shown after a Google / Azure SSO login when the
// authenticated email is linked to more than one active employees row.
// Mounted once at the AuthProvider root; visibility is driven entirely by
// pendingClientChoices on the auth context. Intentionally NOT dismissable
// by Esc / click-outside — the user has to either pick a client or sign
// out, otherwise we'd be left in a half-authenticated state.
export function ClientPickerDialog() {
  const { pendingClientChoices, confirmClientChoice, cancelClientChoice } = useAuth();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const open = pendingClientChoices !== null && pendingClientChoices.length > 0;
  const busy = submittingId !== null || cancelling;

  const handlePick = async (row: ClientChoiceRow) => {
    if (busy) return;
    setSubmittingId(row.id);
    try {
      await confirmClientChoice(row);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCancel = async () => {
    if (busy) return;
    setCancelling(true);
    try {
      await cancelClientChoice();
    } finally {
      setCancelling(false);
    }
  };

  return (
    <DialogPrimitive.Root open={open}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        />
        <DialogPrimitive.Content
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          className={cn(
            'fixed left-1/2 top-1/2 z-[61] w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
            'rounded-2xl border bg-background p-0 shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          <div className="px-6 pt-6 pb-4 border-b">
            <DialogPrimitive.Title className="text-xl font-semibold tracking-tight">
              Choose an organization
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="text-sm text-muted-foreground mt-1">
              Your account has access to multiple organizations. Pick the one you
              want to sign in to.
            </DialogPrimitive.Description>
          </div>

          <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
            <ul className="space-y-2">
              {(pendingClientChoices ?? []).map((row) => (
                <li key={`${row.id}-${row.client_id}`}>
                  <ClientPickerRow
                    row={row}
                    busy={busy}
                    submitting={submittingId === row.id}
                    onPick={() => handlePick(row)}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Signed in as the same email across these organizations.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={busy}
              className="gap-2"
            >
              {cancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Sign out
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface ClientPickerRowProps {
  row: ClientChoiceRow;
  busy: boolean;
  submitting: boolean;
  onPick: () => void;
}

function ClientPickerRow({ row, busy, submitting, onPick }: ClientPickerRowProps) {
  const logoUrl = buildClientLogoUrl(row.client_logo ?? undefined);
  const roleLabel = row.is_super_admin ? 'Super Admin' : 'Employee';
  const roleBadgeClass = row.is_super_admin
    ? 'bg-primary/10 text-primary border-primary/20'
    : 'bg-muted text-foreground border-border';

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={busy}
      className={cn(
        'group w-full flex items-center gap-4 rounded-xl border p-4 text-left',
        'transition-colors',
        'hover:bg-accent hover:border-primary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:opacity-60 disabled:cursor-not-allowed'
      )}
    >
      <div className="flex-shrink-0 h-12 w-12 rounded-lg border bg-muted flex items-center justify-center overflow-hidden">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={row.client_name || 'Client logo'}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <Building2 className="h-6 w-6 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {row.client_name || 'Unnamed client'}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
              roleBadgeClass
            )}
          >
            <ShieldCheck className="h-3 w-3" />
            {roleLabel}
          </span>
        </div>
      </div>

      <div className="flex-shrink-0 text-muted-foreground group-hover:text-foreground">
        {submitting ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </div>
    </button>
  );
}
