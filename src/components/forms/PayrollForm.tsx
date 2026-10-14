import { CandidateEntry, type CandidateEntryValue } from './CandidateEntry';
import { checkCandidateEligibility } from '../../services/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, BarChart3, BriefcaseBusiness, Check, CheckCircle2, CloudUpload, Info, Loader2, MapPin, Send, ShieldCheck, WalletCards } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DefaultValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { MIN_ACCOUNT_VALIDATION_SCORE } from '../../constants/accountValidation';
import { BANKS } from '../../constants/banks';
import { useSubmitPayroll } from '../../hooks/useSubmitPayroll';
import { useValidateBank } from '../../hooks/useValidateBank';
import { payrollSchema } from '../../schemas/payrollSchema';
import type { PayrollFormValues } from '../../types/payroll';
import { toDisplayDate, nowIso } from '../../utils/formatters';
import { sanitizeText } from '../../utils/sanitize';
import { fileToBase64Payload } from '../../utils/validators';
import { AccountNumberField } from '../fields/AccountNumberField';
import { AccountOwnerField } from '../fields/AccountOwnerField';
import { AccountValidationResult } from '../fields/AccountValidationResult';
import { BpjsFields } from '../fields/BpjsFields';
import { FingerFields, PersonalEmergencyFields } from '../fields/AdditionalEmployeeFields';
import { AddressField } from '../fields/AddressField';
import { BankField } from '../fields/BankField';
import { BirthDateField } from '../fields/BirthDateField';
import { BirthPlaceField } from '../fields/BirthPlaceField';
import { EmailField } from '../fields/EmailField';
import { EmploymentStatusField } from '../fields/EmploymentStatusField';
import { EmployeeDocumentUploadField } from '../fields/EmployeeDocumentUploadField';
import { FirstWorkDateField } from '../fields/FirstWorkDateField';
import { FamilyCardUploadField } from '../fields/FamilyCardUploadField';
import { FullNameField } from '../fields/FullNameField';
import { KtpUploadField } from '../fields/KtpUploadField';
import { NikField } from '../fields/NikField';
import { OwnershipStatusField } from '../fields/OwnershipStatusField';
import { PhoneField } from '../fields/PhoneField';
import { GenderField, MaritalStatusField, PtkpCodeField, ReligionField } from '../fields/PersonalStatusFields';
import { PlacementField } from '../fields/PlacementField';
import { PositionField } from '../fields/PositionField';
import { PowerOfAttorneyUploadField } from '../fields/PowerOfAttorneyUploadField';

const defaultValidation = {
  status: 'UNVALIDATED' as const,
  score: null,
  validatedName: '',
  validationTimestamp: '',
  message: '',
};

const DRAFT_STORAGE_KEY = 'form-calon-karyawan-draft-v1';

const stepFields = {
  1: [
    'email',
    'fullName',
    'nik',
    'phone',
    'motherName',
    'emergencyContact',
    'emergencyContactName',
    'emergencyRelationship',
    'birthPlaceCode',
    'birthPlace',
    'birthPlaceProvince',
    'birthDate',
    'gender',
    'maritalStatus',
    'religion',
    'ptkpCode',
    'address',
    'addressDetail',
    'provinceCode',
    'provinceName',
    'regencyCode',
    'regencyName',
    'districtCode',
    'districtName',
    'villageCode',
    'villageName',
    'postalCode',
  ],
  2: [
    'placement',
    'fingerPin',
    'bpjsHealthStatus', 'bpjsHealthNumber',
    'bpjsEmploymentStatus', 'bpjsEmploymentNumber',
    'employmentStatus',
    'position',
    'firstWorkDate',
    'bankCode',
    'bankName',
    'accountNumber',
    'accountOwner',
    'accountValidation',
    'ownershipStatus',
    'powerOfAttorneyFile',
  ],
  3: ['ktpFile', 'familyCardFile', 'personalPhotoFile', 'dataAgreement'],
} as const;

type PersistedPayrollValues = Partial<Omit<PayrollFormValues, 'ktpFile' | 'familyCardFile' | 'powerOfAttorneyFile' | 'personalPhotoFile'>>;

interface PersistedDraft {
  currentStep?: 1 | 2 | 3;
  values?: PersistedPayrollValues;
}

