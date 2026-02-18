import React from "react";
import { useSearchParams } from "react-router-dom";
import MonthlyReportDownload from "@/components/reports/MonthlyReportDownload";

const MonthlyReportAutoDownloadPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId") || "";

  if (!clientId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-red-600">
          Missing clientId in URL. Please contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p className="mb-4 text-sm text-gray-600">
        Your monthly report is being generated and will download shortly. You can
        close this tab after the download starts.
      </p>
      <MonthlyReportDownload clientId={clientId} autoDownload hideButton />
    </div>
  );
};

export default MonthlyReportAutoDownloadPage;

