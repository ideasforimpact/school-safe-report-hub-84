import React from "npm:react@18.2.0";
import { Page, View, Text } from "npm:@react-pdf/renderer@3.4.4";
import { styles } from "../PdfCss.tsx";
import { ReportFooter } from "./ReportFooter.tsx";
import {
  getAssessmentByCategory,
  getAssessmentStats,
} from "../utils.ts";

interface Props {
  month: string;
  assessments: any[];
  assessmentsTotalCount?: number;
}

export const AssessmentPage = ({ month, assessments, assessmentsTotalCount }: Props) => {
  const stats = getAssessmentStats(assessments);
  const categories = getAssessmentByCategory(assessments);
  const totalA = assessmentsTotalCount ?? stats.total;
  const showCapNote = totalA > assessments.length;

  const pendingStatuses = ["New", "Draft"];
  const pendingList = assessments.filter((a: any) =>
    pendingStatuses.includes(a.status)
  );

  return (
    <Page size="A4" style={{
      paddingTop: 30,
      paddingHorizontal: 30,
      paddingBottom: 70,
      fontFamily: "Helvetica",
      backgroundColor: "#FFFFFF"
    }}>
      <View style={styles.assessmentHeaderRow}>
        <Text style={styles.assessmentHeader}>
          Assessment Compliance
        </Text>
      </View>

      <Text style={styles.assessmentSub}>
        Progress on {totalA} scheduled assessments
        {showCapNote ? ` (showing latest ${assessments.length} in this report)` : ""}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        {/* TOTAL ASSESSMENTS */}
        <View
          style={{
            width: "32%",
            backgroundColor: "#f9fafb",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            padding: 14,
            minHeight: 80,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 6 }}>
            TOTAL ASSESSMENTS
          </Text>

          <Text style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            {totalA}
          </Text>
        </View>

        {/* COMPLETED */}
        <View
          style={{
            width: "32%",
            backgroundColor: "#f9fafb",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            padding: 14,
            minHeight: 80,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 6 }}>
            COMPLETED
          </Text>

          <Text style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            {stats.completed}
          </Text>

          <Text
            style={{
              marginTop: 6,
              backgroundColor: "#d1fae5",
              color: "#065f46",
              fontSize: 9,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 9999,
              alignSelf: "flex-start",
            }}
          >
            On Track
          </Text>
        </View>

        {/* COMPLETION RATE */}
        <View
          style={{
            width: "32%",
            backgroundColor: "#f9fafb",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            padding: 14,
            minHeight: 80,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 7, color: "#6b7280", marginBottom: 6 }}>
            COMPLETION RATE
          </Text>

          <Text style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>
            {stats.rate}%
          </Text>

          <Text
            style={{
              marginTop: 6,
              backgroundColor: "#ede9fe",
              color: "#6d28d9",
              fontSize: 9,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 9999,
              alignSelf: "flex-start",
            }}
          >
            {stats.rate}% Rate
          </Text>
        </View>
      </View>

      <View
        style={{
          marginTop: 10,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
          backgroundColor: "#ffffff",
        }}
      >
        {/* Header strip */}
        <View
          style={{
            backgroundColor: "#f3f4f6",
            paddingVertical: 8,
            paddingHorizontal: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
            Assessment Summary by Type
          </Text>
        </View>

        {/* Column header */}
        <View
          style={{
            flexDirection: "row",
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#e5e7eb",
            backgroundColor: "#ffffff",
          }}
        >
          <Text style={{ width: "35%", fontSize: 8, color: "#6b7280" }}>
            CATEGORY
          </Text>
          <Text style={{ width: "13%", fontSize: 8, color: "#6b7280" }}>
            TOTAL
          </Text>
          <Text style={{ width: "13%", fontSize: 8, color: "#059669" }}>
            COMPLETED
          </Text>
          <Text style={{ width: "13%", fontSize: 8, color: "#2563eb" }}>
            SUBMITTED
          </Text>
          <Text style={{ width: "13%", fontSize: 8, color: "#d97706" }}>
            PENDING
          </Text>
          <Text style={{ width: "13%", fontSize: 8, color: "#dc2626" }}>
            OVERDUE
          </Text>
        </View>

        {/* Rows */}
        {categories.map((c: any, i: number) => (
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
            <Text style={{ width: "35%", fontSize: 9, color: "#111827" }}>
              {c.name}
            </Text>

            <Text style={{ width: "13%", fontSize: 9, color: "#374151" }}>
              {c.total}
            </Text>

            <Text style={{ width: "13%", fontSize: 9, color: "#059669", fontWeight: 600 }}>
              {c.completed}
            </Text>

            <Text style={{ width: "13%", fontSize: 9, color: "#2563eb", fontWeight: 600 }}>
              {c.submitted}
            </Text>
            <Text style={{ width: "13%", fontSize: 9, color: "#d97706", fontWeight: 600 }}>
              {c.inProgress}
            </Text>

            <Text style={{ width: "13%", fontSize: 9, color: "#dc2626", fontWeight: 600 }}>
              {c.overdue}
            </Text>
          </View>
        ))}
      </View>


      {pendingList.length > 0 && (
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
              Pending & Overdue Assessments
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
             {stats.inProgress} pending, {stats.overdue} overdue
            </Text>
          </View>

          {/* Column header */}
          <View
            style={{
              flexDirection: "row",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#fecaca",
            }}
          >
            <Text style={{ width: "30%", fontSize: 8, color: "#6b7280" }}>
              ASSESSMENT NAME
            </Text>
            <Text style={{ width: "15%", fontSize: 8, color: "#6b7280" }}>
              TYPE
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              ASSIGNED TO
            </Text>
            <Text style={{ width: "15%", fontSize: 8, color: "#6b7280" }}>
              DUE DATE
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              STATUS
            </Text>
          </View>

          {/* Rows */}
          {pendingList.map((a: any, i: number) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const targetDate = new Date(a.target_completion_date);
            targetDate.setHours(0, 0, 0, 0);

            const isOverdue = targetDate < today;

            return (
              <View
                key={i}
                style={{
                  flexDirection: "row",
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: "#fecaca",
                }}
              >
                <Text style={{ width: "30%", fontSize: 9, color: "#111827" }}>
                  {a.name}
                </Text>

                <Text style={{ width: "15%", fontSize: 9, color: "#374151" }}>
                  {a.assessment_templates?.title}
                </Text>

                <Text style={{ width: "20%", fontSize: 9, color: "#374151" }}>
                  {a.employees?.first_name}
                </Text>

                <Text style={{ width: "15%", fontSize: 9, color: "#374151" }}>
                  {a.target_completion_date
                    ? new Date(a.target_completion_date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    : "-"}
                </Text>

                <View style={{ width: "20%", alignItems: "flex-start" }}>
                  <Text
                    style={{
                      backgroundColor: isOverdue ? "#fee2e2" : "#e5e7eb",
                      color: isOverdue ? "#b91c1c" : "#374151",
                      fontSize: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    {isOverdue ? "Overdue" : a.status}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}



      <ReportFooter month={month} />
    </Page>
  );
};