function getEmptyFormValues(): DefaultValues<PayrollFormValues> {
  return {
    email: '',
    fullName: '',
    address: '',
    addressDetail: '',
    provinceCode: '',
    provinceName: '',
    regencyCode: '',
    regencyName: '',
    districtCode: '',
    districtName: '',
    villageCode: '',
    villageName: '',
    postalCode: '',
    nik: '',
    birthPlaceCode: '',
    birthPlace: '',
    birthPlaceProvince: '',
    birthDate: '',
    gender: '',
    maritalStatus: '',
    religion: '',
    ptkpCode: '',
    phone: '',
    motherName: '',
    emergencyContact: '',
    emergencyContactName: '',
    emergencyRelationship: '',
    placement: '',
    fingerPin: '',
    bpjsHealthStatus: '', bpjsHealthNumber: '',
    bpjsEmploymentStatus: '', bpjsEmploymentNumber: '',
    employmentStatus: 'Kontrak',
    position: 'BATANGAN/REGULER',
    firstWorkDate: '',
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountOwner: '',
    accountValidation: { ...defaultValidation },
    ownershipStatus: '',
    dataAgreement: false,
    website: '',
    formStartedAt: nowIso(),
  };
}

function loadPersistedDraft(): PersistedDraft {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedDraft;
    if (parsed.values) delete (parsed.values as Record<string, unknown>).area;
    const parsedStep = Number(parsed.currentStep);
    return {
      ...parsed,
      currentStep: parsedStep === 1 || parsedStep === 2 || parsedStep === 3 ? parsedStep : 1,
    };
  } catch {
    return {};
  }
}

function savePersistedDraft(currentStep: number, values: unknown) {
  if (typeof window === 'undefined') return;
  const persistableValues = { ...(values as Record<string, unknown>) };
  delete persistableValues.area;
  delete persistableValues.ktpFile;
  delete persistableValues.familyCardFile;
  delete persistableValues.powerOfAttorneyFile;
  delete persistableValues.personalPhotoFile;
  window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ currentStep, values: persistableValues }));
}

function clearPersistedDraft() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  }
}

function isAccountValidationAccepted(validation: PayrollFormValues['accountValidation']): boolean {
  return validation.status === 'VALID' && validation.score !== null && validation.score >= MIN_ACCOUNT_VALIDATION_SCORE;
}

