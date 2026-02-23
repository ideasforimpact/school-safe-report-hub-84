import { Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../PdfCss";
import { ReportFooter } from "./ReportFooter";
import {
  getIncidentStats,
  getIncidentCategorySummary,
  getCriticalIncidents,
  getIndividualsFromIncidents,
  getReportingPeriodText,
} from "../utils";

interface Props {
  month: string;
  incidents: any[];
}

export const IncidentPage = ({ month, incidents }: Props) => {
  // ===== Calculations outside JSX =====
  const stats = getIncidentStats(incidents);
  const categories = getIncidentCategorySummary(incidents);
  const critical = getCriticalIncidents(incidents);
  const individuals = getIndividualsFromIncidents(incidents);

  const overdueCount = critical.filter(
    (i: any) =>
      i.incident_status?.name?.toLowerCase() === "overdue"
  ).length;

  const inProgressCount = critical.filter(
    (i: any) =>
      i.incident_status?.name?.toLowerCase() === "in progress"
  ).length;

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.incidentHeaderRow}>
        <Text style={styles.incidentHeader}>
          Incident Management
        </Text>
      </View>

      <Text style={styles.incidentSub}>
        Tracking {stats.total} reported incidents
      </Text>

      {/* KPI Cards */}
      <View style={styles.incidentSummaryRow}>
        <View style={styles.incidentCard}>
          <Text style={styles.incidentCardTitle}>
            TOTAL INCIDENTS
          </Text>
          <Text style={styles.incidentCardNumber}>
            {stats.total}
          </Text>
        </View>

        <View style={styles.incidentCard}>
          <Text style={styles.incidentCardTitle}>CLOSED</Text>
          <Text style={styles.incidentCardNumber}>
            {stats.closed}
          </Text>
          <Text style={styles.incidentBadgeGreen}>
            Resolved
          </Text>
        </View>

        <View style={styles.incidentCard}>
          <Text style={styles.incidentCardTitle}>
            IN PROGRESS
          </Text>
          <Text style={styles.incidentCardNumber}>
            {stats.inProgress}
          </Text>
          <Text style={styles.incidentBadgeYellow}>
            Active
          </Text>
        </View>

        <View style={styles.incidentCard}>
          <Text style={styles.incidentCardTitle}>
            RESOLUTION RATE
          </Text>
          <Text style={styles.incidentCardNumber}>
            {stats.resolutionRate}%
          </Text>
          <Text style={styles.incidentBadgePurple}>
            {stats.resolutionRate}% Rate
          </Text>
        </View>
      </View>

      {/* Category Table */}
      <Text style={{ fontSize: 10, marginTop: 6 }}>
        Incidents by Category
      </Text>

      <View style={styles.incidentTable}>
        <View style={styles.incidentTableHeader}>
          <Text style={styles.incidentCol1}>CATEGORY</Text>
          <Text style={styles.incidentCol}>TOTAL</Text>
          <Text style={styles.incidentCol}>CLOSED</Text>
          <Text style={styles.incidentCol}>IN PROGRESS</Text>
          <Text style={styles.incidentCol}>OPEN</Text>
        </View>

        {categories.map((c: any, i: number) => (
          <View key={i} style={styles.incidentTableRow}>
            <Text style={styles.incidentCol1}>{c.name}</Text>
            <Text style={styles.incidentCol}>{c.total}</Text>
            <Text style={[styles.incidentCol, { color: "#16a34a" }]}>
              {c.closed}
            </Text>
            <Text style={[styles.incidentCol, { color: "#d97706" }]}>
              {c.progress}
            </Text>
            <Text style={[styles.incidentCol, { color: "#dc2626" }]}>
              {c.open}
            </Text>
          </View>
        ))}
      </View>

      {/* Individuals Section */}
      {individuals.length > 0 && (
        <View style={styles.studentSectionBox}>
          <Text style={styles.studentSectionTitle}>
            Individuals Involved in{" "}
            {getReportingPeriodText(month)} Incidents
          </Text>

          <Text style={styles.studentSectionSub}>
            Students and staff members involved in reported incidents this month
          </Text>

          <View style={styles.studentTableHeader}>
            <Text style={styles.colStudentName}>NAME</Text>
            <Text style={styles.colStudentGrade}>
              GRADE/ROLE
            </Text>
            <Text style={styles.colStudentTitle}>
              INCIDENT TYPE
            </Text>
            <Text style={styles.colStudentCategory}>
              CATEGORY
            </Text>
            <Text style={styles.colStudentDate}>DATE</Text>
          </View>

          {individuals.slice(0, 10).map((p: any, i: number) => (
            <View key={i} style={styles.studentRow}>
              <Text style={styles.colStudentName}>{p.name}</Text>
              <Text style={styles.colStudentGrade}>{p.grade}</Text>
              <Text style={styles.colStudentTitle}>{p.title}</Text>
              <Text style={styles.colStudentCategory}>{p.category}</Text>
              <Text style={styles.colStudentDate}>
                {p.date
                  ? new Date(p.date).toLocaleDateString()
                  : "-"}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Critical Section */}
      {critical.length > 0 && (
        <View style={styles.criticalIncidentBox}>
          <Text style={styles.incidentHeader}>
            Critical & Overdue Incidents
          </Text>

          <Text style={styles.incidentSub}>
            {overdueCount} overdue, {inProgressCount} in progress
          </Text>

          <View style={styles.incidentTableHeader}>
            <Text style={styles.colIncidentTitle}>
              INCIDENT TYPE
            </Text>
            <Text style={styles.colIncidentCategory}>
              CATEGORY
            </Text>
            <Text style={styles.colIncidentDate}>
              REPORTED DATE
            </Text>
            <Text style={styles.colIncidentStatus}>
              STATUS
            </Text>
            <Text style={styles.colIncidentSeverity}>
              SEVERITY
            </Text>
          </View>

          {critical.slice(0, 6).map((inc: any, idx: number) => {
            const status =
              inc.incident_status?.name?.toLowerCase() || "";
            const severity =
              inc.incident_priorities?.name?.toLowerCase() || "";

            const statusStyle =
              status === "overdue"
                ? styles.statusOverdueIncident
                : status === "in progress"
                ? styles.statusInProgress
                : styles.statusOpen;

            const severityStyle =
              severity === "high"
                ? styles.severityHigh
                : styles.severityMedium;

            return (
              <View key={idx} style={styles.incidentRow}>
                <Text style={styles.colIncidentTitle}>
                  {inc.incident_report_types?.name || "-"}
                </Text>

                <Text style={styles.colIncidentCategory}>
                  {inc.incident_categories?.name || "-"}
                </Text>

                <Text style={styles.colIncidentDate}>
                  {inc.reported_date
                    ? new Date(
                        inc.reported_date
                      ).toLocaleDateString()
                    : inc.created_at
                    ? new Date(
                        inc.created_at
                      ).toLocaleDateString()
                    : "-"}
                </Text>

                <View style={styles.colIncidentStatus}>
                  <Text style={statusStyle}>
                    {inc.incident_status?.name || "-"}
                  </Text>
                </View>

                <View style={styles.colIncidentSeverity}>
                  <Text style={severityStyle}>
                    {inc.incident_priorities?.name || "-"}
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
