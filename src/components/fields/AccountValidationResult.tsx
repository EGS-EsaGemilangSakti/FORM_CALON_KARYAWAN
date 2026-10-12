import { MIN_ACCOUNT_VALIDATION_SCORE } from '../../constants/accountValidation';
import type { AccountValidationResult as ValidationResult } from '../../types/payroll';

export function AccountValidationResult({ result }: { result: ValidationResult }) {
  if (result.status === 'UNVALIDATED') {
    return <div className="border border-line bg-panel px-3 py-2 text-sm text-slate-700 md:col-span-2">Status rekening belum divalidasi.</div>;
  }

  const isValid = result.status === 'VALID' && result.score !== null && result.score >= MIN_ACCOUNT_VALIDATION_SCORE;

  return (
    <div className={`border px-3 py-3 text-sm md:col-span-2 ${isValid ? 'border-brand bg-emerald-50 text-brand' : 'border-accent bg-red-50 text-accent'}`}>
      <p className="font-semibold">{isValid ? 'Rekening Valid' : 'Rekening Tidak Valid'}</p>
      <p>Score: {result.score ?? 0}</p>
      {!isValid ? <p>Score minimal {MIN_ACCOUNT_VALIDATION_SCORE} agar bisa lanjut.</p> : null}
      {result.validatedName ? <p>Nama hasil masking: {result.validatedName}</p> : null}
      {result.validationTimestamp ? <p>Waktu validasi: {new Date(result.validationTimestamp).toLocaleString('id-ID')}</p> : null}
    </div>
  );
}