function Stepper({ currentStep }: { currentStep: number }) {
  const steps = [
    { id: 1, label: 'Identitas' },
    { id: 2, label: 'Pekerjaan' },
    { id: 3, label: 'Dokumen' },
  ];

  return (
    <div className="relative flex items-center justify-between">
      <div className="absolute left-0 right-0 top-5 h-px bg-[#353534]" />
      {steps.map((step) => {
        const reached = step.id <= currentStep;
        return (
          <div key={step.id} className="relative z-10 flex min-w-[86px] flex-col items-center gap-3 bg-[#131313] px-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold tracking-[0.05em] ${reached ? 'bg-[#d4af37] text-black' : 'border-2 border-[#d4af37] text-[#d4af37]'}`}>
              {reached ? <Check className="h-5 w-5" /> : `0${step.id}`}
            </div>
            <span className={`text-xs font-medium tracking-[0.03em] ${reached ? 'text-[#f2ca50]' : 'text-[#8f7d3c]'}`}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StepIntro({ step }: { step: 1 | 2 | 3 }) {
  const contentByStep = {
    1: {
      title: 'Identitas Calon Karyawan',
      description: 'Lengkapi data diri Anda sesuai dengan identitas resmi (KTP).',
    },
    2: {
      title: 'Data Pekerjaan',
      description: 'Lengkapi informasi penempatan, posisi, dan rekening penggajian.',
    },
    3: {
      title: 'Dokumen',
      description: 'Unggah dokumen pendukung sesuai status kepemilikan rekening.',
    },
  } satisfies Record<1 | 2 | 3, { title: string; description: string }>;

  const content = contentByStep[step];

  return (
    <section className="pt-10 sm:pt-14">
      <h2 className="max-w-lg text-5xl font-bold leading-[1.08] tracking-normal text-[#e5e2e1]">{content.title}</h2>
      <p className="mt-3 max-w-xl text-lg leading-8 text-[#d0c5af]">{content.description}</p>
    </section>
  );
}

function StepCard({ children, title, icon }: { children: ReactNode; title?: string; icon?: ReactNode }) {
  return (
    <section className="min-w-0 rounded-xl border border-[#d4af37]/15 bg-[#201f1f] p-6 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] sm:p-8">
      {title ? (
        <h3 className="mb-6 flex items-center gap-3 text-2xl font-semibold text-[#e5e2e1]">
          {icon}
          {title}
        </h3>
      ) : null}
      <div className="grid min-w-0 gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function formatSummaryDate(value: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.03em] text-[#d0c5af]">{label}</p>
      <p className="mt-1 break-words text-base leading-7 text-white">{value || '-'}</p>
    </div>
  );
}

function SubmitLoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f0f0f]/85 px-6 text-center backdrop-blur-sm">
      <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
        <div className="wheel"></div>
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear"></div>
              <div className="hamster__eye"></div>
              <div className="hamster__nose"></div>
            </div>
            <div className="hamster__limb hamster__limb--fr"></div>
            <div className="hamster__limb hamster__limb--fl"></div>
            <div className="hamster__limb hamster__limb--br"></div>
            <div className="hamster__limb hamster__limb--bl"></div>
            <div className="hamster__tail"></div>
          </div>
        </div>
        <div className="spoke"></div>
      </div>
      <p className="mt-6 text-base font-semibold tracking-[0.08em] text-[#f2ca50]">MENGIRIM DATA</p>
      <p className="mt-2 max-w-xs text-sm leading-6 text-[#d0c5af]">Mohon tunggu, data dan dokumen sedang diproses.</p>
    </div>
  );
}

export function PayrollForm() {
  const persistedDraft = useMemo(loadPersistedDraft, []);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(persistedDraft.currentStep ?? 1);
  const [pendingValues, setPendingValues] = useState<PayrollFormValues | null>(null);
  const [entry, setEntry] = useState<CandidateEntryValue | null>(null);
  const [checkingFinger, setCheckingFinger] = useState(false);
  const selectedSubmissionType = entry?.submissionType ?? null;
  const [thankYouMessage, setThankYouMessage] = useState<string | null>(null);
  const submitLock = useRef(false);
  const skipDraftPersistRef = useRef(false);
  const validateMutation = useValidateBank();
  const submitMutation = useSubmitPayroll();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollSchema),
    mode: 'onBlur',
    defaultValues: {
      ...getEmptyFormValues(),
      ...persistedDraft.values,
    },
  });

  const accountValidation = watch('accountValidation');
  const ownershipStatus = watch('ownershipStatus');
  const bankCode = watch('bankCode');
  const dataAgreement = watch('dataAgreement');
  const summaryValues = watch();
  const canSubmit = isAccountValidationAccepted(accountValidation) && dataAgreement && !isSubmitting && !submitMutation.isPending;
  const isSubmitLoading = isSubmitting || submitMutation.isPending;

  useEffect(() => {
    const subscription = watch((values) => {
      if (skipDraftPersistRef.current) return;
      savePersistedDraft(currentStep, values);
    });
    return () => subscription.unsubscribe();
  }, [currentStep, watch]);

  useEffect(() => {
    if (skipDraftPersistRef.current) return;
    savePersistedDraft(currentStep, watch());
  }, [currentStep, watch]);

  const resetValidation = () => {
    setValue('accountValidation', defaultValidation, { shouldValidate: true });
  };

  const validateAccount = async () => {
    const fieldsValid = await trigger(['bankCode', 'bankName', 'accountNumber', 'accountOwner']);
    if (!fieldsValid) return;
    const values = watch();
    try {
      const response = await validateMutation.mutateAsync({
        bank_code: values.bankCode,
        bank_name: values.bankName,
        account_number: values.accountNumber,
        account_owner: values.accountOwner.trim(),
        origin: window.location.origin,
      });
      setValue('accountValidation', {
        status: response.status,
        score: response.score,
        validatedName: response.validatedName,
        validationTimestamp: response.validationTimestamp,
        message: response.message,
      }, { shouldValidate: true });
      toast[response.status === 'VALID' ? 'success' : 'error'](response.message);
    } catch (error) {
      setValue('accountValidation', { ...defaultValidation, status: 'INVALID', message: 'Validasi rekening gagal' }, { shouldValidate: true });
      toast.error(error instanceof Error ? error.message : 'Validasi rekening gagal');
    }
  };

  const selectedBank = useMemo(() => BANKS.find((bank) => bank.bank_code === bankCode), [bankCode]);

  const goToNextStep = async () => {
    if (checkingFinger || !entry) return;
    const fields = stepFields[currentStep as keyof typeof stepFields];
    const isStepValid = await trigger([...fields]);
    if (!isStepValid) {
      toast.error('Lengkapi semua data wajib pada step ini');
      return;
    }
    if (currentStep === 2 && !isAccountValidationAccepted(watch('accountValidation'))) {
      toast.error(`Rekening wajib divalidasi dengan score minimal ${MIN_ACCOUNT_VALIDATION_SCORE} sebelum lanjut`);
      return;
    }
    if (currentStep === 2) {
      setCheckingFinger(true);
      try {
        const values = watch();
        const result = await checkCandidateEligibility(entry.nik, entry.submissionType, values.placement, values.fingerPin);
        if (!result.success) throw new Error(result.message);
        if (watch('placement') !== values.placement || watch('fingerPin') !== values.fingerPin) throw new Error('Penempatan atau ID Finger berubah. Tekan Lanjut untuk memeriksa kembali.');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Pemeriksaan ID Finger gagal');
        return;
      } finally { setCheckingFinger(false); }
    }
    setCurrentStep((step) => Math.min(step + 1, 3) as 1 | 2 | 3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousStep = () => {
    setCurrentStep((step) => Math.max(step - 1, 1) as 1 | 2 | 3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (values: PayrollFormValues) => {
    if (!entry || values.nik !== entry.nik) { toast.error('Periksa NIK kembali sebelum mengirim.'); return; }
    setPendingValues(values);
  };

  const submitConfirmed = async (values: PayrollFormValues, submissionType: 'NEW' | 'REVISION') => {
    if (submitLock.current) return;
    if (!entry || values.nik !== entry.nik || submissionType !== entry.submissionType) { toast.error('Periksa NIK kembali sebelum mengirim.'); return; }
    if (currentStep !== 3) {
      toast.error('Selesaikan step saat ini sebelum mengirim data');
      return;
    }
    submitLock.current = true;
    try {
      const ktp = values.ktpFile.item(0);
      const familyCard = values.familyCardFile.item(0);
      const powerOfAttorney = values.powerOfAttorneyFile?.item(0) ?? null;
      const personalPhoto = values.personalPhotoFile?.item(0) ?? null;
      if (!ktp || !familyCard || !selectedBank) throw new Error('Data belum lengkap');
      const payload = {
        origin: window.location.origin,
        submittedAt: nowIso(),
        website: sanitizeText(values.website || ''),
        submissionType,
        data: {
          email: values.email,
          fullName: values.fullName,
          address: values.address,
          addressDetail: values.addressDetail,
          provinceCode: values.provinceCode,
          provinceName: values.provinceName,
          regencyCode: values.regencyCode,
          regencyName: values.regencyName,
          districtCode: values.districtCode,
          districtName: values.districtName,
          villageCode: values.villageCode,
          villageName: values.villageName,
          postalCode: values.postalCode,
          nik: values.nik,
          birthPlaceCode: values.birthPlaceCode,
          birthPlace: values.birthPlace,
          birthPlaceProvince: values.birthPlaceProvince,
          birthDate: toDisplayDate(values.birthDate),
          gender: values.gender,
          maritalStatus: values.maritalStatus,
          religion: values.religion,
          ptkpCode: values.ptkpCode,
          phone: values.phone,
          motherName: values.motherName,
          emergencyContact: values.emergencyContact,
          emergencyContactName: values.emergencyContactName,
          emergencyRelationship: values.emergencyRelationship,
          placement: values.placement,
          fingerPin: values.fingerPin,
          bpjsHealthStatus: values.bpjsHealthStatus,
          bpjsHealthNumber: values.bpjsHealthStatus === 'Sudah Ada' ? values.bpjsHealthNumber : '',
          bpjsEmploymentStatus: values.bpjsEmploymentStatus,
          bpjsEmploymentNumber: values.bpjsEmploymentStatus === 'Sudah Ada' ? values.bpjsEmploymentNumber : '',
          employmentStatus: values.employmentStatus,
          position: values.position,
          firstWorkDate: toDisplayDate(values.firstWorkDate),
          accountNumber: values.accountNumber,
          accountOwner: values.accountOwner,
          accountValidation: values.accountValidation,
          ownershipStatus: values.ownershipStatus,
          formStartedAt: values.formStartedAt,
          bank: selectedBank,
        },
        files: {
          ktp: await fileToBase64Payload(ktp, 'KTP'),
          familyCard: await fileToBase64Payload(familyCard, 'Kartu Keluarga'),
          personalPhoto: personalPhoto ? await fileToBase64Payload(personalPhoto, 'Foto Diri') : null,
          powerOfAttorney: powerOfAttorney ? await fileToBase64Payload(powerOfAttorney, 'Surat Kuasa') : null,
        },
      };
      const response = await submitMutation.mutateAsync(payload);
      if (!response.success) throw new Error(response.message);
      skipDraftPersistRef.current = true;
      clearPersistedDraft();
      reset(getEmptyFormValues());
      setCurrentStep(1);
      setPendingValues(null);
      setEntry(null);
      setThankYouMessage(response.submissionId || 'Berhasil');
      window.setTimeout(() => {
        skipDraftPersistRef.current = false;
      }, 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Pengiriman gagal');
    } finally {
      submitLock.current = false;
    }
  };

  if (!entry && !thankYouMessage) return <CandidateEntry initialNik={watch('nik')} onContinue={value => {
    if (value.nik !== watch('nik')) reset(getEmptyFormValues());
    setValue('nik', value.nik);
    setCurrentStep(1);
    setEntry(value);
  }} />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 px-5 pb-28 pt-6 sm:px-8" noValidate>
      {isSubmitLoading ? <SubmitLoadingOverlay /> : null}
      {entry && <div className="flex flex-wrap items-center justify-between gap-3">
        <p>{entry.submissionType === 'REVISION' ? 'Revisi Data Calon Karyawan Baru' : 'Calon Karyawan Baru'}</p>
        <button type="button" disabled={isSubmitLoading || checkingFinger} onClick={() => { setEntry(null); setPendingValues(null); }}>Ganti Jenis Pengisian / NIK</button>
      </div>}
      {checkingFinger && <p role="status">Memeriksa ID Finger pada penempatan yang dipilih...</p>}
      {pendingValues ? <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="submission-dialog-title" className="w-full max-w-md rounded-2xl border border-[#f2ca50]/25 bg-[#201f1f] p-6 shadow-2xl">
          <h2 id="submission-dialog-title" className="text-2xl font-semibold text-white">Konfirmasi Submit</h2>
          <p className="mt-3 leading-7 text-[#d0c5af]">{selectedSubmissionType === 'REVISION' ? 'Revisi Data Calon Karyawan Baru' : 'Calon Karyawan Baru'} — NIK {entry?.nik}. Pastikan seluruh data sudah benar.</p>
          <div className="mt-6 flex gap-3">
            <button type="button" className="flex-1 rounded-xl border border-[#f2ca50]/30 px-4 py-3 text-[#f2ca50]" onClick={() => setPendingValues(null)}>Kembali</button>
            <button type="button" className="flex-1 rounded-xl bg-[#f2ca50] px-4 py-3 font-bold text-[#3c2f00]" onClick={() => selectedSubmissionType && void submitConfirmed(pendingValues, selectedSubmissionType)}>Submit</button>
          </div>
        </div>
      </div> : null}
      {thankYouMessage ? <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
        <div role="dialog" aria-modal="true" aria-labelledby="thank-you-dialog-title" className="w-full max-w-md rounded-2xl border border-[#f2ca50]/25 bg-[#201f1f] p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f2ca50]/15">
            <CheckCircle2 className="h-9 w-9 text-[#f2ca50]" />
          </div>
          <h2 id="thank-you-dialog-title" className="mt-5 text-2xl font-semibold text-white">Terima Kasih!</h2>
          <p className="mt-3 leading-7 text-[#d0c5af]">Terima kasih telah mengisi Form Calon Karyawan. Data Anda berhasil dikirim dan akan segera diproses oleh tim kami.</p>
          <p className="mt-2 text-xs text-[#8f7d3c]">ID Pengajuan: {thankYouMessage}</p>
          <button type="button" className="mt-6 w-full rounded-xl bg-[#f2ca50] px-4 py-3 font-bold text-[#3c2f00]" onClick={() => setThankYouMessage(null)}>Tutup</button>
        </div>
      </div> : null}
      <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register('website')} />

      <section className="space-y-8 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.1em] text-[#f2ca50]">Pendaftaran Calon Karyawan</p>
          <h1 className="mx-auto mt-2 max-w-sm text-3xl font-semibold leading-tight text-white sm:text-4xl">Form Calon Karyawan</h1>
        </div>
        <Stepper currentStep={currentStep} />
      </section>

      <StepIntro step={currentStep as 1 | 2 | 3} />

      {currentStep === 1 ? (
        <div className="space-y-6">
          <StepCard>
            <EmailField register={register} error={errors.email?.message} />
            <FullNameField register={register} setValue={setValue} error={errors.fullName?.message} />
            <NikField readOnly register={register} setValue={setValue} error={errors.nik?.message} />
            <PhoneField register={register} setValue={setValue} error={errors.phone?.message} />
            <PersonalEmergencyFields register={register} setValue={setValue} errors={{
              motherName: errors.motherName?.message,
              emergencyContact: errors.emergencyContact?.message,
              emergencyContactName: errors.emergencyContactName?.message,
              emergencyRelationship: errors.emergencyRelationship?.message,
            }} />
            <BirthPlaceField setValue={setValue} watch={watch} error={errors.birthPlaceCode?.message || errors.birthPlace?.message || errors.birthPlaceProvince?.message} />
            <BirthDateField register={register} error={errors.birthDate?.message} />
            <GenderField register={register} error={errors.gender?.message} />
            <MaritalStatusField register={register} error={errors.maritalStatus?.message} />
            <ReligionField register={register} error={errors.religion?.message} />
            <PtkpCodeField register={register} error={errors.ptkpCode?.message} />
          </StepCard>

          <StepCard title="Alamat Domisili" icon={<MapPin className="h-5 w-5 text-[#f2ca50]" />}>
            <AddressField register={register} setValue={setValue} watch={watch} errors={errors} />
          </StepCard>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-6">
          <StepCard title="Detail Penempatan" icon={<BriefcaseBusiness className="h-5 w-5 text-[#f2ca50]" />}>
            <PlacementField register={register} setValue={setValue} watch={watch} error={errors.placement?.message} />
            <EmploymentStatusField register={register} setValue={setValue} watch={watch} error={errors.employmentStatus?.message} />
            <FingerFields register={register} setValue={setValue} watch={watch} errors={{ fingerPin: errors.fingerPin?.message }} />
            <PositionField register={register} setValue={setValue} watch={watch} error={errors.position?.message} />
            <BpjsFields register={register} setValue={setValue} watch={watch} errors={errors} />
            <FirstWorkDateField register={register} error={errors.firstWorkDate?.message} />
          </StepCard>

          <StepCard title="Informasi Bank" icon={<WalletCards className="h-5 w-5 text-[#f2ca50]" />}>
            <BankField register={register} setValue={setValue} watch={watch} error={errors.bankCode?.message || errors.bankName?.message} onBankChanged={resetValidation} />
            <AccountNumberField register={register} setValue={setValue} error={errors.accountNumber?.message} onChanged={resetValidation} />
            <AccountOwnerField register={register} setValue={setValue} error={errors.accountOwner?.message} onChanged={resetValidation} />
            <div className="flex items-end">
              <button type="button" onClick={validateAccount} disabled={validateMutation.isPending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#f2ca50] px-4 py-3 text-sm font-semibold text-[#3c2f00] transition hover:bg-[#ffd95c] disabled:cursor-not-allowed disabled:bg-slate-500">
                {validateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                VALIDASI REKENING
              </button>
            </div>
            <AccountValidationResult result={accountValidation} />
            <OwnershipStatusField register={register} error={errors.ownershipStatus?.message} />
            <div className="rounded-xl border border-[#f2ca50]/20 bg-[#26231a] p-4 text-sm leading-6 text-[#d0c5af] md:col-span-2">
              <div className="flex gap-3">
                <Info className="mt-1 h-4 w-4 shrink-0 text-[#f2ca50]" />
                <p>Pastikan data rekening benar untuk kelancaran proses payroll bulanan Anda.</p>
              </div>
            </div>
          </StepCard>

          {ownershipStatus === 'ORANG LAIN' ? (
            <StepCard title="Unggah Dokumen" icon={<CloudUpload className="h-5 w-5 text-[#f2ca50]" />}>
              <PowerOfAttorneyUploadField register={register} watch={watch} trigger={trigger} required error={errors.powerOfAttorneyFile?.message} />
            </StepCard>
          ) : null}
        </div>
      ) : null}

      {currentStep === 3 ? (
        <div className="space-y-6">
          <StepCard title="Unggah Dokumen" icon={<CloudUpload className="h-5 w-5 text-[#f2ca50]" />}>
            <EmployeeDocumentUploadField name="personalPhotoFile" label="Foto Diri (opsional)" register={register} watch={watch} trigger={trigger} error={errors.personalPhotoFile?.message} />
            <KtpUploadField register={register} watch={watch} trigger={trigger} error={errors.ktpFile?.message} />
            <FamilyCardUploadField register={register} watch={watch} trigger={trigger} error={errors.familyCardFile?.message} />
          </StepCard>

          <StepCard title="Ringkasan Data" icon={<BarChart3 className="h-5 w-5 text-[#f2ca50]" />}>
            <div className="space-y-6 border-b border-white/5 pb-6 md:col-span-2">
              <SummaryItem label="Nama Lengkap" value={summaryValues.fullName} />
              <SummaryItem label="Posisi" value={summaryValues.position} />
              <SummaryItem label="Status Karyawan" value={summaryValues.employmentStatus} />
              <SummaryItem label="BPJS Kesehatan" value={summaryValues.bpjsHealthStatus === 'Sudah Ada' ? summaryValues.bpjsHealthNumber : summaryValues.bpjsHealthStatus} />
              <SummaryItem label="BPJS Ketenagakerjaan" value={summaryValues.bpjsEmploymentStatus === 'Sudah Ada' ? summaryValues.bpjsEmploymentNumber : summaryValues.bpjsEmploymentStatus} />
              <SummaryItem label="ID PIN Finger" value={summaryValues.fingerPin} />
            </div>
            <div className="space-y-6 md:col-span-2">
              <SummaryItem label="Email" value={summaryValues.email} />
              <SummaryItem label="Kantor Cabang" value={summaryValues.placement} />
              <SummaryItem label="Tanggal Mulai" value={formatSummaryDate(summaryValues.firstWorkDate)} />
              <SummaryItem label="Bank" value={summaryValues.bankName} />
              <SummaryItem label="Status Rekening" value={summaryValues.accountValidation.status} />
            </div>
          </StepCard>

          <label className="flex items-start gap-4 rounded-xl border border-[#f2ca50]/20 bg-[#f2ca50]/5 p-6">
            <input
              type="checkbox"
              className="mt-1 h-6 w-6 shrink-0 rounded border border-[#99907c] bg-[#201f1f] accent-[#f2ca50]"
              {...register('dataAgreement')}
            />
            <span className="text-sm font-semibold leading-6 tracking-[0.05em] text-[#e5e2e1]">
              Saya menyatakan bahwa data yang saya berikan adalah benar, akurat, dan lengkap sesuai dengan dokumen asli yang berlaku. Saya memahami konsekuensi hukum atas pemberian data yang tidak sah.
              {errors.dataAgreement?.message ? <span className="mt-2 block text-accent">{errors.dataAgreement.message}</span> : null}
            </span>
          </label>
        </div>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#f2ca50]/15 bg-[#1c1b1b] px-5 py-4">
        <div className="mx-auto flex max-w-3xl gap-3">
          {currentStep > 1 ? (
            <button type="button" disabled={checkingFinger} onClick={goToPreviousStep} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#f2ca50]/30 px-4 text-sm font-semibold text-[#f2ca50]">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>
          ) : null}

          {currentStep < 3 ? (
            <button type="button" disabled={checkingFinger} onClick={goToNextStep} className="inline-flex h-12 flex-1 items-center justify-center gap-3 rounded-xl bg-[#f2ca50] px-8 text-sm font-semibold tracking-[0.05em] text-[#3c2f00] transition hover:bg-[#ffd95c]">
              Lanjut
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="submit" disabled={!canSubmit} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#f2ca50] px-5 text-sm font-bold text-[#3c2f00] transition hover:bg-[#ffd95c] disabled:cursor-not-allowed disabled:bg-slate-500">
              {isSubmitting || submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              KIRIM DATA
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
