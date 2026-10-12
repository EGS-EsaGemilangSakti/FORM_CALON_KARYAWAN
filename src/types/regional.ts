import type { ApiResponse } from './payroll';

export interface ProvinceOption {
  code: string;
  name: string;
}

export interface RegencyOption {
  code: string;
  name: string;
  province_code: string;
  province: string;
}

export interface DistrictOption {
  code: string;
  name: string;
  regency_code: string;
  regency: string;
  province_code: string;
  province: string;
}

export interface VillageOption {
  code: string;
  name: string;
  district_code: string;
  district: string;
  regency_code: string;
  regency: string;
  province_code: string;
  province: string;
  postal_codes?: string[];
}

export interface RegionalResponse<T> extends ApiResponse {
  data: T;
}
