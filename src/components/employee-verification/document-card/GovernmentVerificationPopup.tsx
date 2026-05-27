import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  X,
  User,
  Calendar,
  Car,
  CheckCircle2,
  CheckCircle,
  XCircle,
  CreditCard,
  Fingerprint,
  Vote,
  Globe,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/Dateformat";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GovernmentDocumentType =
  | "driving_license"
  | "aadhar"
  | "pan"
  | "voter_id"
  | "passport";

export interface GovernmentVerificationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: GovernmentDocumentType;
  data?: Record<string, any>;
  documentId?: string;
  onVerificationUpdate?: () => void;
  isViewMode?: boolean;
}

// ─── Config per document type ────────────────────────────────────────────────

interface DocConfig {
  title: string;
  icon: React.ReactNode;
  summaryLeft: { label: string; valueKey: string; fallback: string };
  summaryRight: { label: string; valueKey: string; fallback: string; isBadge?: boolean };
  gradientClass: string;
  heading: string;
  subheading: string;
  subtitle?: string;
  numberLabel: string;
  numberKey: string;
  numberFallback: string;
  showStateBadge: boolean;
  fields: { label: string; key: string; fallback: string; highlight?: boolean; colSpan?: number }[];
}

const iconClass = "w-5 h-5";

const DOC_CONFIGS: Record<GovernmentDocumentType, DocConfig> = {
  driving_license: {
    title: "Driving License",
    icon: <Car className={iconClass} />,
    summaryLeft: { label: "Expiry Date", valueKey: "expiryDate", fallback: "—" },
    summaryRight: { label: "Vehicle Class", valueKey: "vehicleClasses", fallback: "LMV", isBadge: true },
    gradientClass: "gov-gradient-dl",
    heading: "Government of India",
    subheading: "DRIVING LICENCE",
    subtitle: "Motor Vehicles Act, 1988",
    numberLabel: "Licence No.",
    numberKey: "licenseNumber",
    numberFallback: "—",
    showStateBadge: true,
    fields: [
      { label: "Name", key: "name", fallback: "—", colSpan: 2 },
      { label: "Date of Birth", key: "dob", fallback: "—" },
      { label: "Issue Date", key: "issueDate", fallback: "—" },
      { label: "Valid Till", key: "expiryDate", fallback: "—", highlight: true },
      { label: "Vehicle Class", key: "vehicleClasses", fallback: "—" },
    ],
  },
  aadhar: {
    title: "Aadhar Card",
    icon: <Fingerprint className={iconClass} />,
    summaryLeft: { label: "Verification Status", valueKey: "verificationStatus", fallback: "Verified" },
    summaryRight: { label: "Gender", valueKey: "gender", fallback: "—" },
    gradientClass: "gov-gradient-aadhar",
    heading: "Government of India",
    subheading: "AADHAAR",
    subtitle: "Unique Identification Authority of India",
    numberLabel: "Aadhaar No.",
    numberKey: "aadharNumber",
    numberFallback: "XXXX XXXX XXXX",
    showStateBadge: false,
    fields: [
      { label: "Name", key: "name", fallback: "—" },      
      { label: "Gender", key: "gender", fallback: "—" },
      { label: "Date of Birth", key: "dob", fallback: "—" },
      { label: "Address", key: "address", fallback: "—" },
    ],
  },
  pan: {
    title: "PAN Card",
    icon: <CreditCard className={iconClass} />,
    summaryLeft: { label: "Verification Status", valueKey: "verificationStatus", fallback: "Verified" },
    summaryRight: { label: "PAN Type", valueKey: "panType", fallback: "Individual" },
    gradientClass: "gov-gradient-pan",
    heading: "Government of India",
    subheading: "PAN CARD",
    subtitle: "Income Tax Department",
    numberLabel: "PAN No.",
    numberKey: "panNumber",
    numberFallback: "XXXXX0000X",
    showStateBadge: false,
    fields: [
      { label: "Name", key: "name", fallback: "—" },
      { label: "Date of Birth", key: "dob", fallback: "—" },

      { label: "Father's Name", key: "fatherName", fallback: "—" },
      { label: "Gender", key: "gender", fallback: "—" },

      { label: "Address", key: "address", fallback: "—", colSpan: 2 },
    ],
  },
  voter_id: {
    title: "Voter ID",
    icon: <Vote className={iconClass} />,
    summaryLeft: { label: "Verification Status", valueKey: "verificationStatus", fallback: "Verified" },
    summaryRight: { label: "Constituency", valueKey: "constituency", fallback: "—" },
    gradientClass: "gov-gradient-voter",
    heading: "Election Commission of India",
    subheading: "VOTER ID CARD",
    subtitle: "Electoral Photo Identity Card",
    numberLabel: "Voter ID No.",
    numberKey: "voterIdNumber",
    numberFallback: "—",
    showStateBadge: true,
    fields: [
      { label: "Name", key: "name", fallback: "—" },
      { label: "Father's Name", key: "fatherName", fallback: "—" },
      { label: "Age", key: "age", fallback: "—" },
      { label: "Gender", key: "gender", fallback: "—" },
      { label: "Constituency", key: "constituency", fallback: "—" },
    ],
  },
  passport: {
    title: "Passport",
    icon: <Globe className={iconClass} />,
    summaryLeft: { label: "Expiry Date", valueKey: "expiryDate", fallback: "—" },
    summaryRight: { label: "Passport Type", valueKey: "passportType", fallback: "P" },
    gradientClass: "gov-gradient-passport",
    heading: "Republic of India",
    subheading: "PASSPORT",
    subtitle: "Ministry of External Affairs",
    numberLabel: "Passport No.",
    numberKey: "passportNumber",
    numberFallback: "—",
    showStateBadge: false,
    fields: [
      { label: "Name", key: "name", fallback: "—", colSpan: 2 },
      { label: "Nationality", key: "nationality", fallback: "Indian" },
      { label: "Gender", key: "gender", fallback: "—" },
      { label: "Date of Birth", key: "dob", fallback: "—" },
      { label: "Place of Birth", key: "placeOfBirth", fallback: "—" },
      { label: "Date of Issue", key: "issueDate", fallback: "—" },
      { label: "Date of Expiry", key: "expiryDate", fallback: "—", highlight: true },
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getMonthDiff = (from: Date, to: Date): number =>
  (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());

const getLicenseStatus = (dateStr?: string) => {
  if (!dateStr) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      isValid: false,
      monthsExpired: 0, 
      monthsUntilExpiry: 0
    };
  }

  const parts = dateStr.split("/");
  if (parts.length !== 3) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      isValid: false,
      monthsExpired: 0, 
      monthsUntilExpiry: 0 
    };
  }

  const [d, m, y] = parts.map(Number);

  const expiryDate = new Date(y, m - 1, d);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

  const isExpired = expiryDate < today;

  const isExpiringSoon =
    expiryDate >= today &&
    expiryDate <= sixMonthsLater;

  const isValid = expiryDate > sixMonthsLater;

  const monthsExpired = isExpired ? getMonthDiff(expiryDate, today) : 0;
  const monthsUntilExpiry = isExpiringSoon ? getMonthDiff(today, expiryDate) : 0;

  return { 
    isExpired, 
    isExpiringSoon, 
    isValid, 
    monthsExpired, 
    monthsUntilExpiry 
  };
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p
    className="text-[9px] uppercase tracking-widest mb-0.5"
    style={{ color: "rgba(255,255,255,0.5)" }}
  >
    {children}
  </p>
);

