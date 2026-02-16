import React from "npm:react@18.2.0";
import { Page, View, Text } from "npm:@react-pdf/renderer@3.4.4";
import { styles } from "../PdfCss.tsx";
import { ReportFooter } from "./ReportFooter.tsx";
import { getPendingEmployeesGrouped } from "../utils.ts";

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

  const submittedEmployeeIds = new Set(
    employeeDocuments.map((d: any) => d.employee_id)
  );

  const noDocumentEmployees = employees.filter(
    (emp: any) => !submittedEmployeeIds.has(emp.id)
  );

  const pendingList =
    pendingEmployees > 0
      ? getPendingEmployeesGrouped(employeeDocuments)
      : [];

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.employeeHeaderRow}>
        <Text style={styles.employeeHeader}>Employee Compliance</Text>
      </View>

      <Text style={styles.employeeSub}>
        Verification status for {totalEmployees} employees
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
          marginBottom: 12,
        }}
      >
        {/* TOTAL EMPLOYEES */}
        <View
          style={{
            width: "24%",
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 10,
            padding: 10,
            minHeight: 70,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 4 }}>
            TOTAL EMPLOYEES
          </Text>

          <Text style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
            {totalEmployees}
          </Text>
        </View>

        {/* VERIFIED */}
        <View
          style={{
            width: "24%",
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 10,
            padding: 10,
            minHeight: 70,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 4 }}>
            VERIFIED
          </Text>

          <Text style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
            {verifiedEmployees}
          </Text>

          <Text
            style={{
              marginTop: 4,
              backgroundColor: "#d1fae5",
              color: "#065f46",
              fontSize: 7,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              alignSelf: "flex-start",
            }}
          >
            {verifiedEmployees} Verified
          </Text>
        </View>

        {/* VERIFICATION RATE */}
        <View
          style={{
            width: "24%",
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 10,
            padding: 10,
            minHeight: 70,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 4 }}>
            VERIFICATION RATE
          </Text>

          <Text style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
            {verificationRate}%
          </Text>

          <Text
            style={{
              marginTop: 4,
              backgroundColor: "#d1fae5",
              color: "#065f46",
              fontSize: 7,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              alignSelf: "flex-start",
            }}
          >
            {verificationRate >= 90
              ? "High Compliance"
              : verificationRate >= 70
                ? "Needs Attention"
                : "Critical"}
          </Text>
        </View>

        {/* NO DOCUMENTS */}
        <View
          style={{
            width: "24%",
            backgroundColor: "#ffffff",
            borderWidth: 1,
            borderColor: "#fca5a5",
            borderRadius: 10,
            padding: 10,
            minHeight: 70,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 4 }}>
            NO DOCUMENTS
          </Text>

          <Text style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
            {noDocumentEmployees.length}
          </Text>

          <Text
            style={{
              marginTop: 4,
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              fontSize: 7,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 6,
              alignSelf: "flex-start",
            }}
          >
            No submissions
          </Text>
        </View>
      </View>


      <View
        style={{
          marginTop: 8,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Title Bar */}
        <View
          style={{
            backgroundColor: "#f3f4f6",
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Verification Summary
          </Text>
        </View>

        {/* Column Header */}
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
          }}
        >
          <Text style={{ width: "50%", fontSize: 8, color: "#6b7280" }}>
            TYPE
          </Text>

          <Text
            style={{
              width: "25%",
              fontSize: 8,
              color: "#059669",
              fontWeight: 600,
            }}
          >
            COMPLIANT
          </Text>

          <Text
            style={{
              width: "25%",
              fontSize: 8,
              color: "#dc2626",
              fontWeight: 600,
            }}
          >
            PENDING
          </Text>
        </View>

        {/* Rows */}
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
            <View
              key={i}
              style={{
                flexDirection: "row",
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
            >
              <Text style={{ width: "50%", fontSize: 8, color: "#111827" }}>
                {type.description}
              </Text>

              <Text
                style={{
                  width: "25%",
                  fontSize: 8,
                  color: "#059669",
                  fontWeight: 600,
                }}
              >
                {compliant}
              </Text>

              <Text
                style={{
                  width: "25%",
                  fontSize: 8,
                  color: "#dc2626",
                  fontWeight: 600,
                }}
              >
                {pending}
              </Text>
            </View>
          );
        })}
      </View>


      {pendingEmployees > 0 && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: "#fffbeb",
            borderWidth: 1,
            borderColor: "#fde68a",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Title Section */}
          <View
            style={{
              backgroundColor: "#fef3c7",
              paddingVertical: 8,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#fde68a",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: 600, color: "#92400e" }}>
              Pending Verifications
            </Text>
          </View>

          {/* Sub text */}
          <View style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
            <Text style={{ fontSize: 8, color: "#6b7280" }}>
              {pendingEmployees} employees require verification action
            </Text>
          </View>

          {/* Column Header */}
          <View
            style={{
              flexDirection: "row",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderTopWidth: 1,
              borderTopColor: "#fffbeb",
            }}
          >
            <Text style={{ width: "30%", fontSize: 8, color: "#6b7280" }}>
              EMPLOYEE NAME
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              EMPLOYEE ID
            </Text>
            <Text style={{ width: "50%", fontSize: 8, color: "#6b7280" }}>
              REASON(S)
            </Text>
          </View>

          {/* Rows */}
          {pendingList.slice(0, 8).map((emp: any, i: number) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderTopWidth: 1,
                borderTopColor: "#fde68a",
              }}
            >
              <Text style={{ width: "30%", fontSize: 8, color: "#111827" }}>
                {emp.name}
              </Text>

              <Text style={{ width: "20%", fontSize: 8, color: "#374151" }}>
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
                  <Text
                    key={idx}
                    style={{
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                      fontSize: 7,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      marginRight: 4,
                      marginBottom: 4,
                    }}
                  >
                    {r}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}


      {noDocumentEmployees.length > 0 && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: "#fef2f2",
            borderWidth: 1,
            borderColor: "#fca5a5",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Header strip */}
          <View
            style={{
              backgroundColor: "#fee2e2",
              paddingVertical: 8,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#fecaca",
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: 600, color: "#374151" }}>
              Employees with No Documents Submitted
            </Text>
          </View>

          {/* Sub text */}
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: "#fecaca",
            }}
          >
            <Text style={{ fontSize: 8, color: "#6b7280" }}>
              {noDocumentEmployees.length} employees have not submitted any documents since being added
            </Text>
          </View>

          {/* Table header */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#ffffff80",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#fdf0f0",
            }}
          >
            <Text style={{ width: "35%", fontSize: 8, color: "#6b7280" }}>
              EMPLOYEE NAME
            </Text>
            <Text style={{ width: "25%", fontSize: 8, color: "#6b7280" }}>
              EMPLOYEE ID
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              DATE ADDED
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              STATUS
            </Text>
          </View>

          {/* Rows */}
          {noDocumentEmployees.slice(0, 8).map((emp: any, i: number) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                paddingVertical: 8,
                paddingHorizontal: 8,
                borderBottomWidth: 1,
                borderBottomColor: "#fdf0f0",
                backgroundColor: "#ffffff80",
              }}
            >
              <Text style={{ width: "35%", fontSize: 8, color: "#111827" }}>
                {emp.first_name} {emp.last_name}
              </Text>

              <Text style={{ width: "25%", fontSize: 8, color: "#374151" }}>
                {emp.employee_id}
              </Text>

              <Text style={{ width: "20%", fontSize: 8, color: "#374151" }}>
                {emp.joining_date
                  ? new Date(emp.joining_date).toLocaleDateString()
                  : "-"}
              </Text>

              <View style={{ width: "20%", alignItems: "flex-start" }}>
                <Text
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#b91c1c",
                    fontSize: 7,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  No Documents
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}


      <ReportFooter month={month} />
    </Page>
  );
};

