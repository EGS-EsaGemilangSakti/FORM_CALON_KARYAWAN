import { MessageCircle, Send, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { BANKS } from '../../constants/banks';
import { buildSupportReportUrl, type ReportType } from '../../utils/supportReport';

const fieldClass = 'mt-2 block w-full rounded-lg border border-[#777064] bg-white px-3 py-3 text-base text-[#1c1b1b] outline-none focus:border-[#f2ca50] focus:ring-2 focus:ring-[#f2ca50]/40';
const bankOptions = [...BANKS].sort((a, b) => a.bank_name.localeCompare(b.bank_name, 'id'));

export function SupportReportButton({ formName }: { formName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [type, setType] = useState<ReportType>('bank');
  const [error, setError] = useState('');

  const submitReport = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const bank = BANKS.find((item) => item.bank_code === data.get('bankCode'));
    try {
      const url = buildSupportReportUrl({
        type,
        description: String(data.get('description') || ''),
        accountOwner: String(data.get('accountOwner') || ''),
        bankName: bank?.bank_name.toUpperCase() || '',
        accountNumber: String(data.get('accountNumber') || ''),
      }, formName);
      setError('');
      window.location.assign(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Periksa kembali data laporan.');
    }
  };

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} aria-haspopup="dialog" className="fixed bottom-24 right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#f2ca50]/40 bg-[#252219] px-4 py-3 text-sm font-semibold text-[#f2ca50] shadow-lg shadow-black/30 transition hover:bg-[#393122] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2ca50] sm:right-6">
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Laporkan Kendala
      </button>
      <dialog ref={dialogRef} aria-labelledby="support-title" aria-describedby="support-description" className="m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-lg overflow-y-auto rounded-2xl border border-[#f2ca50]/25 bg-[#181818] p-0 text-[#e5e2e1] shadow-2xl backdrop:bg-black/70">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div>
            <h2 id="support-title" className="text-xl font-bold text-[#f2ca50]">Laporkan Kendala</h2>
            <p id="support-description" className="mt-2 text-sm leading-6 text-[#d0c5af]">Sampaikan kendala Anda kepada admin melalui WhatsApp.</p>
          </div>
          <button type="button" aria-label="Tutup laporan kendala" onClick={() => dialogRef.current?.close()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#d0c5af] hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f2ca50]">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={submitReport} className="space-y-5 px-5 py-6 sm:px-6">
          <label className="block text-sm font-medium">
            Tipe kendala
            <select name="reportType" value={type} onChange={(event) => { setType(event.target.value as ReportType); setError(''); }} className={fieldClass}>
              <option value="bank">Validasi Rekening</option>
              <option value="other">Lainnya</option>
            </select>
          </label>
          {type === 'bank' ? (
            <>
              <label className="block text-sm font-medium">
                Nama pemilik rekening
                <input name="accountOwner" required maxLength={120} autoComplete="off" placeholder="Sesuai nama pada rekening" className={fieldClass} />
              </label>
              <label className="block text-sm font-medium">
                Bank
                <select name="bankCode" required defaultValue="" className={fieldClass}>
                  <option value="" disabled>Pilih bank</option>
                  {bankOptions.map((bank) => <option key={bank.bank_code} value={bank.bank_code}>{bank.bank_name.toUpperCase()}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Nomor rekening
                <input name="accountNumber" type="text" inputMode="numeric" pattern="[0-9]{5,30}" title="Masukkan 5–30 digit angka" required maxLength={30} autoComplete="off" placeholder="Masukkan nomor rekening" className={fieldClass} />
              </label>
            </>
          ) : null}
          <label className="block text-sm font-medium">
            Deskripsi kendala
            <textarea name="description" required maxLength={1000} rows={4} placeholder="Jelaskan kendala yang Anda alami" className={fieldClass} />
            <span className="mt-2 block text-xs text-[#d0c5af]">Maksimal 1.000 karakter.</span>
          </label>
          {error ? <p role="alert" className="rounded-lg bg-red-950 p-3 text-sm text-red-200">{error}</p> : null}
          <p className="text-xs leading-5 text-[#d0c5af]">WhatsApp akan terbuka dengan pesan terisi ke 0857-1084-0402. Periksa pesan, lalu tekan Kirim di WhatsApp.</p>
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#f2ca50] px-4 py-3 text-sm font-bold text-[#3c2f00] transition hover:bg-[#ffda62] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f2ca50]">
            <Send className="h-4 w-4" aria-hidden="true" />
            Lanjut ke WhatsApp
          </button>
        </form>
      </dialog>
    </>
  );
}
