import { parseVehicleFile } from './excelVehicleProcess';
import { supabase } from '@/integrations/supabase/client';
import { validateVehicleRows } from './importVehicleValidation';
import { checkExistingRegistrations, fetchVehicleTypeMap } from '../transport-safety/vehicleService';

export const validateVehicleExcel = async (
  file: File,
  clientId: string
): Promise<string[]> => {
  const rawData = await parseVehicleFile(file);
  const normalizedRegs = rawData
    .map(v => v.registrationNumber?.trim().toUpperCase())
    .filter(Boolean);

  const existingRegs = await checkExistingRegistrations(
    normalizedRegs,
    clientId
  );

  return validateVehicleRows(rawData, existingRegs);
};

export const importVehicles = async (
  file: File,
  clientId: string,
  employeeId: string
) => {
  const vehicles = await parseVehicleFile(file);

  if (!vehicles.length) return;

  const errors = validateVehicleRows(vehicles);
  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  const vehicleTypeMap = await fetchVehicleTypeMap();

  const payload = vehicles.map((v, index) => {
    const normalizedVehicleType = v.vehicleType
      ?.trim()
      .toUpperCase();

    const typeId = vehicleTypeMap[normalizedVehicleType];

    if (!typeId) {
      throw new Error(
        `Row ${index + 2}: Invalid vehicle type "${v.vehicleType}"`
      );
    }

    return {
      registration_number: v.registrationNumber.trim(),
      internal_vehicle_name: v.internalVehicleName.trim(),

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
  });

  const { error } = await supabase
    .from('vehicles')
    .insert(payload);

  if (error) {
    console.error(error);
    throw new Error('Failed to import vehicles');
  }
};


