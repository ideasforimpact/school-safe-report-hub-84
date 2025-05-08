
export const vehiclesData = [
  {
    id: "v1",
    registrationNumber: "KA-01-AA-1234",
    type: "bus",
    make: "Ashok Leyland",
    model: "Falcon School Bus",
    year: 2020,
    driver: "John D.",
    route: "North Campus Route",
    documents: [
      {
        id: "doc1",
        type: "insurance",
        number: "INS12345",
        issuedDate: "2022-01-01",
        expiryDate: "2024-01-01",
        provider: "United India Insurance",
        status: "valid",
        verificationDate: "2023-01-15",
        verificationMethod: "api",
        verificationStatus: "verified",
        notes: "Comprehensive coverage",
        fileUrls: ["url1", "url2"]
      },
      {
        id: "doc2",
        type: "fitness",
        number: "FIT67890",
        issuedDate: "2023-01-01",
        expiryDate: "2024-01-01",
        provider: "RTO",
        status: "valid",
        verificationDate: "2023-01-15",
        verificationMethod: "manual",
        verificationStatus: "verified",
        notes: "Good condition",
        fileUrls: ["url3", "url4"]
      }
    ],
    status: "active",
    createdAt: "2023-01-15T10:30:00Z",
    updatedAt: "2023-04-10T14:22:30Z"
  },
  {
    id: "v2",
    registrationNumber: "KA-01-BB-5678",
    type: "van",
    make: "Maruti Suzuki",
    model: "Eeco School Van",
    year: 2021,
    driver: "Sam T.",
    route: "East Campus Route",
    documents: [
      {
        id: "doc3",
        type: "pollution",
        number: "POL11223",
        issuedDate: "2023-03-01",
        expiryDate: "2023-09-01",
        provider: "RTO",
        status: "expired",
        verificationDate: "2023-03-10",
        verificationMethod: "manual",
        verificationStatus: "verified",
        notes: "Needs renewal",
        fileUrls: ["url5", "url6"]
      },
      {
        id: "doc4",
        type: "registration",
        number: "REG44556",
        issuedDate: "2021-02-20",
        expiryDate: "2036-02-20",
        provider: "RTO",
        status: "valid",
        verificationDate: "2023-02-28",
        verificationMethod: "manual",
        verificationStatus: "verified",
        notes: "Original RC available",
        fileUrls: ["url7", "url8"]
      }
    ],
    status: "active",
    createdAt: "2023-02-20T09:15:00Z",
    updatedAt: "2023-05-12T11:45:20Z"
  },
  {
    id: "v3",
    registrationNumber: "KA-01-CC-9012",
    type: "bus",
    make: "Tata Motors",
    model: "Starbus Ultra School",
    year: 2019,
    driver: "Mike R.",
    route: "South Campus Route",
    documents: [
      {
        id: "doc5",
        type: "insurance",
        number: "INS67890",
        issuedDate: "2022-04-01",
        expiryDate: "2023-04-01",
        provider: "New India Assurance",
        status: "expiring_soon",
        verificationDate: "2023-04-10",
        verificationMethod: "api",
        verificationStatus: "verified",
        notes: "Renew before April",
        fileUrls: ["url9", "url10"]
      },
      {
        id: "doc6",
        type: "fitness",
        number: "FIT22334",
        issuedDate: "2022-03-15",
        expiryDate: "2023-03-15",
        provider: "RTO",
        status: "expired",
        verificationDate: "2023-03-20",
        verificationMethod: "manual",
        verificationStatus: "verified",
        notes: "Fitness overdue",
        fileUrls: ["url11", "url12"]
      }
    ],
    status: "maintenance",
    createdAt: "2023-03-10T08:45:00Z",
    updatedAt: "2023-06-15T16:30:10Z"
  },
  {
    id: "v4",
    registrationNumber: "KA-01-DD-3456",
    type: "car",
    make: "Toyota",
    model: "Innova",
    year: 2022,
    driver: "Lisa M.",
    route: "Administrative Use",
    documents: [
      {
        id: "doc7",
        type: "pollution",
        number: "POL55667",
        issuedDate: "2023-06-01",
        expiryDate: "2023-12-01",
        provider: "RTO",
        status: "valid",
        verificationDate: "2023-06-10",
        verificationMethod: "manual",
        verificationStatus: "verified",
        notes: "Valid until December",
        fileUrls: ["url13", "url14"]
      },
      {
        id: "doc8",
        type: "registration",
        number: "REG77889",
        issuedDate: "2022-05-20",
        expiryDate: "2037-05-20",
        provider: "RTO",
        status: "valid",
        verificationDate: "2023-05-28",
        verificationMethod: "manual",
        verificationStatus: "verified",
        notes: "Permanent registration",
        fileUrls: ["url15", "url16"]
      }
    ],
    status: "active",
    createdAt: "2023-04-05T14:20:00Z",
    updatedAt: "2023-07-01T09:10:40Z"
  }
];

// Export vehiclesData as initialVehicles to fix the import error
export const initialVehicles = vehiclesData;
