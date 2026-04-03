import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./pdfstyles";

/* TABLE ROW */
const TableRow = ({ row, widths, index, small = false, isLast = false }: any) => (
  <View
    style={[
      styles.row,
      index % 2 === 0 ? styles.oddRow : styles.evenRow,
    ]}
    wrap={false}
  >
    {row.map((item: any, i: number) => (
      <Text
        key={i}
        style={[
          small ? styles.smallCell : styles.cell,
          { width: widths[i] },
          isLast && styles.noVerticalBorder,

          i === row.length - 1 && styles.lastCell,
        ]}
      >
        {item ?? "-"}
      </Text>
    ))}
  </View>
);

/* HEADER ROW */
const HeaderRow = ({ headers, widths, small = false }: any) => (
  <View style={styles.row}>
    {headers.map((h: string, i: number) => (
      <Text
        key={i}
        style={[
          small ? styles.smallHeaderCell : styles.headerCell,
          { width: widths[i] },
          i === headers.length - 1 && styles.lastCell,
        ]}
      >
        {h}
      </Text>
    ))}
  </View>
);

const generateDiagnostics = (report: any) => {
  const insights: string[] = [];

  /* SLEEP  */
  if (report.sleep?.total > 0) {
    const mostCommon =
      report.sleep.common?.[0]?.label || "sleep disturbance";

    insights.push(
      `Frequent sleep disturbances reported (${report.sleep.total} instances). Most common: ${mostCommon}. Consider sleep hygiene assessment.`
    );
  }

  /*  MELTDOWN  */
  if (report.meltdown?.total > 0) {
    const breakdown = report.meltdown.durationBreakdown || [];

    const durationText = breakdown
      .map((d: any) => `${d.label} (${d.count}x)`)
      .join(", ");

    insights.push(
      `${report.meltdown.total} meltdown episodes recorded. Duration breakdown: ${durationText}. Track triggers for de-escalation planning.`
    );
  }

  /*  INJURY  */
  if (report.injury?.total > 0) {
    const types = report.injury.types
      ?.map((t: any) => `${t.label}`)
      .join(", ");

    insights.push(
      `Injuries noted on ${report.injury.total} occasions. Types: ${types}. Monitor for patterns or safeguarding concerns.`
    );
  }

  /*  BEHAVIOUR  */
  if (report.behaviour?.total > 0) {
    const common = report.behaviour.common
      ?.map((b: any) => b.label)
      .join(", ");

    insights.push(
      `Behavioural concerns flagged ${report.behaviour.total} times. Common presentations: ${common}. Consider emotional regulation support.`
    );
  }

  /*  HEALTH  */
  if (report.health?.total > 0) {
    const issues = report.health.issues
      ?.map((h: any) => h.label)
      .join(", ");

    insights.push(
      `Health/medical flags raised ${report.health.total} times. Issues: ${issues}. Liaise with school health team.`
    );
  }

  return insights;
};

const ChildAuditReportPDF = ({ student, monthReport }: any) => {
  const insights = generateDiagnostics(monthReport);
  const generatedAt = new Date().toLocaleString();
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={{ width: "100%" }}>
          {/* TITLE */}
          <Text style={styles.title}>Safety Check Monthly Report</Text>
          {/* <View style={{ marginBottom: 4 }}> */}
          <Text style={styles.subtitle}>
            {student?.name} | {student?.grade} | Age —
          </Text>

          <Text style={[styles.subtitle, styles.subtitle1, { marginTop: 4 }]}>
            Report Period: {new Date().toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </Text>
          {/* </View> */}

          {/* SUMMARY */}
          <View style={styles.section}>
            <Text style={styles.heading}>Summary</Text>
            <View style={{ width: "100%", overflow: "hidden" }}>

              <View style={styles.table}>
                <HeaderRow headers={["Metric", "Value"]} widths={["75%", "25%"]} />

                <TableRow row={["Total Checks", monthReport?.checks]} widths={["75%", "25%"]} index={0} />
                <TableRow row={["Days with Injuries", monthReport?.injuryDays]} widths={["75%", "25%"]} index={1} />
                <TableRow row={["Days with Meltdowns", monthReport?.meltdowns]} widths={["75%", "25%"]} index={2} />
              </View>
            </View>
          </View>

          {/* FACTOR DISTRIBUTION */}
          <View style={styles.section}>
            <Text style={styles.heading}>
              Factor Distribution & Analysis
            </Text>

            {monthReport?.sections.map((section: any) => (
              <View key={section.title}>

                <Text style={styles.subHeading}>
                  {section.title} ({section.total} occurrences)
                </Text>

                <View style={styles.tableInset} >
                  <View style={{ overflow: "hidden" }}>
                    <View style={styles.table}>

                      <HeaderRow
                        headers={["Factor", "Frequency"]}
                        widths={["75%", "25%"]}
                        small
                      />

                      {section.chips.map(([label, count]: any, i: number) => (
                        <TableRow
                          key={label}
                          row={[label, count]}
                          widths={["75%", "25%"]}
                          index={i}
                          small
                          isLast={i === section.chips.length - 1}
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* DIAGNOSTIC */}
          <View style={styles.section} wrap={false}>

            <Text style={styles.heading}>Diagnostic Insights</Text>

            {insights.length > 0 ? (
              <Text style={styles.listItem}>
                • {insights[0]}
              </Text>
            ) : (
              <Text style={styles.listItem}>
                • No significant observations recorded.
              </Text>
            )}


            {/*  Remaining items can flow */}
            {insights.slice(1).map((text, i) => (
              <View key={i} wrap={false}>
                <Text style={styles.listItem}>
                  • {text}
                </Text>
              </View>
            ))}

          </View>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Generated on ${generatedAt} | Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <View style={{ width: "100%" }}>
          <Text style={styles.heading}>Detailed Check Log</Text>
          <View style={{ width: "100%", overflow: "hidden" }}>
            <View style={styles.table}>

              <HeaderRow
                headers={[
                  "Date",
                  "Time",
                  "Type",
                  "Injuries",
                  "Meltdown",
                  "Observations",
                  "Notes",
                ]}
                widths={["12%", "12%", "14%", "16%", "10%", "18%", "18%"]}
              />

              {monthReport.logs?.map((log: any, i: number) => (
                <TableRow
                  key={i}
                  row={[
                    log.date,
                    log.time,
                    log.type,
                    log.injury,
                    log.meltdown,
                    log.observation,
                    log.notes,
                  ]}
                  widths={["12%", "12%", "14%", "16%", "10%", "18%", "18%"]}
                  index={i}
                />
              ))}

            </View>
          </View>

        </View>
        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Generated on ${generatedAt} | Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>

  );
};

export default ChildAuditReportPDF;