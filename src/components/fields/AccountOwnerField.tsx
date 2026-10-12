import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell } from './FieldShell';
import { UppercaseNameInput } from './UppercaseNameInput';

export function AccountOwnerField({ register, setValue, error, onChanged }: { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; error?: string; onChanged: () => void; }) {
  return <FieldShell label="Nama Pemilik Rekening" error={error}>
    <UppercaseNameInput name="accountOwner" register={register} setValue={setValue} onChanged={onChanged} />
  </FieldShell>;
}
