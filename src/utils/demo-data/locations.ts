import { FacilityMapping } from './types';

// Locations
export const locations = ['On Campus', 'Off Campus', 'In Transit', 'During Function'];

// Facility mappings based on location
export const facilityMappings: FacilityMapping[] = [
  {
    location: 'On Campus',
    facilities: [
      'Classroom Building A',
      'Classroom Building B',
      'Gymnasium',
      'Playground',
      'Athletic Field',
      'Cafeteria',
      'Main Office',
      'Library',
      'Science Lab',
      'Computer Lab',
      'Art Room',
      'Music Room',
      'Auditorium',
      'Parking Lot',
      'Hallway',
      'Restroom'
    ]
  },
  {
    location: 'Off Campus',
    facilities: [
      'Park',
      'Museum',
      'Public Library',
      'Local Business',
      'Community Center',
      'Partner School',
      'Sports Venue',
      'Public Pool',
      'Municipal Building',
      'Local Theater'
    ]
  },
  {
    location: 'In Transit',
    facilities: [
      'School Bus',
      'Charter Bus',
      'Public Transportation',
      'Walking Route',
      'Bike Path',
      'Carpool Vehicle',
      'Bus Loop',
      'Bus Stop',
      'Parking Area',
      'Loading Zone'
    ]
  },
  {
    location: 'During Function',
    facilities: [
      'Field Trip Location',
      'Performance Venue',
      'Sports Tournament Venue',
      'Conference Center',
      'Camp Facility',
      'Retreat Center',
      'Competition Venue',
      'Event Hall',
      'Outdoor Event Space',
      'Hotel'
    ]
  }
];

// Legacy facilities list (keeping for backward compatibility)
export const facilities = [
  ...facilityMappings[0].facilities,
  ...facilityMappings[1].facilities,
  ...facilityMappings[2].facilities,
  ...facilityMappings[3].facilities
];
