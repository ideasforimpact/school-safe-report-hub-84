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
import workForm from '@/data/import-templates/work/forms.json';
import workAssessments from '@/data/import-templates/work/assessment-templates.json';
import workEduResources from '@/data/import-templates/work/edu-resources.json';

// Institute templates
import instituteCategories from '@/data/import-templates/institute/categories.json';
import instituteContribFactors from '@/data/import-templates/institute/contributing-factors.json';
import instituteReportTypes from '@/data/import-templates/institute/report-types.json';
import institutePriorities from '@/data/import-templates/institute/priorities.json';
import instituteForm from '@/data/import-templates/institute/forms.json';
import instituteAssessments from '@/data/import-templates/institute/assessment-templates.json';
import instituteEduResources from '@/data/import-templates/institute/edu-resources.json';

const TEMPLATES_BY_TYPE: Record<string, {
  categories: any[];
  contributing_factors: any[];
  report_types: any[];
  priorities: any[];
  forms: any[];
  assessment_templates: any[];
  edu_resources: any[];
}> = {
  school: {
    categories: (schoolCategories as any).categories,
    contributing_factors: (schoolContribFactors as any).contributing_factors,
    report_types: (schoolReportTypes as any).report_types,
    priorities: (schoolPriorities as any).priorities,
    forms: [schoolForm],
    assessment_templates: schoolAssessments as any[],
    edu_resources: schoolEduResources as any[],
  },
  work: {
    categories: (workCategories as any).categories,
    contributing_factors: (workContribFactors as any).contributing_factors,
    report_types: (workReportTypes as any).report_types,
    priorities: (workPriorities as any).priorities,
    forms: [workForm],
    assessment_templates: workAssessments as any[],
    edu_resources: workEduResources as any[],
  },
  institute: {
    categories: (instituteCategories as any).categories,
    contributing_factors: (instituteContribFactors as any).contributing_factors,
    report_types: (instituteReportTypes as any).report_types,
    priorities: (institutePriorities as any).priorities,
    forms: [instituteForm],
    assessment_templates: instituteAssessments as any[],
    edu_resources: instituteEduResources as any[],
  },
};

export async function runImportConfiguration(clientId: string) {
  const results: { typeKey: string; data: any; error: any }[] = [];

  for (const typeKey of ['school', 'work', 'institute']) {
    const templates = TEMPLATES_BY_TYPE[typeKey];

    const { data, error } = await supabase.functions.invoke('import-configuration', {
      body: {
        client_id: clientId,
        type_key: typeKey,
        templates,
      },
    });

    results.push({ typeKey, data, error });
  }

  return results;
}
