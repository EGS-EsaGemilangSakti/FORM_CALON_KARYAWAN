import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { inputClass } from './FieldShell';

type NameField = 'fullName' | 'accountOwner' | 'motherName' | 'emergencyContactName';
type Props = {
  name: NameField;
  register: UseFormRegister<PayrollFormValues>;
  setValue: UseFormSetValue<PayrollFormValues>;
  placeholder?: string;
  autoComplete?: string;
  onChanged?: () => void;
};

export function UppercaseNameInput({ name, register, setValue, placeholder, autoComplete, onChanged }: Props) {
  return <input
    className={inputClass + ' uppercase'}
    placeholder={placeholder}
    autoComplete={autoComplete}
    autoCapitalize="characters"
    autoCorrect="off"
    spellCheck={false}
    {...register(name, {
      // Keep native typing/composition intact. Rewriting the DOM value on each
      // keystroke interrupts Android keyboards when they commit a word at Space.
      onChange: () => onChanged?.(),
      onBlur: (event) => setValue(name, event.target.value.trim().replace(/\s+/g, ' ').toUpperCase(), { shouldDirty: true, shouldValidate: true }),
    })}
  />;
}
