import { CheckCircle, Clock, XCircle, LucideIcon } from 'lucide-react';

export interface VerificationStatusCounts {
  verified: number;
  pending: number;
  inProgress?: number;
  failed: number;
  total: number;
}

export interface VerificationStatusOption {
  status: string;
  icon: LucideIcon;
  iconColor: string;
  badgeClass: string;
  matches: (counts: VerificationStatusCounts) => boolean;
}

// Ordered highest → lowest precedence: the first entry whose `matches` returns
// true wins. Reorder entries here to change precedence — every consumer of
// getOverallVerificationStatus picks it up automatically.
export const VERIFICATION_STATUS_PRIORITY: VerificationStatusOption[] = [
  {
    status: 'Failed',
    icon: XCircle,
    iconColor: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    matches: (c) => c.failed > 0,
  },
  {
    status: 'Pending',
    icon: Clock,
    iconColor: 'text-amber-600',
    badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    matches: (c) => c.pending > 0,
  },
  {
    status: 'In Progress',
    icon: Clock,
    iconColor: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    matches: (c) => (c.inProgress ?? 0) > 0,
  },
  {
    status: 'Verified',
    icon: CheckCircle,
    iconColor: 'text-emerald-600',
    badgeClass: 'bg-green-100 text-green-800 border-green-200',
    matches: () => true,
  },
];

export function getOverallVerificationStatus(counts: VerificationStatusCounts): VerificationStatusOption {
  return (
    VERIFICATION_STATUS_PRIORITY.find((option) => option.matches(counts)) ??
    VERIFICATION_STATUS_PRIORITY[VERIFICATION_STATUS_PRIORITY.length - 1]
  );
}
