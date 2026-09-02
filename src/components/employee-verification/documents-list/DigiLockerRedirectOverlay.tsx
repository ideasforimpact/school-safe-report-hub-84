import React, { useEffect } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

interface DigiLockerRedirectOverlayProps {
  isVisible: boolean;
  onCancel: () => void;
}

// Blocks interaction with the rest of the app while the DigiLocker popup (a real
// window.open(), outside our control) is open. Closing that popup without finishing
// usually triggers the SDK's onFailure callback on its own, which unblocks the page —
// this timeout is the fallback for the case where the popup fails to open at all, or
// the SDK never calls back, so the page doesn't stay blocked forever.
const DIGILOCKER_TIMEOUT_MS = 5 * 60 * 1000;

const DigiLockerRedirectOverlay = ({ isVisible, onCancel }: DigiLockerRedirectOverlayProps) => {
  useEffect(() => {
    if (!isVisible) return;
    const timer = window.setTimeout(onCancel, DIGILOCKER_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isVisible, onCancel]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
        <ShieldCheck className="h-10 w-10 text-primary-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Verifying with DigiLocker</h3>
        <p className="text-sm text-gray-600 mb-6">
          Complete the verification in the DigiLocker window. This page will unlock automatically once it's done.
        </p>
        <Loader2 className="h-6 w-6 animate-spin text-primary-600 mx-auto mb-6" />
      </div>
    </div>
  );
};

export default DigiLockerRedirectOverlay;
