import { Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../PdfCss";
import { ReportFooter } from "./ReportFooter";
import {
  getGrievanceStats,
  getGrievanceSourceSummary,
  getCriticalGrievances,
} from "../utils";

interface Props {
  month: string;
  grievancesSummary: any[];
}

export const GrievancePage = ({
  month,
  grievancesSummary,
}: Props) => {
  // ===== Calculations outside JSX =====
  const stats = getGrievanceStats(grievancesSummary);
  const sources = getGrievanceSourceSummary(grievancesSummary);
  const critical = getCriticalGrievances(grievancesSummary);

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.grievanceHeaderRow}>
        <Text style={styles.grievanceHeader}>
          Grievance Management
        </Text>
      </View>

      <Text style={styles.grievanceSub}>
        Tracking and resolution of {stats.total} grievances
      </Text>

      {/* KPI Cards */}
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

      {/* Source Table */}
      <Text style={{ fontSize: 10, marginTop: 6 }}>
        Grievances by Source
      </Text>

      <View style={styles.grievanceTable}>
        <View style={styles.grievanceTableHeader}>
          <Text style={styles.grievanceColSource}>SOURCE</Text>
          <Text style={styles.grievanceCol}>TOTAL</Text>
          <Text style={[styles.grievanceCol, { color: "#16a34a" }]}>
            ADDRESSED
          </Text>
          <Text style={[styles.grievanceCol, { color: "#d97706" }]}>
            PENDING
          </Text>
          <Text style={[styles.grievanceCol, { color: "#dc2626" }]}>
            OVERDUE
          </Text>
        </View>

        {sources.map((s: any, i: number) => (
          <View key={i} style={styles.grievanceTableRow}>
            <Text style={styles.grievanceColSource}>{s.name}</Text>
            <Text style={styles.grievanceCol}>{s.total}</Text>
            <Text style={[styles.grievanceCol, { color: "#16a34a" }]}>
              {s.addressed}
            </Text>
            <Text style={[styles.grievanceCol, { color: "#d97706" }]}>
              {s.pending}
            </Text>
            <Text style={[styles.grievanceCol, { color: "#dc2626" }]}>
              {s.overdue}
            </Text>
          </View>
        ))}
      </View>

      {/* Critical Section */}
      {critical.length > 0 && (
        <View style={styles.criticalGrievanceBox}>
          <Text style={styles.criticalHeader}>
            Pending & Overdue Grievances
          </Text>

          <Text style={styles.criticalSub}>
            {stats.overdue} overdue, {stats.pending} pending
          </Text>

          {/* Header */}
          <View style={styles.criticalTableHeader}>
            <Text style={styles.colTitle}>SUBMITTED BY</Text>
            <Text style={styles.colRaised}>TITLE</Text>
            <Text style={styles.colType}>RAISED BY</Text>
            <Text style={styles.colDate}>DATE RAISED</Text>
            <Text style={styles.colStatus}>STATUS</Text>
          </View>

          {critical.slice(0, 8).map((g: any, i: number) => {
            const isOverdue =
              g.status?.toLowerCase() === "pending" &&
              g.due_date &&
              new Date(g.due_date) < new Date();

            return (
              <View key={i} style={styles.criticalRow}>
                <Text style={styles.colTitle}>
                  {g.submitter_name || "Anonymous"}
                </Text>

                <Text style={styles.colRaised}>
                  {g.responses?.subject || "Not provided"}
                </Text>

                <Text style={styles.colType}>
                  {g.submitter_type || "-"}
                </Text>

                <Text style={styles.colDate}>
                  {g.created_at
                    ? new Date(g.created_at).toLocaleDateString()
                    : "-"}
                </Text>

                <View style={styles.colStatus}>
                  <Text
                    style={
                      isOverdue
                        ? styles.statusOverdue
                        : styles.statusPending
                    }
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
