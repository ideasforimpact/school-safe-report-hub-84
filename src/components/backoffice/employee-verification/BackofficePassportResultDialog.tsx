import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BackofficePassportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: any;
}

const BackofficePassportResultDialog: React.FC<BackofficePassportResultDialogProps> = ({
  open,
  onOpenChange,
  details
}) => {
  const payload = (details?.data?.data ?? details?.data ?? {}) as Record<string, any>;
  const isSuccessful = details?.success === true && details?.status_code === 200;
  const failureMessage = details?.message || details?.error || 'Passport verification failed.';
console.log(failureMessage,'failureMessagefailureMessage');

  const profileImageSrc = (() => {
    const value = payload?.profile_image || payload?.photo || payload?.image || payload?.image_url;
    if (!value || typeof value !== 'string') return undefined;
    if (value.startsWith('http') || value.startsWith('https') || value.startsWith('data:')) return value;
    return `data:image/jpeg;base64,${value}`;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Passport Verification Result</DialogTitle>
          <DialogDescription>
            {isSuccessful ? 'Passport data fetched successfully.' : 'Passport verification failed.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[420px] rounded-md border">
          {isSuccessful ? (
            <div className="p-4">
              {profileImageSrc && (
                <div className="flex justify-center mb-4">
                  <img
                    src={profileImageSrc}
                    alt="Passport profile"
                    className="w-32 h-32 object-cover rounded border"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ['Passport Number', payload?.passport_number || payload?.passport_no || '-'],
                    ['Full Name', payload?.full_name || payload?.name || '-'],
                    ['File Number', payload?.file_number || '-'],
                    ['Date of Birth', payload?.dob || '-'],
                    ['Application Date', payload?.date_of_application || payload?.application_date || '-'],
                    ['Status', payload?.application_status || payload?.current_status || payload?.status || '-']
                  ].map(([label, value]) => (
                    <TableRow key={String(label)}>
                      <TableCell className="font-medium">{String(label)}</TableCell>
                      <TableCell>{String(value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-red-600 font-medium mb-2">Verification Error</p>
              <p className="text-sm text-gray-700">{failureMessage}</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackofficePassportResultDialog;
