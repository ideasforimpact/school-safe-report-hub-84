/**
 * Inline icon data URIs for PDF in Edge Function (no filesystem reads).
 * Small PNG scaled by style so icons show on the dashboard cards.
 */
// 1x1 white pixel - scales to 10x10, visible on colored icon boxes
const ICON_BULLET =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export const PDF_ICONS = {
  vehicle: ICON_BULLET,
  challan: ICON_BULLET,
  user: ICON_BULLET,
  check: ICON_BULLET,
  shield: ICON_BULLET,
  message: ICON_BULLET,
} as const;
