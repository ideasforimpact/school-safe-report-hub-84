// SOP Form Validation Constants

export const SOP_VALIDATION = {
  title: {
    min: 2,
    max: 250,
  },
  description: {
    min: 2,
    max: 500,
  },
  procedureStep: {
    min: 2,
    max: 2000,
  },
  importantNotes: {
    min: 2,
    max: 1000,
  },
} as const;



