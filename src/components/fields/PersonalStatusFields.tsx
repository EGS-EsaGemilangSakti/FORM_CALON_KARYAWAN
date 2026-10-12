import type { UseFormRegister } from 'react-hook-form';
import { GENDERS, MARITAL_STATUSES, PTKP_CODES, PTKP_LABELS, RELIGIONS } from '../../constants/personal';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell, inputClass } from './FieldShell';

type FieldProps = {
  register: UseFormRegister<PayrollFormValues>;
  error?: string;
};

export function GenderField({ register, error }: FieldProps) {
  return (
    <FieldShell label="Jenis Kelamin" error={error}>
      <select className={inputClass} {...register('gender')}>
        <option value="">Pilih jenis kelamin</option>
        {GENDERS.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
      </select>
    </FieldShell>
  );
}

export function MaritalStatusField({ register, error }: FieldProps) {
  return (
    <FieldShell label="Status Pernikahan" error={error}>
      <select className={inputClass} {...register('maritalStatus')}>
        <option value="">Pilih status pernikahan</option>
        {MARITAL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
    </FieldShell>
  );
}

export function ReligionField({ register, error }: FieldProps) {
  return (
    <FieldShell label="Agama" error={error}>
      <select className={inputClass} {...register('religion')}>
        <option value="">Pilih agama</option>
        {RELIGIONS.map((religion) => <option key={religion} value={religion}>{religion}</option>)}
      </select>
    </FieldShell>
  );
}

export function PtkpCodeField({ register, error }: FieldProps) {
  return (
    <FieldShell label="PTKP" error={error}>
      <select className={inputClass} {...register('ptkpCode')}>
        <option value="">Pilih PTKP</option>
        {PTKP_CODES.map((code) => <option key={code} value={code}>{PTKP_LABELS[code]}</option>)}
      </select>
    </FieldShell>
  );
}
