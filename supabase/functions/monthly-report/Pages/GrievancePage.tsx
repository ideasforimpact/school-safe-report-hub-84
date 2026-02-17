import React from "npm:react@18.2.0";
import { Page, View, Text } from "npm:@react-pdf/renderer@3.4.4";
import { styles } from "../PdfCss.tsx";
import { ReportFooter } from "./ReportFooter.tsx";
import {
  getGrievanceStats,
  getGrievanceSourceSummary,
  getCriticalGrievances,
} from "../utils.ts";

interface Props {
  month: string;
  grievancesSummary: any[];
}

export const GrievancePage = ({
  month,
  grievancesSummary,
}: Props) => {
  const stats = getGrievanceStats(grievancesSummary);
  const sources = getGrievanceSourceSummary(grievancesSummary);
  const critical = getCriticalGrievances(grievancesSummary);

  return (
    <Page size="A4" style={{
      paddingTop: 30,
      paddingHorizontal: 30,
      paddingBottom: 70,
      fontFamily: "Helvetica",
      backgroundColor: "#FFFFFF"
    }}>
      <View style={styles.grievanceHeaderRow}>
        <Text style={styles.grievanceHeader}>
          Grievance Management
        </Text>
      </View>

      <Text style={styles.grievanceSub}>
        Tracking and resolution of {stats.total} grievances
      </Text>

      <View style={styles.grievanceSummaryRow}>
        <View style={styles.grievanceCard}>
          <Text style={styles.grievanceCardTitle}>
            TOTAL GRIEVANCES
          </Text>
          <Text style={styles.grievanceCardNumber}>
            {stats.total}
          </Text>
        </View>

        <View style={styles.grievanceCard}>
          <Text style={styles.grievanceCardTitle}>
            ADDRESSED
          </Text>
          <Text style={styles.grievanceCardNumber}>
            {stats.addressed}
          </Text>
          <Text style={styles.grievanceBadgeGreen}>
            Resolved
          </Text>
        </View>

        <View style={styles.grievanceCard}>
          <Text style={styles.grievanceCardTitle}>
            PENDING
          </Text>
          <Text style={styles.grievanceCardNumber}>
            {stats.pending}
          </Text>
          <Text style={styles.grievanceBadgeYellow}>
            Action Needed
          </Text>
        </View>

        <View style={styles.grievanceCard}>
          <Text style={styles.grievanceCardTitle}>
            RESOLUTION RATE
          </Text>
          <Text style={styles.grievanceCardNumber}>
            {stats.resolutionRate}%
          </Text>
          <Text style={styles.grievanceBadgePurple}>
            {stats.resolutionRate}% Rate
          </Text>
        </View>
      </View>

      <View
        wrap={false}
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
            Grievances by Source
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
          <Text style={{ width: "40%", fontSize: 8, color: "#6b7280" }}>
            SOURCE
          </Text>

          <Text style={{ width: "15%", fontSize: 8, color: "#6b7280" }}>
            TOTAL
          </Text>

          <Text style={{ width: "15%", fontSize: 8, color: "#059669" }}>
            ADDRESSED
          </Text>

          <Text style={{ width: "15%", fontSize: 8, color: "#d97706" }}>
            PENDING
          </Text>

          <Text style={{ width: "15%", fontSize: 8, color: "#dc2626" }}>
            OVERDUE
          </Text>
        </View>

        {/* Rows */}
        {sources.map((s: any, i: number) => (
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
            <Text style={{ width: "40%", fontSize: 9, color: "#111827" }}>
              {s.name}
            </Text>

            <Text style={{ width: "15%", fontSize: 9, color: "#374151" }}>
              {s.total}
            </Text>

            <Text
              style={{
                width: "15%",
                fontSize: 9,
                color: "#059669",
                fontWeight: 600,
              }}
            >
              {s.addressed}
            </Text>

            <Text
              style={{
                width: "15%",
                fontSize: 9,
                color: "#d97706",
                fontWeight: 600,
              }}
            >
              {s.pending}
            </Text>

            <Text
              style={{
                width: "15%",
                fontSize: 9,
                color: "#dc2626",
                fontWeight: 600,
              }}
            >
              {s.overdue}
            </Text>
          </View>
        ))}
      </View>


      {critical.length > 0 && (
        <View
          wrap={false}
          style={{
            marginTop: 12,
            backgroundColor: "#fef2f2",
            borderWidth: 1,
            borderColor: "#fecaca",
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
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#7f1d1d" }}>
              Pending & Overdue Grievances
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
              {stats.pending} pending
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
              SUBMITTED BY
            </Text>
            <Text style={{ width: "15%", fontSize: 8, color: "#6b7280" }}>
              TITLE
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              RAISED BY
            </Text>
            <Text style={{ width: "15%", fontSize: 8, color: "#6b7280" }}>
              DATE RAISED
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              STATUS
            </Text>
          </View>

          {/* Rows */}
          {critical.slice(0, 8).map((g: any, i: number) => {
            const isOverdue =
              g.status?.toLowerCase() === "pending" &&
              g.due_date &&
              new Date(g.due_date) < new Date();
            
            return (
              <View
                wrap={false}
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
                  {g.responses?.subject || "Not provided"}
                </Text>

                <Text style={{ width: "15%", fontSize: 9, color: "#374151" }}>
                  {g.submitter_type}
                </Text>

                <Text style={{ width: "20%", fontSize: 9, color: "#374151" }}>
                  {g.submitter_name || "-"}
                </Text>

                <Text style={{ width: "15%", fontSize: 9, color: "#374151" }}>
                  {g.created_at
                    ? new Date(g.created_at).toLocaleDateString()
                    : "-"}
                </Text>

                <View style={{ width: "20%", alignItems: "flex-start" }}>
                  <Text
                    style={{
                      fontSize: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: isOverdue ? "#fee2e2" : "#e5e7eb",
                      color: isOverdue ? "#b91c1c" : "#374151",
                      fontWeight: 600,
                    }}
                  >
                    {isOverdue ? "Overdue" : "Pending"}
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

