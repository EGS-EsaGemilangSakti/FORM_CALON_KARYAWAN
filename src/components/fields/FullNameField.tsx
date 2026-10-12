import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell } from './FieldShell';
import { UppercaseNameInput } from './UppercaseNameInput';

export function FullNameField({ register, setValue, error }: { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; error?: string; }) {
  return <FieldShell label="Nama Lengkap" error={error}>
    <UppercaseNameInput name="fullName" register={register} setValue={setValue} autoComplete="name" />
  </FieldShell>;
}
