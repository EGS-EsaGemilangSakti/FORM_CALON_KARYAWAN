import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { digitsOnly } from '../../utils/sanitize';
import { FieldShell, inputClass } from './FieldShell';

export function NikField({ register, setValue, error }: { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; error?: string }) {
  return (
    <FieldShell label="NIK" error={error}>
      <input className={inputClass} inputMode="numeric" maxLength={16} {...register('nik')} onChange={(event) => setValue('nik', digitsOnly(event.target.value), { shouldValidate: true })} />
    </FieldShell>
  );
}
