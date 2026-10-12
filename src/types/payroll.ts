export type EmergencyRelationship = 'Saudara Kandung' | 'Saudara' | 'Ibu' | 'Ayah';
export type OwnershipStatus = 'PRIBADI' | 'ORANG LAIN';
export type Gender = 'Laki-laki' | 'Perempuan';
export type MaritalStatus = 'Menikah' | 'Belum Menikah' | 'Cerai Hidup' | 'Cerai Mati';
export type Religion = 'Islam' | 'Kristen' | 'Protestan' | 'Hindu' | 'Buddha' | 'Khonghucu';
export type PtkpCode = 'tk0' | 'k1' | 'k2' | 'k3' | 'tk1' | 'tk2' | 'tk3';
export type AccountValidationStatus = 'UNVALIDATED' | 'VALID' | 'INVALID';

export interface BankOption {
  bank_code: string;
  bank_name: string;
}

export interface UploadPayload {
  fileName: string;
  mimeType: string;
  size: number;
  base64: string;
}

export interface AccountValidationResult {
  status: AccountValidationStatus;
  score: number | null;
  validatedName: string;
  validationTimestamp: string;
  message: string;
}

export interface PayrollFormValues {
  email: string;
  fullName: string;
  address: string;
  addressDetail: string;
  provinceCode: string;
  provinceName: string;
  regencyCode: string;
  regencyName: string;
  districtCode: string;
  districtName: string;
  villageCode: string;
  villageName: string;
  postalCode: string;
  nik: string;
  birthPlaceCode: string;
  birthPlace: string;
  birthPlaceProvince: string;
  birthDate: string;
  gender: Gender | '';
  maritalStatus: MaritalStatus | '';
  religion: Religion | '';
  ptkpCode: PtkpCode | '';
  phone: string;
  motherName: string;
  emergencyContact: string;
  emergencyContactName: string;
  emergencyRelationship: EmergencyRelationship | '';
  placement: string;
  fingerPin: string;
  bpjsHealthStatus: 'Sudah Ada' | 'Belum' | '';
  bpjsHealthNumber: string;
  bpjsEmploymentStatus: 'Sudah Ada' | 'Belum' | '';
  bpjsEmploymentNumber: string;
  employmentStatus: string;
  position: string;
  firstWorkDate: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountOwner: string;
  accountValidation: AccountValidationResult;
  ownershipStatus: OwnershipStatus | '';
  ktpFile: FileList;
  familyCardFile: FileList;
  personalPhotoFile?: FileList;
  powerOfAttorneyFile?: FileList;
  dataAgreement: boolean;
  website?: string;
  formStartedAt: string;
}

type UploadFieldNames = 'ktpFile' | 'familyCardFile' | 'powerOfAttorneyFile' | 'personalPhotoFile';

export interface PayrollSubmitPayload {
  origin: string;
  submittedAt: string;
  website: string;
  submissionType: 'NEW' | 'REVISION';
  data: Omit<PayrollFormValues, UploadFieldNames | 'dataAgreement' | 'bankCode' | 'bankName'> & {
    bank: BankOption;
  };
  files: {
    ktp: UploadPayload;
    familyCard: UploadPayload;
    personalPhoto: UploadPayload | null;
    powerOfAttorney: UploadPayload | null;
  };
}

export interface ApiResponse {
  success: boolean;
  message: string;
  submissionId?: string;
}

export interface BankValidationRequest {
  bank_code: string;
  bank_name: string;
  account_number: string;
  account_owner: string;
  origin: string;
}

export interface BankValidationResponse extends ApiResponse {
  status: 'VALID' | 'INVALID';
  score: number;
  validatedName: string;
  validationTimestamp: string;
}
