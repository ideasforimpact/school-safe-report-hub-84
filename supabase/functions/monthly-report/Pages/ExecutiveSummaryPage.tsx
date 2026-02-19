import React from "npm:react@18.2.0";
import { Page, View, Text, StyleSheet, Svg, Path, Circle } from "npm:@react-pdf/renderer@3.4.4";
import {
  getAssessmentCompliance,
  getEmployeeCompliance,
  getExpiredVehicleDocsCount,
  getGrievanceCompliance,
  getIncidentCompliance,
  getNewAssessmentCount,
  getOpenIncidentCount,
  getPendingGrievanceCount,
  getReportingPeriodText,
  getStatusStyle,
  getVehicleCompliance,
} from "../utils.ts";
import { ReportFooter } from "./ReportFooter.tsx";

// Use built-in Helvetica everywhere – closest default to Inter, no external loading.
const HEADER_FONT = "Helvetica";

const ICON_SIZE = 20;
const SMALL_ICON_SIZE = 16;
const iconStyle = (size: number) => ({
  width: size,
  height: size,
  marginRight: 8,
});

// Six SVG icons for summary cards (outline style, 24x24 viewBox).
const CardIcons = {
  vehicle: (color: string, size: number = ICON_SIZE) => (
    <Svg viewBox="0 0 24 24" style={iconStyle(size)}>
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  ),
  challan: (color: string, size: number = ICON_SIZE) => (
    <Svg viewBox="0 0 24 24" style={iconStyle(size)}>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M12 8v4M12 16h.01" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </Svg>
  ),
  user: (color: string, size: number = ICON_SIZE) => (
    <Svg viewBox="0 0 24 24" style={iconStyle(size)}>
      <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  ),
  assessment: (color: string, size: number = ICON_SIZE) => (
    <Svg viewBox="0 0 24 24" style={iconStyle(size)}>
      <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2L9 5z" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  ),
  incident: (color: string, size: number = ICON_SIZE) => (
    <Svg viewBox="0 0 24 24" style={iconStyle(size)}>
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M12 6v6l4 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      <Path d="M12 17h.01" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
    </Svg>
  ),
  grievance: (color: string, size: number = ICON_SIZE) => (
    <Svg viewBox="0 0 24 24" style={iconStyle(size)}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={color} strokeWidth={1.5} fill="none" />
    </Svg>
  ),
};

const headerStyles = StyleSheet.create({
  title: {
    fontFamily: HEADER_FONT,
    fontSize: 32,
    fontWeight: 700,
  },
  subtitle: {
    fontFamily: HEADER_FONT,
    fontSize: 14,
    fontWeight: 400,
    color: "#6B7280",
    marginBottom: 10,
  },
});

interface Props {
  month: string;
  vehicles: any[];
  employees: any[];
  employeeDocuments: any[];
  challans: any[];
  assessments: any[];
  incidents: any[];
  grievancesSummary: any[];
  challanTotal: number;
}

export const ExecutiveSummaryPage = ({
  month,
  vehicles,
  employees,
  employeeDocuments,
  challans,
  assessments,
  incidents,
  grievancesSummary,
  challanTotal,
}: Props) => {
  const expiredVehicleCount = getExpiredVehicleDocsCount(vehicles);
  const pendingEmployees = employeeDocuments.filter(
    (d: any) => d.verification_status !== "verified"
  ).length;
  const newAssessmentCount = getNewAssessmentCount(assessments);
  const openIncidentCount = getOpenIncidentCount(incidents);
  const pendingGrievances = getPendingGrievanceCount(grievancesSummary);

  const vehicleStats = getVehicleCompliance(vehicles);
  const employeeStats = getEmployeeCompliance(employees, employeeDocuments);
  const assessmentStats = getAssessmentCompliance(assessments);
  const incidentStats = getIncidentCompliance(incidents);
  const grievanceStats = getGrievanceCompliance(grievancesSummary);

  const totalCritical =
    expiredVehicleCount +
    challans.length +
    pendingEmployees +
    newAssessmentCount +
    openIncidentCount +
    pendingGrievances;

  const modules = [
    {
      name: "Vehicle Compliance",
      percent: vehicleStats.percent,
      sub: `${vehicleStats.nonCompliant} of ${vehicleStats.total} vehicles`,
      icon: "vehicle" as const,
      iconColor: "#2563EB",
    },
    {
      name: "Employee Compliance",
      percent: employeeStats.percent,
      sub: `${employeeStats.compliant} of ${employeeStats.totalEmployeesdocs} employees documents`,
      icon: "user" as const,
      iconColor: "#10B981",
    },
    {
      name: "Assessment Compliance",
      percent: assessmentStats.percent,
      sub: `${assessmentStats.compliant} of ${assessmentStats.total} assessments`,
      icon: "assessment" as const,
      iconColor: "#7C3AED",
    },
    {
      name: "Incident Management",
      percent: incidentStats.percent,
      sub: `${incidentStats.compliant} of ${incidentStats.total} incidents`,
      icon: "incident" as const,
      iconColor: "#DC2626",
    },
    {
      name: "Grievance Management",
      percent: grievanceStats.percent,
      sub: `${grievanceStats.compliant} of ${grievanceStats.total} grievances`,
      icon: "grievance" as const,
      iconColor: "#F97316",
    },
  ];

  return (
    <Page
      size="A4"
      style={{
        padding: 30,
        backgroundColor: "#FFFFFF",
        fontFamily: "Helvetica",
      }}
    >
      {/* Header — edit headerStyles above to match original */}
      <Text style={headerStyles.title}>Executive Summary</Text>
      <Text style={headerStyles.subtitle}>{getReportingPeriodText(month)}  Compliance Overview</Text>

      <View
        style={{
          height: 1,
          backgroundColor: "#E5E7EB",
          marginBottom: 20,
        }}
      />

      {/* Critical Banner */}
      {/* <View
        style={{
          backgroundColor: "#FEF2F2",
          borderRadius: 6,
          padding: 24,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "#FEE2E2",
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#881337",
              marginBottom: 4,
            }}
          >
            CRITICAL ITEMS REQUIRING IMMEDIATE ACTION
          </Text>
          <Text style={{ fontSize: 9, color: "#991B1B" }}>
            Items below require urgent attention to maintain compliance
          </Text>
        </View>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 6,
            paddingVertical: 14,
            paddingHorizontal: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#FEE2E2",
          }}
        >
          <Text
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#DC2626",
            }}
          >
            {totalCritical}
          </Text>
          <Text
            style={{
              fontSize: 8,
              fontWeight: 600,
              color: "#6B7280",
            }}
          >
            TOTAL CRITICAL
          </Text>
        </View>
      </View> */}

      {/* Large Cards Row */}
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 14 }}>
        {[
          {
            title: "Vehicle Documents",
            value: expiredVehicleCount,
            sub: "Expired certificates",
            badge: { text: "Critical", bg: "#FFE4E6", color: "#9F1239" },
            icon: "vehicle" as const,
            iconColor: "#2563EB",
          },
          {
            title: "Pending Challans",
            value: challans.length,
            sub: "Vehicles with fines",
            badge: {
              text: `Rs.${(challanTotal || 0).toLocaleString()} Total`,
              bg: "#FEF3C7",
              color: "#92400E",
            },
            icon: "challan" as const,
            iconColor: "#F97316",
          },
          {
            title: "Employee Verification",
            value: pendingEmployees,
            sub: "Pending verifications",
            badge: {
              text: "Pending",
              bg: "#FFE4E6",
              color: "#9F1239",
            },
            icon: "user" as const,
            iconColor: "#10B981",
          },
        ].map((card, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 6,
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              {CardIcons[card.icon](card.iconColor)}
              <Text style={{ fontSize: 11, fontWeight: 400 }}>
                {card.title}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              {card.value}
            </Text>

            <Text
              style={{
                fontSize: 9,
                color: "#6B7280",
                marginBottom: 6,
              }}
            >
              {card.sub}
            </Text>

            {/* Divider */}
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
                marginBottom: 8,
                width: "100%",
              }}
            />

            <View
              style={{
                backgroundColor: card.badge.bg,
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 12,
                alignSelf: "flex-start",
              }}
            >
              <Text
                style={{
                  fontSize: 8,
                  color: card.badge.color,
                  fontWeight: 600,
                }}
              >
                {card.badge.text}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Small Cards Row */}
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 20 }}>
        {[
          { title: "Assessments", value: newAssessmentCount, sub: "Pending & Overdue", icon: "assessment" as const, iconColor: "#7C3AED" },
          { title: "Open Incidents", value: openIncidentCount, sub: "All Priority", icon: "incident" as const, iconColor: "#DC2626" },
          { title: "Grievances", value: pendingGrievances, sub: "pending", icon: "grievance" as const, iconColor: "#F97316" },
        ].map((card, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 6,
              padding: 14,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
              {CardIcons[card.icon](card.iconColor)}
              <Text style={{ fontSize: 11, fontWeight: 400 }}>
                {card.title}
              </Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 700 }}>
              {card.value}
            </Text>
            <Text style={{ fontSize: 9, color: "#6B7280" }}>
              {card.sub}
            </Text>
          </View>
        ))}
      </View>

      {/* Module Compliance */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        Module Compliance Status
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 6,
        }}
      >
        {modules.map((m, i) => {
          const status = getStatusStyle(m.percent);
          return (
            <View
              key={i}
              style={{
                flexDirection: "row",
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderBottomWidth: i === modules.length - 1 ? 0 : 1,
                borderBottomColor: "#F3F4F6",
                alignItems: "center",
              }}
            >
              <View style={{ width: "55%", flexDirection: "row", alignItems: "center" }}>
                {CardIcons[m.icon](m.iconColor, SMALL_ICON_SIZE)}
                <View>
                  <Text style={{ fontSize: 10, fontWeight: 700 }}>
                    {m.name}
                  </Text>
                  <Text style={{ fontSize: 8, color: "#6B7280" }}>
                    {m.sub}
                  </Text>
                </View>
              </View>

              <Text
                style={{
                  width: "20%",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {m.percent}%
              </Text>

              <View style={{ width: "25%", alignItems: "flex-end" }}>
                <View
                  style={{
                    ...status.style,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontSize: 8, fontWeight: 400 }}>
                    {status.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      <ReportFooter month={month} />
    </Page>
  );
};
