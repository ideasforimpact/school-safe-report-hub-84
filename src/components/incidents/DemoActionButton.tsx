import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface DemoActionButtonProps {
  /**
   * Side effect to run when the user clicks the demo icon. Called
   * after a brief 400ms "thinking" spin so the cause/effect of the
   * fill is visible. Can be async — the button stays in its loading
   * state until the promise resolves.
   */
  onActivate: () => void | Promise<void>;
  /** Optional aria-label / tooltip text. Defaults to "Fill demo data". */
  label?: string;
  /** Optional class on the button. */
  className?: string;
}

/**
 * Generic Sparkles ⇢ Loader icon button used by every "demo fill"
 * affordance in the app (Report Incident, Edit Incident, Close
 * Incident, Create Assessment). Gated behind VITE_IS_DEMO_SETUP — when
 * the env flag is off, the component returns null and nothing is
 * rendered.
 *
 * The 400ms spinner before the callback fires is purely UX polish —
 * it makes the click obvious in a demo / walkthrough context so the
 * audience sees the cause-and-effect. The button is disabled during
 * the spin to swallow rapid double-clicks.
 *
 * Sibling component `DemoIncidentButton` exists for the Report
 * Incident form and is bound to the incident-scenario module; this
 * one is the more generic primitive that anything else uses.
 */
export const DemoActionButton: React.FC<DemoActionButtonProps> = ({
  onActivate,
  label = 'Fill demo data',
  className,
}) => {
  const enabled = import.meta.env.VITE_IS_DEMO_SETUP === 'true';
  const [isLoading, setIsLoading] = useState(false);

  if (!enabled) return null;

  const handleClick = () => {
    if (isLoading) return;
    setIsLoading(true);
    window.setTimeout(async () => {
      try {
        await onActivate();
      } finally {
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      aria-label={label}
      title={label}
      className={className ?? 'text-primary'}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Sparkles className="h-5 w-5" />
      )}
    </Button>
  );
};

export default DemoActionButton;
