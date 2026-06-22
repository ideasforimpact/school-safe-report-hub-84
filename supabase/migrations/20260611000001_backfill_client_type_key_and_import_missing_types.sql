-- Migration: Backfill client_type_id for existing rows and insert missing type data
--
-- Two steps:
--   1. For every row in config tables where client_type_id IS NULL, set it to the
--      client's actual type id (derived from clients.client_type_id).
--   2. For every existing client, insert template data for all 3 types (school / work /
--      institute) that are not already present — using cross joins instead of a per-client
--      loop so all clients are handled in a single SQL statement per table.

DO $$
DECLARE
  school_id UUID;
  work_id   UUID;
  inst_id   UUID;
BEGIN

  -- Resolve client_type UUIDs once
  SELECT id INTO school_id FROM public.client_type WHERE key = 'school';
  SELECT id INTO work_id   FROM public.client_type WHERE key = 'work';
  SELECT id INTO inst_id   FROM public.client_type WHERE key = 'institute';

  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 1: Backfill NULL client_type_id using the client's own type
  -- ────────────────────────────────────────────────────────────────────────────

  UPDATE public.contributing_factors cf
  SET    client_type_id = c.client_type_id
  FROM   public.clients c
  WHERE  cf.client_id = c.id AND cf.client_type_id IS NULL;

  UPDATE public.incident_report_types rt
  SET    client_type_id = c.client_type_id
  FROM   public.clients c
  WHERE  rt.client_id = c.id AND rt.client_type_id IS NULL;

  UPDATE public.incident_priorities pr
  SET    client_type_id = c.client_type_id
  FROM   public.clients c
  WHERE  pr.client_id = c.id AND pr.client_type_id IS NULL;

  UPDATE public.incident_categories ic
  SET    client_type_id = c.client_type_id
  FROM   public.clients c
  WHERE  ic.client_id = c.id AND ic.client_type_id IS NULL;

  UPDATE public.incident_subcategories sc
  SET    client_type_id = ic.client_type_id
  FROM   public.incident_categories ic
  WHERE  sc.category_id = ic.id AND sc.client_type_id IS NULL;

  UPDATE public.custom_forms cf
  SET    client_type_id = c.client_type_id
  FROM   public.clients c
  WHERE  cf.client_id = c.id AND cf.client_type_id IS NULL;

  UPDATE public.assessment_templates at
  SET    client_type_id = c.client_type_id
  FROM   public.clients c
  WHERE  at.client_id = c.id AND at.client_type_id IS NULL;


  -- ────────────────────────────────────────────────────────────────────────────
  -- STEP 2: Insert missing template data for all clients × all 3 types
  --         Uses CROSS JOIN so every client gets the templates in one statement.
  --         NOT EXISTS guards prevent duplicates.
  -- ────────────────────────────────────────────────────────────────────────────

  -- ── Contributing Factors ──────────────────────────────────────────────────

  INSERT INTO public.contributing_factors (name, description, client_id, client_type_id)
  SELECT v.name, v.description, c.id, school_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Facility or Equipment',    'Faulty, missing, or unsafe facility or equipment'),
    ('Human Error',              'Mistake, carelessness, or failure to follow procedures'),
    ('Lack of Supervision',      'No or inadequate monitoring during the incident'),
    ('Non Compliance with Rules','Not following established safety or conduct guidelines'),
    ('Poor Communication',       'Delay or missed communication'),
    ('Environmental Factors',    'Weather, lighting, or other environmental conditions'),
    ('Training Deficiencies',    'Insufficient training or knowledge gaps'),
    ('System Failure',           'Technical or system-related failures')
  ) AS v(name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.contributing_factors x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = school_id
  );

  INSERT INTO public.contributing_factors (name, description, client_id, client_type_id)
  SELECT v.name, v.description, c.id, work_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Inadequate Training',                       'Insufficient job-specific or safety training provided to the employee'),
    ('Equipment or Tool Failure',                 'Faulty, poorly maintained, or inappropriate equipment or tools'),
    ('Human Error',                               'Mistake, carelessness, or failure to follow established procedures'),
    ('Lack of Supervision',                       'Inadequate or absent oversight during the task or incident'),
    ('Policy or Procedure Non-Compliance',        'Failure to follow workplace safety rules, policies, or standard operating procedures'),
    ('Workplace Stress or Fatigue',               'Physical or mental exhaustion, overwork, or high-pressure environment'),
    ('Poor Communication',                        'Miscommunication, delayed information, or lack of clarity between teams or individuals'),
    ('Environmental or Facility Hazard',          'Unsafe physical conditions such as poor lighting, wet floors, or extreme temperatures'),
    ('Organizational Culture or Management Issue','Toxic culture, lack of accountability, or management failures contributing to the incident'),
    ('System or IT Failure',                      'Technical or software failures that contributed to the incident')
  ) AS v(name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.contributing_factors x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = work_id
  );

  INSERT INTO public.contributing_factors (name, description, client_id, client_type_id)
  SELECT v.name, v.description, c.id, inst_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Inadequate Student Supervision',   'Insufficient monitoring of students in classrooms, labs, hostels, or common areas'),
    ('Policy Non-Compliance',            'Failure by students, faculty, or staff to follow institute rules and code of conduct'),
    ('Facility or Infrastructure Hazard','Unsafe physical conditions such as broken equipment, poor lighting, or structural issues'),
    ('Academic Pressure or Stress',      'Excessive academic demands, examination stress, or competitive environment'),
    ('Lack of Awareness or Training',    'Insufficient orientation, safety training, or awareness programs for students or staff'),
    ('Peer Influence',                   'Negative influence from peer groups leading to misconduct or unsafe behavior'),
    ('Poor Communication',               'Miscommunication between students, faculty, administration, or parents'),
    ('Mental Health or Wellbeing Factor','Underlying mental health challenges, personal issues, or emotional distress'),
    ('System or IT Failure',             'Technical failures in academic portals, exam systems, or campus IT infrastructure'),
    ('Environmental or External Factor', 'Weather, off-campus events, or external circumstances contributing to the incident')
  ) AS v(name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.contributing_factors x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = inst_id
  );


  -- ── Report Types ──────────────────────────────────────────────────────────

  INSERT INTO public.incident_report_types (name, description, is_active, client_id, client_type_id)
  SELECT v.name, v.description, true, c.id, school_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Incident Report',          'Standard incident reporting form'),
    ('Near Miss Report',         'Report for incidents that could have caused harm'),
    ('Hazard Report',            'Report for potential safety hazards'),
    ('Emergency Report',         'Urgent incident requiring immediate attention'),
    ('Follow-up Report',         'Follow-up documentation for previous incidents'),
    ('Investigation Report',     'Detailed investigation findings and analysis'),
    ('Corrective Action Report', 'Documentation of corrective measures taken'),
    ('Training Incident Report', 'Incidents occurring during training activities')
  ) AS v(name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_report_types x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = school_id
  );

  INSERT INTO public.incident_report_types (name, description, is_active, client_id, client_type_id)
  SELECT v.name, v.description, true, c.id, work_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Workplace Incident Report',             'Standard report for any workplace accident, injury, or unsafe event'),
    ('Near Miss Report',                      'Report for events that could have caused harm but did not'),
    ('Hazard Identification Report',          'Report identifying a potential safety hazard in the workplace'),
    ('Harassment or Discrimination Complaint','Formal complaint related to harassment, bullying, or discriminatory behavior'),
    ('Grievance Report',                      'Employee grievance regarding working conditions, management, or HR matters'),
    ('Security Incident Report',              'Report for physical or cyber security breaches or threats'),
    ('Investigation Report',                  'Detailed findings and analysis following a formal investigation'),
    ('Corrective Action Report',              'Documentation of corrective or preventive measures taken after an incident'),
    ('Emergency Response Report',             'Report documenting emergency situations and the response taken')
  ) AS v(name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_report_types x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = work_id
  );

  INSERT INTO public.incident_report_types (name, description, is_active, client_id, client_type_id)
  SELECT v.name, v.description, true, c.id, inst_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Incident Report',                     'Standard report for accidents, injuries, or safety incidents on campus'),
    ('Student Grievance Report',            'Formal complaint raised by a student regarding academic or campus issues'),
    ('Ragging or Bullying Complaint',       'Report for incidents of ragging, bullying, or peer harassment'),
    ('Sexual Harassment Complaint (POSH)',  'Formal complaint under the Prevention of Sexual Harassment policy'),
    ('Academic Misconduct Report',          'Report for plagiarism, cheating, exam irregularities, or research misconduct'),
    ('Infrastructure or Facilities Report', 'Report for physical damage, hazards, or facility-related issues on campus'),
    ('Near Miss Report',                    'Report for incidents that could have caused harm but did not'),
    ('Emergency Report',                    'Report for urgent situations requiring immediate response'),
    ('Investigation Report',               'Detailed findings and analysis following a formal campus investigation'),
    ('Corrective Action Report',            'Documentation of corrective or preventive measures following an incident')
  ) AS v(name, description)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_report_types x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = inst_id
  );


  -- ── Priorities ────────────────────────────────────────────────────────────
  -- Same names/colors across all 3 types — inserted separately per type so
  -- each client sees exactly one set filtered by their client_type_id.

  INSERT INTO public.incident_priorities (name, color, weight, is_active, client_id, client_type_id)
  SELECT v.name, v.color, v.weight, true, c.id, t.type_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Critical',      '#dc2626', 1),
    ('High',          '#ea580c', 2),
    ('Medium',        '#d97706', 3),
    ('Low',           '#16a34a', 4),
    ('Informational', '#6b7280', 5)
  ) AS v(name, color, weight)
  CROSS JOIN (VALUES (school_id), (work_id), (inst_id)) AS t(type_id)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_priorities x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = t.type_id
  );


  -- ── Categories + Subcategories ────────────────────────────────────────────
  -- Step A: insert all categories for all clients in one statement per type.
  -- Step B: insert subcategories by joining back to the just-inserted categories
  --         to resolve category_id — no loop variable needed.

  -- SCHOOL categories
  INSERT INTO public.incident_categories (name, client_id, client_type_id)
  SELECT v.name, c.id, school_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Student Behaviour & Discipline'),('Safety & Security'),('Health & Medical'),
    ('Staff Conduct & Performance'),('Parent or Visitor Related'),('Infrastructure & Facilities'),
    ('Cyber & IT Related'),('Emergency & Crisis Management'),('Academic & Administrative'),
    ('Interpersonal Conflicts'),('Positive Incident Reporting')
  ) AS v(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_categories x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = school_id
  );

  -- WORK categories
  INSERT INTO public.incident_categories (name, client_id, client_type_id)
  SELECT v.name, c.id, work_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Workplace Safety & Health'),('Harassment & Discrimination'),('Employee Conduct & Misconduct'),
    ('Management & HR Issues'),('Infrastructure & Facilities'),('Emergency & Crisis Management'),
    ('Cyber & IT Security'),('Positive Incident Reporting')
  ) AS v(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_categories x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = work_id
  );

  -- INSTITUTE categories
  INSERT INTO public.incident_categories (name, client_id, client_type_id)
  SELECT v.name, c.id, inst_id
  FROM public.clients c
  CROSS JOIN (VALUES
    ('Student Conduct & Discipline'),('Safety & Security'),('Health & Medical'),
    ('Faculty & Staff Conduct'),('Infrastructure & Facilities'),('Academic & Administrative'),
    ('Cyber & IT Security'),('Positive Incident Reporting')
  ) AS v(name)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_categories x
    WHERE x.client_id = c.id AND x.name = v.name AND x.client_type_id = inst_id
  );

  -- SCHOOL subcategories (join to categories to get category_id)
  INSERT INTO public.incident_subcategories (name, category_id, client_id, client_type_id)
  SELECT v.sub_name, ic.id, ic.client_id, school_id
  FROM public.incident_categories ic
  JOIN public.clients c ON c.id = ic.client_id
  JOIN (VALUES
    ('Student Behaviour & Discipline', 'Bullying / Harassment (verbal, physical, cyber)'),
    ('Student Behaviour & Discipline', 'Use of abusive language'),
    ('Student Behaviour & Discipline', 'Disobedience / Defiance'),
    ('Student Behaviour & Discipline', 'Fighting / Physical altercation'),
    ('Student Behaviour & Discipline', 'Damage to school property'),
    ('Student Behaviour & Discipline', 'Truancy / Skipping class'),
    ('Student Behaviour & Discipline', 'Cheating / Academic dishonesty'),
    ('Student Behaviour & Discipline', 'Theft / Possession of stolen items'),
    ('Student Behaviour & Discipline', 'Inappropriate clothing or uniform violation'),
    ('Student Behaviour & Discipline', 'Mobile phone misuse / Social media misuse'),
    ('Student Behaviour & Discipline', 'Substance use or possession (tobacco, drugs)'),
    ('Student Behaviour & Discipline', 'Misconduct during school transport'),
    ('Safety & Security', 'Slip, trip, or fall injury'),
    ('Safety & Security', 'Playground accident'),
    ('Safety & Security', 'Laboratory accident (chemical/equipment injury)'),
    ('Safety & Security', 'Electrical hazard / shock'),
    ('Safety & Security', 'Fire / Smoke incident'),
    ('Safety & Security', 'Unsafe infrastructure (broken furniture, staircase, etc.)'),
    ('Safety & Security', 'Stranger in school premises'),
    ('Safety & Security', 'Transportation accident (school bus)'),
    ('Safety & Security', 'Security breach (unauthorized access, missing student)'),
    ('Safety & Security', 'Lost & Found (important belongings)'),
    ('Health & Medical', 'Injury during sports / PE'),
    ('Health & Medical', 'Allergic reaction'),
    ('Health & Medical', 'Fever / Sudden illness'),
    ('Health & Medical', 'Food poisoning / Canteen-related issue'),
    ('Health & Medical', 'Communicable disease case (measles, flu, etc.)'),
    ('Health & Medical', 'Mental health / Emotional distress'),
    ('Health & Medical', 'Fainting / Unconscious student'),
    ('Health & Medical', 'Chronic condition episode (asthma, diabetes, etc.)'),
    ('Health & Medical', 'Medication error or delay'),
    ('Health & Medical', 'Menstrual health concern (for girls)'),
    ('Staff Conduct & Performance', 'Verbal or physical misconduct towards students'),
    ('Staff Conduct & Performance', 'Absenteeism / Late reporting'),
    ('Staff Conduct & Performance', 'Academic negligence / Not completing syllabus'),
    ('Staff Conduct & Performance', 'Favoritism / Unfair grading'),
    ('Staff Conduct & Performance', 'Unprofessional behaviour (language, attire)'),
    ('Staff Conduct & Performance', 'Misuse of authority'),
    ('Staff Conduct & Performance', 'Conflict with other staff'),
    ('Staff Conduct & Performance', 'Data breach (sharing student info)'),
    ('Staff Conduct & Performance', 'Harassment / Discrimination'),
    ('Parent or Visitor Related', 'Parent aggression / Verbal abuse'),
    ('Parent or Visitor Related', 'Unauthorized entry'),
    ('Parent or Visitor Related', 'Late pickup / No pickup'),
    ('Parent or Visitor Related', 'Disagreement during PTM'),
    ('Parent or Visitor Related', 'Complaint about staff or student'),
    ('Parent or Visitor Related', 'Suspicious visitor activity'),
    ('Infrastructure & Facilities', 'Broken classroom furniture'),
    ('Infrastructure & Facilities', 'Water leakage / Plumbing issue'),
    ('Infrastructure & Facilities', 'Power failure'),
    ('Infrastructure & Facilities', 'Internet / Network outage'),
    ('Infrastructure & Facilities', 'Air-conditioning / Ventilation issue'),
    ('Infrastructure & Facilities', 'Transportation breakdown'),
    ('Infrastructure & Facilities', 'Waste management issue'),
    ('Infrastructure & Facilities', 'Canteen hygiene issue'),
    ('Infrastructure & Facilities', 'Library / Lab equipment damage'),
    ('Infrastructure & Facilities', 'Fire extinguisher / CCTV not functional'),
    ('Cyber & IT Related', 'Cyberbullying'),
    ('Cyber & IT Related', 'Unauthorized access to school systems'),
    ('Cyber & IT Related', 'Data privacy violation'),
    ('Cyber & IT Related', 'Inappropriate use of school devices'),
    ('Cyber & IT Related', 'Exam paper leak'),
    ('Cyber & IT Related', 'Social media impersonation'),
    ('Cyber & IT Related', 'Virus / Malware attack'),
    ('Cyber & IT Related', 'Online class misconduct (camera/mic misuse, chat abuse)'),
    ('Emergency & Crisis Management', 'Natural disaster (flood, earthquake)'),
    ('Emergency & Crisis Management', 'Fire / Explosion'),
    ('Emergency & Crisis Management', 'Bomb threat / Suspicious object'),
    ('Emergency & Crisis Management', 'Missing student'),
    ('Emergency & Crisis Management', 'Death / Fatal injury'),
    ('Emergency & Crisis Management', 'Riot / Protest near school'),
    ('Emergency & Crisis Management', 'Pandemic / Contagious outbreak'),
    ('Emergency & Crisis Management', 'Evacuation drill / Lockdown report'),
    ('Academic & Administrative', 'Exam paper error'),
    ('Academic & Administrative', 'Missing student record / wrong data'),
    ('Academic & Administrative', 'Timetable error'),
    ('Academic & Administrative', 'Late distribution of report cards'),
    ('Academic & Administrative', 'School transport scheduling issue'),
    ('Academic & Administrative', 'Canteen overcharge'),
    ('Academic & Administrative', 'Fee dispute / Missing payment record'),
    ('Interpersonal Conflicts', 'Student vs Student conflict'),
    ('Interpersonal Conflicts', 'Student vs Teacher disagreement'),
    ('Interpersonal Conflicts', 'Teacher vs Teacher conflict'),
    ('Interpersonal Conflicts', 'Parent vs Teacher dispute'),
    ('Interpersonal Conflicts', 'Parent vs Management issue'),
    ('Interpersonal Conflicts', 'Peer group bullying or exclusion'),
    ('Positive Incident Reporting', 'Student bravery or honesty'),
    ('Positive Incident Reporting', 'Teacher excellence'),
    ('Positive Incident Reporting', 'Peer support or mentoring'),
    ('Positive Incident Reporting', 'Innovation / Initiative by students'),
    ('Positive Incident Reporting', 'Successful conflict resolution'),
    ('Positive Incident Reporting', 'Safety suggestion implemented')
  ) AS v(cat_name, sub_name) ON ic.name = v.cat_name AND ic.client_type_id = school_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_subcategories x
    WHERE x.category_id = ic.id AND x.name = v.sub_name
  );

  -- WORK subcategories
  INSERT INTO public.incident_subcategories (name, category_id, client_id, client_type_id)
  SELECT v.sub_name, ic.id, ic.client_id, work_id
  FROM public.incident_categories ic
  JOIN public.clients c ON c.id = ic.client_id
  JOIN (VALUES
    ('Workplace Safety & Health', 'Slip, trip, or fall injury'),
    ('Workplace Safety & Health', 'Equipment malfunction or misuse'),
    ('Workplace Safety & Health', 'Chemical or hazardous material exposure'),
    ('Workplace Safety & Health', 'Ergonomic injury (repetitive strain, back injury)'),
    ('Workplace Safety & Health', 'Fire or explosion'),
    ('Workplace Safety & Health', 'Electrical hazard or shock'),
    ('Workplace Safety & Health', 'Fatigue or heat-related illness'),
    ('Workplace Safety & Health', 'Personal Protective Equipment (PPE) violation'),
    ('Harassment & Discrimination', 'Sexual harassment'),
    ('Harassment & Discrimination', 'Racial or ethnic discrimination'),
    ('Harassment & Discrimination', 'Gender-based discrimination'),
    ('Harassment & Discrimination', 'Workplace bullying or intimidation'),
    ('Harassment & Discrimination', 'Verbal abuse or threatening behavior'),
    ('Harassment & Discrimination', 'Religious or caste-based discrimination'),
    ('Harassment & Discrimination', 'Disability-related discrimination'),
    ('Employee Conduct & Misconduct', 'Theft or fraud'),
    ('Employee Conduct & Misconduct', 'Substance abuse on premises'),
    ('Employee Conduct & Misconduct', 'Unauthorized access or data breach'),
    ('Employee Conduct & Misconduct', 'Conflict of interest'),
    ('Employee Conduct & Misconduct', 'Absenteeism or tardiness'),
    ('Employee Conduct & Misconduct', 'Violation of company policy'),
    ('Employee Conduct & Misconduct', 'Misuse of company resources'),
    ('Management & HR Issues', 'Unfair performance evaluation'),
    ('Management & HR Issues', 'Wrongful termination concern'),
    ('Management & HR Issues', 'Favoritism or nepotism'),
    ('Management & HR Issues', 'Retaliation after complaint'),
    ('Management & HR Issues', 'Pay or benefits dispute'),
    ('Management & HR Issues', 'Micromanagement or excessive monitoring'),
    ('Infrastructure & Facilities', 'Power failure'),
    ('Infrastructure & Facilities', 'Internet or network outage'),
    ('Infrastructure & Facilities', 'HVAC or ventilation failure'),
    ('Infrastructure & Facilities', 'Structural damage or unsafe premises'),
    ('Infrastructure & Facilities', 'Sanitation or hygiene issue'),
    ('Infrastructure & Facilities', 'Security breach'),
    ('Emergency & Crisis Management', 'Natural disaster (flood, earthquake)'),
    ('Emergency & Crisis Management', 'Medical emergency'),
    ('Emergency & Crisis Management', 'Bomb threat or suspicious package'),
    ('Emergency & Crisis Management', 'Pandemic or disease outbreak'),
    ('Emergency & Crisis Management', 'Evacuation drill or lockdown'),
    ('Cyber & IT Security', 'Phishing or social engineering attack'),
    ('Cyber & IT Security', 'Ransomware or malware attack'),
    ('Cyber & IT Security', 'Data privacy or confidentiality breach'),
    ('Cyber & IT Security', 'Unauthorized device or software use'),
    ('Cyber & IT Security', 'Account compromise'),
    ('Positive Incident Reporting', 'Employee safety suggestion implemented'),
    ('Positive Incident Reporting', 'Outstanding performance or initiative'),
    ('Positive Incident Reporting', 'Peer support or mentoring'),
    ('Positive Incident Reporting', 'Successful conflict resolution')
  ) AS v(cat_name, sub_name) ON ic.name = v.cat_name AND ic.client_type_id = work_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_subcategories x
    WHERE x.category_id = ic.id AND x.name = v.sub_name
  );

  -- INSTITUTE subcategories
  INSERT INTO public.incident_subcategories (name, category_id, client_id, client_type_id)
  SELECT v.sub_name, ic.id, ic.client_id, inst_id
  FROM public.incident_categories ic
  JOIN public.clients c ON c.id = ic.client_id
  JOIN (VALUES
    ('Student Conduct & Discipline', 'Bullying or ragging'),
    ('Student Conduct & Discipline', 'Academic dishonesty (plagiarism, cheating)'),
    ('Student Conduct & Discipline', 'Substance use on campus'),
    ('Student Conduct & Discipline', 'Physical altercation between students'),
    ('Student Conduct & Discipline', 'Property damage'),
    ('Student Conduct & Discipline', 'Unauthorized absence'),
    ('Student Conduct & Discipline', 'Social media misuse'),
    ('Safety & Security', 'Slip, trip, or fall injury'),
    ('Safety & Security', 'Laboratory accident'),
    ('Safety & Security', 'Unauthorized entry on campus'),
    ('Safety & Security', 'Fire or smoke incident'),
    ('Safety & Security', 'Electrical hazard'),
    ('Safety & Security', 'Theft or robbery'),
    ('Safety & Security', 'Security breach or access control failure'),
    ('Health & Medical', 'Injury during sports or physical activity'),
    ('Health & Medical', 'Mental health crisis or emotional distress'),
    ('Health & Medical', 'Communicable disease outbreak'),
    ('Health & Medical', 'Allergic reaction or food poisoning'),
    ('Health & Medical', 'Fainting or medical emergency'),
    ('Faculty & Staff Conduct', 'Harassment by faculty or staff'),
    ('Faculty & Staff Conduct', 'Unfair grading or academic bias'),
    ('Faculty & Staff Conduct', 'Research misconduct'),
    ('Faculty & Staff Conduct', 'Conflict of interest'),
    ('Faculty & Staff Conduct', 'Absenteeism or academic negligence'),
    ('Infrastructure & Facilities', 'Power failure'),
    ('Infrastructure & Facilities', 'Internet or network outage'),
    ('Infrastructure & Facilities', 'HVAC or ventilation failure'),
    ('Infrastructure & Facilities', 'Plumbing or water supply issue'),
    ('Infrastructure & Facilities', 'Lab equipment damage or malfunction'),
    ('Infrastructure & Facilities', 'Canteen or food service issue'),
    ('Academic & Administrative', 'Examination irregularity'),
    ('Academic & Administrative', 'Incorrect academic records'),
    ('Academic & Administrative', 'Fee or scholarship dispute'),
    ('Academic & Administrative', 'Timetable or scheduling conflict'),
    ('Academic & Administrative', 'Hostel or accommodation issue'),
    ('Cyber & IT Security', 'Cyberbullying or online harassment'),
    ('Cyber & IT Security', 'Unauthorized access to academic systems'),
    ('Cyber & IT Security', 'Data breach or privacy violation'),
    ('Cyber & IT Security', 'Malware or virus attack'),
    ('Cyber & IT Security', 'Exam or result system tampering'),
    ('Positive Incident Reporting', 'Student excellence or innovation'),
    ('Positive Incident Reporting', 'Faculty excellence'),
    ('Positive Incident Reporting', 'Peer support or mentoring'),
    ('Positive Incident Reporting', 'Safety suggestion implemented')
  ) AS v(cat_name, sub_name) ON ic.name = v.cat_name AND ic.client_type_id = inst_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.incident_subcategories x
    WHERE x.category_id = ic.id AND x.name = v.sub_name
  );

END $$;
