import { useEffect, useState } from 'react';
import { fileToBase64Payload } from '../utils/validators';

export function usePreparedUpload(file: File | null | undefined, label: string) {
  const [result, setResult] = useState<{ file: File; message: string; failed: boolean } | null>(null);
  useEffect(() => {
    if (!file) return;
    let active = true;
    void fileToBase64Payload(file, label).then(
      () => { if (active) setResult({ file, message: 'File siap dikirim saat formulir disubmit.', failed: false }); },
      (error: unknown) => {
        if (active) setResult({ file, message: error instanceof Error ? error.message : 'File tidak dapat dibaca. Pilih ulang file.', failed: true });
      },
    );
    return () => { active = false; };
  }, [file, label]);
  if (!file) return null;
  return result?.file === file ? result : { message: 'Sedang membaca file...', failed: false };
}
