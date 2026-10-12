import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { digitsOnly } from '../../utils/sanitize';
import { FieldShell, inputClass } from './FieldShell';

export function PhoneField({ register, setValue, error }: { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; error?: string }) {
  return (
    <FieldShell label="Nomor Telepon" error={error}>
      <input className={inputClass} inputMode="numeric" maxLength={15} autoComplete="tel" {...register('phone')} onChange={(event) => setValue('phone', digitsOnly(event.target.value), { shouldValidate: true })} />
    </FieldShell>
  );
}
