import { supabase } from '@/integrations/supabase/client';

// School templates
import schoolCategories from '@/data/import-templates/school/categories.json';
import schoolContribFactors from '@/data/import-templates/school/contributing-factors.json';
import schoolReportTypes from '@/data/import-templates/school/report-types.json';
import schoolPriorities from '@/data/import-templates/school/priorities.json';
import schoolForm from '@/data/import-templates/school/forms.json';
import schoolAssessments from '@/data/import-templates/school/assessment-templates.json';
import schoolEduResources from '@/data/import-templates/school/edu-resources.json';

// Work templates
import workCategories from '@/data/import-templates/work/categories.json';
import workContribFactors from '@/data/import-templates/work/contributing-factors.json';
import workReportTypes from '@/data/import-templates/work/report-types.json';
import workPriorities from '@/data/import-templates/work/priorities.json';
import workAssessments from '@/data/import-templates/work/assessment-templates.json';
import workEduResources from '@/data/import-templates/work/edu-resources.json';

// Institute templates
import instituteCategories from '@/data/import-templates/institute/categories.json';
import instituteContribFactors from '@/data/import-templates/institute/contributing-factors.json';
import instituteReportTypes from '@/data/import-templates/institute/report-types.json';
import institutePriorities from '@/data/import-templates/institute/priorities.json';
import instituteAssessments from '@/data/import-templates/institute/assessment-templates.json';
import instituteEduResources from '@/data/import-templates/institute/edu-resources.json';

interface TemplateFile {
  categories?: unknown[];
  contributing_factors?: unknown[];
  report_types?: unknown[];
  priorities?: unknown[];
}

const asTemplateFile = (x: unknown) => x as TemplateFile;

interface ClientTypeTemplates {
  categories: unknown[];
  contributing_factors: unknown[];
  report_types: unknown[];
  priorities: unknown[];
  forms: unknown[];
  assessment_templates: unknown[];
  edu_resources: unknown[];
}

const TEMPLATES_BY_TYPE: Record<string, ClientTypeTemplates> = {
  school: {
    categories: asTemplateFile(schoolCategories).categories,
    contributing_factors: asTemplateFile(schoolContribFactors).contributing_factors,
    report_types: asTemplateFile(schoolReportTypes).report_types,
    priorities: asTemplateFile(schoolPriorities).priorities,
    forms: [schoolForm],
    assessment_templates: schoolAssessments as unknown[],
    edu_resources: schoolEduResources as unknown[],
  },
  work: {
    categories: asTemplateFile(workCategories).categories,
    contributing_factors: asTemplateFile(workContribFactors).contributing_factors,
    report_types: asTemplateFile(workReportTypes).report_types,
    priorities: asTemplateFile(workPriorities).priorities,
    forms: [],
    assessment_templates: workAssessments as unknown[],
    edu_resources: workEduResources as unknown[],
  },
  institute: {
    categories: asTemplateFile(instituteCategories).categories,
    contributing_factors: asTemplateFile(instituteContribFactors).contributing_factors,
    report_types: asTemplateFile(instituteReportTypes).report_types,
    priorities: asTemplateFile(institutePriorities).priorities,
    forms: [],
    assessment_templates: instituteAssessments as unknown[],
    edu_resources: instituteEduResources as unknown[],
  },
};

export async function runImportConfiguration(clientId: string) {
  const { data, error } = await supabase.functions.invoke('import-configuration', {
    body: {
      client_id: clientId,
      types: [
        { type_key: 'school',    templates: TEMPLATES_BY_TYPE.school },
        { type_key: 'work',      templates: TEMPLATES_BY_TYPE.work },
        { type_key: 'institute', templates: TEMPLATES_BY_TYPE.institute },
      ],
    },
  });

  return { data, error };
}
