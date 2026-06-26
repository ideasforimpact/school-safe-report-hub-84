
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import DomainList from './DomainList';

interface SuperAdminDomainInputProps {
  domains: string[];
  onAdd: (domain: string) => void;
  onRemove: (domain: string) => void;
  /**
   * Feature 2: edit-view gets the +-with-cap UX when the env flag is on.
   * Add view always behaves like today (single domain, no cap applied beyond
   * the natural one). Defaults to false so any other callers stay unaffected.
   */
  isEdit?: boolean;
}

// Mirrors MAX_SECONDARY_SUPER_ADMINS so the "cap = 1 primary + up to 2 extras"
// behavior is symmetric between the secondary-super-admin-emails list and the
// allowed-super-admin-domains list.
const MAX_SUPER_ADMIN_DOMAINS_WITH_MULTI = 3;
const MAX_SUPER_ADMIN_DOMAINS_WITHOUT_MULTI = 1;

const SuperAdminDomainInput = ({
  domains,
  onAdd,
  onRemove,
  isEdit = false,
}: SuperAdminDomainInputProps) => {
  const [newDomain, setNewDomain] = useState('');
  const multiEnabled = import.meta.env.VITE_IS_MULTI_SUPER_ADMIN === 'true';

  // The cap only kicks in on the edit view. On the add view we keep the
  // legacy behavior — let the user enter whatever they want; the backend
  // also enforces the cap when IS_MULTI_SUPER_ADMIN is set there.
  const maxDomains = isEdit
    ? (multiEnabled
        ? MAX_SUPER_ADMIN_DOMAINS_WITH_MULTI
        : MAX_SUPER_ADMIN_DOMAINS_WITHOUT_MULTI)
    : Number.POSITIVE_INFINITY;

  const atCap = domains.length >= maxDomains;
  // When env is off on edit view AND we already have extra rows, freeze
  // them: render the first domain editable as today, gray out the rest
  // (DomainList hides the X for indexes >= disabledFromIndex).
  const disabledFromIndex =
    isEdit && !multiEnabled ? MAX_SUPER_ADMIN_DOMAINS_WITHOUT_MULTI : undefined;

  const handleAdd = () => {
    if (newDomain && !domains.includes(newDomain) && !atCap) {
      onAdd(newDomain);
      setNewDomain('');
    }
  };

  return (
    <div className="space-y-2 mt-6">
      <label className="font-medium">Allowed Super Admin Email Domains <span className="text-red-500">*</span></label>
      <p className="text-sm text-gray-500">
        Only super admins with email addresses from these domains can access this client's portal
      </p>

      {!atCap && (
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="e.g. example.com"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          />
          <Button type="button" onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      )}

      {atCap && isEdit && multiEnabled && (
        <p className="text-xs text-gray-500">
          Maximum of {MAX_SUPER_ADMIN_DOMAINS_WITH_MULTI} domains reached.
        </p>
      )}

      {atCap && isEdit && !multiEnabled && domains.length > MAX_SUPER_ADMIN_DOMAINS_WITHOUT_MULTI && (
        <p className="text-xs text-amber-600">
          Multi super admin is disabled. Additional domains beyond the first
          are shown read-only and will not be modified on save.
        </p>
      )}

      <DomainList
        domains={domains}
        onRemove={onRemove}
        disabledFromIndex={disabledFromIndex}
      />
    </div>
  );
};

export default SuperAdminDomainInput;
