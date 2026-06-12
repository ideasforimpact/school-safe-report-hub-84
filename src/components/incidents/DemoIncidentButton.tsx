import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  getNextScenario,
  type NextScenarioResult,
} from '@/demo_client/incident/demoScenarios';

interface DemoIncidentButtonProps {
  /**
   * Called when the user clicks the demo icon. Receives both the
   * chosen scenario AND its index in the canonical 0..N-1 sequence —
   * the index is used by the resolvers to deterministically pick from
   * loaded dropdown options when a scenario's field name doesn't
   * match (so each click still produces a visibly different fill).
   * The parent decides how to map into its specific form state.
   */
  onApply: (result: NextScenarioResult) => void;
}

/**
 * Small ghost-icon button that appears in the Report Incident and Edit
 * Incident page headers when VITE_IS_DEMO_SETUP=true. Click cycles to
 * the next pre-canned demo scenario from
 * src/demo_client/incident/scenarios.json and hands it to the parent
 * via onApply.
 *
 * Gating: when VITE_IS_DEMO_SETUP is anything other than the literal
 * string 'true', the component renders null — no demo path reaches
 * runtime in production builds. The static JSON import means
 * scenarios.json itself ends up in the bundle (~1 KB) regardless;
 * that's the trade-off for build-time simplicity. To fully tree-shake
 * the JSON, switch to a dynamic `import('./scenarios.json')` inside
 * an env-conditional branch — optional follow-up.
 *
 * UX notes:
 *   - 400ms spinner makes the cause/effect visible to a demo audience
 *     (without it, the form just snaps to filled and the trigger isn't
 *     obvious).
 *   - The icon is Sparkles (lucide-react) — no other UI in the app
 *     uses it for an unrelated meaning, so the affordance reads
 *     unambiguously as "auto-fill / magic".
 *   - title attribute on the button gives a native browser tooltip;
 *     no extra Tooltip primitive required.
 */
export const DemoIncidentButton: React.FC<DemoIncidentButtonProps> = ({
  onApply,
}) => {
  const enabled = import.meta.env.VITE_IS_DEMO_SETUP === 'true';
  const [isLoading, setIsLoading] = useState(false);

  if (!enabled) return null;

  // Click → swap Sparkles for Loader2 spinner for ~400ms → apply the
  // next scenario → restore the icon. The brief spin gives the user
  // visible feedback that the click was registered before all the form
  // fields snap to filled (so the cause-and-effect is obvious in a
  // demo / walkthrough setting).
  const handleClick = () => {
    if (isLoading) return;
    setIsLoading(true);
    window.setTimeout(() => {
      try {
        onApply(getNextScenario());
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
      aria-label="Fill demo data"
      title="Fill demo data"
      className="text-primary"
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Sparkles className="h-5 w-5" />
      )}
    </Button>
  );
};

export default DemoIncidentButton;
