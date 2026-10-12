import { useEffect } from 'react';
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { useDistricts, useProvinces, useRegencies, useVillages } from '../../hooks/useRegional';
import type { PayrollFormValues } from '../../types/payroll';
import { sanitizeText, sanitizeTextInput, finalizeTextInput } from '../../utils/sanitize';
import { FieldShell, inputClass } from './FieldShell';
import { SearchableSelect } from './SearchableSelect';

function composeAddress(values: Pick<PayrollFormValues, 'addressDetail' | 'villageName' | 'districtName' | 'regencyName' | 'provinceName' | 'postalCode'>): string {
  return [
    sanitizeText(values.addressDetail),
    values.villageName ? `DESA/KEL. ${values.villageName}` : '',
    values.districtName ? `KEC. ${values.districtName}` : '',
    values.regencyName,
    values.provinceName,
    values.postalCode ? `KODE POS ${values.postalCode}` : '',
  ].filter(Boolean).join(', ');
}

export function AddressField({
  register,
  setValue,
  watch,
  errors,
}: {
  register: UseFormRegister<PayrollFormValues>;
  setValue: UseFormSetValue<PayrollFormValues>;
  watch: UseFormWatch<PayrollFormValues>;
  errors: FieldErrors<PayrollFormValues>;
}) {
  const values = watch();
  const addressDetail = values.addressDetail;
  const provinceCode = values.provinceCode;
  const regencyCode = values.regencyCode;
  const districtCode = values.districtCode;
  const villageName = values.villageName;
  const districtName = values.districtName;
  const regencyName = values.regencyName;
  const provinceName = values.provinceName;
  const postalCode = values.postalCode;
  const provinces = useProvinces();
  const regencies = useRegencies(provinceCode);
  const districts = useDistricts(regencyCode);
  const villages = useVillages(districtCode);

  useEffect(() => {
    setValue('address', composeAddress({ addressDetail, villageName, districtName, regencyName, provinceName, postalCode }), { shouldValidate: true });
  }, [addressDetail, villageName, districtName, regencyName, provinceName, postalCode, setValue]);

  return (
    <div className="grid min-w-0 gap-4 md:col-span-2 md:grid-cols-2">
      <input type="hidden" {...register('address')} />
      <FieldShell label="Provinsi" error={errors.provinceCode?.message || errors.provinceName?.message}>
        <SearchableSelect
          value={provinceCode}
          placeholder="Pilih provinsi"
          searchPlaceholder="Cari provinsi"
          loading={provinces.isLoading}
          loadingText="Memuat provinsi"
          disabled={provinces.isLoading}
          options={(provinces.data ?? []).map((item) => ({ value: item.code, label: item.name }))}
          onChange={(selectedValue) => {
            const selected = provinces.data?.find((item) => item.code === selectedValue);
            setValue('provinceCode', selected?.code ?? '', { shouldValidate: true });
            setValue('provinceName', selected?.name ?? '', { shouldValidate: true });
            setValue('regencyCode', '', { shouldValidate: true });
            setValue('regencyName', '', { shouldValidate: true });
            setValue('districtCode', '', { shouldValidate: true });
            setValue('districtName', '', { shouldValidate: true });
            setValue('villageCode', '', { shouldValidate: true });
            setValue('villageName', '', { shouldValidate: true });
            setValue('postalCode', '', { shouldValidate: true });
          }}
        />
      </FieldShell>

      <FieldShell label="Kabupaten/Kota" error={errors.regencyCode?.message || errors.regencyName?.message}>
        <SearchableSelect
          value={regencyCode}
          placeholder="Pilih kabupaten/kota"
          searchPlaceholder="Cari kabupaten/kota"
          loading={regencies.isLoading}
          loadingText="Memuat kabupaten/kota"
          disabled={!provinceCode || regencies.isLoading}
          options={(regencies.data ?? []).map((item) => ({ value: item.code, label: item.name, searchText: item.province }))}
          onChange={(selectedValue) => {
            const selected = regencies.data?.find((item) => item.code === selectedValue);
            setValue('regencyCode', selected?.code ?? '', { shouldValidate: true });
            setValue('regencyName', selected?.name ?? '', { shouldValidate: true });
            setValue('districtCode', '', { shouldValidate: true });
            setValue('districtName', '', { shouldValidate: true });
            setValue('villageCode', '', { shouldValidate: true });
            setValue('villageName', '', { shouldValidate: true });
            setValue('postalCode', '', { shouldValidate: true });
          }}
        />
      </FieldShell>

      <FieldShell label="Kecamatan" error={errors.districtCode?.message || errors.districtName?.message}>
        <SearchableSelect
          value={districtCode}
          placeholder="Pilih kecamatan"
          searchPlaceholder="Cari kecamatan"
          loading={districts.isLoading}
          loadingText="Memuat kecamatan"
          disabled={!regencyCode || districts.isLoading}
          options={(districts.data ?? []).map((item) => ({ value: item.code, label: item.name, searchText: `${item.regency} ${item.province}` }))}
          onChange={(selectedValue) => {
            const selected = districts.data?.find((item) => item.code === selectedValue);
            setValue('districtCode', selected?.code ?? '', { shouldValidate: true });
            setValue('districtName', selected?.name ?? '', { shouldValidate: true });
            setValue('villageCode', '', { shouldValidate: true });
            setValue('villageName', '', { shouldValidate: true });
            setValue('postalCode', '', { shouldValidate: true });
          }}
        />
      </FieldShell>

      <FieldShell label="Kelurahan/Desa" error={errors.villageCode?.message || errors.villageName?.message}>
        <SearchableSelect
          value={values.villageCode}
          placeholder="Pilih kelurahan/desa"
          searchPlaceholder="Cari kelurahan/desa"
          loading={villages.isLoading}
          loadingText="Memuat kelurahan/desa"
          disabled={!districtCode || villages.isLoading}
          options={(villages.data ?? []).map((item) => ({ value: item.code, label: item.name, searchText: `${item.district} ${item.regency} ${item.province} ${(item.postal_codes ?? []).join(' ')}` }))}
          onChange={(selectedValue) => {
            const selected = villages.data?.find((item) => item.code === selectedValue);
            setValue('villageCode', selected?.code ?? '', { shouldValidate: true });
            setValue('villageName', selected?.name ?? '', { shouldValidate: true });
            setValue('postalCode', selected?.postal_codes?.[0] ?? '', { shouldValidate: true });
          }}
        />
      </FieldShell>

      <FieldShell label="Kode Pos" error={errors.postalCode?.message}>
        <input
          className={inputClass}
          inputMode="numeric"
          maxLength={5}
          value={postalCode}
          onChange={(event) => setValue('postalCode', event.target.value.replace(/\D/g, ''), { shouldValidate: true })}
        />
      </FieldShell>

      <FieldShell label="Detail Alamat" error={errors.addressDetail?.message} className="md:col-span-2">
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          maxLength={200}
          placeholder="Contoh: Jl. Merdeka No. 12, RT 003/RW 004, Blok A, patokan dekat masjid"
          value={addressDetail}
          onBlur={(event) => setValue('addressDetail', finalizeTextInput(event.target.value), { shouldValidate: true, shouldTouch: true })}
          onChange={(event) => setValue('addressDetail', sanitizeTextInput(event.target.value), { shouldValidate: true })}
        />
      </FieldShell>

      {errors.address?.message ? <p className="text-sm text-accent md:col-span-2">{errors.address.message}</p> : null}
    </div>
  );
}
