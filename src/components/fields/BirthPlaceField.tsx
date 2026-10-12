import { useEffect } from 'react';
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useBirthRegencies } from '../../hooks/useRegional';
import type { PayrollFormValues } from '../../types/payroll';
import { sanitizeUpper } from '../../utils/sanitize';
import { FieldShell } from './FieldShell';
import { SearchableSelect } from './SearchableSelect';

export function BirthPlaceField({
  setValue,
  watch,
  error,
}: {
  setValue: UseFormSetValue<PayrollFormValues>;
  watch: UseFormWatch<PayrollFormValues>;
  error?: string;
}) {
  const regencies = useBirthRegencies();
  const birthPlaceCode = watch('birthPlaceCode');

  useEffect(() => {
    if (!birthPlaceCode || !regencies.data?.length) return;
    const selected = regencies.data.find((item) => item.code === birthPlaceCode);
    if (!selected) return;

    setValue('birthPlace', sanitizeUpper(selected.name), { shouldValidate: true });
    setValue('birthPlaceProvince', sanitizeUpper(selected.province), { shouldValidate: true });
  }, [birthPlaceCode, regencies.data, setValue]);

  return (
    <FieldShell label="Tempat Lahir" error={error}>
      <SearchableSelect
        value={birthPlaceCode}
        placeholder="Pilih kota/kabupaten lahir"
        searchPlaceholder="Cari kota/kabupaten lahir"
        loading={regencies.isLoading}
        loadingText="Memuat kota/kabupaten"
        disabled={regencies.isLoading}
        options={(regencies.data ?? []).map((item) => ({
          value: item.code,
          label: `${item.name} - ${item.province}`,
          searchText: `${item.name} ${item.province}`,
        }))}
        onChange={(selectedValue) => {
          const selected = regencies.data?.find((item) => item.code === selectedValue);
          setValue('birthPlaceCode', selected?.code ?? '', { shouldValidate: true });
          setValue('birthPlace', sanitizeUpper(selected?.name ?? ''), { shouldValidate: true });
          setValue('birthPlaceProvince', sanitizeUpper(selected?.province ?? ''), { shouldValidate: true });
        }}
      />
    </FieldShell>
  );
}
