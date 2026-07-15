interface VerificationLogItem {
    field: string;
    value: string;
}

interface VerificationDataEntry {
    value?: Record<string, VerificationLogItem[]>;
}

export interface VehicleReportRow {
    id?: string;
    registration_number?: string;
    verification_data?: VerificationDataEntry[];
    verification_status?: string;
}

export interface AssessmentReportRow {
    name?: string;
    status?: string;
    target_completion_date?: string;
    assessment_templates?: { title?: string };
    employees?: { first_name?: string };
}

interface IncidentStatusRef {
    name?: string;
}

interface IncidentCategoryRef {
    name?: string;
}

interface IncidentPriorityRef {
    name?: string;
}

interface IncidentReportTypeRef {
    name?: string;
}

interface PersonInvolved {
    name?: string;
    role?: string;
    grades?: { name?: string };
    sections?: { name?: string };
}

export interface IncidentReportRow {
    incident_status?: IncidentStatusRef;
    incident_categories?: IncidentCategoryRef;
    incident_priorities?: IncidentPriorityRef;
    incident_report_types?: IncidentReportTypeRef;
    people_involved?: PersonInvolved[];
    date?: string;
    created_at?: string;
    reported_date?: string;
}

export interface GrievanceReportRow {
    status?: string;
    submitter_type?: string;
    submitter_name?: string;
    due_date?: string;
    created_at?: string;
    responses?: { subject?: string };
}

export interface EmployeeReportRow {
    id?: string;
    first_name?: string;
    last_name?: string;
    employee_id?: string;
    joining_date?: string;
}

export interface EmployeeDocumentReportRow {
    employee_id?: string;
    employee_name?: string;
    employee_code?: string;
    document_type_id?: string;
    document_type?: string;
    verification_status?: string;
}

export interface ChallanReportRow {
    amount?: number | string;
    registration_number?: string;
    name?: string;
    challan_number?: string;
    date?: string;
}

interface VehicleActionItem {
    vehicleNo?: string;
    owner: string;
    fc?: string;
    insurance?: string;
    puc?: string;
}

interface PendingEmployeeGroup {
    name: string;
    id: string;
    reasons: string[];
}

interface CategorySummary {
    name: string;
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
}

interface IncidentCategorySummaryItem {
    name: string;
    total: number;
    closed: number;
    progress: number;
    open: number;
}

interface GrievanceSourceSummaryItem {
    name: string;
    total: number;
    addressed: number;
    pending: number;
    overdue: number;
}

interface IndividualInvolved {
    name?: string;
    grade: string;
    title: string;
    category: string;
    date?: string;
}

export const getReportingPeriodText = (monthLabel: string) => {
    const [monthName, yearStr] = monthLabel.split(" ");
    const year = Number(yearStr);

    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();

    const lastDay = new Date(year, monthIndex + 1, 0).getDate();

    return `${monthName} ${year} • Reporting Period: ${monthName.slice(0, 3)} 1–${lastDay}, ${year}`;
};

export const getStatusStyle = (percent: number) => {
    if (percent >= 90) {
        return {
            label: "Good",
            style: {
                backgroundColor: "#d1fae5",
                color: "#065f46",
                padding: 3,
                borderRadius: 4,
                fontSize: 7,
            },
        };
    }

    if (percent >= 70) {
        return {
            label: "Needs Attention",
            style: {
                backgroundColor: "#fef3c7",
                color: "#92400e",
                padding: 3,
                borderRadius: 4,
                fontSize: 7,
            },
        };
    }

    return {
        label: "Critical",
        style: {
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            padding: 3,
            borderRadius: 4,
            fontSize: 7,
        },
    };
};

export const getExpiredVehicleDocsCount = (vehicles: VehicleReportRow[]) => {
    const today = new Date();
    let expiredCount = 0;

    vehicles.forEach((vehicle) => {
        // ✅ Only consider active verified vehicles
        if (vehicle.verification_status !== "active") {
            return;
        }

        const logObject = vehicle.verification_data?.[0]?.value;

        // No verification data → all docs missing
        if (!logObject) {
            expiredCount += 3;
            return;
        }

        const verificationLog = Object.values(logObject)[0] as VerificationLogItem[];
        if (!Array.isArray(verificationLog)) {
            expiredCount += 3;
            return;
        }

        const getField = (name: string) =>
            verificationLog.find((item) => item.field === name)?.value;

        // -------- PUCC --------
        const puccNumber = getField("pucc_number");
        const puccUpto = getField("pucc_upto");

        if (!puccNumber || !puccUpto || new Date(puccUpto) < today) {
            expiredCount++;
        }

        // -------- Insurance --------
        const insuranceUpto = getField("insurance_upto");

        if (!insuranceUpto || new Date(insuranceUpto) < today) {
            expiredCount++;
        }

        // -------- Fitness --------
        const fitUpto = getField("fit_up_to");

        if (!fitUpto || new Date(fitUpto) < today) {
            expiredCount++;
        }
    });

    return expiredCount;
};

