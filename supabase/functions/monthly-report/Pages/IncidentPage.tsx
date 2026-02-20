import React from "npm:react@18.2.0";
import { Page, View, Text } from "npm:@react-pdf/renderer@3.4.4";
import { styles } from "../PdfCss.tsx";
import { ReportFooter } from "./ReportFooter.tsx";
import {
  getIncidentStats,
  getIncidentCategorySummary,
  getCriticalIncidents,
  getIndividualsFromIncidents,
  getReportingPeriodText,
} from "../utils.ts";

interface Props {
  month: string;
  incidents: any[];
}

export const IncidentPage = ({ month, incidents }: Props) => {
  const stats = getIncidentStats(incidents);
  const categories = getIncidentCategorySummary(incidents);
  const critical = getCriticalIncidents(incidents);
  const individuals = getIndividualsFromIncidents(incidents);

  const inProgressCount = critical.filter(
    (i: any) =>
      i.incident_status?.name?.toLowerCase() === "in progress"
  ).length;

  return (
    <Page size="A4" style={{
      paddingTop: 30,
      paddingHorizontal: 30,
      paddingBottom: 70,
      fontFamily: "Helvetica",
      backgroundColor: "#FFFFFF"
    }}>
      <View style={styles.incidentHeaderRow}>
        <Text style={styles.incidentHeader}>
          Incident Management
        </Text>
      </View>

      <Text style={styles.incidentSub}>
        Tracking {stats.total} reported incidents
      </Text>

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
            Open
          </Text>
          <Text style={styles.incidentCardNumber}>
            {stats.open}
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
            Incidents by Category
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
            CATEGORY
          </Text>
          <Text style={{ width: "15%", fontSize: 8, color: "#6b7280" }}>
            TOTAL
          </Text>
          <Text style={{ width: "15%", fontSize: 8, color: "#059669" }}>
            CLOSED
          </Text>
          <Text style={{ width: "15%", fontSize: 8, color: "#dc2626" }}>
            OPEN
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
            <Text style={{ width: "40%", fontSize: 9, color: "#111827" }}>
              {c.name}
            </Text>

            <Text style={{ width: "15%", fontSize: 9, color: "#374151" }}>
              {c.total}
            </Text>

            <Text
              style={{
                width: "15%",
                fontSize: 9,
                color: "#059669",
                fontWeight: 600,
              }}
            >
              {c.closed}
            </Text>

            <Text
              style={{
                width: "15%",
                fontSize: 9,
                color: "#dc2626",
                fontWeight: 600,
              }}
            >
              {c.open}
            </Text>
          </View>
        ))}
      </View>


      {individuals.length > 0 && (
        <View
          style={{
            marginTop: 12,
            backgroundColor: "#f8fafc",
            borderWidth: 1,
            borderColor: "#93c5fd",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {/* Header strip */}
          <View
            style={{
              backgroundColor: "#e0f2fe",
              paddingVertical: 8,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#bfdbfe",
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#1e40af" }}>
              Individuals Involved in Incidents
            </Text>
          </View>

          {/* Sub text */}
          <View
            style={{
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#bfdbfe",
            }}
          >
            <Text style={{ fontSize: 8, color: "#6b7280" }}>
              Students and staff members involved in reported incidents
            </Text>
          </View>

          {/* Table header */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "#f1f5f9",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#e5e7eb",
            }}
          >
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              NAME
            </Text>
            <Text style={{ width: "18%", fontSize: 8, color: "#6b7280" }}>
              GRADE/ROLE
            </Text>
            <Text style={{ width: "27%", fontSize: 8, color: "#6b7280" }}>
              INCIDENT TITLE
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              CATEGORY
            </Text>
            <Text style={{ width: "15%", fontSize: 8, color: "#6b7280" }}>
              DATE
            </Text>
          </View>

          {/* Rows */}
          {individuals.map((p: any, i: number) => {
            const isStudent =
              !(p.grade && p.grade.toLowerCase().includes("staff"));
            const breakText = (text?: string | null, length: number = 12): string => {
              if (!text) return "";
              return text.match(new RegExp(`.{1,${length}}`, "g"))?.join("\n") || "";
            };

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
                <Text style={{ width: "20%", fontSize: 9, color: "#111827" }}>
                  {p.name}
                </Text>

                {/* Grade / Role pill */}
                <View
                  style={{
                    width: "18%",
                    alignItems: "flex-start",
                  }}
                >
                  <View
                    style={{
                      backgroundColor: isStudent ? "#dbeafe" : "#e5e7eb",
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      maxWidth: "100%",
                    }}
                  >
                    <Text
                      style={{
                        color: isStudent ? "#1d4ed8" : "#374151",
                        fontSize: 8,
                      }}
                    >
                      {breakText(p.grade)}
                    </Text>
                  </View>
                </View>

                <Text style={{ width: "27%", fontSize: 9, color: "#374151" }}>
                  {p.title}
                </Text>

                <Text style={{ width: "20%", fontSize: 9, color: "#374151" }}>
                  {p.category}
                </Text>

                <Text style={{ width: "15%", fontSize: 9, color: "#374151" }}>
                  {p.date
                    ? new Date(p.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    : "-"}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {critical.length > 0 && (
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
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
              Critical Incidents
            </Text>
          </View>

          {/* Sub text */}
          <View
            style={{
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#fecaca",
            }}
          >
            <Text style={{ fontSize: 8, color: "#6b7280" }}>
              {critical.length} open incidents
            </Text>
          </View>

          {/* Table header */}
          <View
            style={{
              flexDirection: "row",
              paddingVertical: 6,
              paddingHorizontal: 8,
              borderBottomWidth: 1,
              borderBottomColor: "#fecaca",
            }}
          >
            <Text style={{ width: "28%", fontSize: 8, color: "#6b7280" }}>
              INCIDENT TITLE
            </Text>
            <Text style={{ width: "20%", fontSize: 8, color: "#6b7280" }}>
              CATEGORY
            </Text>
            <Text style={{ width: "18%", fontSize: 8, color: "#6b7280" }}>
              REPORTED DATE
            </Text>
            <Text style={{ width: "17%", fontSize: 8, color: "#6b7280" }}>
              STATUS
            </Text>
            <Text style={{ width: "17%", fontSize: 8, color: "#6b7280" }}>
              SEVERITY
            </Text>
          </View>

          {/* Rows */}
          {critical.map((inc: any, idx: number) => {
            const status =
              inc.incident_status?.name?.toLowerCase() || "";
            const severity =
              inc.incident_priorities?.name?.toLowerCase() || "";

            // Status colors
            let statusBg = "#e5e7eb";
            let statusColor = "#374151";

            if (status === "overdue") {
              statusBg = "#fee2e2";
              statusColor = "#b91c1c";
            } else if (status === "in progress") {
              statusBg = "#fef3c7";
              statusColor = "#92400e";
            }

            // Severity colors
            let severityBg = "#fef3c7";
            let severityColor = "#92400e";

            if (severity === "high") {
              severityBg = "#fee2e2";
              severityColor = "#b91c1c";
            }

            return (
              <View
                key={idx}
                style={{
                  flexDirection: "row",
                  paddingVertical: 8,
                  paddingHorizontal: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: "#fecaca",
                }}
              >
                <Text style={{ width: "28%", fontSize: 9, color: "#111827" }}>
                  {inc.incident_report_types?.name || "-"}
                </Text>

                <Text style={{ width: "20%", fontSize: 9, color: "#374151" }}>
                  {inc.incident_categories?.name || "-"}
                </Text>

                <Text style={{ width: "18%", fontSize: 9, color: "#374151" }}>
                  {inc.date
                    ? new Date(inc.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    : "-"}
                </Text>

                {/* Status pill */}
                <View style={{ width: "17%", alignItems: "flex-start" }}>
                  <Text
                    style={{
                      backgroundColor: statusBg,
                      color: statusColor,
                      fontSize: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    {inc.incident_status?.name || "-"}
                  </Text>
                </View>

                {/* Severity pill */}
                <View style={{ width: "17%", alignItems: "flex-start" }}>
                  <Text
                    style={{
                      backgroundColor: severityBg,
                      color: severityColor,
                      fontSize: 8,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
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

