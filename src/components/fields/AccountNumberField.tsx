import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { digitsOnly } from '../../utils/sanitize';
import { FieldShell, inputClass } from './FieldShell';

export function AccountNumberField({ register, setValue, error, onChanged }: { register: UseFormRegister<PayrollFormValues>; setValue: UseFormSetValue<PayrollFormValues>; error?: string; onChanged: () => void }) {
  return (
    <FieldShell label="Nomor Rekening" error={error}>
      <input
        className={inputClass}
        inputMode="numeric"
        maxLength={30}
        {...register('accountNumber')}
        onChange={(event) => {
          setValue('accountNumber', digitsOnly(event.target.value), { shouldValidate: true });
          onChanged();
        }}
      />
    </FieldShell>
  );
}
