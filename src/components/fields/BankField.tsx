import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { BANKS } from '../../constants/banks';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell } from './FieldShell';
import { SearchableSelect } from './SearchableSelect';

export function BankField({
  register,
  setValue,
  watch,
  error,
  onBankChanged,
}: {
  register: UseFormRegister<PayrollFormValues>;
  setValue: UseFormSetValue<PayrollFormValues>;
  watch: UseFormWatch<PayrollFormValues>;
  error?: string;
  onBankChanged: () => void;
}) {
  const bankCode = watch('bankCode');

  return (
    <FieldShell label="Bank" error={error}>
      <input type="hidden" {...register('bankCode')} />
      <input type="hidden" {...register('bankName')} />
      <SearchableSelect
        value={bankCode}
        placeholder="Pilih bank"
        searchPlaceholder="Cari bank"
        options={BANKS.map((bank) => ({
          value: bank.bank_code,
          label: bank.bank_name,
          searchText: bank.bank_code,
        }))}
        onChange={(selectedValue) => {
          const bank = BANKS.find((item) => item.bank_code === selectedValue);
          setValue('bankCode', bank?.bank_code ?? '', { shouldValidate: true });
          setValue('bankName', bank?.bank_name ?? '', { shouldValidate: true });
          onBankChanged();
        }}
      />
    </FieldShell>
  );
}
