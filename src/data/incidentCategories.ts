
import { IncidentCategory } from "@/types/incident";

// Adding subcategories mapping
export const subcategories: Record<IncidentCategory, string[]> = {
  'Physical Injury': [
    'Slipped on wet floor',
    'Playground or sports injury',
    'Injury from furniture or equipment',
    'Science/lab-related accidents',
    'Falls from stairs/benches',
    'Animal/insect bites on campus',
    'Other'
  ],
  'Bullying': [
    'Name-calling, teasing, mocking',
    'Physical fighting or intimidation',
    'Cyberbullying via messages/social media',
    'Spreading rumors or private info',
    'Targeted bullying (caste, appearance, disability)',
    'Other'
  ],
  'Tech Misuse': [
    'Using phone or laptop without permission',
    'Watching inappropriate videos',
    'Taking photos or videos without permission',
    'Cheating using AI tools or online answers',
    'Using VPN to access blocked websites',
    'Sharing or saving obscene or harmful content',
    'Being part of inappropriate online groups',
    'Using school Wi-Fi for wrong purposes',
    'Creating fake accounts of students or staff',
    'Cyberbullying or online harassment',
    'Other'
  ],
  'Property Damage': [
    'Vandalism (desks, walls, restrooms)',
    'Damage to lab/sports/classroom equipment',
    'Destruction of library or digital assets',
    'Electrical/plumbing fixture damage',
    'Tampering with CCTV or smart boards',
    'Other'
  ],
  'Health Concern': [
    'Fainting, seizures, or sudden illness',
    'Asthma/allergy attacks',
    'Menstrual health emergencies',
    'Accidents causing bleeding/fractures',
    'Food poisoning or dehydration',
    'Suspected communicable disease',
    'Other'
  ],
  'Security Breach': [
    'Unauthorized entry of outsiders',
    'Suspicious person or object found',
    'Safety violation',
    'Emergency exits blocked or locked',
    'Other'
  ],
  'Other': ['Other']
};

// Near Miss subcategories
export const nearMissSubcategories: Record<string, string[]> = {
  'Fall or Physical Injury Risk': [
    'Wet or slippery floors',
    'Uneven flooring or broken stairs',
    'Playground equipment failure',
    'Rough play almost causing injury',
    'Sports equipment narrowly missing someone',
    'Other'
  ],
  'Electrical / Fire / Infrastructure Risk': [
    'Exposed wires or sparks',
    'Electrical socket misuse or overloading',
    'Fire alarm not working during drill',
    'Combustible items near heat sources',
    'Ceiling fan wobbling, window glass nearly breaking',
    'Door/gate slamming due to wind',
    'Other'
  ],
  'Transport & Movement Risk': [
    'Student almost fell while boarding/exiting school bus',
    'Vehicle reversing without seeing nearby student',
    'Running in corridors/stairs almost causing a fall',
    'Other'
  ],
  'Behavioral / Technology Misuse': [
    'Object thrown narrowly missing someone',
    'Student using mobile in sensitive areas',
    'Device overheating or misused',
    'Near misuse of AI tools or unsafe browsing',
    'Other'
  ],
  'External / Unauthorized Access Risk': [
    'Student seen near construction or restricted zone',
    'Unidentified person near campus entry/exit',
    'Gate or restricted door left open accidentally',
    'Other'
  ]
};

// Unsafe Condition subcategories
export const unsafeConditionSubcategories: Record<string, string[]> = {
  'Building & Infrastructure Hazards': [
    'Broken tiles, loose railings, or damaged stairs',
    'Cracked windowpanes or unstable fixtures',
    'Incomplete construction zones left open',
    'Poor lighting in corridors or staircases',
    'Other'
  ],
  'Electrical / Fire Safety Concerns': [
    'Exposed wiring or open electrical boxes',
    'Overloaded power sockets or plug points',
    'Fire extinguishers missing or not working',
    'Blocked emergency exits or fire routes',
    'Other'
  ],
  'Playground / Sports Area Issues': [
    'Damaged swings, slides, or seesaw',
    'Loose bolts or unstable equipment',
    'Sharp edges or rusted metal in play areas',
    'Uneven playing surface or unsafe sports gear',
    'Other'
  ],
  'Transport & Vehicular Risks': [
    'Buses without proper railing or handhold',
    'Broken steps or sharp edges in transport vehicles',
    'Lack of supervision during pick-up/drop-off',
    'No speed breakers or warning signs in school driveway',
    'Other'
  ],
  'Hygiene & Health-Related Hazards': [
    'Dirty or slippery restrooms',
    'Stagnant water near drinking areas',
    'Uncovered dustbins attracting pests',
    'Spoiled food or unsafe canteen storage',
    'Other'
  ],
  'Technology & Surveillance Gaps': [
    'Non-functioning CCTV cameras',
    'Wi-Fi access in unauthorized zones',
    'Poor digital access control for sensitive areas',
    'Other'
  ],
  'Weather / Natural Hazards': [
    'Water leakage during rain',
    'Open drains or unmarked wet areas',
    'Trees with broken branches near pathways',
    'Other'
  ]
};
