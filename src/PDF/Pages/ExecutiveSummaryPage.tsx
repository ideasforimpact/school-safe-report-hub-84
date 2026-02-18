import { Page, View, Text, Image } from "@react-pdf/renderer";
import { styles } from "../PdfCss";
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
} from "../utils";
import { ReportFooter } from "./ReportFooter";

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
  // ===== Calculations (outside JSX) =====
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
      sub: `${vehicleStats.compliant} of ${vehicleStats.total} vehicles`,
      icon: "/sedanimg.png",
      color: styles.iconBlue,
    },
    {
      name: "Employee Compliance",
      percent: employeeStats.percent,
      sub: `${employeeStats.pending} of ${employeeStats.totalEmployeesdocs} employees`,
      icon: "/userimg.png",
      color: styles.iconGreen,
    },
    {
      name: "Assessment Compliance",
      percent: assessmentStats.percent,
      sub: `${assessmentStats.overdue} of ${assessmentStats.total} assessments`,
      icon: "/checkimg.png",
      color: styles.iconPurple,
    },
    {
      name: "Incident Management",
      percent: incidentStats.percent,
      sub: `${incidentStats.open} of ${incidentStats.total} incidents`,
      icon: "/shieldimg.png",
      color: styles.iconRed,
    },
    {
      name: "Grievance Management",
      percent: grievanceStats.percent,
      sub: `${grievanceStats.pending} of ${grievanceStats.total} grievances`,
      icon: "/messageimg.png",
      color: styles.iconYellow,
    },
  ];

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Monthly Compliance Report</Text>
          <Text style={styles.subtitle}>
            {getReportingPeriodText(month)}
          </Text>
        </View>

        <View style={styles.rightInfo}>
          <Text>REPORT GENERATED</Text>
          <Text>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Executive Summary */}
      <Text style={styles.sectionTitle}>Executive Summary</Text>
      <Text style={styles.sectionSub}>
        Overall compliance status across all modules
      </Text>

      {/* Critical Banner */}
      <View style={styles.criticalBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.criticalTitle}>
            CRITICAL ITEMS REQUIRING IMMEDIATE ACTION
          </Text>
          <Text style={styles.criticalSub}>
            Items below require urgent attention to maintain compliance
          </Text>
        </View>

        <View style={styles.criticalCountBox}>
          <Text style={styles.criticalCount}>{totalCritical}</Text>
          <Text style={styles.criticalCountLabel}>
            TOTAL CRITICAL
          </Text>
        </View>
      </View>

      {/* ===== Row 1 ===== */}
      <View style={styles.dashboardRow}>
        <View style={styles.dashboardCardLarge}>
          <View style={styles.titleRow}>
            <View style={[styles.iconBox, styles.iconBlue]}>
              <Image src="/sedanimg.png" style={styles.dashboardIcon} />
            </View>
            <Text style={styles.dashboardTitle}>Vehicle Documents</Text>
          </View>
          <Text style={styles.dashboardNumber}>{expiredVehicleCount}</Text>
          <Text style={styles.dashboardSub}>Expired certificates</Text>
          <Text style={[styles.pill, styles.statusCritical]}>
            Critical
          </Text>
        </View>

        <View style={styles.dashboardCardLarge}>
          <View style={styles.titleRow}>
            <View style={[styles.iconBox, styles.iconOrange]}>
              <Image src="/circleimg.png" style={styles.dashboardIcon} />
            </View>
            <Text style={styles.dashboardTitle}>Pending Challans</Text>
          </View>
          <Text style={styles.dashboardNumber}>{challans.length}</Text>
          <Text style={styles.dashboardSub}>Vehicles with fines</Text>
          <Text style={[styles.pill, styles.statusWarn]}>
            Rs.{(challanTotal || 0).toLocaleString()} Total
          </Text>
        </View>

        <View style={styles.dashboardCardLarge}>
          <View style={styles.titleRow}>
            <View style={[styles.iconBox, styles.iconGreen]}>
              <Image src="/userimg.png" style={styles.dashboardIcon} />
            </View>
            <Text style={styles.dashboardTitle}>Employee Verification</Text>
          </View>
          <Text style={styles.dashboardNumber}>{pendingEmployees}</Text>
          <Text style={styles.dashboardSub}>Pending verifications</Text>
          <Text style={[styles.pill, styles.statusWarn]}>
            Pending
          </Text>
        </View>
      </View>

      {/* ===== Row 2 ===== */}
      <View style={styles.dashboardRow}>
        <View style={styles.dashboardCardSmall}>
          <View style={styles.titleRow}>
            <View style={[styles.iconBox, styles.iconPurple]}>
              <Image src="/checkimg.png" style={styles.dashboardIcon} />
            </View>
            <Text style={styles.dashboardTitle}>Assessments</Text>
          </View>
          <Text style={styles.dashboardNumber}>{newAssessmentCount}</Text>
          <Text style={styles.dashboardSub}>overdue</Text>
        </View>

        <View style={styles.dashboardCardSmall}>
          <View style={styles.titleRow}>
            <View style={[styles.iconBox, styles.iconRed]}>
              <Image src="/shieldimg.png" style={styles.dashboardIcon} />
            </View>
            <Text style={styles.dashboardTitle}>Open Incidents</Text>
          </View>
          <Text style={styles.dashboardNumber}>{openIncidentCount}</Text>
          <Text style={styles.dashboardSub}>high priority</Text>
        </View>

        <View style={styles.dashboardCardSmall}>
          <View style={styles.titleRow}>
            <View style={[styles.iconBox, styles.iconYellow]}>
              <Image src="/messageimg.png" style={styles.dashboardIcon} />
            </View>
            <Text style={styles.dashboardTitle}>Grievances</Text>
          </View>
          <Text style={styles.dashboardNumber}>{pendingGrievances}</Text>
          <Text style={styles.dashboardSub}>overdue</Text>
        </View>
      </View>

      {/* Module Compliance Table */}
      <Text style={{ marginTop: 10, fontSize: 12 }}>
        Module Compliance Status
      </Text>

      <View style={styles.moduleSectionBox}>
        <View style={styles.moduleHeaderRow}>
          <Text style={{ width: "55%" }}>MODULE</Text>
          <Text style={{ width: "20%", textAlign: "center" }}>
            COMPLIANCE RATE
          </Text>
          <Text style={{ width: "25%", textAlign: "right" }}>
            STATUS
          </Text>
        </View>

        {modules.map((m, i) => {
          const status = getStatusStyle(m.percent);

          return (
            <View key={i} style={styles.moduleDataRow}>
              <View style={styles.moduleLeft}>
                <View style={[styles.moduleIconSmall, m.color]}>
                  <Image src={m.icon} style={styles.dashboardIcon} />
                </View>
                <View>
                  <Text style={styles.moduleName}>{m.name}</Text>
                  <Text style={styles.moduleSubText}>{m.sub}</Text>
                </View>
              </View>

              <Text style={styles.moduleMiddle}>{m.percent}%</Text>

              <View style={styles.moduleRight}>
                <Text style={status.style}>{status.label}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <ReportFooter month={month} />
    </Page>
  );
};
