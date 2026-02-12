import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { MonthlyReportPDF } from "@/PDF/MonthlyReportPDF";
import {
  fetchVehiclesForReport,
  fetchEmployeesForReport,
  fetchVehicleChallansForReport,
  fetchIncidentsForReport,
  fetchGrievancesForReport,
  getMonthRange,
  fetchEmployeeDocumentsForClient,
  fetchAssessmentsForReport,
  fetchEmployeeDocumentTypes,
} from "@/services/monthly-export/monthlyReport";

interface Props {
  clientId: string;
}

const MonthlyReportDownload = ({ clientId }: Props) => {
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    if (!clientId) return;

    try {
      setLoading(true);

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const { start, end } = getMonthRange(year, month);

      const [
        vehicles,
        employees,
        employeeDocuments,
        assessmentData,
        documentTypes,
        challanData,
        incidents,
        grievances,
      ] = await Promise.all([
        fetchVehiclesForReport(clientId, start, end),
        fetchEmployeesForReport(clientId, start, end),
        fetchEmployeeDocumentsForClient(clientId, start, end),
        fetchAssessmentsForReport(clientId, start, end),
        fetchEmployeeDocumentTypes(),
        fetchVehicleChallansForReport(clientId, start, end),
        fetchIncidentsForReport(clientId, start, end),
        fetchGrievancesForReport(clientId, start, end),
      ]);

      const report = {
        vehicles: vehicles || [],
        employees: employees || [],
        employeeDocuments: employeeDocuments || [],
        challans: challanData?.challans || [],
        challanTotal: challanData?.totalPendingAmount || 0,
        incidents: incidents || [],
        assessmentData: assessmentData || [],
        grievancesSummary: grievances || {},
        documentTypes
      };


      const blob = await pdf(
        <MonthlyReportPDF
          month={new Date(year, month - 1).toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
          vehicles={report.vehicles}
          employees={report.employees}
          employeeDocuments={report.employeeDocuments}
          documentTypes={documentTypes}
          challans={report.challans}
          challanTotal={report.challanTotal}
          incidents={report.incidents}
          assessments={report.assessmentData}
          grievancesSummary={report.grievancesSummary}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Monthly_Report_${year}_${month}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Report generation failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={generateReport}
      disabled={loading}
      className="flex items-center space-x-2"
    >
      <Download className="h-4 w-4" />
      <span>{loading ? "Generating..." : "Generate Report"}</span>
    </Button>
  );
};

export default MonthlyReportDownload;
