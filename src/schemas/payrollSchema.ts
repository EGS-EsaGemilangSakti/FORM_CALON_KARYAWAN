import { z } from 'zod';
import { MIN_ACCOUNT_VALIDATION_SCORE } from '../constants/accountValidation';
import { BANKS } from '../constants/banks';
import { EMERGENCY_RELATIONSHIPS, EMPLOYMENT_STATUSES, OWNERSHIP_STATUSES, PLACEMENTS, POSITIONS } from '../constants/placements';
import { GENDERS, MARITAL_STATUSES, PTKP_CODES, RELIGIONS } from '../constants/personal';
import { EMPLOYEE_DOCUMENT_MIME_TYPES, FAMILY_CARD_MIME_TYPES, KTP_MIME_TYPES, MAX_FILE_SIZE, POWER_OF_ATTORNEY_MIME_TYPES } from '../utils/validators';

const fileListSchema = z.custom<FileList>();

function validateUploadFile(
  fileList: unknown,
  mimeTypes: string[],
  label: string,
  requiredMessage: string,
  invalidMessage: string,
  ctx: z.RefinementCtx,
  path: string[],
): boolean {
  if (!(fileList instanceof FileList) || fileList.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message: requiredMessage });
    return false;
  }

  const file = fileList.item(0);
  if (!file || !mimeTypes.includes(file.type) || file.size > MAX_FILE_SIZE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path,
      message: `${invalidMessage}: ${file?.name || label}`,
    });
    return false;
  }

  return true;
}