const FieldValue: React.FC<{ children: React.ReactNode; highlight?: boolean }> = ({
  children,
  highlight,
}) => (
  <p
    className="text-xs sm:text-sm font-semibold"
    style={{ color: highlight ? "hsl(var(--gov-popup-highlight))" : "#ffffff" }}
  >
    {children}
  </p>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const GovernmentVerificationPopup: React.FC<GovernmentVerificationPopupProps> = ({
  open,
  onOpenChange,
  documentType,
  data,  
  documentId,
  onVerificationUpdate,
  isViewMode = false,
}) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const { toast } = useToast();
  const { user, employeeData } = useAuth();
  const safeData = data ?? {};
  const config = DOC_CONFIGS[documentType];
  if (!config) return null;

  const getValue = (key: string, fallback: string) => {
  const value = safeData[key] ?? fallback;

  // Apply formatting only for date fields
  if (
      ["dob", "issueDate", "expiryDate"].includes(key) &&
      value !== "—"
    ) {
      return formatDate(value);
    }

    return value;
  };

  const isViewOnly = isViewMode === true;
  const summaryLeftValue = getValue(config.summaryLeft.valueKey, config.summaryLeft.fallback);
  const summaryRightValue = getValue(config.summaryRight.valueKey, config.summaryRight.fallback);
  const docNumber = getValue(config.numberKey, config.numberFallback);
  const stateCode = (docNumber?.match?.(/^[A-Za-z]{2}/)?.[0]?.toUpperCase()) || "";
  const state = safeData.state || "";
  const uploadedFileUrl = safeData.uploadedFileUrl;
  const fileType = safeData.fileType;
  const {
    isExpired: expired,
    isExpiringSoon,
    isValid,
    monthsExpired,
    monthsUntilExpiry,
  } = getLicenseStatus(summaryLeftValue);
  console.log({
  uploadedFileUrl,
  documentType,
});
console.log("isViewMode:", isViewMode);

  const handleApprove = async () => {
    if (!documentId) return;

    try {
      setIsApproving(true);

      const functionMap: Record<string, string> = {
        pan: 'pan-verification',
        aadhar: 'employee-verification',
        voter_id: 'voter-verification',
        driving_license: 'driving-license',
        passport: 'passport-verification',
      };

      const functionName = functionMap[documentType];

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'approveAfterApi',
          documentId,
          verification_notes: 'Verified after Government API check',
          verified_by_employee_id: employeeData?.id || user?.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Approved Successfully",
          description: "Document verified successfully.",
        });

        onOpenChange(false);
        onVerificationUpdate?.(); // 🔥 refresh table
      } else {
        throw new Error(data?.error || "Approval failed");
      }

    } catch (error: any) {
      toast({
        title: "Approval Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };
  
  const handleReject = async (reason: string) => {
    if (!documentId) return;

    try {
      setIsRejecting(true);

      const functionMap: Record<string, string> = {
        pan: 'pan-verification',
        aadhar: 'employee-verification',
        voter_id: 'voter-verification',
        driving_license: 'driving-license',
        passport: 'passport-verification',
      };

      const functionName = functionMap[documentType];

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'reject',
          documentId,
          verification_notes: reason,
          reject_reason: reason,
          verified_by_employee_id: employeeData?.id || user?.id,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Rejected Successfully",
          description: "Document rejected.",
        });

        onOpenChange(false);
        onVerificationUpdate?.();
      } else {
        throw new Error(data?.error || "Rejection failed");
      }

    } catch (error: any) {
      toast({
        title: "Rejection Failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
      setShowRejectForm(false);
      setRejectReason('');
    }
  };

  const gradientStyles: Record<GovernmentDocumentType, React.CSSProperties> = {
    driving_license: {
      background:
        "linear-gradient(135deg, hsl(var(--gov-dl-gradient-from)), hsl(var(--gov-dl-gradient-to)))",
    },
    aadhar: {
      background:
        "linear-gradient(135deg, hsl(var(--gov-aadhar-gradient-from)), hsl(var(--gov-aadhar-gradient-to)))",
    },
    pan: {
      background:
        "linear-gradient(135deg, hsl(var(--gov-pan-gradient-from)), hsl(var(--gov-pan-gradient-to)))",
    },
    voter_id: {
      background:
        "linear-gradient(135deg, hsl(var(--gov-voter-gradient-from)), hsl(var(--gov-voter-gradient-to)))",
    },
    passport: {
      background:
        "linear-gradient(135deg, hsl(var(--gov-passport-gradient-from)), hsl(var(--gov-passport-gradient-to)))",
    },
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[560px] p-0 gap-0 rounded-2xl border-0 overflow-hidden">

        {/* ── Header ──────────────────────────────────── */}
        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>
            {config.title}
          </AlertDialogTitle>

          <AlertDialogDescription>
            Government verified document preview for {config.title}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "hsl(var(--gov-popup-accent))" }}
            >
              <span className="text-white">{config.icon}</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-foreground">
                {config.title}
              </p>
              {documentType === "driving_license" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center">
                        {expired ? (
                          <XCircle
                            size={18}
                            className="text-red-600 cursor-pointer transition-transform duration-200 hover:scale-125"
                          />
                        ) : isExpiringSoon ? (
                          <AlertTriangle
                            size={18}
                            className="text-yellow-500 cursor-pointer transition-transform duration-200 hover:scale-125"
                          />
                        ) : (  
                          <CheckCircle
                            size={18}
                            className="text-green-600 cursor-pointer transition-transform duration-200 hover:scale-125"
                          />
                        )}
                      </span>
                    </TooltipTrigger>

                    <TooltipContent
                      side="bottom"
                      align="center"
                      className={`text-xs px-2 py-1 ${
                        expired
                          ? "bg-red-600 text-white"
                          : isExpiringSoon
                          ? "bg-yellow-500 text-white"
                          : "bg-green-600 text-white"
                      }`}
                    >
                      {expired
                        ? `Driving License Expired${monthsExpired > 0 ? ` · ${monthsExpired} month${monthsExpired > 1 ? "s" : ""} ago` : " · less than a month ago"}`
                        : isExpiringSoon
                        ? `Driving License Expiring Soon${monthsUntilExpiry > 0 ? ` · ${monthsUntilExpiry} month${monthsUntilExpiry > 1 ? "s" : ""} remaining` : " · less than a month remaining"}`
                        : "Valid Driving License"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}  
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors mb-4"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* ── Summary Cards ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-4">
          {/* Left summary card */}
          <div
            className="rounded-xl p-4 bg-green-50"
            style={{
              border: `1.5px solid hsl(var(--gov-popup-card-border))`,
              
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {config.summaryLeft.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                size={16}
                style={{ color: expired ? "hsl(0 84% 60%)" : "hsl(var(--gov-popup-success))" }}
              />
              <span className="text-sm font-bold text-foreground" style={{ color: expired ? "#dc2626" : "#16a34a" }}>
                {summaryLeftValue}</span>
            </div>
            {config.summaryLeft.label.toLowerCase().includes("expiry") && (
              <p
                className="text-xs font-semibold mt-1"
                style={{
                  color: expired
                  ? "#ef4444"
                  : isExpiringSoon
                  ? "#eab308"
                  : "#22c55e",
                                }}
                              >
                  {expired
                    ? "Expired"
                    : isExpiringSoon
                    ? "Expiring Soon"
                    : "Valid"
                  }
              </p>
            )}
          </div>

          {/* Right summary card */}
          <div
            className="rounded-xl p-4 bg-blue-50"
            style={{
              border: `1.5px solid hsl(var(--gov-popup-card-border))`,
              // background: `hsl(var(--gov-popup-card-bg))`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {config.summaryRight.label}
              </span>
            </div>
            {config.summaryRight.isBadge ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {String(summaryRightValue)
                  .split(",")
                  .map((item: string, index: number) => (
                    <span
                      key={index}
                      className="bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-md"
                    >
                      {item.trim()}
                    </span>
                  ))}
              </div>
            ) : (
              <span className="text-sm font-bold text-foreground">
                {summaryRightValue}
              </span>
            )}
          </div>
        </div>

        {/* ── Document Image Label ────────────────────── */}
        <div className="px-5 pb-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
            Document Image
          </p>
        </div>

        {/* ── Document Card ───────────────────────────── */}
        <div className="mt-1 px-5 pb-6 ">
          <div
            className={`rounded-2xl p-5 relative overflow-hidden ${
              documentType === "pan"
                ? "min-h-[350px]"
                : "min-h-[300px]"
            }`}
            style={{ ...gradientStyles[documentType], fontFamily: "OCR-B, monospace" }}
          >
          
            {/* Diagonal stripe overlay */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.5) 10px, rgba(255,255,255,0.5) 12px)",
              }}
            />

            <div className="relative z-10 ">
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p
                    className="text-[10px] uppercase tracking-[0.2em] mb-0.5"
                    style={{ color: "hsl(var(--gov-popup-highlight))" }}
                  >
                    {config.heading}
                  </p>
                  <p className="text-sm font-bold text-white tracking-wide">
                    {config.subheading}
                  </p>
                  {config.subtitle && (
                    <p className="text-[10px] text-white/60">{config.subtitle}</p>
                  )}
                </div>

                {/* State badge (conditional) */}
                {config.showStateBadge && stateCode && (
                  <div
                    className="flex flex-col items-center justify-center
                              rounded-lg px-4 py-2
                              bg-white/10 backdrop-blur-lg
                              border border-white/25
                              shadow-inner"
                  >
                    <span
                      className="text-xs font-bold tracking-wider"
                      style={{ color: "hsl(var(--gov-popup-highlight))" }}
                    >
                      {stateCode}
                    </span>

                    <span className="text-xs text-white/80 mt-1">
                      {state}
                    </span>
                  </div>
                )}
              </div>

              {/* Uploaded file preview OR structured fields */}
              {uploadedFileUrl ? (
                <div className="mb-3">
                  {fileType === "pdf" ? (
                    <iframe
                      src={uploadedFileUrl}
                      className="w-full rounded-lg"
                      style={{ height: "220px" }}
                      title={config.title}
                    />
                  ) : (
                    <img
                      src={uploadedFileUrl}
                      alt={config.title}
                      className="w-full rounded-lg object-cover"
                      style={{ maxHeight: "220px" }}
                    />
                  )}
                </div>
              ) : (
                <div className="flex gap-4 mb-4">
                  {/* Avatar placeholder */}
                  <div
                    className="flex-shrink-0 w-20 h-24 sm:w-24 sm:h-28 rounded-lg overflow-hidden flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    {data?.profileImage ? (
                    <img
                      src={`data:image/jpeg;base64,${data.profileImage}`}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={30} color="rgba(255,255,255,0.35)" />
                    )}
                  </div>

                  {/* Dynamic fields */}
                  <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {config.fields.map((field) => (
                      <div
                        key={field.key + field.label}
                        className={field.colSpan === 2 ? "col-span-2" : ""}
                      >
                        <FieldLabel>{field.label}</FieldLabel>
                        <FieldValue highlight={field.highlight}>
                            {getValue(field.key, field.fallback)}
                        </FieldValue>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document number + barcode */}
              <div
                className="flex items-end justify-between pt-3 mt-2"
                style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
              >
                <div>
                  <FieldLabel>{config.numberLabel}</FieldLabel>
                  <p className="text-sm font-bold tracking-[0.15em] text-white">{docNumber}</p>
                </div>
                
              </div>
            </div>
          </div>          
        </div>
      
        {/* ── Footer ──────────────────────────────────── */}
     
      {!isViewOnly && (
        <div className="px-5 pb-5 pt-3 border-t">
          {showRejectForm ? (
            <>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reject reason..."
                className="w-full border border-red-400 rounded-md p-2 text-sm mb-3
                focus:outline-none focus:ring-0 focus:border-red-400"
                rows={3}
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectReason('');
                  }}
                  disabled={isRejecting}
                  className="w-[250px] border-gray-400 hover:bg-gray-100"
                >
                  Cancel
                </Button>

                <Button
                  variant="destructive"
                  disabled={isRejecting || !rejectReason.trim()}
                  onClick={() => handleReject(rejectReason)}
                  className="w-[250px]"
                >
                  {isRejecting ? (
                    "Rejecting..."
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Confirm Reject
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                disabled={isRejecting || isApproving}
                onClick={() => setShowRejectForm(true)}
              >
                <X className="w-5 h-5" />
                Reject
              </Button>

              <Button
                className="flex-1   bg-green-600 hover:bg-green-700 text-white"
                disabled={isApproving || isRejecting}
                onClick={handleApprove}
              >
                {isApproving ? (
                  "Approving..."
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 " />
                    Approve
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GovernmentVerificationPopup;