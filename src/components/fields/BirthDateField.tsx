import type { UseFormRegister } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { todayInputDate } from '../../utils/formatters';
import { FieldShell, inputClass } from './FieldShell';

export function BirthDateField({ register, error }: { register: UseFormRegister<PayrollFormValues>; error?: string }) {
  return (
    <FieldShell label="Tanggal Lahir" error={error}>
      <input className={inputClass} type="date" max={todayInputDate()} {...register('birthDate')} />
    </FieldShell>
  );
}
