import { Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../PdfCss";
import { ReportFooter } from "./ReportFooter";
import { getPendingEmployeesGrouped } from "../utils";

interface Props {
  month: string;
  employees: any[];
  employeeDocuments: any[];
  documentTypes: any[];
}

export const EmployeePage = ({
  month,
  employees,
  employeeDocuments,
  documentTypes,
}: Props) => {
  // ===== Calculations (outside JSX) =====
  const totalEmployees = employees.length;

  const verifiedEmployees = employeeDocuments.filter(
    (d: any) => d.verification_status === "verified"
  ).length;

  const pendingEmployees = employeeDocuments.filter(
    (d: any) => d.verification_status !== "verified"
  ).length;

  const verificationRate =
    totalEmployees === 0
      ? 100
      : Math.round((verifiedEmployees / totalEmployees) * 100);

  // Employees who submitted at least one document
  const submittedEmployeeIds = new Set(
    employeeDocuments.map((d: any) => d.employee_id)
  );

  // Employees with no documents
  const noDocumentEmployees = employees.filter(
    (emp: any) => !submittedEmployeeIds.has(emp.id)
  );

  // Pending grouped list
  const pendingList =
    pendingEmployees > 0
      ? getPendingEmployeesGrouped(employeeDocuments)
      : [];

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.employeeHeaderRow}>
        <Text style={styles.employeeHeader}>Employee Compliance</Text>
      </View>

      <Text style={styles.employeeSub}>
        Verification status for {totalEmployees} employees
      </Text>

      {/* ===== KPI Cards ===== */}
      <View style={styles.employeeSummaryRow}>
        <View style={styles.employeeCard}>
          <Text style={styles.employeeCardTitle}>TOTAL EMPLOYEES</Text>
          <Text style={styles.employeeCardNumber}>{totalEmployees}</Text>
        </View>

        <View style={styles.employeeCard}>
          <Text style={styles.employeeCardTitle}>VERIFIED</Text>
          <Text style={styles.employeeCardNumber}>{verifiedEmployees}</Text>
          <Text style={styles.employeeBadge}>
            {verifiedEmployees} Verified
          </Text>
        </View>

        <View style={styles.employeeCard}>
          <Text style={styles.employeeCardTitle}>VERIFICATION RATE</Text>
          <Text style={styles.employeeCardNumber}>
            {verificationRate}%
          </Text>
          <Text style={styles.employeeBadge}>
            {verificationRate >= 90
              ? "High Compliance"
              : verificationRate >= 70
              ? "Needs Attention"
              : "Critical"}
          </Text>
        </View>
      </View>

      {/* ===== Verification Summary ===== */}
      <Text style={{ marginTop: 6, fontSize: 10 }}>
        Verification Summary
      </Text>

      <View style={styles.employeeTable}>
        <View style={styles.employeeTableHeader}>
          <Text style={styles.employeeColType}>TYPE</Text>
          <Text style={styles.employeeColCompliant}>COMPLIANT</Text>
          <Text style={styles.employeeColPending}>PENDING</Text>
        </View>

        {documentTypes.map((type: any, i: number) => {
          const compliant = employeeDocuments.filter(
            (d: any) =>
              d.document_type_id === type.id &&
              d.verification_status === "verified"
          ).length;

          const pending = employeeDocuments.filter(
            (d: any) =>
              d.document_type_id === type.id &&
              d.verification_status !== "verified"
          ).length;

          return (
            <View key={i} style={styles.employeeTableRow}>
              <Text style={styles.employeeColType}>
                {type.description}
              </Text>
              <Text style={styles.employeeColCompliant}>
                {compliant}
              </Text>
              <Text style={styles.employeeColPending}>
                {pending}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ===== Pending Employees ===== */}
      {pendingEmployees > 0 && (
        <View style={styles.pendingBox}>
          <Text style={styles.pendingTitle}>
            Pending Verifications
          </Text>

          <Text style={styles.pendingSub}>
            {pendingEmployees} employees require verification action
          </Text>

          <View style={styles.tableHeaderLight}>
            <Text style={{ width: "30%", fontSize: 8 }}>
              EMPLOYEE NAME
            </Text>
            <Text style={{ width: "20%", fontSize: 8 }}>
              EMPLOYEE ID
            </Text>
            <Text style={{ width: "50%", fontSize: 8 }}>
              REASON(S)
            </Text>
          </View>

          {pendingList.slice(0, 8).map((emp: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "30%", fontSize: 8 }}>
                {emp.name}
              </Text>

              <Text style={{ width: "20%", fontSize: 8 }}>
                {emp.id}
              </Text>

              <View
                style={{
                  width: "50%",
                  flexDirection: "row",
                  flexWrap: "wrap",
                }}
              >
                {emp.reasons.map((r: string, idx: number) => (
                  <Text key={idx} style={styles.pendingPill}>
                    {r}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ===== No Document Employees ===== */}
      {noDocumentEmployees.length > 0 && (
        <View style={styles.noDocBox}>
          <Text style={styles.noDocTitle}>
            Employees with No Documents Submitted
          </Text>

          <Text style={styles.noDocSub}>
            {noDocumentEmployees.length} employees have not submitted any
            documents since being added
          </Text>

          <View style={styles.tableHeaderLight}>
            <Text style={{ width: "35%", fontSize: 8 }}>
              EMPLOYEE NAME
            </Text>
            <Text style={{ width: "25%", fontSize: 8 }}>
              EMPLOYEE ID
            </Text>
            <Text style={{ width: "20%", fontSize: 8 }}>
              JOINING DATE
            </Text>
            <Text style={{ width: "20%", fontSize: 8 }}>
              STATUS
            </Text>
          </View>

          {noDocumentEmployees.slice(0, 8).map((emp: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "35%", fontSize: 8 }}>
                {emp.first_name} {emp.last_name}
              </Text>

              <Text style={{ width: "25%", fontSize: 8 }}>
                {emp.employee_id}
              </Text>

              <Text style={{ width: "20%", fontSize: 8 }}>
                {emp.joining_date
                  ? new Date(emp.joining_date).toLocaleDateString()
                  : "-"}
              </Text>

              <View style={{ width: "20%" }}>
                <Text style={styles.noDocPill}>No Documents</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <ReportFooter month={month} />
    </Page>
  );
};
