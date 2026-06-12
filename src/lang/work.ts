import type { ClientLang } from './types';

const work: ClientLang = {
  // People
  people: {
    member: 'Employee',
    members: 'Employees',
    memberPlural: 'Employees',
    staff: 'Staff',
    staffPlural: 'Staff Members',
    staffGroup: 'Workforce',
    manager: 'Manager',
    managers: 'Managers',
    admin: 'HR Admin',
    admins: 'HR Admins',
    reporter: 'Employee',
    reporterPlural: 'Employees',
    supervisor: 'Supervisor',
    supervisors: 'Supervisors',
    department: 'Department',
    departments: 'Departments',
    grade: 'Designation / Level',
    grades: 'Designations / Levels',
  },

  // Place
  place: {
    organization: 'Organisation',
    organizations: 'Organisations',
    site: 'Office / Site',
    sites: 'Offices / Sites',
    unit: 'Business Unit',
    units: 'Business Units',
    floor: 'Floor',
    area: 'Work Area',
    areas: 'Work Areas',
  },

  // Incidents
  incident: {
    incident: 'Workplace Incident',
    incidents: 'Workplace Incidents',
    report: 'Incident Report',
    reports: 'Incident Reports',
    reportVerb: 'Report Incident',
    category: 'Incident Category',
    categories: 'Incident Categories',
    subcategory: 'Incident Subcategory',
    subcategories: 'Incident Subcategories',
    priority: 'Severity',
    priorities: 'Severity Levels',
    type: 'Report Type',
    types: 'Report Types',
    involvedPerson: 'Employee Involved',
    involvedPersons: 'Employees Involved',
    witness: 'Witness',
    witnesses: 'Witnesses',
    factor: 'Contributing Factor',
    factors: 'Contributing Factors',
  },

  // Assessment / Audit
  assessment: {
    assessment: 'Workplace Assessment',
    assessments: 'Workplace Assessments',
    template: 'Assessment Template',
    templates: 'Assessment Templates',
    audit: 'Workplace Audit',
    audits: 'Workplace Audits',
    compliance: 'Compliance Check',
    checklist: 'Safety Checklist',
  },

  // Modules / Features
  modules: {
    students: 'Employees',
    staff: 'Staff',
    incidents: 'Incidents',
    grievances: 'Grievances',
    assessments: 'Assessments',
    facilities: 'Facilities',
    transport: 'Transport Safety',
    visitor: 'Visitor Management',
    childAudit: 'Safety Audit',
    wellbeing: 'Employee Wellbeing',
    sop: 'SOPs',
    committees: 'Committees',
    compliance: 'Compliance Documents',
    forms: 'Custom Forms',
    insights: 'Insights & Analytics',
  },

  // Actions
  actions: {
    addMember: 'Add Employee',
    editMember: 'Edit Employee',
    removeMember: 'Remove Employee',
    inviteStaff: 'Invite Staff',
    fileReport: 'File Incident Report',
    assignAssessment: 'Assign Assessment',
    reviewCompliance: 'Review Compliance',
    logVisitor: 'Log Visitor',
  },

  // Organisational structure (Site/Office → Department → Team + Facility)
  structure: {
    pageTitle: 'Workplace Structure',
    pageDescription: 'Manage sites, departments, teams, and facilities',
    level1: 'Site / Office',
    level1Plural: 'Sites / Offices',
    level2: 'Department',
    level2Plural: 'Departments',
    level3: 'Team',
    level3Plural: 'Teams',
    facility: 'Facility',
    facilityPlural: 'Facilities',
  },

  // Labels / UI text
  labels: {
    memberId: 'Employee ID',
    memberName: 'Employee Name',
    staffId: 'Staff ID',
    staffName: 'Staff Name',
    organizationId: 'Organisation ID',
    organizationName: 'Organisation Name',
    siteId: 'Site / Office ID',
    siteName: 'Site / Office Name',
    gradeOrDivision: 'Designation / Level',
    incidentLocation: 'Incident Location',
    reportedBy: 'Reported By',
    assignedTo: 'Assigned To',
    dueDate: 'Due Date',
    status: 'Status',
  },
};

export default work;