export const getNewAssessmentCount = (assessments: AssessmentReportRow[]) => {
    if (!Array.isArray(assessments)) return 0;

    return assessments.filter(
        (a) => a.status?.toLowerCase() === "new"
    ).length;
};

export const getOpenIncidentCount = (incidents: IncidentReportRow[]) => {
    if (!Array.isArray(incidents)) return 0;

    return incidents.filter(
        (i) =>
            i.incident_status?.name?.toLowerCase() === "open"
    ).length;
};

export const getPendingGrievanceCount = (grievances: GrievanceReportRow[]) => {
    if (!Array.isArray(grievances)) return 0;

    return grievances.filter(
        (g) => g.status?.toLowerCase() === "pending"
    ).length;
};

export const getVehicleCompliance = (vehicles: VehicleReportRow[]) => {
    const activeVehicles = vehicles.filter(
        (v) => v.verification_status === "active"
    );

    const total = activeVehicles.length;
    let compliant = 0;

    activeVehicles.forEach(v => {
        const log = v.verification_data?.[0]?.value;
        if (!log) return;

        const data = Object.values(log)[0] as VerificationLogItem[];

        const today = new Date();

        const getDate = (field: string) =>
            new Date(data.find(d => d.field === field)?.value);

        const dates = [
            getDate("fit_up_to"),
            getDate("insurance_upto"),
            getDate("pucc_upto"),
        ];

        const expired = dates.some(d => !d || d < today);

        if (!expired) compliant++;
    });

    const percent = total === 0 ? 100 : Math.round((compliant / total) * 100);

    return { percent, compliant, total };
};

export const getAssessmentCompliance = (assessments: AssessmentReportRow[]) => {
    const total = assessments.length;

    const overdue = assessments.filter(
        (a) => a.status?.toLowerCase() === "new"
    ).length;

    const compliant = total - overdue;

    if (total === 0) return { percent: 100, overdue: 0 };

    const percent = Math.round((compliant / total) * 100);

    return { percent, overdue, total };
};

export const getEmployeeCompliance = (
    employees: EmployeeReportRow[],
    employeeDocuments: EmployeeDocumentReportRow[]
) => {
    const totalEmployees = employees.length;
    const totalEmployeesdocs = employeeDocuments.length;
    const pendingDocs = employeeDocuments.filter(
        (doc) => doc.verification_status !== "verified"
    ).length;

    const compliant = totalEmployeesdocs - pendingDocs;

    if (totalEmployeesdocs === 0) return { percent: 100, pending: 0 };

    const percent = Math.round((compliant / totalEmployeesdocs) * 100);

    return { percent, pending: pendingDocs, totalEmployeesdocs };
};

export const getIncidentCompliance = (incidents: IncidentReportRow[]) => {
    const total = incidents.length;
    const open = getOpenIncidentCount(incidents);

    const compliant = total - open;

    if (total === 0) return { percent: 100, open: 0 };

    const percent = Math.round((compliant / total) * 100);

    return { percent, open, total };
};

export const getGrievanceCompliance = (grievances: GrievanceReportRow[]) => {
    const total = grievances.length;
    const pending = getPendingGrievanceCount(grievances);

    const compliant = total - pending;

    if (total === 0) return { percent: 100, pending: 0 };

    const percent = Math.round((compliant / total) * 100);

    return { percent, pending, total };
};

export const getVehicleSummary = (vehicles: VehicleReportRow[]) => {
    const today = new Date();

    let total = 0;
    let compliant = 0;
    let nonCompliant = 0;
    let expiringSoon = 0;

    vehicles.forEach(v => {
        if (v.verification_status !== "active") return;

        total++;

        const log = v.verification_data?.[0]?.value;
        if (!log) {
            nonCompliant++;
            return;
        }

        const data = Object.values(log)[0] as VerificationLogItem[];

        const getDate = (field: string) =>
            new Date(data.find(d => d.field === field)?.value);

        const dates = [
            getDate("fit_up_to"),
            getDate("insurance_upto"),
            getDate("pucc_upto"),
        ];

        let expired = false;
        let soon = false;

        dates.forEach(d => {
            if (!d) return;

            const diffDays = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

            if (diffDays < 0) expired = true;
            else if (diffDays <= 30) soon = true;
        });

        if (expired) nonCompliant++;
        else if (soon) expiringSoon++;
        else compliant++;
    });

    return { total, compliant, nonCompliant, expiringSoon };
};

