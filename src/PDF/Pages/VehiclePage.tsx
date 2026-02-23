import { Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../PdfCss";
import { ReportFooter } from "./ReportFooter";

import {
  getVehicleSummary,
  getDocumentComplianceStats,
  getVehiclesRequiringAction,
  getChallanSummary,
  getDateCellStyle,
} from "../utils";

interface Props {
  month: string;
  vehicles: any[];
  challans: any[];
}

export const VehiclePage = ({ month, vehicles, challans }: Props) => {
  // ===== Calculations outside JSX =====
  const summary = getVehicleSummary(vehicles);
  const docStats = getDocumentComplianceStats(vehicles);
  const actionVehicles = getVehiclesRequiringAction(vehicles);
  const challanTotal = getChallanSummary(challans);

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <Text style={styles.vehicleHeader}>Vehicle Compliance</Text>
      <Text style={styles.vehicleSub}>
        Tracking {vehicles.length} vehicles across 3 document types
      </Text>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Vehicles</Text>
          <Text style={styles.summaryNumber}>{summary.total}</Text>
        </View>

        <View style={[styles.summaryCard, { borderColor: "#10b981" }]}>
          <Text style={styles.summaryTitle}>Fully Compliant</Text>
          <Text style={[styles.summaryNumber, { color: "#10b981" }]}>
            {summary.compliant}
          </Text>
          <Text style={styles.summaryNote}>
            All certificates valid
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderColor: "#ef4444" }]}>
          <Text style={styles.summaryTitle}>Non-Compliant</Text>
          <Text style={[styles.summaryNumber, { color: "#ef4444" }]}>
            {summary.nonCompliant}
          </Text>
          <Text style={styles.summaryNote}>
            One or more expired
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderColor: "#facc15" }]}>
          <Text style={styles.summaryTitle}>Expiring Soon</Text>
          <Text style={[styles.summaryNumber, { color: "#ca8a04" }]}>
            {summary.expiringSoon}
          </Text>
          <Text style={styles.summaryNote}>
            Action needed (30 days)
          </Text>
        </View>

        <View style={[styles.summaryCard, { borderColor: "#f59e0b" }]}>
          <Text style={styles.summaryTitle}>Pending Challans</Text>
          <Text style={[styles.summaryNumber, { color: "#f59e0b" }]}>
            {challans.length}
          </Text>
          <Text style={styles.summaryNote}>
            Total fine amount Rs.{challanTotal.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Compliance by Document Type */}
      <View style={styles.sectionBox}>
        <Text style={styles.sectionHeader}>
          Compliance by Document Type
        </Text>

        <View style={styles.tableHeaderLight}>
          <Text style={styles.tableCell}>DOCUMENT TYPE</Text>
          <Text style={styles.tableCell}>VALID</Text>
          <Text style={styles.tableCell}>EXPIRED</Text>
          <Text style={styles.tableCell}>EXPIRING</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Fitness Certificate</Text>
          <Text style={[styles.tableCell, { color: "#16a34a" }]}>
            {docStats.fitness.valid}
          </Text>
          <Text style={[styles.tableCell, { color: "#dc2626" }]}>
            {docStats.fitness.expired}
          </Text>
          <Text style={[styles.tableCell, { color: "#d97706" }]}>
            {docStats.fitness.expiring}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Insurance</Text>
          <Text style={[styles.tableCell, { color: "#16a34a" }]}>
            {docStats.insurance.valid}
          </Text>
          <Text style={[styles.tableCell, { color: "#dc2626" }]}>
            {docStats.insurance.expired}
          </Text>
          <Text style={[styles.tableCell, { color: "#d97706" }]}>
            {docStats.insurance.expiring}
          </Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>
            Pollution Certificate (PUC)
          </Text>
          <Text style={[styles.tableCell, { color: "#16a34a" }]}>
            {docStats.puc.valid}
          </Text>
          <Text style={[styles.tableCell, { color: "#dc2626" }]}>
            {docStats.puc.expired}
          </Text>
          <Text style={[styles.tableCell, { color: "#d97706" }]}>
            {docStats.puc.expiring}
          </Text>
        </View>
      </View>

      {/* Challans */}
      <View style={styles.challanBox}>
        <Text style={{ fontSize: 10, marginBottom: 4 }}>
          Pending Traffic Challans
        </Text>

        <Text style={{ fontSize: 8, marginBottom: 6 }}>
          {challans.length} pending challans across vehicles • Total fine amount Rs.
          {challanTotal.toLocaleString()}
        </Text>

        <View style={styles.tableHeaderLight}>
          <Text style={styles.tableCell}>VEHICLE NO</Text>
          <Text style={styles.tableCell}>OWNER</Text>
          <Text style={styles.tableCell}>CHALLAN TYPE</Text>
          <Text style={styles.tableCell}>FINE AMOUNT</Text>
          <Text style={styles.tableCell}>CHALLAN DATE</Text>
          <Text style={styles.tableCell}>STATUS</Text>
        </View>

        {challans.slice(0, 8).map((c, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.tableCell}>{c.registration_number}</Text>
            <Text style={styles.tableCell}>{c.name}</Text>
            <Text style={styles.tableCell}>{c.challan_number}</Text>
            <Text style={[styles.tableCell, styles.amountRed]}>
              Rs.{Number(c.amount).toLocaleString()}
            </Text>
            <Text style={styles.tableCell}>{c.date}</Text>
            <Text style={[styles.tableCell, styles.statusPill]}>
              Pending
            </Text>
          </View>
        ))}
      </View>

      {/* Vehicles Requiring Action */}
      <View style={styles.actionBox}>
        <Text style={{ fontSize: 10, marginBottom: 4 }}>
          Vehicles Requiring Immediate Action
        </Text>

        <Text style={{ fontSize: 8, marginBottom: 6 }}>
          {actionVehicles.length} vehicles with expired or soon-to-expire documents
        </Text>

        <View style={styles.tableHeader}>
          <Text style={styles.tableCell}>VEHICLE NO.</Text>
          <Text style={styles.tableCell}>OWNER</Text>
          <Text style={styles.tableCell}>FC EXPIRY</Text>
          <Text style={styles.tableCell}>INSURANCE EXPIRY</Text>
          <Text style={styles.tableCell}>PUC EXPIRY</Text>
        </View>

        {actionVehicles.slice(0, 10).map((v, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.tableCell}>{v.vehicleNo}</Text>
            <Text style={styles.tableCell}>{v.owner}</Text>

            <View style={[styles.tableCellBox, getDateCellStyle(v.fc)]}>
              <Text style={{ fontSize: 8 }}>{v.fc || "--"}</Text>
            </View>

            <View style={[styles.tableCellBox, getDateCellStyle(v.insurance)]}>
              <Text style={{ fontSize: 8 }}>{v.insurance || "--"}</Text>
            </View>

            <View style={[styles.tableCellBox, getDateCellStyle(v.puc)]}>
              <Text style={{ fontSize: 8 }}>{v.puc || "--"}</Text>
            </View>
          </View>
        ))}
      </View>

      <ReportFooter month={month} />
    </Page>
  );
};
