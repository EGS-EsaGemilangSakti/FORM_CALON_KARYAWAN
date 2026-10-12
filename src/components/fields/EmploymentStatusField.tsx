import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { EMPLOYMENT_STATUSES } from '../../constants/placements';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell, inputClass } from './FieldShell';
export function EmploymentStatusField({ register, error }: { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; watch: UseFormWatch<PayrollFormValues>; error?: string }) {
  return <FieldShell label="Status Karyawan" error={error}><select className={inputClass} {...register('employmentStatus')}>
    {EMPLOYMENT_STATUSES.map(value => <option key={value} value={value}>{value}</option>)}
  </select></FieldShell>;
}
