import { useMemo } from 'react';
import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { PLACEMENTS } from '../../constants/placements';
import type { PayrollFormValues } from '../../types/payroll';
import { FieldShell } from './FieldShell';
import { SearchableSelect } from './SearchableSelect';

type PlacementFieldProps = {
  register: UseFormRegister<PayrollFormValues>;
  setValue: UseFormSetValue<PayrollFormValues>;
  watch: UseFormWatch<PayrollFormValues>;
  error?: string;
};

export function PlacementField({ register, setValue, watch, error }: PlacementFieldProps) {
  const value = watch('placement') || '';
  const options = useMemo(() => PLACEMENTS.map((placement) => ({
    value: placement,
    label: placement,
  })), []);

  return (
    <FieldShell label="Penempatan" error={error}>
      <input type="hidden" {...register('placement')} />
      <SearchableSelect
        value={value}
        placeholder="Pilih penempatan"
        searchPlaceholder="Cari penempatan"
        emptyText="Penempatan tidak ditemukan"
        options={options}
        onChange={(selectedValue) => {
          setValue('placement', selectedValue, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
        }}
      />
    </FieldShell>
  );
}
