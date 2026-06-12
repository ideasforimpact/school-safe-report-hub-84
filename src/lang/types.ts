export interface ClientLang {
  people: {
    member: string;
    members: string;
    memberPlural: string;
    staff: string;
    staffPlural: string;
    staffGroup: string;
    manager: string;
    managers: string;
    admin: string;
    admins: string;
    reporter: string;
    reporterPlural: string;
    supervisor: string;
    supervisors: string;
    department: string;
    departments: string;
    grade: string;
    grades: string;
  };

  place: {
    organization: string;
    organizations: string;
    site: string;
    sites: string;
    unit: string;
    units: string;
    floor: string;
    area: string;
    areas: string;
  };

  incident: {
    incident: string;
    incidents: string;
    report: string;
    reports: string;
    reportVerb: string;
    category: string;
    categories: string;
    subcategory: string;
    subcategories: string;
    priority: string;
    priorities: string;
    type: string;
    types: string;
    involvedPerson: string;
    involvedPersons: string;
    witness: string;
    witnesses: string;
    factor: string;
    factors: string;
  };

  assessment: {
    assessment: string;
    assessments: string;
    template: string;
    templates: string;
    audit: string;
    audits: string;
    compliance: string;
    checklist: string;
  };

  modules: {
    students: string;
    staff: string;
    incidents: string;
    grievances: string;
    assessments: string;
    facilities: string;
    transport: string;
    visitor: string;
    childAudit: string;
    wellbeing: string;
    sop: string;
    committees: string;
    compliance: string;
    forms: string;
    insights: string;
  };

  actions: {
    addMember: string;
    editMember: string;
    removeMember: string;
    inviteStaff: string;
    fileReport: string;
    assignAssessment: string;
    reviewCompliance: string;
    logVisitor: string;
  };

  structure: {
    pageTitle: string;
    pageDescription: string;
    level1: string;           // e.g. Campus / Site / Office
    level1Plural: string;
    level2: string;           // e.g. Grade / Department / Department
    level2Plural: string;
    level3: string;           // e.g. Section / Batch / Team
    level3Plural: string;
    facility: string;
    facilityPlural: string;
  };

  labels: {
    memberId: string;
    memberName: string;
    staffId: string;
    staffName: string;
    organizationId: string;
    organizationName: string;
    siteId: string;
    siteName: string;
    gradeOrDivision: string;
    incidentLocation: string;
    reportedBy: string;
    assignedTo: string;
    dueDate: string;
    status: string;
  };
}

export type ClientTypeKey = 'school' | 'institute' | 'work';
