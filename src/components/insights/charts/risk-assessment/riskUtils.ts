
// Utility functions for risk assessment calculations and styling

// Get color based on risk score (frequency * severity)
export const getRiskColor = (frequency: number, severity: number) => {
  const riskScore = frequency * severity;
  
  if (riskScore < 4) return "#4ade80"; // Low risk - green
  if (riskScore < 9) return "#facc15"; // Medium risk - yellow
  if (riskScore < 16) return "#f97316"; // High risk - orange
  return "#ef4444"; // Critical risk - red
};

// Determine risk level from score
export const getRiskLevel = (riskScore: number): string => {
  if (riskScore >= 16) return "Critical";
  if (riskScore >= 9) return "High";
  if (riskScore >= 4) return "Medium";
  return "Low";
};

// Create risk zones for visualization
export const createRiskZones = () => {
  // Create a visual representation of risk zones
  const zones = [];
  for (let i = 0; i <= 5; i++) {
    for (let j = 0; j <= 5; j++) {
      if (i === 0 || j === 0) continue; // Skip the 0 values
      zones.push({
        x: i,
        y: j,
        z: 10, // Fixed size
        name: `Zone ${i}x${j}`,
        color: getRiskColor(i, j)
      });
    }
  }
  return zones;
};
