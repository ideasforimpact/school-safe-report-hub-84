import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  /* ===== PAGE ===== */
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },

  /* ===== TITLE ===== */
  title: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },

  subtitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 8,
  },

  subtitle1: {
    fontSize: 10,
  },

  /* ===== SECTION ===== */
  section: {
    marginTop: 16,
  },

  heading: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#111827",
  },

  subHeading: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 18,
    marginBottom: 6,
    color: "#1f2937",
  },

  /* ===== TABLE ===== */
  table: {
    width: "100%",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    boxSizing: "border-box",
  },

  tableInset: {
    // marginHorizontal: 24, 
    width: "92%",
    alignSelf: "center"
  },

  row: {
    flexDirection: "row",
  },

  noVerticalBorder: {
    borderRightWidth: 0,
    borderLeftWidth: 0,
  },

  headerCell: {
    backgroundColor: "#2f6f4f",
    color: "#ffffff",
    paddingVertical: 5,
    paddingHorizontal: 14,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  cell: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  smallCell: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  smallHeaderCell: {
    backgroundColor: "#2f6f4f",
    color: "#ffffff",
    paddingVertical: 4,
    paddingHorizontal: 12,
    fontWeight: "bold",
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  lastCell: {
    borderRightWidth: 0,
  },

  /* ===== ROW COLORS ===== */
  oddRow: {
    backgroundColor: "#ffffff",
  },

  evenRow: {
    backgroundColor: "#f9fafb",
  },

  /* ===== LIST ===== */
  listItem: {
    fontSize: 11,
    marginBottom: 8,
    lineHeight: 1.5,
  },

  /* ===== FOOTER ===== */
  footer: {
    position: "absolute",
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 10,
    color: "#6b7280",
  },
});