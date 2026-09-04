// Indian vehicle registration number format, shared by all vehicle forms/imports.
// Covers every state/UT code (no fixed whitelist), the 0-3 letter series segment
// (two-wheelers and four-wheelers both use this scheme), and the state-neutral
// BH (Bharat) series, e.g. TN01AB1234, KA05B1234, DL1CAB1234, 21BH1234AB.
export const VEHICLE_REGISTRATION_REGEX =
  /^(?:[A-Z]{2}\d{1,2}[A-Z]{0,3}\d{4}|\d{2}BH\d{4}[A-Z]{1,2})$/i;

export const VEHICLE_REGISTRATION_EXAMPLE = 'TN01AB1234';

export const isValidVehicleRegistrationNumber = (value: string): boolean =>
  VEHICLE_REGISTRATION_REGEX.test((value || '').trim());
