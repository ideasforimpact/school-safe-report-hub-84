import React from "npm:react@18.2.0";
import { Document } from "npm:@react-pdf/renderer@3.4.4";
import { ExecutiveSummaryPage } from "./Pages/ExecutiveSummaryPage.tsx";
import { VehiclePage } from "./Pages/VehiclePage.tsx";
import { EmployeePage } from "./Pages/EmployeePage.tsx";
import { AssessmentPage } from "./Pages/AssessmentPage.tsx";
import { IncidentPage } from "./Pages/IncidentPage.tsx";
import { GrievancePage } from "./Pages/GrievancePage.tsx";

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
  grievancesSummary: any[];
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
      <VehiclePage
        month={month}
        vehicles={vehicles}
        challans={challans}
      />
      <EmployeePage
        month={month}
        employees={employees}
        employeeDocuments={employeeDocuments}
        documentTypes={documentTypes}
      />
      <AssessmentPage
        month={month}
        assessments={assessments}
      />
      <IncidentPage
        month={month}
        incidents={incidents}
      />
      <GrievancePage
        month={month}
        grievancesSummary={grievancesSummary}
      />
    </Document>
  );
};

