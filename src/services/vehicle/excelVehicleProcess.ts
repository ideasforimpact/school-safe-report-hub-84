import * as XLSX from 'xlsx';

export interface RawVehicleData {
  registrationNumber: string;
  internalVehicleName: string;
  vehicleType: string;
}

const parseVehicleCSVFile = async (
  file: File
): Promise<RawVehicleData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        if (!e.target?.result) {
          reject(new Error('Failed to read CSV file'));
          return;
        }

        const csvText = e.target.result as string;
        const lines = csvText
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean);

        if (lines.length < 2) {
          reject(new Error('CSV must contain header and at least one row'));
          return;
        }

        const headers = lines[0]
          .split(',')
          .map(h => h.replace(/"/g, '').trim().toLowerCase());

        const rows = lines.slice(1).map(line => {
          const values =
            line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v =>
              v.replace(/^"|"$/g, '').trim()
            ) || [];

          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = values[i] ?? '';
          });
          return row;
        });

        const vehicles: RawVehicleData[] = rows.map((row, index) => ({
          registrationNumber:
            row['registration number'] ||
            '',
          internalVehicleName:
            row['internal vehicle name'] ||
            '',
          vehicleType:
            row['vehicle type'] ||
            '',
        }));

        resolve(vehicles);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = err => reject(err);
    reader.readAsText(file);
  });
};

const parseVehicleExcelFile = async (
  file: File
): Promise<RawVehicleData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        if (!e.target?.result) {
          reject(new Error('Failed to read Excel file'));
          return;
        }

        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          raw: true,
          defval: '',
        });

        const vehicles: RawVehicleData[] = jsonData.map((row: any) => {
          const keys = Object.keys(row).reduce<Record<string, any>>(
            (acc, key) => {
              acc[key.toLowerCase()] = row[key];
              return acc;
            },
            {}
          );

          return {
            registrationNumber:
              keys['registration number'] ||
              '',
            internalVehicleName:
              keys['internal vehicle name'] ||
              '',
            vehicleType:
              keys['vehicle type'] ||
              '',
          };
        });

        resolve(vehicles);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = err => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
export const parseVehicleFile = async (
  file: File
): Promise<RawVehicleData[]> => {
  const ext = file.name.toLowerCase().split('.').pop();

  if (ext === 'csv') {
    return parseVehicleCSVFile(file);
  }

  return parseVehicleExcelFile(file);
};