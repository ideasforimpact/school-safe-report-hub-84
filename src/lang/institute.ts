import type { ClientLang } from './types';

const institute: ClientLang = {
  // People
  people: {
    member: 'Student',
    members: 'Students',
    memberPlural: 'Students',
    staff: 'Faculty',
    staffPlural: 'Faculty Members',
    staffGroup: 'Faculty & Staff',
    manager: 'Dean / HoD',
    managers: 'Deans / HoDs',
    admin: 'Institute Admin',
    admins: 'Institute Admins',
    reporter: 'Student / Faculty',
    reporterPlural: 'Students / Faculty',
    supervisor: 'Faculty Advisor',
    supervisors: 'Faculty Advisors',
    department: 'Department',
    departments: 'Departments',
    grade: 'Semester / Year',
    grades: 'Semesters / Years',
  },

  // Place
  place: {
    organization: 'Institution',
    organizations: 'Institutions',
    site: 'Campus',
    sites: 'Campuses',
    unit: 'Branch',
    units: 'Branches',
    floor: 'Floor',
    area: 'Campus Area',
    areas: 'Campus Areas',
  },

  // Incidents
  incident: {
    incident: 'Incident',
    incidents: 'Incidents',
    report: 'Incident Report',
    reports: 'Incident Reports',
    reportVerb: 'Report Incident',
    category: 'Incident Category',
    categories: 'Incident Categories',
    subcategory: 'Incident Subcategory',
    subcategories: 'Incident Subcategories',
    priority: 'Priority',
    priorities: 'Priorities',
    type: 'Report Type',
    types: 'Report Types',
    involvedPerson: 'Student Involved',
    involvedPersons: 'Students Involved',
    witness: 'Witness',
    witnesses: 'Witnesses',
    factor: 'Contributing Factor',
    factors: 'Contributing Factors',
  },

  // Assessment / Audit
  assessment: {
    assessment: 'Safety Assessment',
    assessments: 'Safety Assessments',
    template: 'Assessment Template',
    templates: 'Assessment Templates',
    audit: 'Institute Audit',
    audits: 'Institute Audits',
    compliance: 'Compliance Check',
    checklist: 'Safety Checklist',
  },

  // Modules / Features
  modules: {
    students: 'Students',
    staff: 'Faculty & Staff',
    incidents: 'Incidents',
    grievances: 'Grievances',
    assessments: 'Assessments',
    facilities: 'Facilities',
    transport: 'Transport Safety',
    visitor: 'Visitor Management',
    childAudit: 'Safety Audit',
    wellbeing: 'Student Wellbeing',
    sop: 'Safety SOPs',
    committees: 'Committees',
    compliance: 'Compliance Documents',
    forms: 'Custom Forms',
    insights: 'Insights & Analytics',
  },

  // Actions
  actions: {
    addMember: 'Add Student',
    editMember: 'Edit Student',
    removeMember: 'Remove Student',
    inviteStaff: 'Invite Faculty',
    fileReport: 'File Incident Report',
    assignAssessment: 'Assign Assessment',
    reviewCompliance: 'Review Compliance',
    logVisitor: 'Log Visitor',
  },

  // Organisational structure (Campus → Department → Batch + Facility)
  structure: {
    pageTitle: 'Organisational Structure',
    pageDescription: 'Manage campuses, departments, batches, and facilities',
    level1: 'Campus',
    level1Plural: 'Campuses',
    level2: 'Department',
    level2Plural: 'Departments',
    level3: 'Batch',
    level3Plural: 'Batches',
    facility: 'Facility',
    facilityPlural: 'Facilities',
  },

  // Labels / UI text
  labels: {
    memberId: 'Student ID / Enrollment No.',
    memberName: 'Student Name',
    staffId: 'Faculty ID',
    staffName: 'Faculty Name',
    organizationId: 'Institution ID',
    organizationName: 'Institution Name',
    siteId: 'Campus ID',
    siteName: 'Campus Name',
    gradeOrDivision: 'Semester / Year',
    incidentLocation: 'Incident Location',
    reportedBy: 'Reported By',
    assignedTo: 'Assigned To',
    dueDate: 'Due Date',
    status: 'Status',
  },
};

export default institute;
