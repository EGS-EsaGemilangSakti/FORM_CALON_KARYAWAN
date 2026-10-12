import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { POSITIONS } from '../../constants/placements';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell, inputClass } from './FieldShell';
export function PositionField({ register, error }: { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; watch: UseFormWatch<PayrollFormValues>; error?: string }) {
  return <FieldShell label="Posisi" error={error}><select className={inputClass} {...register('position')}>
    {POSITIONS.map(value => <option key={value} value={value}>{value}</option>)}
  </select></FieldShell>;
}
