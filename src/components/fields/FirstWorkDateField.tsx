import type { UseFormRegister } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell, inputClass } from './FieldShell';

export function FirstWorkDateField({ register, error }: { register: UseFormRegister<PayrollFormValues>; error?: string }) {
  return (
    <FieldShell label="Tanggal Kerja Pertama" error={error}>
      <input className={inputClass} type="date" {...register('firstWorkDate')} />
    </FieldShell>
  );
}
