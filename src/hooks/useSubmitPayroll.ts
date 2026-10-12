import { useMutation } from '@tanstack/react-query';
import { submitPayroll } from '../services/api';

export function useSubmitPayroll() {
  return useMutation({
    mutationFn: submitPayroll,
  });
}
