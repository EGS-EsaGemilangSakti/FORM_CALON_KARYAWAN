import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { EMERGENCY_RELATIONSHIPS } from '../../constants/placements';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell, inputClass } from './FieldShell';

type Props = {
  register: UseFormRegister<PayrollFormValues>;
  setValue: UseFormSetValue<PayrollFormValues>;
  watch: UseFormWatch<PayrollFormValues>;
  errors: Partial<Record<'area' | 'motherName' | 'emergencyContact' | 'emergencyContactName' | 'emergencyRelationship' | 'fingerPin', string>>;
};

const uppercase = (value: string) => value.toUpperCase();

export function PersonalEmergencyFields({ register, setValue, errors }: Omit<Props, 'watch'>) {
  return <>
    <FieldShell label="Ibu Kandung" error={errors.motherName}>
      <input className={inputClass} placeholder="NAMA IBU KANDUNG" {...register('motherName')} onChange={(event) => setValue('motherName', uppercase(event.target.value), { shouldDirty: true, shouldValidate: true })} />
    </FieldShell>
    <FieldShell label="Kontak Darurat" error={errors.emergencyContact}>
      <input className={inputClass} type="tel" inputMode="numeric" placeholder="08xxxxxxxxxx" {...register('emergencyContact')} onChange={(event) => setValue('emergencyContact', event.target.value.replace(/\D/g, ''), { shouldDirty: true, shouldValidate: true })} />
    </FieldShell>
    <FieldShell label="Nama Kontak Darurat" error={errors.emergencyContactName}>
      <input className={inputClass} placeholder="NAMA KONTAK DARURAT" {...register('emergencyContactName')} onChange={(event) => setValue('emergencyContactName', uppercase(event.target.value), { shouldDirty: true, shouldValidate: true })} />
    </FieldShell>
    <FieldShell label="Hubungan Kontak Darurat" error={errors.emergencyRelationship}>
      <select className={inputClass} {...register('emergencyRelationship')}>
        <option value="">Pilih hubungan</option>
        {EMERGENCY_RELATIONSHIPS.map((relationship) => <option key={relationship} value={relationship}>{relationship}</option>)}
      </select>
    </FieldShell>
  </>;
}

export function AreaAndFingerFields({ register, setValue, errors }: Props) {
  return <>
    <FieldShell label="Area" error={errors.area}>
      <input className={inputClass} placeholder="AREA" {...register('area')} onChange={(event) => setValue('area', uppercase(event.target.value), { shouldDirty: true, shouldValidate: true })} />
    </FieldShell>
    <FieldShell label="ID PIN Finger" error={errors.fingerPin}>
      <input className={inputClass} inputMode="numeric" maxLength={30} placeholder="ID PIN Finger" {...register('fingerPin')} onChange={(event) => setValue('fingerPin', event.target.value.replace(/\D/g, ''), { shouldDirty: true, shouldValidate: true })} />
    </FieldShell>
  </>;
}
