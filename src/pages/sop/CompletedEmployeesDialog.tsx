import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, CheckCircle2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: any[];
  sopTitle?: string;
}

const CompletedEmployeesDialog = ({
  open,
  onOpenChange,
  employees,
  sopTitle,
}: Props) => {
  // Color variants for avatar initials
  const colorVariants = [
    "bg-emerald-100 text-emerald-700 ring-emerald-200",
    "bg-teal-100 text-teal-700 ring-teal-200",
    "bg-green-100 text-green-700 ring-green-200",
    "bg-cyan-100 text-cyan-700 ring-cyan-200",
    "bg-lime-100 text-lime-700 ring-lime-200",
  ];

  const getInitials = (name: string) => {
    const parts = name?.trim().split(" ") ?? [];
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name?.slice(0, 2).toUpperCase() ?? "??";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 overflow-hidden border-0 shadow-2xl"
        style={{
          maxWidth: "640px",
          borderRadius: "20px",
          background: "linear-gradient(145deg, #ffffff 0%, #f8fdf9 100%)",
          boxShadow:
            "0 32px 64px -12px rgba(0,0,0,0.14), 0 0 0 1px rgba(16,185,129,0.08)",
          fontFamily: "'DM Sans', 'Nunito', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div
          className="relative px-7 pt-7 pb-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(209,250,229,0.5) 0%, rgba(255,255,255,0) 60%)",
            borderBottom: "1px solid rgba(16,185,129,0.1)",
          }}
        >
          {/* Decorative circle */}
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.07] pointer-events-none"
            style={{
              background: "radial-gradient(circle, #10b981, transparent 70%)",
              transform: "translate(30%, -30%)",
            }}
          />

          <div className="flex items-start justify-between">
            {/* Left */}
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-11 h-11 rounded-2xl"
                style={{
                  background: "linear-gradient(135deg, #6ee7b7, #34d399)",
                  boxShadow: "0 4px 14px rgba(52,211,153,0.4)",
                }}
              >
                <Users size={20} className="text-white" strokeWidth={2.2} />
              </div>

              <div>
                <h2
                  className="text-xl font-bold leading-tight"
                  style={{ color: "#0f2d1f", letterSpacing: "-0.3px" }}
                >
                  Employees
                </h2>

                {sopTitle && (
                  <p className="text-xs mt-0.5" style={{ color: "#6b8f7a" }}>
                    {sopTitle}
                  </p>
                )}
              </div>
            </div>

            {/* Right count badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: "rgba(52,211,153,0.12)",
                color: "#059669",
                border: "1px solid rgba(52,211,153,0.25)",
              }}
            >
              <CheckCircle2 size={13} strokeWidth={2.5} />
              {employees.length} Employees
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-5">
          {employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,0.08)" }}
              >
                <Users size={20} style={{ color: "#9dbfac" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "#9dbfac" }}>
                No employees found
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[320px] pr-1">
              <div className="flex flex-wrap gap-2.5">
                {employees.map((emp, i) => {
                  const colorClass =
                    colorVariants[i % colorVariants.length];

                  return (
                    <div
                      key={emp.id}
                      className="group flex items-center gap-2 px-3 py-2 rounded-full cursor-default"
                      style={{
                        background: "rgba(209,250,229,0.55)",
                        border: "1.5px solid rgba(52,211,153,0.2)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {/* Avatar initials */}
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold ring-1 flex-shrink-0 ${colorClass}`}
                      >
                        {getInitials(emp.full_name ?? "")}
                      </div>

                      {/* Name */}
                      <span
                        className="text-sm font-medium leading-none"
                        style={{ color: "#155742" }}
                      >
                        {emp.full_name} ({emp.email})
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompletedEmployeesDialog;
