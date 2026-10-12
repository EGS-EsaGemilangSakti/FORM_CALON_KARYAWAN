import type { UseFormRegister } from 'react-hook-form';
import { OWNERSHIP_STATUSES } from '../../constants/placements';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell, inputClass } from './FieldShell';

export function OwnershipStatusField({ register, error }: { register: UseFormRegister<PayrollFormValues>; error?: string }) {
  return (
    <FieldShell label="Status Kepemilikan Rekening" error={error}>
      <select className={inputClass} {...register('ownershipStatus')}>
        <option value="">Pilih status</option>
        {OWNERSHIP_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
    </FieldShell>
  );
}
