import type { FormField } from '@/types/formTypes';

const SCHOOL_GRIEVANCE_SUBMITTER_OPTIONS = ['Parent', 'Student', 'Staff', 'Other'];
const WORK_GRIEVANCE_SUBMITTER_OPTIONS = ['Employee', 'Manager', 'HR / Admin', 'Contractor / Vendor', 'Other'];

export const getGrievanceSubmitterField = (clientTypeKey?: string | null) => {
  if (clientTypeKey === 'work') {
    return {
      label: 'Who is raising this workplace grievance?',
      options: WORK_GRIEVANCE_SUBMITTER_OPTIONS,
    };
  }

  return {
    label: 'Who is raising this grievance?',
    options: SCHOOL_GRIEVANCE_SUBMITTER_OPTIONS,
  };
};

export const isGrievanceSubmitterField = (field: Pick<FormField, 'id' | 'label'>) => {
  const label = (field.label || '').toLowerCase();

  return (
    field.id === 'submitter_type' ||
    label.includes('who is raising this grievance') ||
    label.includes('who is raising this workplace grievance')
  );
};

export const normalizeGrievanceSubmitterFields = <T extends FormField>(
  fields: T[],
  clientTypeKey?: string | null
): T[] => {
  const override = getGrievanceSubmitterField(clientTypeKey);

  return fields.map((field) => {
    if (!isGrievanceSubmitterField(field)) return field;

    return {
      ...field,
      label: override.label,
      options: override.options,
    };
  });
};
