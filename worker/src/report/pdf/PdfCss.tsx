import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontSize: 10,
        paddingBottom: 60,
        backgroundColor: "#f5f6f7",
    },
    // ===== Dashboard Cards =====
    criticalBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
        borderRadius: 12,
        padding: 32,
        marginBottom: 24,
    },

    criticalTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: "#881337",
        marginBottom: 4,
    },

    criticalSub: {
        fontSize: 12,
        lineHeight: 16,
        color: "#6B7280",
    },

    criticalCountBox: {
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingVertical: 20,
        paddingHorizontal: 28,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 120,
    },
    

    criticalCount: {
        fontSize: 48,
        fontWeight: 700,
        color: "#881337",
    },

    criticalCountLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: "#6B7280",
        marginTop: 4,
    },

    dashboardRow: {
        flexDirection: "row",
        marginBottom: 24,
    },

    dashboardCardLarge: {
        flex: 1,
        marginRight: 24,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 24,
        minHeight: 160,
    },

    dashboardCardSmall: {
        flex: 1,
        marginRight: 24,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        padding: 20,
        minHeight: 100,
    },

    dashboardTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: "#111827",
    },

    dashboardNumber: {
        fontSize: 36,
        lineHeight: 20,
        fontWeight: 700,
        color: "#111827",
        marginTop: 16,
        marginBottom: 8,
    },

    dashboardSub: {
        fontSize: 14,
        color: "#4B5563",
        marginBottom: 12,
    },


    dashboardCardTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },

    dashboardSmallTitle: {
        fontSize: 20,
        fontWeight: 600,
        color: "#111827",
    },

    dashboardSmallNumber: {
        fontSize: 30,
        lineHeight: 20,
        fontWeight: 700,
        color: "#111827",
        marginTop: 16,
    },

    dashboardSmallSub: {
        fontSize: 14,
        lineHeight: 20,
        color: "#4B5563",
        marginTop: 4,
    },

    pill: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        alignSelf: "flex-start",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
    },

    // ===== Module Table =====
    moduleTable: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        marginTop: 10,
    },

    moduleTableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        padding: 8,
    },

    moduleRowTable: {
        flexDirection: "row",
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        alignItems: "center",
    },

    moduleCol1: { width: "50%" },
    moduleCol2: { width: "20%", textAlign: "center" },
    moduleCol3: { width: "30%", alignItems: "flex-end" },

    statusGood: {
        backgroundColor: "#d1fae5",
        color: "#065f46",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        fontSize: 7,
    },

    statusWarn: {
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
    },

    statusCritical: {
        backgroundColor: "#FFE4E6",
        color: "#9F1239",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
    },

    statusPendingBadge: {
        backgroundColor: "#FCE7F3",
        color: "#9D174D",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 600,
    },

    // Header
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1f2937",
    },
    subtitle: {
        fontSize: 10,
        color: "#6b7280",
        marginTop: 4,
    },
    rightInfo: {
        textAlign: "right",
        fontSize: 9,
        color: "#6b7280",
    },
    divider: {
    borderBottomWidth: 2,      
    borderBottomColor: "#111827", 
    paddingBottom: 12,        
    },

    // ===== Section =====
    sectionTitle: {
        fontSize: 30,
        lineHeight: 20,
        fontWeight: 600,
        color: "#111827",
        marginTop: 12,
        marginBottom: 4,
    },

    sectionSub: {
        fontSize: 14,
        color: "#6B7280",
        marginBottom: 12,
    },

    sectionDivider: {
        borderBottomWidth: 1,
        borderBottomColor: "#111827",
        marginTop: 6,
        marginBottom: 20,
    },

    // Critical Box
    criticalBox: {
        alignItems: "center",
        padding: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        marginBottom: 20,
    },
    criticalNumber: {
        fontSize: 40,
        color: "#e11d48",
        marginBottom: 6,
    },
    criticalLabel: {
        fontSize: 10,
        color: "#6b7280",
    },

    // KPI Cards Row
    cardRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    card: {
        width: "18%",
        padding: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        backgroundColor: "#ffffff",
        alignItems: "center",
    },
    cardTitle: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 6,
        textAlign: "center",
    },
    cardNumber: {
        fontSize: 18,
        marginBottom: 4,
    },
    cardStatus: {
        fontSize: 8,
        color: "#e11d48",
    },

    moduleSection: {
        marginTop: 20,
    },
    //module row percentage
    moduleTitle: {
        fontSize: 14,
        color: "#374151",
        marginBottom: 4,
    },

    moduleSub: {
        fontSize: 9,
        color: "#6b7280",
        marginBottom: 10,
    },

    moduleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },

    moduleCard: {
        width: "19%",
        padding: 14,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        backgroundColor: "#ffffff",
        minHeight: 120,
    },

    iconWrapper: {
        width: 22,
        height: 22,
        marginBottom: 8,
    },

    moduleCardTitle: {
        fontSize: 9,
        color: "#374151",
        marginBottom: 4,
    },

    moduleCardSub: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 8,
    },

    modulePercent: {
        fontSize: 20,
        color: "#7c3aed",
        marginBottom: 6,
        fontWeight: "bold",
    },

    badge: {
        fontSize: 8,
        color: "#b91c1c",
        backgroundColor: "#fee2e2",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
        alignSelf: "flex-start",
    },

    //footer
    footer: {
        position: "absolute",
        bottom: 20,
        left: 30,
        right: 30,
        flexDirection: "row",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        paddingTop: 6,
        fontSize: 8,
        color: "#6B7280",
    },

    //vehile page 
    vehicleHeader: {
        borderLeftWidth: 4,
        borderLeftColor: "#393cff",
        paddingLeft: 8,
        marginBottom: 6,
        fontSize: 16,
    },

    vehicleSub: {
        fontSize: 9,
        color: "#6b7280",
        marginBottom: 12,
    },

    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 14,
    },

    summaryCard: {
        width: "18.5%",
        padding: 4,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 6,
        backgroundColor: "#f0fdf4",
        minHeight: 70,
        justifyContent: "center",
    },

    summaryTitle: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 4,
        marginLeft: 6,
    },

    summaryNumber: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 2,
        marginLeft: 6,
    },

    summaryNote: {
        fontSize: 7,
        color: "#6b7280",
        marginLeft: 6,
    },

    tableContainer: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        marginBottom: 14,
    },

    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 6,
        fontWeight: "bold",
    },

    tableRow: {
        flexDirection: "row",
        padding: 6,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },

    tableCell: {
        flex: 1,
        fontSize: 8,
    },


    tableCellBox: {
        flex: 1,
        padding: 4,
        justifyContent: "center",
    },

    iconRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },

    iconBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
        marginRight: 12,
    },

    iconBoxInRow: {
        marginBottom: 0,
        marginRight: 12,
    },

    iconBlue: { backgroundColor: "#dbeafe" },     // Vehicle
    iconOrange: { backgroundColor: "#ffedd5" },   // Challan
    iconGreen: { backgroundColor: "#dcfce7" },    // Employee
    iconPurple: { backgroundColor: "#ede9fe" },   // Assessment
    iconRed: { backgroundColor: "#fee2e2" },      // Incident
    iconYellow: { backgroundColor: "#fef3c7" },   // Grievance

    dashboardIcon: {
        width: 12,
        height: 12,
    },

    // vehicle and challan 
    sectionBox: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
    },

    sectionHeader: {
        fontSize: 10,
        marginBottom: 6,
        color: "#374151",
    },

    challanBox: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#FED7AA",
        borderRadius: 8,
        padding: 10,
        marginBottom: 12,
        
    },

    actionBox: {
        backgroundColor: "#f3ebde",
        borderWidth: 1,
        borderColor: "#f59e0b",
        borderRadius: 8,
        padding: 10,
    },

    tableHeaderLight: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        padding: 6,
        borderRadius: 4,
    },

    amountRed: { color: "#dc2626" },
    statusPill: {
        backgroundColor: "#FFEDD5",
        color: "#C2410C",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        fontSize: 8,
        fontWeight: 500,
        alignSelf: "center",
    },
    //employee
    // ===== Employee Page =====
    employeeHeaderRow: {
        borderLeftWidth: 4,
        borderLeftColor: "#10b981",
        paddingLeft: 8,
        marginBottom: 10,
    },

    employeeHeader: {
        fontWeight: 700,
        fontSize: 20,
        color: "#374151",
    },

    employeeSub: {
        fontSize: 9,
        color: "#6b7280",
        marginBottom: 15,
    },

    employeeSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    employeeCard: {
        width: "32%",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 6,
        paddingVertical: 18,
        minHeight: 70,
    },

    employeeCardTitle: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 4,
        marginLeft: 10,
    },

    employeeCardNumber: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#111827",
        marginLeft: 8,
    },

    employeeBadge: {
        marginTop: 6,
        backgroundColor: "#d1fae5",
        color: "#065f46",
        fontSize: 7,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: "flex-start",
        marginLeft: 10,
    },

    noDocBox: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#fecaca",
        backgroundColor: "#ffffff",
        borderRadius: 6,
        padding: 8,
    },

    noDocTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: "#b02a37",
    },

    noDocSub: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 6,
    },

    noDocPill: {
        fontSize: 7,
        backgroundColor: "#f8d7da",
        color: "#b02a37",
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 10,
        alignSelf: "flex-start",
    },


    // ===== Verification Summary Table =====
    employeeTable: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        marginTop: 6,
    },

    employeeTableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        padding: 8,
    },

    employeeTableRow: {
        flexDirection: "row",
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },

    employeeColType: { width: "50%" },
    employeeColCompliant: { width: "25%", color: "#16a34a" },
    employeeColPending: { width: "25%", color: "#dc2626" },

    // ===== Pending Box =====
    pendingBox: {
        marginTop: 12,
        backgroundColor: "#FFEDD5",
        borderWidth: 1,
        borderColor: "#FFEDD5",
        borderRadius: 12,
        padding: 14,
    },

    pendingTitle: {
        fontSize: 10,
        marginBottom: 4,
    },

    pendingSub: {
        fontSize: 9,
        color: "#4b5563",
        marginBottom: 6,
    },

    pendingPill: {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        fontSize: 7,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 4,
        marginBottom: 3,
    },
    // ===== Assessment Page =====
    assessmentHeaderRow: {
        borderLeftWidth: 4,
        borderLeftColor: "#8b5cf6",
        paddingLeft: 8,
        marginBottom: 10,
    },

    assessmentHeader: {
        fontWeight:700,
        fontSize: 20,
        color: "#374151",
    },

    assessmentSub: {
        fontSize: 9,
        color: "#6b7280",
        marginBottom: 10,
    },

    assessmentSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    assessmentCard: {
        width: "32%",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 6,
        padding: 12,
        minHeight: 120,
    },

    assessmentCardTitle: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 4,
        marginLeft: 6,
    },

    assessmentCardNumber: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#111827",
        marginLeft: 6,
    },

    assessmentBadgeGreen: {
        marginTop: 6,
        backgroundColor: "#d1fae5",
        color: "#065f46",
        fontSize: 7,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: "flex-start",
    },

    assessmentBadgePurple: {
        marginTop: 6,
        backgroundColor: "#ede9fe",
        color: "#6d28d9",
        fontSize: 7,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: "flex-start",
    },

    assessmentTable: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        marginTop: 6,
    },

    assessmentColCat: { width: "40%" },
    assessmentCol: { width: "20%" },

    // Pending box
    assessmentPendingBox: {
        marginTop: 12,
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#ffe4e6",
        borderRadius: 10,
        padding: 10,
    },

    statusOverdue: {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 7,
    },

    statusProgress: {
        backgroundColor: "#e5e7eb",
        color: "#374151",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 7,
    },

    //incident 
    criticalIncidentBox: {
        marginTop: 12,
        backgroundColor: "#fde8e8",
        borderWidth: 1,
        borderColor: "#fca5a5",
        borderRadius: 10,
        padding: 10,
    },

    incidentHeader: {
        fontSize: 20,
        marginBottom: 4,
        fontWeight:700
    },

    incidentSub: {
        fontSize: 8,
        marginBottom: 6,
        color: "#6b7280",
    },

    incidentTableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        padding: 6,
        borderRadius: 4,
    },

    incidentRow: {
        flexDirection: "row",
        padding: 6,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },

    colIncidentTitle: { width: "30%", fontSize: 8 },
    colIncidentCategory: { width: "20%", fontSize: 8 },
    colIncidentDate: { width: "18%", fontSize: 8 },
    colIncidentStatus: { width: "16%", alignItems: "flex-start" },
    colIncidentSeverity: { width: "16%", alignItems: "flex-start" },

    // Status Pills
    statusOverdueIncident: {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 7,
    },

    statusInProgress: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 7,
    },

    statusOpen: {
        backgroundColor: "#e5e7eb",
        color: "#374151",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 7,
    },

    studentSectionBox: {
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 6,
        padding: 8,
    },

    studentSectionTitle: {
        fontSize: 11,
        fontWeight: 700,
        color: "#1e3a8a",
    },

    studentSectionSub: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 6,
    },

    studentTableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: "#e5e7eb",
    },

    studentRow: {
        flexDirection: "row",
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderColor: "#f1f5f9",
    },

    colStudentName: { width: "20%", fontSize: 8 },
    colStudentGrade: { width: "15%", fontSize: 8 },
    colStudentTitle: { width: "30%", fontSize: 8 },
    colStudentCategory: { width: "20%", fontSize: 8 },
    colStudentDate: { width: "15%", fontSize: 8, textAlign: "right" },


    // Severity Pills
    severityHigh: {
        backgroundColor: "#fee2e2",
        color: "#b91c1c",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 7,
    },

    severityMedium: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 7,
    },

    incidentHeaderRow: {
        borderLeftWidth: 4,
        borderLeftColor: "#ef4444",
        paddingLeft: 8,
        marginBottom: 10,
    },

    incidentSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    incidentCard: {
        width: "24%",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 12,
    },

    incidentCardTitle: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 4,
    },

    incidentCardNumber: {
        fontSize: 18,
        fontWeight: "bold",
    },

    incidentBadgeGreen: {
        backgroundColor: "#d1fae5",
        color: "#065f46",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 9,
        marginTop: 4,
        alignSelf: "flex-start",
    },

    incidentBadgeYellow: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 9,
        marginTop: 4,
        alignSelf: "flex-start",
    },

    incidentBadgePurple: {
        backgroundColor: "#ede9fe",
        color: "#5b21b6",
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        fontSize: 9,
        marginTop: 4,
        alignSelf: "flex-start",
    },

    incidentTable: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        marginTop: 6,
    },

    incidentTableRow: {
        flexDirection: "row",
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },

    incidentCol1: { width: "40%" },
    incidentCol: { width: "20%", textAlign: "center" },

    // ===== Grievance Page =====
    grievanceHeaderRow: {
        borderLeftWidth: 4,
        borderLeftColor: "#2563eb",
        paddingLeft: 8,
        marginBottom: 10,
    },

    grievanceHeader: {
        fontSize: 20,
        fontWeight:700,
        color: "#374151",
    },

    grievanceSub: {
        fontSize: 9,
        color: "#6b7280",
        marginBottom: 10,
    },

    grievanceSummaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },

    grievanceCard: {
        width: "24%",
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        padding: 12,
    },

    grievanceCardTitle: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 4,
    },

    grievanceCardNumber: {
        fontSize: 18,
        fontWeight: "bold",
    },

    grievanceBadgeGreen: {
        backgroundColor: "#d1fae5",
        color: "#065f46",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 9,
        marginTop: 4,
        alignSelf: "flex-start",

    },

    grievanceBadgeYellow: {
        backgroundColor: "#fef3c7",
        color: "#92400e",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 9,
        marginTop: 4,
        alignSelf: "flex-start",

    },

    grievanceBadgePurple: {
        backgroundColor: "#ede9fe",
        color: "#5b21b6",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 9,
        marginTop: 4,
        alignSelf: "flex-start",
    },

    grievanceTable: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 10,
        marginTop: 6,
    },

    grievanceTableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        padding: 8,
    },

    grievanceTableRow: {
        flexDirection: "row",
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },

    grievanceColSource: { width: "40%" },
    grievanceCol: { width: "20%", textAlign: "center" },

    criticalGrievanceBox: {
        marginTop: 12,
        backgroundColor: "#fde8e8",
        borderWidth: 1,
        borderColor: "#fca5a5",
        borderRadius: 10,
        padding: 10,
    },

    criticalHeader: {
        fontSize: 10,
        marginBottom: 4,
    },

    criticalTableHeader: {
        flexDirection: "row",
        backgroundColor: "#f3f4f6",
        padding: 6,
        borderRadius: 4,
    },

    criticalRow: {
        flexDirection: "row",
        padding: 6,
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
    },

    colTitle: { width: "30%", fontSize: 8 },
    colRaised: { width: "15%", fontSize: 8 },
    colType: { width: "20%", fontSize: 8 },
    colDate: { width: "20%", fontSize: 8 },
    colStatus: { width: "15%", alignItems: "flex-start" },


    statusPending: {
        backgroundColor: "#f3f4f6",
        color: "#374151",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        fontSize: 7,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },

    moduleSectionBox: {
        backgroundColor: "#ffffff",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        marginTop: 6,
        overflow: "hidden",
    },

    moduleSectionTitle: {
        paddingTop: 24,
        marginBottom: 16,
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 20,
        color: "#111827",
    },

    moduleHeaderRow: {
        flexDirection: "row",
        backgroundColor: "#F9FAFB",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    moduleHeaderText: {
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 16,
        color: "#6B7280",
    },

    moduleDataRow: {
        flexDirection: "row",
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
        alignItems: "center",
    },

    moduleLeft: {
        width: "55%",
        flexDirection: "row",
        alignItems: "center",
    },

    moduleMiddle: {
        width: "20%",
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: 24,
        lineHeight: 20,
        fontWeight: 700,
        textAlign: "center",
        color: "#111827",
    },

    moduleRight: {
        width: "25%",
        alignItems: "flex-end",
    },

    moduleIconSmall: {
        width: 18,
        height: 18,
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    moduleName: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: 600,
        color: "#111827",
    },

    moduleSubText: {
        fontSize: 12,
        lineHeight: 16,
        color: "#6b7280",
        marginTop: 2
    }

});