export const getDocumentComplianceStats = (vehicles: VehicleReportRow[]) => {
    const today = new Date();
    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 30);

    const stats = {
        fitness: { valid: 0, expired: 0, expiring: 0 },
        insurance: { valid: 0, expired: 0, expiring: 0 },
        puc: { valid: 0, expired: 0, expiring: 0 },
    };

    vehicles.forEach((vehicle) => {
        if (vehicle.verification_status !== "active") return;

        const logObject = vehicle.verification_data?.[0]?.value;
        if (!logObject) return;

        const verificationLog = Object.values(logObject)[0] as VerificationLogItem[];
        if (!Array.isArray(verificationLog)) return;

        const getDate = (field: string) => {
            const value = verificationLog.find((i) => i.field === field)?.value;
            return value ? new Date(value) : null;
        };

        const process = (date: Date | null, type: "fitness" | "insurance" | "puc") => {
            if (!date) {
                stats[type].expired++;
                return;
            }

            if (date < today) {
                stats[type].expired++;
            } else if (date <= soonDate) {
                stats[type].expiring++;
            } else {
                stats[type].valid++;
            }
        };

        process(getDate("fit_up_to"), "fitness");
        process(getDate("insurance_upto"), "insurance");
        process(getDate("pucc_upto"), "puc");
    });

    return stats;
};

export const getVehiclesRequiringAction = (vehicles: VehicleReportRow[]) => {
    const today = new Date();
    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 30);

    const result: VehicleActionItem[] = [];

    vehicles.forEach((vehicle) => {
        if (vehicle.verification_status !== "active") return;

        const logObject = vehicle.verification_data?.[0]?.value;
        if (!logObject) return;

        const verificationLog = Object.values(logObject)[0] as VerificationLogItem[];
        if (!Array.isArray(verificationLog)) return;

        const getField = (name: string) =>
            verificationLog.find((i) => i.field === name)?.value;

        const fc = getField("fit_up_to");
        const insurance = getField("insurance_upto");
        const puc = getField("pucc_upto");
        const owner = getField("owner_name");

        const fcDate = fc ? new Date(fc) : null;
        const insDate = insurance ? new Date(insurance) : null;
        const pucDate = puc ? new Date(puc) : null;

        const isCritical = (date: Date | null) =>
            !date || date < today || date <= soonDate;

        if (isCritical(fcDate) || isCritical(insDate) || isCritical(pucDate)) {
            result.push({
                vehicleNo: vehicle.registration_number,
                owner: owner || "--",
                fc,
                insurance,
                puc,
            });
        }
    });

    return result;
};

export const getDateCellStyle = (dateStr: string | null) => {
    const today = new Date();
    const soonDate = new Date();
    soonDate.setDate(today.getDate() + 30);

    if (!dateStr) {
        // Missing → treat as expired
        return {
            backgroundColor: "#f8d7da", // strong light red
            color: "#b91c1c",
        };
    }

    const date = new Date(dateStr);

    if (date < today) {
        // Expired
        return {
            backgroundColor: "#f8d7da",
            color: "#b91c1c",
        };
    }

    if (date <= soonDate) {
        // Expiring soon
        return {
            backgroundColor: "#fff3cd", // strong yellow like UI
            color: "#92400e",
        };
    }

    return {
        backgroundColor: "#fefefe",
        color: "#111827",
    };
};

export const getChallanSummary = (challans: ChallanReportRow[]) => {
    let total = 0;
    challans.forEach(c => {
        total += Number(c.amount || 0);
    });
    return total;
};

export const getPendingEmployeesGrouped = (employeeDocuments: EmployeeDocumentReportRow[]) => {
    const map: Record<string, PendingEmployeeGroup> = {};

    employeeDocuments.forEach((doc) => {

        if (doc.verification_status === "verified") return;

        const empId = doc.employee_id || "unknown";

        if (!map[empId]) {
            map[empId] = {
                name: doc.employee_name || "Employee",
                id: doc.employee_code || "-",
                reasons: [],
            };
        }

        map[empId].reasons.push(
            doc.verification_status === "expired"
                ? `${doc.document_type} Expired`
                : `${doc.document_type} Pending`
        );
    });

    return Object.values(map);
};

export const getAssessmentStats = (assessments: AssessmentReportRow[]) => {
    console.log(assessments, 'assessments items ');

    const total = assessments.length;
    const completed = assessments.filter(a => a.status === "Submitted").length;
    const inProgress = assessments.filter(a => a.status === "New").length;
    const overdue = assessments.filter(a => a.status === "overdue").length;

    const rate = total ? Math.round((completed / total) * 100) : 100;

    return { total, completed, inProgress, overdue, rate };
};

