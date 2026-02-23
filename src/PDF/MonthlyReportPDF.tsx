import { Document } from "@react-pdf/renderer";
import { ExecutiveSummaryPage } from "./Pages/ExecutiveSummaryPage";
import { VehiclePage } from "./Pages/VehiclePage";
import { EmployeePage } from "./Pages/EmployeePage";
import { AssessmentPage } from "./Pages/AssessmentPage";
import { IncidentPage } from "./Pages/IncidentPage";
import { GrievancePage } from "./Pages/GrievancePage";



interface Props {
  month: string;
  vehicles: any[];
  employees: any[];
  employeeDocuments: any[];
  challans: any[];
  incidents: any[];
  challanTotal: number;
  assessments: any[];
  documentTypes: any[];
  grievancesSummary: any;
}

export const MonthlyReportPDF = ({
  month,
  vehicles,
  employees,
  challans,
  incidents,
  assessments,
  challanTotal,
  employeeDocuments,
  grievancesSummary,
  documentTypes,
}: Props) => {
  return (
    <Document>
      {/* 1. Executive Summary */}
      <ExecutiveSummaryPage
        month={month}
        vehicles={vehicles}
        employees={employees}
        employeeDocuments={employeeDocuments}
        challans={challans}
        assessments={assessments}
        incidents={incidents}
        grievancesSummary={grievancesSummary}
        challanTotal={challanTotal}
      />

      {/* 2. Vehicle Page */}
      <VehiclePage
        month={month}
        vehicles={vehicles}
        challans={challans}
      />

      {/* 3. Employee Page */}
      <EmployeePage
        month={month}
        employees={employees}
        employeeDocuments={employeeDocuments}
        documentTypes={documentTypes}
      />

      {/* 4. Assessment Page */}
      <AssessmentPage
        month={month}
        assessments={assessments}
      />

      {/* 5. Incident Page */}
      <IncidentPage
        month={month}
        incidents={incidents}
      />

      {/* 6. Grievance Page */}
      <GrievancePage
        month={month}
        grievancesSummary={grievancesSummary}
      />
    </Document>
  );
};
