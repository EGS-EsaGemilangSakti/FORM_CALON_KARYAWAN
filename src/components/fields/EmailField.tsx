import type { UseFormRegister } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell, inputClass } from './FieldShell';

export function EmailField({ register, error }: { register: UseFormRegister<PayrollFormValues>; error?: string }) {
  return (
    <FieldShell label="Email" error={error}>
      <input className={inputClass} type="email" autoComplete="email" {...register('email')} />
    </FieldShell>
  );
}
