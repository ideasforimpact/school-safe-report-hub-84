import React from "npm:react@18.2.0";
import { Page, View, Text } from "npm:@react-pdf/renderer@3.4.4";
import { styles } from "../PdfCss.tsx";
import { ReportFooter } from "./ReportFooter.tsx";
import {
  getAssessmentByCategory,
  getAssessmentStats,
} from "../utils.ts";

interface Props {
  month: string;
  assessments: any[];
}

export const AssessmentPage = ({ month, assessments }: Props) => {
  const stats = getAssessmentStats(assessments);
  const categories = getAssessmentByCategory(assessments);

  const pendingStatuses = ["New", "Draft"];
  const pendingList = assessments.filter((a: any) =>
    pendingStatuses.includes(a.status)
  );

  return (
    <Page size="A4" style={styles.page}>
      <View style={styles.assessmentHeaderRow}>
        <Text style={styles.assessmentHeader}>
          Assessment Compliance
        </Text>
      </View>

      <Text style={styles.assessmentSub}>
        Progress on {stats.total} scheduled assessments
      </Text>

      <View style={styles.assessmentSummaryRow}>
        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentCardTitle}>
            TOTAL ASSESSMENTS
          </Text>
          <Text style={styles.assessmentCardNumber}>
            {stats.total}
          </Text>
        </View>

        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentCardTitle}>
            COMPLETED
          </Text>
          <Text style={styles.assessmentCardNumber}>
            {stats.completed}
          </Text>
          <Text style={styles.assessmentBadgeGreen}>
            On Track
          </Text>
        </View>

        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentCardTitle}>
            COMPLETION RATE
          </Text>
          <Text style={styles.assessmentCardNumber}>
            {stats.rate}%
          </Text>
          <Text style={styles.assessmentBadgePurple}>
            {stats.rate}% Rate
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 10, marginBottom: 4 }}>
        Assessment Summary by Type
      </Text>

      <View style={styles.assessmentTable}>
        <View style={styles.tableHeaderLight}>
          <Text style={styles.assessmentColCat}>CATEGORY</Text>
          <Text style={styles.assessmentCol}>TOTAL</Text>
          <Text style={[styles.assessmentCol, { color: "#16a34a" }]}>
            COMPLETED
          </Text>
          <Text style={[styles.assessmentCol, { color: "#d97706" }]}>
            IN PROGRESS
          </Text>
          <Text style={[styles.assessmentCol, { color: "#dc2626" }]}>
            OVERDUE
          </Text>
        </View>

        {categories.map((c: any, i: number) => (
          <View key={i} style={styles.tableRow}>
            <Text style={styles.assessmentColCat}>{c.name}</Text>
            <Text style={styles.assessmentCol}>{c.total}</Text>
            <Text style={[styles.assessmentCol, { color: "#16a34a" }]}>
              {c.completed}
            </Text>
            <Text style={[styles.assessmentCol, { color: "#d97706" }]}>
              {c.inProgress}
            </Text>
            <Text style={[styles.assessmentCol, { color: "#dc2626" }]}>
              {c.overdue}
            </Text>
          </View>
        ))}
      </View>

      {pendingList.length > 0 && (
        <View style={styles.assessmentPendingBox}>
          <Text style={{ fontSize: 10, marginBottom: 4 }}>
            Pending & Overdue Assessments
          </Text>

          <Text style={{ fontSize: 8, marginBottom: 6 }}>
            {stats.overdue} overdue, {stats.inProgress} in progress
          </Text>

          <View style={styles.tableHeaderLight}>
            <Text style={{ width: "30%" }}>ASSESSMENT</Text>
            <Text style={{ width: "15%" }}>TYPE</Text>
            <Text style={{ width: "20%" }}>ASSIGNED TO</Text>
            <Text style={{ width: "15%" }}>DUE DATE</Text>
            <Text style={{ width: "20%" }}>STATUS</Text>
          </View>

          {pendingList.slice(0, 8).map((a: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={{ width: "30%", fontSize: 8 }}>
                {a.name}
              </Text>

              <Text style={{ width: "15%", fontSize: 8 }}>
                {a.assessment_templates?.title}
              </Text>

              <Text style={{ width: "20%", fontSize: 8 }}>
                {a.employees?.first_name}
              </Text>

              <Text style={{ width: "15%", fontSize: 8 }}>
                {a.target_completion_date}
              </Text>

              <Text
                style={
                  a.status === "New"
                    ? styles.statusOverdue
                    : styles.statusProgress
                }
              >
                {a.status === "New" ? "In Progress" : "Overdue"}
              </Text>
            </View>
          ))}
        </View>
      )}

      <ReportFooter month={month} />
    </Page>
  );
};

