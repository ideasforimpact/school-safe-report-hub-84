import { RawVehicleData } from "./excelVehicleProcess";

const REGISTRATION_REGEX = /^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/;
const INTERNAL_NAME_REGEX = /^[A-Za-z0-9\s]+$/;

const REQUIRED_FIELDS: Array<{
  key: keyof RawVehicleData;
  label: string;
}> = [
    { key: 'registrationNumber', label: 'Registration Number' },
    { key: 'internalVehicleName', label: 'Internal Vehicle Name' },
    { key: 'vehicleType', label: 'Vehicle Type' },
  ];

const ALLOWED_VEHICLE_TYPES = [
  'BUS',
  'CAR',
  'MOTORCYCLE',
  'OTHERS',
  'TRACTOR',
  'VAN',
];

export const validateVehicleRows = (
  rows: RawVehicleData[],
): string[] => {

  if (
    !rows.length ||
    rows.every(row =>
      Object.values(row).every(
        value =>
          value === undefined ||
          value === null ||
          (typeof value === 'string' && !value.trim())
      )
    )
  ) {
    return ['The uploaded file is empty. Please add at least one vehicle record.'];
  }

  const errors: string[] = [];
  const seenInFile = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    REQUIRED_FIELDS.forEach(({ key, label }) => {
      const value = row[key];

      if (
        value === undefined ||
        value === null ||
        (typeof value === 'string' && !value.trim())
      ) {
        errors.push(`Row ${rowNum}: ${label} is required`);
      }
    });

    const regNo =
      row.registrationNumber !== undefined &&
        row.registrationNumber !== null
        ? String(row.registrationNumber).trim().toUpperCase()
        : '';
    if (!regNo) return;

    if (!REGISTRATION_REGEX.test(regNo)) {
      errors.push(
        `Row ${rowNum}: Registration Number must be in format TN09AB1234`
      );
    }

    if (seenInFile.has(regNo)) {
      return;
    }
    seenInFile.add(regNo);


    const internalName =
      row.internalVehicleName !== undefined &&
        row.internalVehicleName !== null
        ? String(row.internalVehicleName).trim()
        : '';
    if (internalName) {
      if (internalName.length < 2) {
        errors.push(
          `Row ${rowNum}: Internal Vehicle Name must be at least 2 characters`
        );
      }

      if (internalName.length > 100) {
        errors.push(
          `Row ${rowNum}: Internal Vehicle Name cannot exceed 100 characters`
        );
      }

      if (!INTERNAL_NAME_REGEX.test(internalName)) {
        errors.push(
          `Row ${rowNum}: Internal Vehicle Name can only contain letters, numbers, and spaces`
        );
      }
    }

    const vehicleType =
      row.vehicleType !== undefined &&
        row.vehicleType !== null
        ? String(row.vehicleType).trim().toUpperCase()
        : '';

    if (
      vehicleType &&
      !ALLOWED_VEHICLE_TYPES.includes(vehicleType)
    ) {
      errors.push(
        `Row ${rowNum}: Vehicle Type must be one of ${ALLOWED_VEHICLE_TYPES.join(
          ', '
        )}`
      );
    }
  });

  return errors;
};
