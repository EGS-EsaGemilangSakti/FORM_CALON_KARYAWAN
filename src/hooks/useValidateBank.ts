import { useMutation } from '@tanstack/react-query';
import { requestBankValidation } from '../services/bankValidation';

export function useValidateBank() {
  return useMutation({
    mutationFn: requestBankValidation,
  });
}
