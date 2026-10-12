import provincesUrl from '../../data/provinces.json?url';
import regenciesUrl from '../../data/regencies.json?url';
import districtsUrl from '../../data/districts.json?url';
import villagesUrl from '../../data/villages.json?url';
import type { DistrictOption, ProvinceOption, RegencyOption, VillageOption } from '../types/regional';

const jsonCache = new Map<string, Promise<unknown>>();

async function fetchJson<T>(url: string): Promise<T> {
  let request = jsonCache.get(url);
  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) throw new Error('Gagal memuat data wilayah lokal');
      return response.json() as Promise<T>;
    });
    jsonCache.set(url, request);
  }

  return request as Promise<T>;
}

export async function listLocalProvinces(): Promise<ProvinceOption[]> {
  return fetchJson<ProvinceOption[]>(provincesUrl);
}

export async function listLocalRegencies(provinceCode: string): Promise<RegencyOption[]> {
  const regencies = await fetchJson<RegencyOption[]>(regenciesUrl);
  return regencies.filter((item) => item.province_code === provinceCode);
}

export async function listLocalDistricts(regencyCode: string): Promise<DistrictOption[]> {
  const districts = await fetchJson<DistrictOption[]>(districtsUrl);
  return districts.filter((item) => item.regency_code === regencyCode);
}

export async function listLocalVillages(districtCode: string): Promise<VillageOption[]> {
  const villages = await fetchJson<VillageOption[]>(villagesUrl);
  return villages.filter((item) => item.district_code === districtCode);
}

export async function listLocalBirthRegencies(): Promise<RegencyOption[]> {
  return fetchJson<RegencyOption[]>(regenciesUrl);
}
