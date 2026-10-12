import axios from 'axios';
import type { ApiResponse, BankValidationRequest, BankValidationResponse, PayrollSubmitPayload } from '../types/payroll';
import type { DistrictOption, ProvinceOption, RegencyOption, RegionalResponse, VillageOption } from '../types/regional';

const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

export const api = axios.create({
  baseURL: apiUrl || '/',
  timeout: 45000,
  headers: {
    'Content-Type': 'text/plain;charset=utf-8',
  },
});

export async function postJson<TResponse>(payload: unknown): Promise<TResponse> {
  if (!apiUrl) {
    throw new Error('VITE_API_URL belum diatur');
  }
  const response = await api.post('', JSON.stringify(payload));
  return response.data as TResponse;
}

export function submitPayroll(payload: PayrollSubmitPayload): Promise<ApiResponse> {
  return postJson<ApiResponse>({ action: 'submitPayroll', payload });
}

export function validateBankAccount(payload: BankValidationRequest): Promise<BankValidationResponse> {
  return postJson<BankValidationResponse>({ action: 'validateBankAccount', payload });
}

export function listProvinces(origin: string): Promise<RegionalResponse<ProvinceOption[]>> {
  return postJson<RegionalResponse<ProvinceOption[]>>({ action: 'listProvinces', payload: { origin } });
}

export function listRegencies(origin: string, provinceCode: string): Promise<RegionalResponse<RegencyOption[]>> {
  return postJson<RegionalResponse<RegencyOption[]>>({ action: 'listRegencies', payload: { origin, provinceCode } });
}

export function listDistricts(origin: string, regencyCode: string): Promise<RegionalResponse<DistrictOption[]>> {
  return postJson<RegionalResponse<DistrictOption[]>>({ action: 'listDistricts', payload: { origin, regencyCode } });
}

export function listVillages(origin: string, districtCode: string): Promise<RegionalResponse<VillageOption[]>> {
  return postJson<RegionalResponse<VillageOption[]>>({ action: 'listVillages', payload: { origin, districtCode } });
}

export function listBirthRegencies(origin: string): Promise<RegionalResponse<RegencyOption[]>> {
  return postJson<RegionalResponse<RegencyOption[]>>({ action: 'listBirthRegencies', payload: { origin } });
}
