import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell, inputClass } from './FieldShell';

type Props = { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; watch: UseFormWatch<PayrollFormValues>; errors: FieldErrors<PayrollFormValues> };
export function BpjsFields({ register, setValue, watch, errors }: Props) {
  return <>{(['Health', 'Employment'] as const).map(kind => {
    const statusField = `bpjs${kind}Status` as const;
    const numberField = `bpjs${kind}Number` as const;
    const label = kind === 'Health' ? 'BPJS Kesehatan' : 'BPJS Ketenagakerjaan';
    return <div key={kind} className="space-y-4">
      <FieldShell label={`Status Kepemilikan ${label}`} error={errors[statusField]?.message}>
        <select className={inputClass} {...register(statusField)} onChange={event => {
          setValue(statusField, event.target.value as 'Sudah Ada' | 'Belum' | '', { shouldDirty: true, shouldValidate: true });
          if (event.target.value !== 'Sudah Ada') setValue(numberField, '', { shouldDirty: true, shouldValidate: true });
        }}>
          <option value="">Pilih status</option><option value="Sudah Ada">Sudah Ada</option><option value="Belum">Belum</option>
        </select>
      </FieldShell>
      {watch(statusField) === 'Sudah Ada' && <FieldShell label={`Nomor ${label}`} error={errors[numberField]?.message}>
        <input className={inputClass} inputMode="numeric" maxLength={30} {...register(numberField)} onChange={event => setValue(numberField, event.target.value.replace(/\D/g, ''), { shouldDirty: true, shouldValidate: true })} />
      </FieldShell>}
    </div>;
  })}</>;
}
