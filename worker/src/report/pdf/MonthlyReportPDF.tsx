import React from "react";
import { Document } from "@react-pdf/renderer";
import { ExecutiveSummaryPage } from "./Pages/ExecutiveSummaryPage.js";
import { VehiclePage } from "./Pages/VehiclePage.js";
import { EmployeePage } from "./Pages/EmployeePage.js";
import { AssessmentPage } from "./Pages/AssessmentPage.js";
import { IncidentPage } from "./Pages/IncidentPage.js";
import { GrievancePage } from "./Pages/GrievancePage.js";

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