export const getAssessmentByCategory = (assessments: AssessmentReportRow[]) => {
    const map: Record<string, Omit<CategorySummary, "name">> = {};

    assessments.forEach(a => {
        const cat = a.assessment_templates.title || "Other";

        if (!map[cat]) {
            map[cat] = { total: 0, completed: 0, inProgress: 0, overdue: 0 };
        }

        map[cat].total++;

        if (a.status === "Submitted") map[cat].completed++;
        else if (a.status === "New") map[cat].inProgress++;
        else if (a.status === "overdue") map[cat].overdue++;
    });

    return Object.entries(map).map(([name, v]): CategorySummary => ({ name, ...v }));
};

export const getIncidentStats = (incidents: IncidentReportRow[]) => {
    const total = incidents.length;

    const closed = incidents.filter(
        (i) => i.incident_status?.name?.toLowerCase() === "closed"
    ).length;

    const inProgress = incidents.filter(
        (i) => i.incident_status?.name?.toLowerCase() === "in progress"
    ).length;

    const open = incidents.filter(
        (i) => i.incident_status?.name?.toLowerCase() === "open"
    ).length;

    const resolutionRate =
        total === 0 ? 100 : Math.round((closed / total) * 100);

    return { total, closed, inProgress, open, resolutionRate };
};

export const getIncidentCategorySummary = (incidents: IncidentReportRow[]) => {
    const map: Record<string, Omit<IncidentCategorySummaryItem, "name">> = {};

    incidents.forEach((i) => {

        const category = i.incident_categories.name || "Others";
        const status = i.incident_status?.name?.toLowerCase();

        if (!map[category]) {
            map[category] = { total: 0, closed: 0, progress: 0, open: 0 };
        }

        map[category].total++;

        if (status === "closed") map[category].closed++;
        else if (status === "Open") map[category].progress++;
        else map[category].open++;
    });

    return Object.entries(map).map(([name, data]): IncidentCategorySummaryItem => ({
        name,
        ...data,
    }));
};

export const getCriticalIncidents = (incidents: IncidentReportRow[]) => {
    return incidents.filter((i) => {

        const status = i.incident_status?.name?.toLowerCase();
        const priority = i.incident_priorities.name?.toLowerCase();
        return status !== "closed" && (priority === "high" || priority === "critical");
    });
};

export const getIndividualsFromIncidents = (incidents: IncidentReportRow[]) => {
    const list: IndividualInvolved[] = [];
    console.log(incidents, 'incident student involved');

    incidents.forEach((inc) => {
        if (inc.people_involved?.length) {
            inc.people_involved.forEach((p) => {
                list.push({
                    name: p.name,
                    grade:
                        p.grades?.name && p.sections?.name
                            ? `${p.grades.name} ${p.sections.name}`
                            : p.grades?.name || p.role || "-",
                    title: inc.incident_report_types?.name || "-",
                    category: inc.incident_categories?.name || "-",
                    date: inc.date || inc.created_at,
                });
            });
        }
    });

    return list;
};

export const getGrievanceStats = (grievances: GrievanceReportRow[]) => {
    const total = grievances.length;

    const addressed = grievances.filter(
        (g) => g.status?.toLowerCase() === "acknowledged"
    ).length;

    const pending = grievances.filter(
        (g) => g.status?.toLowerCase() === "pending"
    ).length;

    const overdue = grievances.filter(
        (g) =>
            g.status?.toLowerCase() === "pending" &&
            g.due_date &&
            new Date(g.due_date) < new Date()
    ).length;

    const resolutionRate =
        total === 0 ? 100 : Math.round((addressed / total) * 100);

    return { total, addressed, pending, overdue, resolutionRate };
};

export const getGrievanceSourceSummary = (grievances: GrievanceReportRow[]) => {
    const map: Record<string, Omit<GrievanceSourceSummaryItem, "name">> = {};

    grievances.forEach((g) => {
        const source = g.submitter_type || "Others";
        const status = g.status?.toLowerCase();

        if (!map[source]) {
            map[source] = { total: 0, addressed: 0, pending: 0, overdue: 0 };
        }

        map[source].total++;

        if (status === "resolved" || status === "closed") {
            map[source].addressed++;
        } else if (status === "pending") {
            map[source].pending++;

            if (g.due_date && new Date(g.due_date) < new Date()) {
                map[source].overdue++;
            }
        }
    });

    return Object.entries(map).map(([name, data]): GrievanceSourceSummaryItem => ({
        name,
        ...data,
    }));
};

export const getCriticalGrievances = (grievances: GrievanceReportRow[]) => {
    const today = new Date();

    return grievances.filter((g) => {
        const status = g.status?.toLowerCase();
        if (status !== "pending") return false;

        if (!g.due_date) return true;
        return new Date(g.due_date) < today;
    });
};