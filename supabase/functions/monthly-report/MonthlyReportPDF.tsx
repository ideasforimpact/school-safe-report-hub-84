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
  vehiclesTotalCount?: number;
  employees: any[];
  employeesTotalCount?: number;
  employeeDocuments: any[];
  employeeDocumentsTotalCount?: number;
  challans: any[];
  incidents: any[];
  incidentsTotalCount?: number;
  challanTotal: number;
  assessments: any[];
  assessmentsTotalCount?: number;
  documentTypes: any[];
  grievancesSummary: any[];
  grievancesTotalCount?: number;
}

export const MonthlyReportPDF = ({
  month,
  vehicles,
  vehiclesTotalCount,
  employees,
  employeesTotalCount,
  employeeDocuments,
  employeeDocumentsTotalCount,
  challans,
  incidents,
  incidentsTotalCount,
  challanTotal,
  assessments,
  assessmentsTotalCount,
  grievancesSummary,
  grievancesTotalCount,
  documentTypes,
}: Props) => {
  return (
    <Document>
      <ExecutiveSummaryPage
        month={month}
        vehicles={vehicles}
        vehiclesTotalCount={vehiclesTotalCount}
        employees={employees}
        employeesTotalCount={employeesTotalCount}
        employeeDocuments={employeeDocuments}
        employeeDocumentsTotalCount={employeeDocumentsTotalCount}
        challans={challans}
        assessments={assessments}
        assessmentsTotalCount={assessmentsTotalCount}
        incidents={incidents}
        incidentsTotalCount={incidentsTotalCount}
        grievancesSummary={grievancesSummary}
        grievancesTotalCount={grievancesTotalCount}
        challanTotal={challanTotal}
      />
      <VehiclePage
        month={month}
        vehicles={vehicles}
        vehiclesTotalCount={vehiclesTotalCount}
        challans={challans}
      />
      <EmployeePage
        month={month}
        employees={employees}
        employeesTotalCount={employeesTotalCount}
        employeeDocuments={employeeDocuments}
        employeeDocumentsTotalCount={employeeDocumentsTotalCount}
        documentTypes={documentTypes}
      />
      <AssessmentPage
        month={month}
        assessments={assessments}
        assessmentsTotalCount={assessmentsTotalCount}
      />
      <IncidentPage
        month={month}
        incidents={incidents}
        incidentsTotalCount={incidentsTotalCount}
      />
      <GrievancePage
        month={month}
        grievancesSummary={grievancesSummary}
        grievancesTotalCount={grievancesTotalCount}
      />
    </Document>
  );
};