export const payrollSchema = z
  .object({
    email: z.string().trim().email('Email tidak valid'),
    fullName: z.string().trim().min(1, 'Nama wajib diisi').regex(/^[A-Z ]+$/, 'Nama hanya boleh huruf kapital dan spasi'),
    address: z.string().trim().min(10, 'Alamat minimal 10 karakter').max(500, 'Alamat maksimal 500 karakter'),
    addressDetail: z.string().trim().min(5, 'Detail alamat minimal 5 karakter').max(200, 'Detail alamat maksimal 200 karakter'),
    provinceCode: z.string().regex(/^\d{2}$/, 'Provinsi wajib dipilih'),
    provinceName: z.string().min(1, 'Provinsi wajib dipilih'),
    regencyCode: z.string().regex(/^\d{4}$/, 'Kabupaten/kota wajib dipilih'),
    regencyName: z.string().min(1, 'Kabupaten/kota wajib dipilih'),
    districtCode: z.string().regex(/^\d{6}$/, 'Kecamatan wajib dipilih'),
    districtName: z.string().min(1, 'Kecamatan wajib dipilih'),
    villageCode: z.string().regex(/^\d{10}$/, 'Kelurahan/desa wajib dipilih'),
    villageName: z.string().min(1, 'Kelurahan/desa wajib dipilih'),
    postalCode: z.string().regex(/^\d{5}$/, 'Kode pos wajib 5 digit'),
    nik: z.string().regex(/^\d{16}$/, 'NIK wajib 16 digit angka'),
    birthPlaceCode: z.string().regex(/^\d{4}$/, 'Tempat lahir wajib dipilih dari daftar kota/kabupaten'),
    birthPlace: z.string().trim().min(1, 'Tempat lahir wajib dipilih dari daftar').regex(/^[A-Za-z ]+$/, 'Tempat lahir wajib dipilih dari daftar'),
    birthPlaceProvince: z.string().min(1, 'Provinsi tempat lahir wajib terisi'),
    birthDate: z.string().refine((value) => Boolean(value) && new Date(value) <= new Date(), 'Tanggal lahir tidak boleh masa depan'),
    gender: z.enum(GENDERS, { message: 'Jenis kelamin wajib dipilih' }),
    maritalStatus: z.enum(MARITAL_STATUSES, { message: 'Status pernikahan wajib dipilih' }),
    religion: z.enum(RELIGIONS, { message: 'Agama wajib dipilih' }),
    ptkpCode: z.enum(PTKP_CODES, { message: 'PTKP wajib dipilih' }),
    phone: z.string().regex(/^\d{10,15}$/, 'Nomor telepon wajib 10-15 digit'),
    motherName: z.string().trim().min(1, 'Nama ibu kandung wajib diisi').regex(/^[A-Z .'-]+$/, 'Nama ibu kandung harus menggunakan huruf kapital'),
    emergencyContact: z.string().regex(/^\d{10,15}$/, 'Kontak darurat wajib 10-15 digit angka'),
    emergencyContactName: z.string().trim().min(1, 'Nama kontak darurat wajib diisi').regex(/^[A-Z .'-]+$/, 'Nama kontak darurat harus menggunakan huruf kapital'),
    emergencyRelationship: z.enum(EMERGENCY_RELATIONSHIPS, { message: 'Hubungan kontak darurat wajib dipilih' }),
    placement: z.enum(PLACEMENTS, { message: 'Penempatan wajib dipilih' }),
    area: z.string().trim().min(1, 'Area wajib diisi').regex(/^[-A-Z0-9 .,'()/]+$/, 'Area harus menggunakan huruf kapital'),
    fingerPin: z.string().regex(/^\d{1,30}$/, 'ID PIN Finger wajib 1–30 digit angka'),
    employmentStatus: z.enum(EMPLOYMENT_STATUSES, { message: 'Status karyawan wajib dipilih' }),
    position: z.enum(POSITIONS, { message: 'Posisi wajib dipilih' }),
    firstWorkDate: z.string().min(1, 'Tanggal kerja pertama wajib diisi'),
    bankCode: z.string().refine((code) => BANKS.some((bank) => bank.bank_code === code), 'Bank wajib dipilih'),
    bankName: z.string().min(1, 'Bank wajib dipilih'),
    accountNumber: z.string().regex(/^\d{5,30}$/, 'Nomor rekening wajib 5-30 digit angka'),
    accountOwner: z.string().trim().min(1, 'Nama pemilik rekening wajib diisi').regex(/^[A-Z .]+$/, 'Nama pemilik rekening hanya boleh huruf kapital, titik, dan spasi'),
    accountValidation: z.object({
      status: z.enum(['UNVALIDATED', 'VALID', 'INVALID']),
      score: z.number().nullable(),
      validatedName: z.string(),
      validationTimestamp: z.string(),
      message: z.string(),
    }),
    ownershipStatus: z.enum(OWNERSHIP_STATUSES, { message: 'Status kepemilikan rekening wajib dipilih' }),
    ktpFile: fileListSchema,
    familyCardFile: fileListSchema,
    personalPhotoFile: z.custom<FileList>().optional(),
    diplomaFile: z.custom<FileList>().optional(),
    npwpFile: z.custom<FileList>().optional(),
    bpjsHealthFile: z.custom<FileList>().optional(),
    bpjsEmploymentFile: z.custom<FileList>().optional(),
    domicileLetterFile: z.custom<FileList>().optional(),
    powerOfAttorneyFile: z.custom<FileList>().optional(),
    dataAgreement: z.literal(true, { errorMap: () => ({ message: 'Pernyataan wajib disetujui' }) }),
    website: z.string().optional(),
    formStartedAt: z.string().min(1),
  })
  .superRefine((data, ctx) => {
    if (data.accountValidation.status !== 'VALID' || data.accountValidation.score === null || data.accountValidation.score < MIN_ACCOUNT_VALIDATION_SCORE) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['accountValidation'], message: `Rekening wajib divalidasi dengan score minimal ${MIN_ACCOUNT_VALIDATION_SCORE}` });
    }
    validateUploadFile(data.ktpFile, KTP_MIME_TYPES, 'KTP', 'KTP wajib diunggah', 'KTP wajib pdf, jpg, jpeg, atau png maksimal 5MB', ctx, ['ktpFile']);
    validateUploadFile(data.familyCardFile, FAMILY_CARD_MIME_TYPES, 'Kartu Keluarga', 'Kartu Keluarga wajib diunggah', 'Kartu Keluarga wajib pdf, jpg, jpeg, atau png maksimal 5MB', ctx, ['familyCardFile']);

    for (const [field, label] of [['personalPhotoFile', 'Foto Diri'], ['diplomaFile', 'Ijazah'], ['npwpFile', 'NPWP'], ['bpjsHealthFile', 'BPJS Kesehatan'], ['bpjsEmploymentFile', 'BPJS Ketenagakerjaan'], ['domicileLetterFile', 'Surat Domisili']] as const) {
      const files = data[field];
      if (files instanceof FileList && files.length > 0) validateUploadFile(files, EMPLOYEE_DOCUMENT_MIME_TYPES, label, '', label + ' wajib jpg, jpeg, atau png maksimal 5MB', ctx, [field]);
    }

    const powerOfAttorneyFile = data.powerOfAttorneyFile;
    const hasPowerOfAttorney = powerOfAttorneyFile instanceof FileList && powerOfAttorneyFile.length > 0;
    if (data.ownershipStatus === 'ORANG LAIN' || hasPowerOfAttorney) {
      validateUploadFile(powerOfAttorneyFile, POWER_OF_ATTORNEY_MIME_TYPES, 'Surat Kuasa', 'Surat kuasa wajib diunggah', 'Surat kuasa wajib pdf, jpg, jpeg, atau png maksimal 5MB', ctx, ['powerOfAttorneyFile']);
    }
  });

export type PayrollSchema = z.infer<typeof payrollSchema>;
