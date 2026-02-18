import React from "npm:react@18.2.0";
import { View, Text } from "npm:@react-pdf/renderer@3.4.4";
import { styles } from "../PdfCss.tsx";

interface Props {
  month: string;
}

export const ReportFooter = ({ month }: Props) => {
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.footer} fixed>
      <Text>Monthly Compliance Report - {month}</Text>
      <Text>Generated: {generatedDate}</Text>
    </View>
  );
};

