import type { BankValidationRequest } from '../types/payroll';
import { validateBankAccount } from './api';

export async function requestBankValidation(payload: BankValidationRequest) {
  return validateBankAccount(payload);
}
