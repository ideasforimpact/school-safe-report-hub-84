import React from "npm:react@18.2.0";
import { Page, View, Text, Svg, Path, Circle } from "npm:@react-pdf/renderer@3.4.4";
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

const SECTION_ICON_SIZE = 10;

const sectionIconStyle = {
  width: SECTION_ICON_SIZE,
  height: SECTION_ICON_SIZE,
  marginRight: 6,
};

const InfoIcon = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" style={sectionIconStyle}>
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} fill="none" />
    <Path d="M12 10v6" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M12 8h.01" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const WarningIcon = ({ color }: { color: string }) => (
  <Svg viewBox="0 0 24 24" style={sectionIconStyle}>
    <Path
      d="M12 3L3 19h18L12 3z"
      stroke={color}
      strokeWidth={1.5}
      fill="none"
      strokeLinejoin="round"
    />
    <Path d="M12 9v5" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    <Path d="M12 16h.01" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

export const VehiclePage = ({ month, vehicles, challans }: Props) => {
  const summary = getVehicleSummary(vehicles);
  const docStats = getDocumentComplianceStats(vehicles);
  const actionVehicles = getVehiclesRequiringAction(vehicles);
  const challanTotal = getChallanSummary(challans);


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
  const cardBase = {
    width: "19%",
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#ffffff",
  };


  return (
    <Page
      size="A4"
      style={{
        paddingTop: 30,
        paddingHorizontal: 30,
        paddingBottom: 70,
        fontFamily: "Helvetica",
        backgroundColor: "#FFFFFF",
      }}
    >
      {/* Header */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: 700,
          borderLeftColor: "#2563EB",
          borderLeftWidth: 4,
          paddingLeft: 8,
          marginBottom: 10,
        }}
      >
        Vehicle Compliance
      </Text>
      <Text style={{ fontSize: 9, color: "#6B7280", marginBottom: 15 }}>
        Tracking {vehicles.length} vehicles across 3 document types
      </Text>

      {/* Summary Cards */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
        {/* Total vehicles (no badge in reference) */}
        <View style={[cardBase, { borderColor: "#E5E7EB" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Total Vehicles</Text>
          <Text style={{ fontSize: 18, fontWeight: 700, marginVertical: 6 }}>
            {summary.total}
          </Text>
        </View>

        {/* Fully compliant */}
        <View style={[cardBase, { borderColor: "#BBF7D0", backgroundColor: "#F0FDF4" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Fully Compliant</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#16A34A",
              marginVertical: 4,
            }}
          >
            {summary.compliant}
          </Text>
          <Text style={{ fontSize: 7, color: "#6B7280", marginBottom: 4 }}>
            All certificates valid
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#BBF7D0",
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 9999,
            }}
          >
            <Text
              style={{
                fontSize: 7,
                fontWeight: 600,
                color: "#166534",
              }}
            >
              {summary.compliant} Vehicles
            </Text>
          </View>
        </View>

        {/* Non-compliant */}
        <View style={[cardBase, { borderColor: "#FECACA", backgroundColor: "#FEF2F2" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Non-Compliant</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#EF4444",
              marginVertical: 4,
            }}
          >
            {summary.nonCompliant}
          </Text>
          <Text style={{ fontSize: 7, color: "#6B7280", marginBottom: 4 }}>
            One or more expired
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#FECACA",
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 9999,
            }}
          >
            <Text
              style={{
                fontSize: 7,
                fontWeight: 600,
                color: "#B91C1C",
              }}
            >
              {summary.nonCompliant} Vehicles
            </Text>
          </View>
        </View>

        {/* Expiring soon */}
        <View style={[cardBase, { borderColor: "#FDE68A", backgroundColor: "#FFFBEB" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Expiring Soon</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#F59E0B",
              marginVertical: 4,
            }}
          >
            {summary.expiringSoon}
          </Text>
          <Text style={{ fontSize: 7, color: "#6B7280", marginBottom: 4 }}>
            Action needed (30 days)
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#FDE68A",
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 9999,
            }}
          >
            <Text
              style={{
                fontSize: 7,
                fontWeight: 600,
                color: "#92400E",
              }}
            >
              {summary.expiringSoon} Vehicles
            </Text>
          </View>
        </View>

        {/* Pending challans */}
        <View style={[cardBase, { borderColor: "#FED7AA", backgroundColor: "#FFF7ED" }]}>
          <Text style={{ fontSize: 8, color: "#6B7280" }}>Pending Challans</Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#F97316",
              marginVertical: 4,
            }}
          >
            {challans.length}
          </Text>
          <Text style={{ fontSize: 7, color: "#6B7280", marginBottom: 4 }}>
            Total fine amount
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              backgroundColor: "#FED7AA",
              paddingVertical: 3,
              paddingHorizontal: 8,
              borderRadius: 9999,
            }}
          >
            <Text
              style={{
                fontSize: 7,
                fontWeight: 600,
                color: "#EA580C",
              }}
            >
              Rs.{challanTotal.toLocaleString()}
            </Text>
          </View>
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
          fontSize: 12,
            fontWeight: 700,
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
            <Text style={[cell, { flex: 2, fontSize: 9 }]}>{row.name}</Text>
            <Text style={[cell, { color: "#16A34A", fontSize: 9 }]}>{row.data.valid}</Text>
            <Text style={[cell, { color: "#DC2626", fontSize: 9 }]}>{row.data.expired}</Text>
            <Text style={[cell, { color: "#D97706", fontSize: 9 }]}>{row.data.expiring}</Text>
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
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 8,
          }}
        >
          <InfoIcon color="#F97316" />
          <Text style={{ fontSize: 12, fontWeight: 700, color: "#92400E" }}>
            Pending Traffic Challans
          </Text>
        </View>

        <View style={tableHeader}>
          <Text style={{ width: "20%", fontSize: 8 }}>VEHICLE</Text>
          <Text style={{ width: "25%", fontSize: 8 }}>OWNER</Text>
          <Text style={{ width: "15%", fontSize: 8 }}>AMOUNT</Text>
          <Text style={{ width: "20%", fontSize: 8 }}>DATE</Text>
          <Text style={{ width: "20%", fontSize: 8 }}>STATUS</Text>
        </View>

        {challans.map((c, i) => (
          <View key={i} style={tableRow}>
            <Text style={{ width: "20%", fontSize: 9 }}>
              {c.registration_number}
            </Text>

            <Text style={{ width: "25%", fontSize: 9 }}>
              {c.name}
            </Text>

            <Text style={{ width: "15%", fontSize: 9, color: "#DC2626" }}>
              Rs.{Number(c.amount).toLocaleString()}
            </Text>

            <Text style={{ width: "20%", fontSize: 9 }}>
              {c.date}
            </Text>

            <View style={{ width: "20%", alignItems: "flex-start" }}>
              <View
                style={{
                  backgroundColor: "#FFE7CC",
                  borderRadius: 12,
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 8,
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
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 8,
            }}
          >
            <WarningIcon color="#EAB308" />
            <Text style={{ fontSize: 12, fontWeight: 700, color: "#854D0E" }}>
              Vehicles Requiring Immediate Action
            </Text>
          </View>

          <View style={tableHeader}>
              <Text style={[cell, { fontSize: 9 }]}>VEHICLE</Text>
              <Text style={[cell, { fontSize: 9 }]}>OWNER</Text>
              <Text style={[cell, { fontSize: 9 }]}>FC</Text>
              <Text style={[cell, { fontSize: 9 }]}>INSURANCE</Text>
              <Text style={[cell, { fontSize: 9 }]}>PUC</Text>
          </View>

          {actionVehicles.map((v, i) => (
            <View key={i} style={tableRow}>
              <Text style={[cell, { fontSize: 9 }]}>{v.vehicleNo}</Text>
              <Text style={[cell, { fontSize: 9 }]}>{v.owner}</Text>
              <View style={[cell, getDateCellStyle(v.fc)]}>
                <Text style={{ fontSize: 9 }}>{v.fc || "--"}</Text>
              </View>
              <View style={[cell, getDateCellStyle(v.insurance)]}>
                <Text style={{ fontSize: 9 }}>{v.insurance || "--"}</Text>
              </View>
              <View style={[cell, getDateCellStyle(v.puc)]}>
                <Text style={{ fontSize: 9 }}>{v.puc || "--"}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <ReportFooter month={month} />
    </Page>
  );
};
