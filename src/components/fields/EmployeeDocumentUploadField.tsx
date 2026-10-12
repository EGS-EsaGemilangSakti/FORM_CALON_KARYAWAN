import { usePreparedUpload } from '../../hooks/usePreparedUpload';
import { FileImage } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { FieldPath, UseFormRegister, UseFormTrigger, UseFormWatch } from 'react-hook-form';
import type { PayrollFormValues } from '../../types/payroll';
import { formatFileSize } from '../../utils/validators';

type Props = {
  name: FieldPath<PayrollFormValues>;
  label: string;
  register: UseFormRegister<PayrollFormValues>;
  watch: UseFormWatch<PayrollFormValues>;
  trigger: UseFormTrigger<PayrollFormValues>;
  error?: string;
};

export function EmployeeDocumentUploadField({ name, label, register, watch, trigger, error }: Props) {
  const [preview, setPreview] = useState('');
  const fileList = watch(name) as FileList | undefined;
  const file = fileList?.item(0);
  const preparation = usePreparedUpload(file, label);
  const fileRegister = register(name, { onChange: () => void trigger(name) });

  useEffect(() => {
    if (!file || !file.type.startsWith('image/')) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <label className="block md:col-span-2">
    <span className="sr-only">{label}</span>
    <div className="relative flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#4d4635] bg-[#1c1b1b] px-6 text-center transition hover:border-[#f2ca50]/70">
      {preview ? <img src={preview} alt={`Preview ${label}`} className="mb-4 max-h-32 w-full object-contain" /> : <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2ca50]/10"><FileImage className="h-7 w-7 text-[#f2ca50]" /></div>}
      <p className="text-sm font-semibold tracking-[0.05em] text-white">{file ? file.name : `Upload ${label}`}</p>
      {file ? <p className="mt-1 text-xs font-semibold text-[#f2ca50]">Ukuran file: {formatFileSize(file.size)}</p> : null}
      <p className="mt-1 max-w-52 text-xs font-medium leading-4 text-[#d0c5af]">Format JPG atau PNG. Maks 5MB per file.</p>
      <input className="absolute inset-0 cursor-pointer opacity-0" type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" {...fileRegister} />
    </div>
    {preparation ? <span role={preparation.failed ? 'alert' : 'status'} className={`mt-2 block text-sm ${preparation.failed ? 'text-accent' : 'text-[#d0c5af]'}`}>{preparation.message}</span> : null}
      {error ? <span className="mt-2 block text-sm text-accent">{error}</span> : null}
  </label>;
}
