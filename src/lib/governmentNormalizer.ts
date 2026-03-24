import { GovernmentDocumentType } 
  from "@/components/employee-verification/document-card/GovernmentVerificationPopup";

export const normalizeApiData = (
  raw: any,
  docType: GovernmentDocumentType
) => {
  if (!raw) return {};

  // 🔥 Auto unwrap nested API structures
  const data =
    raw?.data?.data ||
    raw?.data ||
    raw;

  switch (docType) {

    case "voter_id":
      return {
        name: data.name || data.name_v1,
        gender: data.gender,
        voterIdNumber: data.epic_no,
        state: data.state,
        constituency: data.assembly_constituency,
        fatherName: data.relation_name,
        age: data.age,
      };

    case "pan":
      return {
        name: data.full_name,
        fatherName: data.full_name_split?.[0],
        dob: data.dob,
        gender: data.gender,
        panNumber: data.pan_number,
        
      };

    case "aadhar":
      return {
        name: data.full_name || data.name,
        dob: data.dob,
        gender: data.gender,
        aadharNumber: data.aadhaar_number || data.aadhar_number,
        profileImage: data.profile_image,
        state: data.address?.state,
        address: data.address
          ? [
              data.address.house,
              data.address.street,
              data.address.loc,
              data.address.dist,
              data.address.state,
              data.address.zip,
            ]
              .filter(Boolean)
              .join(", ")
          : undefined,
      };

    case "driving_license":
      return {
        name: data.name,
        dob: data.dob,
        issueDate: data.doi,
        expiryDate: data.doe,
        licenseNumber: data.license_number,
        vehicleClasses: Array.isArray(data.vehicle_classes)
          ? data.vehicle_classes.join(", ")
          : undefined,
        profileImage: data.profile_image,
        state: data.state,
      };

    case "passport":
      return {
        name: data.name,
        dob: data.dob,
        gender: data.gender,
        passportNumber: data.passport_number,
        nationality: data.nationality,
      };

    default:
      return data;
  }
};