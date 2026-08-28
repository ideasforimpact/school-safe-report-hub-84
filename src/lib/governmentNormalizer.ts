import { GovernmentDocumentType } 
  from "@/components/employee-verification/document-card/GovernmentVerificationPopup";

type RawApiRecord = Record<string, unknown> & {
  data?: RawApiRecord;
  address?: Record<string, unknown>;
  full_name_split?: string[];
  personal_info?: { address?: string };
  vehicle_classes?: unknown;
};

export const normalizeApiData = (
  raw: unknown,
  docType: GovernmentDocumentType
) => {
  if (!raw) return {};

  const rawRecord = raw as RawApiRecord;

  // 🔥 Auto unwrap nested API structures
  const data: RawApiRecord =
    rawRecord?.data?.data ||
    rawRecord?.data ||
    rawRecord;

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

    case "pan": {
      const panAddress = data.address
        ? [
            data.address.line_1,
            data.address.line_2,
            data.address.street_name,
            data.address.city,
            data.address.state,
            data.address.zip,
            data.address.country,
          ]
            .filter(Boolean)
            .join(", ")
        : "";

      return {
        name: data.full_name,
        fatherName: data.full_name_split?.[0] || "-",
        dob: data.dob,
        gender: data.gender,
        panNumber: data.pan_number,
        address:
          data.personal_info?.address ||
          panAddress ||
          "-",
      };
    }

    case "aadhar": {
      // DigiLocker responses nest the actual fields under aadhaar_xml_data /
      // digilocker_metadata instead of the flat shape the OTP providers use.
      const xml = data.aadhaar_xml_data as RawApiRecord | undefined;
      const metadata = data.digilocker_metadata as RawApiRecord | undefined;

      if (xml || metadata) {
        const xmlAddress = xml?.address as Record<string, unknown> | undefined;
        return {
          name: xml?.full_name || metadata?.name,
          dob: xml?.dob || metadata?.dob,
          gender: xml?.gender || metadata?.gender,
          aadharNumber: xml?.masked_aadhaar,
          profileImage: xml?.profile_image,
          state: xmlAddress?.state,
          address:
            xml?.full_address ||
            (xmlAddress
              ? [
                  xmlAddress.house,
                  xmlAddress.street,
                  xmlAddress.landmark,
                  xmlAddress.loc,
                  xmlAddress.vtc,
                  xmlAddress.subdist,
                  xmlAddress.dist,
                  xmlAddress.state,
                  xml?.zip,
                  xmlAddress.country,
                ]
                  .filter(Boolean)
                  .join(", ")
              : undefined),
        };
      }

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
    }

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