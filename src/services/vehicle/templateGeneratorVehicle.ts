import * as XLSX from 'xlsx';
import { fetchVehicleTypes } from '../transport-safety/vehicleService';

export interface VehicleTemplateData {
  'Registration Number': string;
  'Internal Vehicle Name': string;
  'Vehicle Type': string;
};

export const generateVehicleSampleData = async (): Promise<VehicleTemplateData[]> => {
  const vehicleTypes = await fetchVehicleTypes();

  return vehicleTypes.map((type, index) => ({
    'Registration Number': `TN09AB${1000 + index}`,
    'Internal Vehicle Name': `${type.toUpperCase()} Vehicle ${index + 1}`,
    'Vehicle Type': type,
  }));
};


export const downloadVehicleExcelTemplate = async (): Promise<void> => {
  const sampleData = await generateVehicleSampleData();

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sampleData);

  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 28 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vehicles');
  XLSX.writeFile(workbook, 'vehicle_import_template.xlsx');
};


export const downloadVehicleCSVTemplate = async (): Promise<void> => {
  const sampleData = await generateVehicleSampleData();

  if (sampleData.length === 0) return;

  const headers = Object.keys(sampleData[0]);

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row =>
      headers
        .map(header =>
          `"${String(row[header as keyof VehicleTemplateData]).replace(/"/g, '""')}"`
        )
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'vehicle_import_template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export const getVehicleTemplateFormatInfo = () => ({
  requiredColumns: [
    'Registration Number',
    'Internal Vehicle Name',
    'Vehicle Type',
  ],
  supportedFormats: ['XLSX', 'XLS', 'CSV'],
});
