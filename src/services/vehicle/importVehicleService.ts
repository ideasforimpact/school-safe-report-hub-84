import { parseVehicleFile } from './excelVehicleProcess';
import { supabase } from '@/integrations/supabase/client';
import { validateVehicleRows } from './importVehicleValidation';
import { checkExistingRegistrations, fetchVehicleTypeMap } from '../transport-safety/vehicleService';

export const validateVehicleExcel = async (
  file: File,
  clientId: string
): Promise<{ errors: string[]; warnings: string[] }> => {
  const rawData = await parseVehicleFile(file);

  const errors = validateVehicleRows(rawData);
  const warnings: string[] = [];

  const normalizedRegs = rawData
    .map(v =>
      v.registrationNumber !== undefined && v.registrationNumber !== null
        ? String(v.registrationNumber).trim().toUpperCase()
        : ''
    )
    .filter(Boolean);

  const seen = new Map<string, number[]>();
  normalizedRegs.forEach((reg, index) => {
    if (!seen.has(reg)) seen.set(reg, []);
    seen.get(reg)!.push(index + 2);
  });

  seen.forEach((rows, reg) => {
    if (rows.length > 1) {
      warnings.push(
        `Vehicle "${reg}" appears multiple times in rows ${rows.join(', ')}`
      );
    }
  });

  if (normalizedRegs.length > 0) {
    const existingRegs = await checkExistingRegistrations(
      normalizedRegs,
      clientId
    );

    existingRegs.forEach(reg => {
      const rowIndex = normalizedRegs.findIndex(r => r === reg.toUpperCase());
      const rowNumber = rowIndex >= 0 ? rowIndex + 2 : 'Unknown';

      warnings.push(
        `Row ${rowNumber}: Vehicle "${reg}" already exists and will be skipped`
      );
    });
  }

  return { errors, warnings };
};


export const importVehicles = async (
  file: File,
  clientId: string,
  employeeId: string
): Promise<{ skippedVehicles: string[] }> => {
  const vehicles = await parseVehicleFile(file);
  const normalizedRegs = vehicles
    .map(v =>
      v.registrationNumber !== undefined && v.registrationNumber !== null
        ? String(v.registrationNumber).trim().toUpperCase()
        : ''
    )
    .filter(Boolean);

  const existingRegs = await checkExistingRegistrations(
    normalizedRegs,
    clientId
  );

  const existingSet = new Set(existingRegs.map(r => r.toUpperCase()));

  if (!vehicles.length) {
    return { skippedVehicles: [] };
  }

  const errors = validateVehicleRows(vehicles);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  const vehicleTypeMap = await fetchVehicleTypeMap();
  const skippedVehicles: string[] = [];
  const seenInFile = new Set<string>();
  const payload = vehicles.map((v, index) => {
    const registrationNumber =
      v.registrationNumber !== undefined && v.registrationNumber !== null
        ? String(v.registrationNumber).trim().toUpperCase()
        : '';
    if (!registrationNumber) return null;

    if (seenInFile.has(registrationNumber)) {
      skippedVehicles.push(registrationNumber);
      return null;
    }
    seenInFile.add(registrationNumber);

    if (existingSet.has(registrationNumber)) {
      skippedVehicles.push(registrationNumber);
      return null;
    }

    const internalVehicleName =
      v.internalVehicleName !== undefined && v.internalVehicleName !== null
        ? String(v.internalVehicleName).trim()
        : '';

    const normalizedVehicleType =
      v.vehicleType !== undefined && v.vehicleType !== null
        ? String(v.vehicleType).trim().toUpperCase()
        : '';

    const typeId = vehicleTypeMap[normalizedVehicleType];

    if (!typeId) {
      throw new Error(
        `Row ${index + 2}: Invalid vehicle type "${v.vehicleType}"`
      );
    }

    return {
      registration_number: registrationNumber,
      internal_vehicle_name: internalVehicleName,

      type: typeId,

      make: '',
      model: '',
      year: null,

      status: 'active',
      capacity: null,
      driver: '',
      route: '',
      active: true,

      client_id: clientId,
      employee_id: employeeId,
    };
  }).filter((v): v is NonNullable<typeof v> => Boolean(v));

  if (payload.length > 0) {
    const { error } = await supabase
      .from('vehicles')
      .insert(payload);

    if (error) {
      console.error(error);
      throw new Error('Failed to import vehicles');
    }
  }
  return { skippedVehicles };
};


