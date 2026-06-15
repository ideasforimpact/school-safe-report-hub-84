
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { X } from 'lucide-react';

interface DomainListProps {
  domains: string[];
  onRemove: (domain: string) => void;
  /**
   * Feature 2 / Allowed Super Admin Email Domains: when the
   * IS_MULTI_SUPER_ADMIN env is off but the client already has more than
   * one super-admin domain in the DB, we still render the extras but
   * inert. `disabledFromIndex` is the first index that should be locked.
   * Pass a value beyond the array length to disable nothing (default).
   */
  disabledFromIndex?: number;
}

const DomainList = ({ domains, onRemove, disabledFromIndex }: DomainListProps) => {
  const lockFrom =
    typeof disabledFromIndex === 'number' ? disabledFromIndex : Number.POSITIVE_INFINITY;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {domains.map((domain, index) => {
        const locked = index >= lockFrom;
        return (
          <Badge
            key={domain}
            variant="secondary"
            className={
              'flex items-center gap-1' + (locked ? ' opacity-60' : '')
            }
          >
            {domain}
            {!locked && (
              <button
                onClick={() => onRemove(domain)}
                className="ml-1 hover:text-destructive focus:outline-none"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove {domain}</span>
              </button>
            )}
          </Badge>
        );
      })}
      {domains.length === 0 && (
        <p className="text-sm text-gray-500 italic">No domains added yet</p>
      )}
    </div>
  );
};

export default DomainList;
