import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/Dateformat';
import { EmployeeUser, CpdEntryForUser } from '@/pages/UserManagement';

export type CpdDomainForTabs = {
  id: string;
  name: string;
};

const CORE_VALUES_NAME = 'Core Values & Ethics';

/** Order domains so Core Values & Ethics is first (activated by default). */
function orderDomains(domains: CpdDomainForTabs[]): CpdDomainForTabs[] {
  const core = domains.find((d) => d.name === CORE_VALUES_NAME);
  const rest = domains.filter((d) => d.name !== CORE_VALUES_NAME);
  return core ? [core, ...rest] : [...domains];
}

interface CpdDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: EmployeeUser | null;
  domains: CpdDomainForTabs[];
}

/** Card layout matching ChallanDetailsDialog: same padding, borders, label/value spacing. */
const CpdEntryCard = ({ entry }: { entry: CpdEntryForUser }) => (
  <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50/50 hover:border-orange-300 transition-all">
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-500 mb-1">Title</div>
          <div className="text-sm font-bold text-gray-900">{entry.title}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">Hours</div>
          <div className="text-sm text-gray-900">
            {entry.hour != null ? `${entry.hour}h` : '—'}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-1">Date</div>
          <div className="text-sm text-gray-900">
            {entry.captured_date ? formatDate(entry.captured_date) : '—'}
          </div>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-gray-500 mb-1">Category</div>
        <div className="text-sm text-gray-900">{entry.category ?? '—'}</div>
      </div>

      {entry.cpd_learning && (
        <div className="pt-2 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 mb-1">
            What did you learn
          </div>
          <div className="text-sm text-gray-700 leading-relaxed">
            {entry.cpd_learning}
          </div>
        </div>
      )}
    </div>
  </div>
);

const CpdDetailsDialog: React.FC<CpdDetailsDialogProps> = ({
  open,
  onClose,
  user,
  domains,
}) => {
  const orderedDomains = React.useMemo(() => orderDomains(domains), [domains]);
  const defaultTab = orderedDomains[0]?.id ?? '';

  const entriesByDomain = React.useMemo(() => {
    const entries = (user as any)?.cpd_entries ?? [];
    const map: Record<string, CpdEntryForUser[]> = {};
    for (const d of orderedDomains) {
      map[d.id] = entries.filter((e: CpdEntryForUser) => e.domain_id === d.id);
    }
    return map;
  }, [user, orderedDomains]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[100vh] max-h-[80vh] flex flex-col p-0 rounded-lg overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
          <DialogTitle>CPD Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4 no-scrollbar rounded-b-lg">
          {user && orderedDomains.length > 0 ? (
            <Tabs defaultValue={defaultTab} className="w-full">
              <div className="sticky top-0 z-10 bg-white pb-2 pt-2 -mx-6 px-6">
                <TabsList className="grid w-full grid-cols-3 gap-3 p-1 bg-gray-100 rounded-lg">
                  {orderedDomains.map((d) => {
                    const count = (entriesByDomain[d.id] ?? []).length;
                    return (
                      <TabsTrigger
                        key={d.id}
                        value={d.id}
                        className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-700 data-[state=active]:font-semibold transition-all"
                      >
                        <span className="truncate">{d.name}</span>
                        {count > 0 && (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full">
                            {count}
                          </span>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {orderedDomains.map((d) => {
                const domainEntries = entriesByDomain[d.id] ?? [];
                const totalHours = domainEntries.reduce(
                  (sum, e) => sum + (e.hour ?? 0),
                  0
                );
                return (
                <TabsContent key={d.id} value={d.id} className="mt-4">
                  {domainEntries.length > 0 ? (
                    <div>
                      <div className="flex justify-end mb-3">
                        <Badge className="border-orange-300 text-orange-700 bg-orange-50 font-semibold px-3 py-1">
                          Total hours: {totalHours}h
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        {domainEntries.map((e) => (
                          <CpdEntryCard key={e.id} entry={e} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-orange-200 rounded-lg bg-orange-50/30">
                      <div className="text-sm font-medium text-gray-500">
                        No CPD entries for this domain
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        No entries in {d.name} yet
                      </div>
                    </div>
                  )}
                </TabsContent>
                );
              })}
            </Tabs>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="text-sm font-medium text-gray-500">
                No CPD data to display
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 rounded-b-lg">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CpdDetailsDialog;
