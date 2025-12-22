/**
 * Trusted vehicle form validation constants
 * Central place to manage min/max lengths and related helpers.
 */

export const TRUSTED_VEHICLE_CONSTANTS = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  TYPE_MIN_LENGTH: 2,
  TYPE_MAX_LENGTH: 50,
} as const;

export const getTrustedVehicleNameMinLength = (): number =>
  TRUSTED_VEHICLE_CONSTANTS.NAME_MIN_LENGTH;

export const getTrustedVehicleNameMaxLength = (): number =>
  TRUSTED_VEHICLE_CONSTANTS.NAME_MAX_LENGTH;

export const getTrustedVehicleTypeMinLength = (): number =>
  TRUSTED_VEHICLE_CONSTANTS.TYPE_MIN_LENGTH;

export const getTrustedVehicleTypeMaxLength = (): number =>
  TRUSTED_VEHICLE_CONSTANTS.TYPE_MAX_LENGTH;


