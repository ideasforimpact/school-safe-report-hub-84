import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "../PdfCss.js";

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

