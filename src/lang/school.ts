import type { ClientLang } from './types';

const school: ClientLang = {
  // People
  people: {
    member: 'Student',
    members: 'Students',
    memberPlural: 'Students',
    staff: 'Teacher',
    staffPlural: 'Teachers',
    staffGroup: 'Staff',
    manager: 'Principal',
    managers: 'Principals',
    admin: 'School Admin',
    admins: 'School Admins',
    reporter: 'Student / Parent',
    reporterPlural: 'Students / Parents',
    supervisor: 'Class Teacher',
    supervisors: 'Class Teachers',
    department: 'Department',
    departments: 'Departments',
    grade: 'Class / Grade',
    grades: 'Classes / Grades',
  },

  // Place
  place: {
    organization: 'School',
    organizations: 'Schools',
    site: 'Campus',
    sites: 'Campuses',
    unit: 'Section',
    units: 'Sections',
    floor: 'Floor',
    area: 'School Area',
    areas: 'School Areas',
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
    audit: 'School Audit',
    audits: 'School Audits',
    compliance: 'Compliance Check',
    checklist: 'Safety Checklist',
  },

  // Modules / Features
  modules: {
    students: 'Students',
    staff: 'Staff',
    incidents: 'Incidents',
    grievances: 'Grievances',
    assessments: 'Assessments',
    facilities: 'Facilities',
    transport: 'Transport Safety',
    visitor: 'Visitor Management',
    childAudit: 'Child Safety Audit',
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
    inviteStaff: 'Invite Teacher',
    fileReport: 'File Incident Report',
    assignAssessment: 'Assign Assessment',
    reviewCompliance: 'Review Compliance',
    logVisitor: 'Log Visitor',
  },

  // Organisational structure (Campus → Grade → Section + Facility)
  structure: {
    pageTitle: 'Educational Structure',
    pageDescription: 'Manage campuses, grades, sections, and facilities',
    level1: 'Campus',
    level1Plural: 'Campuses',
    level2: 'Grade',
    level2Plural: 'Grades',
    level3: 'Section',
    level3Plural: 'Sections',
    facility: 'Facility',
    facilityPlural: 'Facilities',
  },

  // Labels / UI text
  labels: {
    memberId: 'Student ID',
    memberName: 'Student Name',
    staffId: 'Employee ID',
    staffName: 'Staff Name',
    organizationId: 'School ID',
    organizationName: 'School Name',
    siteId: 'Campus ID',
    siteName: 'Campus Name',
    gradeOrDivision: 'Class / Grade',
    incidentLocation: 'Incident Location',
    reportedBy: 'Reported By',
    assignedTo: 'Assigned To',
    dueDate: 'Due Date',
    status: 'Status',
  },
};

export default school;
