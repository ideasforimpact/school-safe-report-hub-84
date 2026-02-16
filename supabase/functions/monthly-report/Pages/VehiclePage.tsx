import React from "npm:react@18.2.0";
import { Page, View, Text } from "npm:@react-pdf/renderer@3.4.4";
import { ReportFooter } from "./ReportFooter.tsx";
import {
  getVehicleSummary,
  getDocumentComplianceStats,
  getVehiclesRequiringAction,
  getChallanSummary,
  getDateCellStyle,
} from "../utils.ts";

interface Props {
  month: string;
  vehicles: any[];
  challans: any[];
}

export const VehiclePage = ({ month, vehicles, challans }: Props) => {
  const summary = getVehicleSummary(vehicles);
  const docStats = getDocumentComplianceStats(vehicles);
  const actionVehicles = getVehiclesRequiringAction(vehicles);
  const challanTotal = getChallanSummary(challans);

  const cardBase = {
    flex: 1,
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
  };

  const tableHeader = {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  };

  const tableRow = {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  };

  const cell = {
    fontSize: 8,
    flex: 1,
  };

  return (
    <Page
      size="A4"
      style={{
        padding: 30,
        fontFamily: "Helvetica",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Header */}
      <Text style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 ,borderLeftColor: "#2563EB",borderLeftWidth: 4,paddingLeft: 8}}>
        Vehicle Compliance
      </Text>
      <Text style={{ fontSize: 9, color: "#6B7280", marginBottom: 12 }}>
        Tracking {vehicles.length} vehicles across 3 document types
      </Text>

      {/* Summary Cards */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        <View style={[cardBase, { borderColor: "#E5E7EB" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Total Vehicles</Text>
          <Text style={{ fontSize: 18, fontWeight: 700 }}>{summary.total}</Text>
        </View>

        <View style={[cardBase, { borderColor: "#10B981" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Fully Compliant</Text>
          <Text style={{ fontSize: 18, fontWeight: 700, color: "#10B981" }}>
            {summary.compliant}
          </Text>
          <Text style={{ fontSize: 7, color: "#6B7280" }}>
            All certificates valid
          </Text>
        </View>

        <View style={[cardBase, { borderColor: "#EF4444" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Non-Compliant</Text>
          <Text style={{ fontSize: 18, fontWeight: 700, color: "#EF4444" }}>
            {summary.nonCompliant}
          </Text>
          <Text style={{ fontSize: 7, color: "#6B7280" }}>
            One or more expired
          </Text>
        </View>

        <View style={[cardBase, { borderColor: "#F59E0B" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Expiring Soon</Text>
          <Text style={{ fontSize: 18, fontWeight: 700, color: "#F59E0B" }}>
            {summary.expiringSoon}
          </Text>
          <Text style={{ fontSize: 7, color: "#6B7280" }}>
            Action needed (30 days)
          </Text>
        </View>

        <View style={[cardBase, { borderColor: "#FB923C" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Pending Challans</Text>
          <Text style={{ fontSize: 18, fontWeight: 700, color: "#F97316" }}>
            {challans.length}
          </Text>
          <Text style={{ fontSize: 7, color: "#6B7280" }}>
            Rs.{challanTotal.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Compliance by Document */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 6,
          marginBottom: 14,
          overflow: "hidden",
        }}
      >
        <Text
          style={{
            fontSize: 9,
            fontWeight: 600,
            padding: 8,
            backgroundColor: "#F9FAFB",
          }}
        >
          Compliance by Document Type
        </Text>

        <View style={tableHeader}>
          <Text style={[cell, { flex: 2 }]}>DOCUMENT TYPE</Text>
          <Text style={[cell, { color: "#16A34A" }]}>VALID</Text>
          <Text style={[cell, { color: "#DC2626" }]}>EXPIRED</Text>
          <Text style={[cell, { color: "#D97706" }]}>EXPIRING</Text>
        </View>

        {[
          { name: "Fitness Certificate (FC)", data: docStats.fitness },
          { name: "Insurance Coverage", data: docStats.insurance },
          { name: "Pollution Certificate (PUC)", data: docStats.puc },
        ].map((row, i) => (
          <View key={i} style={tableRow}>
            <Text style={[cell, { flex: 2 }]}>{row.name}</Text>
            <Text style={[cell, { color: "#16A34A" }]}>{row.data.valid}</Text>
            <Text style={[cell, { color: "#DC2626" }]}>{row.data.expired}</Text>
            <Text style={[cell, { color: "#D97706" }]}>{row.data.expiring}</Text>
          </View>
        ))}
      </View>

      {/* Challan Box */}
      <View
        style={{
          borderWidth: 1,
          borderColor: "#FDBA74",
          backgroundColor: "#FFF7ED",
          borderRadius: 6,
          marginBottom: 14,
          overflow: "hidden",
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: 600, padding: 8 }}>
          Pending Traffic Challans
        </Text>

        <View style={tableHeader}>
          <Text style={{ width: "20%", fontSize: 8 }}>VEHICLE</Text>
          <Text style={{ width: "25%", fontSize: 8 }}>OWNER</Text>
          <Text style={{ width: "15%", fontSize: 8 }}>AMOUNT</Text>
          <Text style={{ width: "20%", fontSize: 8 }}>DATE</Text>
          <Text style={{ width: "20%", fontSize: 8 }}>STATUS</Text>
        </View>

        {challans.slice(0, 10).map((c, i) => (
          <View key={i} style={tableRow}>
            <Text style={{ width: "20%", fontSize: 8 }}>
              {c.registration_number}
            </Text>

            <Text style={{ width: "25%", fontSize: 8 }}>
              {c.name}
            </Text>

            <Text style={{ width: "15%", fontSize: 8, color: "#DC2626" }}>
              Rs.{Number(c.amount).toLocaleString()}
            </Text>

            <Text style={{ width: "20%", fontSize: 8 }}>
              {c.date}
            </Text>

            <View style={{ width: "20%", alignItems: "flex-start" }}>
              <View
                style={{
                  backgroundColor: "#FFE7CC",
                  borderRadius: 10,
                  paddingVertical: 2,
                  paddingHorizontal: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 7,
                    color: "#EA580C",
                    fontWeight: 600,
                  }}
                >
                  Pending
                </Text>
              </View>
            </View>
          </View>


        ))}
      </View>

      {/* Action Box */}
      {actionVehicles.length > 0 && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#FACC15",
            backgroundColor: "#FEFCE8",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <Text style={{ fontSize: 9, fontWeight: 600, padding: 8 }}>
            Vehicles Requiring Immediate Action
          </Text>

          <View style={tableHeader}>
            <Text style={cell}>VEHICLE</Text>
            <Text style={cell}>OWNER</Text>
            <Text style={cell}>FC</Text>
            <Text style={cell}>INSURANCE</Text>
            <Text style={cell}>PUC</Text>
          </View>

          {actionVehicles.slice(0, 10).map((v, i) => (
            <View key={i} style={tableRow}>
              <Text style={cell}>{v.vehicleNo}</Text>
              <Text style={cell}>{v.owner}</Text>
              <View style={[cell, getDateCellStyle(v.fc)]}>
                <Text style={{ fontSize: 8 }}>{v.fc || "--"}</Text>
              </View>
              <View style={[cell, getDateCellStyle(v.insurance)]}>
                <Text style={{ fontSize: 8 }}>{v.insurance || "--"}</Text>
              </View>
              <View style={[cell, getDateCellStyle(v.puc)]}>
                <Text style={{ fontSize: 8 }}>{v.puc || "--"}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <ReportFooter month={month} />
    </Page>
  );
};
