import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { sanitizeUpperInput, finalizeTextInput } from '../../utils/sanitize';
import { FieldShell, inputClass } from './FieldShell';

export function AccountOwnerField({ register, setValue, error, onChanged }: { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; error?: string; onChanged: () => void }) {
  return (
    <FieldShell label="Nama Pemilik Rekening" error={error}>
      <input
        className={inputClass}
        {...register('accountOwner', {
          onBlur: (event) => setValue('accountOwner', finalizeTextInput(event.target.value), { shouldValidate: true }),
        })}
        onChange={(event) => {
          setValue('accountOwner', sanitizeUpperInput(event.target.value), { shouldValidate: true });
          onChanged();
        }}
      />
    </FieldShell>
  );
}
